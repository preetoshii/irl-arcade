/**
 * TTS Service - Unified text-to-speech with provider switching
 * 
 * This service provides a single interface for TTS that can switch between:
 * - Browser's built-in Web Speech API (default)
 * - ElevenLabs API (when enabled)
 * 
 * Usage:
 * - Set TTS_PROVIDER in .env to 'elevenlabs' to use ElevenLabs
 * - Or toggle at runtime: window.Game.ttsProvider = 'elevenlabs'
 */

import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';

// Configuration
const TTS_PROVIDER = import.meta.env.VITE_TTS_PROVIDER || 'elevenlabs'; // Default to ElevenLabs
const ELEVENLABS_API_KEY = import.meta.env.VITE_ELEVENLABS_API_KEY;
const ELEVENLABS_VOICE_ID = import.meta.env.VITE_ELEVENLABS_VOICE_ID || 'mtrellq69YZsNwzUSyXh'; // Default voice

class TTSService {
  constructor() {
    this.provider = TTS_PROVIDER;
    this.elevenLabsClient = null;
    this.audioCache = new Map(); // In-memory cache for quick access
    this.cachePrefix = 'tts_cache_'; // Prefix for localStorage keys
    this.cacheIndexKey = 'tts_cache_index'; // Key to store list of cached items
    
    // Initialize ElevenLabs if API key is available
    if (ELEVENLABS_API_KEY) {
      // ElevenLabs API key found, initializing client
      this.elevenLabsClient = new ElevenLabsClient({
        apiKey: ELEVENLABS_API_KEY
      });
    } else {
      console.warn('[TTSService] No ElevenLabs API key found, falling back to webspeech');
      this.provider = 'webspeech';
    }
    
    // Initialized with provider: ${this.provider}
    
    // Load cache index from localStorage
    this.loadCacheIndex();
    
    // Always try to load preload cache on startup
    this.loadPreloadCache();
  }
  
  /**
   * Load cache index from localStorage
   */
  loadCacheIndex() {
    try {
      const cacheIndex = localStorage.getItem(this.cacheIndexKey);
      if (cacheIndex) {
        const index = JSON.parse(cacheIndex);
        // Loaded ${index.length} cached items from localStorage
      }
    } catch (error) {
      console.error('[TTSService] Error loading cache index:', error);
    }
  }
  
  /**
   * Load preloaded cache data if available
   */
  async loadPreloadCache() {
    try {
      // Try to load preload data
      const response = await fetch('/tts-cache-preload.json');
      if (!response.ok) return;
      
      const preloadData = await response.json();
      console.log(`[TTS] Loading ${Object.keys(preloadData.cache).length} preloaded cache entries...`);
      
      let loaded = 0;
      // Load all cache entries
      Object.entries(preloadData.cache).forEach(([key, value]) => {
        try {
          // Only set if not already present
          if (!localStorage.getItem(key)) {
            localStorage.setItem(key, value);
            loaded++;
          }
        } catch (e) {
          console.warn('[TTSService] Failed to preload entry:', key);
        }
      });
      
      if (loaded > 0) {
        console.log(`[TTS] Successfully loaded ${loaded} new entries from preload cache`);
      }
      
      console.log(`[TTS] Loaded ${Object.keys(preloadData.cache).length} preloaded cache entries`);
    } catch (error) {
      // Preload is optional, so we just log and continue
      // No preload cache available
    }
  }
  
  /**
   * Set the TTS provider
   * @param {string} provider - 'webspeech' or 'elevenlabs'
   */
  setProvider(provider) {
    if (!['webspeech', 'elevenlabs'].includes(provider)) {
      console.error(`[TTSService] Invalid provider: ${provider}`);
      return;
    }
    
    if (provider === 'elevenlabs' && !this.elevenLabsClient) {
      console.error('[TTSService] ElevenLabs API key not configured');
      return;
    }
    
    this.provider = provider;
    // Switched to provider: ${provider}
  }
  
  /**
   * Speak text using the current provider
   * @param {string} text - Text to speak
   * @param {number} pitch - Pitch (0.1-2.0) - only for webspeech
   * @param {number} rate - Rate (0.1-10) - only for webspeech
   */
  async speak(text, pitch = 1, rate = 1) {
    if (!text) return;
    
    // Speaking with provider
    
    if (this.provider === 'elevenlabs') {
      return this.speakElevenLabs(text);
    } else {
      return this.speakWebSpeech(text, pitch, rate);
    }
  }
  
  /**
   * Speak using Web Speech API
   */
  async speakWebSpeech(text, pitch, rate) {
    // Cancel any pending speech first
    window.speechSynthesis.cancel();
    
    return new Promise((resolve, reject) => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.pitch = pitch;
      utterance.rate = rate;
      
      utterance.onend = () => {
        // WebSpeech completed
        resolve();
      };
      
      utterance.onerror = (event) => {
        console.error('[TTSService] WebSpeech error:', event);
        // Don't reject on 'canceled' errors
        if (event.error === 'canceled') {
          resolve();
        } else {
          reject(event);
        }
      };
      
      // Add timeout fallback
      const timeout = setTimeout(() => {
        // WebSpeech timeout - resolving anyway
        resolve();
      }, 5000);
      
      utterance.onstart = () => {
        clearTimeout(timeout);
        // WebSpeech started
      };
      
      console.log(`[TTS] "${text}" - [WebSpeech]`);
      window.speechSynthesis.speak(utterance);
    });
  }
  
  /**
   * Speak using ElevenLabs API with streaming and persistent caching
   */
  async speakElevenLabs(text) {
    if (!this.elevenLabsClient) {
      console.error('[TTSService] ElevenLabs not initialized');
      return this.speakWebSpeech(text, 1, 1); // Fallback
    }
    
    const cacheKey = `${text}_${ELEVENLABS_VOICE_ID}`;
    const storageKey = `${this.cachePrefix}${cacheKey}`;
    
    // Check in-memory cache first
    if (this.audioCache.has(cacheKey)) {
      console.log(`[TTS] "${text}" - [Cached: memory]`);
      const cachedUrl = this.audioCache.get(cacheKey);
      return this.playAudioUrl(cachedUrl);
    }
    
    // Check localStorage cache
    try {
      const cachedData = localStorage.getItem(storageKey);
      if (cachedData) {
        console.log(`[TTS] "${text}" - [Cached: localStorage/preload]`);
        const audioBlob = await this.base64ToBlob(cachedData);
        const audioUrl = URL.createObjectURL(audioBlob);
        this.audioCache.set(cacheKey, audioUrl); // Store in memory cache too
        return this.playAudioUrl(audioUrl);
      }
    } catch (error) {
      console.error('[TTSService] Error loading from localStorage:', error);
    }
    
    try {
      console.log(`[TTS] "${text}" - [New: generating with ElevenLabs]`);
      
      // Use the cheapest settings
      const audioStream = await this.elevenLabsClient.textToSpeech.convert(
        ELEVENLABS_VOICE_ID,
        {
          text,
          model_id: 'eleven_turbo_v2', // Cheapest and fastest model
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0,  // Disable style for cheaper generation
            use_speaker_boost: false  // Disable speaker boost to save cost
          },
          optimize_streaming_latency: 4, // Maximum optimization for streaming
          output_format: 'mp3_22050_32' // Lower quality for smaller size and cost
        }
      );
      
      // Collect chunks
      const chunks = [];
      for await (const chunk of audioStream) {
        chunks.push(chunk);
      }
      
      // Convert to blob
      const audioBlob = new Blob(chunks, { type: 'audio/mpeg' });
      
      // Save to localStorage
      try {
        const base64 = await this.blobToBase64(audioBlob);
        localStorage.setItem(storageKey, base64);
        this.updateCacheIndex(cacheKey);
        console.log(`[TTS] "${text}" - [Saved to cache]`);
      } catch (error) {
        console.error('[TTSService] Error saving to localStorage:', error);
        // Clean up old cache entries if storage is full
        this.cleanupOldCache();
      }
      
      // Create URL and cache in memory
      const audioUrl = URL.createObjectURL(audioBlob);
      this.audioCache.set(cacheKey, audioUrl);
      
      // Play the audio
      return this.playAudioUrl(audioUrl);
      
    } catch (error) {
      console.error('[TTSService] ElevenLabs API error:', error);
      // Fallback to Web Speech
      return this.speakWebSpeech(text, 1, 1);
    }
  }
  
  /**
   * Convert blob to base64 for localStorage
   */
  async blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
  
  /**
   * Convert base64 back to blob
   */
  async base64ToBlob(base64) {
    const response = await fetch(base64);
    return response.blob();
  }
  
  /**
   * Update cache index in localStorage
   */
  updateCacheIndex(cacheKey) {
    try {
      let index = [];
      const stored = localStorage.getItem(this.cacheIndexKey);
      if (stored) {
        index = JSON.parse(stored);
      }
      
      // Add new key with timestamp
      const entry = { key: cacheKey, timestamp: Date.now() };
      index = index.filter(item => item.key !== cacheKey); // Remove if exists
      index.push(entry);
      
      localStorage.setItem(this.cacheIndexKey, JSON.stringify(index));
    } catch (error) {
      console.error('[TTSService] Error updating cache index:', error);
    }
  }
  
  /**
   * Clean up old cache entries when storage is full
   */
  cleanupOldCache() {
    try {
      const stored = localStorage.getItem(this.cacheIndexKey);
      if (!stored) return;
      
      let index = JSON.parse(stored);
      
      // Sort by timestamp (oldest first)
      index.sort((a, b) => a.timestamp - b.timestamp);
      
      // Remove oldest 25% of entries
      const toRemove = Math.ceil(index.length * 0.25);
      const removed = index.splice(0, toRemove);
      
      // Delete from localStorage
      removed.forEach(entry => {
        const storageKey = `${this.cachePrefix}${entry.key}`;
        localStorage.removeItem(storageKey);
      });
      
      // Update index
      localStorage.setItem(this.cacheIndexKey, JSON.stringify(index));
      // Cleaned up old cache entries
    } catch (error) {
      console.error('[TTSService] Error cleaning cache:', error);
    }
  }
  
  /**
   * Play audio from URL
   */
  async playAudioUrl(audioUrl) {
    return new Promise((resolve, reject) => {
      const audio = new Audio(audioUrl);
      audio.onended = () => {
        resolve();
      };
      audio.onerror = (error) => {
        console.error('[TTSService] Audio playback error:', error);
        reject(error);
      };
      audio.play().catch(reject);
    });
  }
  
  /**
   * Cancel any ongoing speech
   */
  cancel() {
    if (this.provider === 'webspeech') {
      window.speechSynthesis.cancel();
    }
    // ElevenLabs doesn't support cancellation of in-progress audio
  }
  
  /**
   * Clear all cached audio
   */
  clearCache() {
    // Clear in-memory cache
    this.audioCache.forEach(url => URL.revokeObjectURL(url));
    this.audioCache.clear();
    
    // Clear localStorage cache
    try {
      const stored = localStorage.getItem(this.cacheIndexKey);
      if (stored) {
        const index = JSON.parse(stored);
        index.forEach(entry => {
          const storageKey = `${this.cachePrefix}${entry.key}`;
          localStorage.removeItem(storageKey);
        });
        localStorage.removeItem(this.cacheIndexKey);
      }
      // Cache cleared
    } catch (error) {
      console.error('[TTSService] Error clearing cache:', error);
    }
  }
  
  /**
   * Get cache statistics
   */
  getCacheStats() {
    try {
      const stored = localStorage.getItem(this.cacheIndexKey);
      if (!stored) return { count: 0, size: 0 };
      
      const index = JSON.parse(stored);
      let totalSize = 0;
      
      index.forEach(entry => {
        const storageKey = `${this.cachePrefix}${entry.key}`;
        const data = localStorage.getItem(storageKey);
        if (data) {
          totalSize += data.length;
        }
      });
      
      return {
        count: index.length,
        size: Math.round(totalSize / 1024) + 'KB',
        inMemory: this.audioCache.size
      };
    } catch (error) {
      console.error('[TTSService] Error getting cache stats:', error);
      return { count: 0, size: 0 };
    }
  }
  
  /**
   * Export cache for preloading
   * Run this in console: window.Game.ttsService.exportCache()
   */
  exportCache() {
    const cache = {};
    
    // Get all TTS cache entries
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith(this.cachePrefix)) {
        cache[key] = localStorage.getItem(key);
      }
    });
    
    // Get the index
    const index = localStorage.getItem(this.cacheIndexKey);
    if (index) {
      cache[this.cacheIndexKey] = index;
    }
    
    // Create export object
    const exportData = {
      version: 1,
      exportDate: new Date().toISOString(),
      entries: Object.keys(cache).length,
      cache: cache
    };
    
    // Download as file
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tts-cache-preload.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    console.log(`[TTSService] Exported ${Object.keys(cache).length} cache entries to public/tts-cache-preload.json`);
    
    return exportData;
  }
}

// Create singleton instance
const ttsService = new TTSService();

// Make it available globally for runtime switching
if (typeof window !== 'undefined') {
  window.Game = window.Game || {};
  window.Game.ttsService = ttsService;
}

export default ttsService;