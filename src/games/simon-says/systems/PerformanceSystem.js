/**
 * Performance System for Simon Says
 * Handles text-to-speech and theatrical script delivery
 */

import eventBus, { Events } from './EventBus';
import configLoader from './ConfigLoader';
import { getPauseDuration } from '../state/constants';

// ============================================
// PERFORMANCE SYSTEM CLASS
// ============================================

class PerformanceSystem {
  constructor() {
    this.isPerforming = false;
    this.currentPerformance = null;
    this.performanceQueue = [];
    this.voice = null;
    this.synthesis = window.speechSynthesis;
    this.mockMode = false;
    this.interrupted = false;
    
    // Performance settings
    this.settings = {
      rate: 1.0,
      pitch: 1.0,
      volume: 1.0,
      voice: null
    };
    
    // Initialize
    this.initialize();
  }

  /**
   * Initialize the performance system
   */
  async initialize() {
    // Check for Web Speech API support
    if (!this.synthesis) {
      console.error('[PerformanceSystem] Web Speech API not supported');
      this.mockMode = true;
      return;
    }

    // Load voices
    await this.loadVoices();
    
    // Listen for voice changes
    this.synthesis.addEventListener('voiceschanged', () => this.loadVoices());
    
    eventBus.emit(Events.SYSTEM_READY, { system: 'performance' });
  }

  /**
   * Load available voices
   */
  async loadVoices() {
    return new Promise((resolve) => {
      const attemptLoad = () => {
        const voices = this.synthesis.getVoices();
        
        if (voices.length > 0) {
          // Find best voice for Simon
          this.voice = this.selectBestVoice(voices);
          this.settings.voice = this.voice;
          
          console.log('[PerformanceSystem] Selected voice:', this.voice?.name);
          resolve(voices);
        } else {
          // Retry after a short delay
          setTimeout(attemptLoad, 100);
        }
      };
      
      attemptLoad();
    });
  }

  /**
   * Select the best voice for Simon
   */
  selectBestVoice(voices) {
    // Priority order for voice selection
    const preferences = [
      { lang: 'en-US', gender: 'male' },
      { lang: 'en-GB', gender: 'male' },
      { lang: 'en', gender: 'male' },
      { lang: 'en-US', gender: 'female' },
      { lang: 'en-GB', gender: 'female' },
      { lang: 'en', gender: 'female' }
    ];
    
    // Look for preferred voices
    for (const pref of preferences) {
      const match = voices.find(voice => 
        voice.lang.startsWith(pref.lang) &&
        (!pref.gender || voice.name.toLowerCase().includes(pref.gender))
      );
      if (match) return match;
    }
    
    // Default to first English voice
    return voices.find(v => v.lang.startsWith('en')) || voices[0];
  }

  /**
   * Perform a complete play
   */
  async perform(play, context = {}) {
    if (this.isPerforming) {
      console.warn('[PerformanceSystem] Already performing, queueing...');
      this.performanceQueue.push({ play, context });
      return;
    }

    this.isPerforming = true;
    this.currentPerformance = { play, context };
    this.interrupted = false;
    
    eventBus.emit(Events.PERFORMANCE_STARTED, { play, context });

    try {
      // Process scripts based on play type
      if (play.blockType === 'round') {
        await this.performRoundPlay(play, context);
      } else if (play.blockType === 'ceremony') {
        await this.performCeremony(play, context);
      } else if (play.blockType === 'relax') {
        await this.performRelaxBlock(play, context);
      }
      
      eventBus.emit(Events.PERFORMANCE_COMPLETED, { play, context });
      
    } catch (error) {
      console.error('[PerformanceSystem] Performance error:', error);
      eventBus.emit(Events.SYSTEM_ERROR, { system: 'performance', error });
      
    } finally {
      this.isPerforming = false;
      this.currentPerformance = null;
      
      // Process next in queue
      if (this.performanceQueue.length > 0) {
        const next = this.performanceQueue.shift();
        this.perform(next.play, next.context);
      }
    }
  }

  /**
   * Perform a round play
   */
  async performRoundPlay(play, context) {
    const scripts = play.scripts;
    const hints = play.performanceHints || {};
    
    // Adjust performance style based on hints
    this.adjustPerformanceStyle(hints);
    
    // Introduction
    if (scripts.intro) {
      await this.speak(scripts.intro);
      await this.pause('medium');
    }
    
    // Player selection
    if (scripts.playerSelect) {
      await this.speak(scripts.playerSelect);
      await this.pause('small');
    }
    
    // Variant reveal
    if (scripts.variantReveal) {
      await this.speak(scripts.variantReveal);
    }
    
    // Sub-variant reveal
    if (scripts.subVariantReveal) {
      await this.pause('small');
      await this.speak(scripts.subVariantReveal);
    }
    
    // Modifier reveal
    if (scripts.modifierReveal) {
      await this.pause('medium');
      await this.speak(scripts.modifierReveal);
    }
    
    // Rules explanation
    if (scripts.rules) {
      await this.pause('small');
      await this.speak(scripts.rules);
    }
    
    // Positioning
    if (scripts.positioning) {
      await this.pause('medium');
      await this.speak(scripts.positioning);
    }
    
    // Countdown and start
    if (scripts.countdown) {
      await this.pause('large');
      await this.speak(scripts.countdown);
    } else if (scripts.start) {
      await this.pause('large');
      await this.speak(scripts.start);
    }
    
    // During phase (if any)
    if (scripts.during && scripts.during.length > 0) {
      // Wait a bit before first encouragement
      await this.pause('xlarge');
      
      for (let i = 0; i < scripts.during.length; i++) {
        if (this.interrupted) break;
        
        await this.speak(scripts.during[i]);
        
        // Wait between encouragements
        if (i < scripts.during.length - 1) {
          await this.wait(15000); // 15 seconds between
        }
      }
    }
    
    // Ending
    if (scripts.ending) {
      await this.speak(scripts.ending);
    }
    
    // Outro
    if (scripts.outro) {
      await this.pause('medium');
      await this.speak(scripts.outro);
    }
  }

  /**
   * Perform a ceremony
   */
  async performCeremony(play, context) {
    const scripts = play.scripts || {};
    
    if (play.ceremonyType === 'opening') {
      // Welcome
      if (scripts.welcome) {
        await this.speak(scripts.welcome);
        await this.pause('medium');
      }
      
      // Explanation
      if (scripts.explanation) {
        await this.speak(scripts.explanation);
        await this.pause('medium');
      }
      
      // Team building
      if (scripts.teamBuilding) {
        await this.speak(scripts.teamBuilding);
      }
      
    } else if (play.ceremonyType === 'closing') {
      // Celebration
      if (scripts.celebration) {
        await this.speak(scripts.celebration);
        await this.pause('medium');
      }
      
      // Thanks
      if (scripts.thanks) {
        await this.speak(scripts.thanks);
      }
    }
  }

  /**
   * Perform a relax block
   */
  async performRelaxBlock(play, context) {
    const scripts = play.scripts || {};
    
    // Introduction
    if (scripts.intro) {
      await this.speak(scripts.intro);
      await this.pause('medium');
    }
    
    // Instructions
    if (scripts.instructions) {
      for (const instruction of scripts.instructions) {
        await this.speak(instruction);
        await this.pause('large');
      }
    }
    
    // Outro
    if (scripts.outro) {
      await this.speak(scripts.outro);
    }
  }

  /**
   * Speak text with TTS
   */
  async speak(text) {
    if (!text) return;
    
    // Process script tokens
    const processed = this.processScriptTokens(text);
    
    // Handle pause tokens
    const segments = this.extractPauseSegments(processed);
    
    for (const segment of segments) {
      if (this.interrupted) break;
      
      if (segment.type === 'speech') {
        await this.speakSegment(segment.text);
      } else if (segment.type === 'pause') {
        await this.pause(segment.duration);
      }
    }
  }

  /**
   * Speak a single text segment
   */
  async speakSegment(text) {
    if (!text.trim()) return;
    
    eventBus.emit(Events.SCRIPT_STARTED, { text });
    
    if (this.mockMode || configLoader.get('system.mockTTS')) {
      // Mock mode - just log
      console.log(`[Simon Says] ${text}`);
      await this.wait(text.length * 50); // Simulate speaking time
      
    } else {
      // Real TTS
      return new Promise((resolve, reject) => {
        const utterance = new SpeechSynthesisUtterance(text);
        
        // Apply settings
        utterance.rate = this.settings.rate;
        utterance.pitch = this.settings.pitch;
        utterance.volume = this.settings.volume;
        if (this.settings.voice) {
          utterance.voice = this.settings.voice;
        }
        
        // Event handlers
        utterance.onend = () => {
          eventBus.emit(Events.SCRIPT_COMPLETED, { text });
          resolve();
        };
        
        utterance.onerror = (event) => {
          console.error('[PerformanceSystem] Speech error:', event);
          reject(event);
        };
        
        // Speak
        this.synthesis.speak(utterance);
      });
    }
  }

  /**
   * Process script tokens (variable replacement)
   */
  processScriptTokens(text) {
    let processed = text;
    
    // Get token values from context
    const tokens = this.currentPerformance?.context?.tokens || {};
    
    // Replace tokens
    Object.entries(tokens).forEach(([key, value]) => {
      const regex = new RegExp(`\\{${key}\\}`, 'g');
      processed = processed.replace(regex, value);
    });
    
    return processed;
  }

  /**
   * Extract pause segments from text
   */
  extractPauseSegments(text) {
    const segments = [];
    const pauseRegex = /\[(\w+)\]/g;
    let lastIndex = 0;
    let match;
    
    while ((match = pauseRegex.exec(text)) !== null) {
      // Add speech segment before pause
      if (match.index > lastIndex) {
        segments.push({
          type: 'speech',
          text: text.substring(lastIndex, match.index).trim()
        });
      }
      
      // Add pause segment
      segments.push({
        type: 'pause',
        duration: match[1]
      });
      
      lastIndex = match.index + match[0].length;
    }
    
    // Add remaining speech
    if (lastIndex < text.length) {
      segments.push({
        type: 'speech',
        text: text.substring(lastIndex).trim()
      });
    }
    
    return segments;
  }

  /**
   * Pause for a duration
   */
  async pause(duration) {
    const milliseconds = getPauseDuration(duration, configLoader.get('difficulty.pauseMultiplier', 1.0));
    await this.wait(milliseconds);
  }

  /**
   * Wait for milliseconds
   */
  async wait(milliseconds) {
    return new Promise(resolve => {
      const timeout = setTimeout(resolve, milliseconds);
      
      // Store timeout so it can be cleared if interrupted
      if (this.currentPerformance) {
        this.currentPerformance.timeout = timeout;
      }
    });
  }

  /**
   * Adjust performance style based on hints
   */
  adjustPerformanceStyle(hints) {
    const baseSettings = { ...this.settings };
    
    // Difficulty adjustments
    if (hints.difficulty) {
      const difficultyAdjustments = {
        1: { rate: 0.9, pitch: 1.0 },
        2: { rate: 0.95, pitch: 1.0 },
        3: { rate: 1.0, pitch: 1.0 },
        4: { rate: 1.05, pitch: 1.05 },
        5: { rate: 1.1, pitch: 1.1 }
      };
      
      const adjustment = difficultyAdjustments[hints.difficulty] || difficultyAdjustments[3];
      this.settings.rate = baseSettings.rate * adjustment.rate;
      this.settings.pitch = baseSettings.pitch * adjustment.pitch;
    }
    
    // Build suspense
    if (hints.buildSuspense) {
      // Slightly lower pitch for dramatic effect
      this.settings.pitch *= 0.95;
    }
    
    // Near end of match
    if (hints.isNearEnd) {
      // Slightly faster and higher energy
      this.settings.rate *= 1.05;
      this.settings.pitch *= 1.05;
    }
  }

  /**
   * Interrupt current performance
   */
  interrupt() {
    this.interrupted = true;
    
    // Stop current speech
    if (this.synthesis) {
      this.synthesis.cancel();
    }
    
    // Clear any pending timeouts
    if (this.currentPerformance?.timeout) {
      clearTimeout(this.currentPerformance.timeout);
    }
    
    // Clear queue
    this.performanceQueue = [];
    
    console.log('[PerformanceSystem] Performance interrupted');
  }

  /**
   * Update voice settings
   */
  updateSettings(settings) {
    this.settings = { ...this.settings, ...settings };
    
    // Re-select voice if needed
    if (settings.voicePreferences) {
      const voices = this.synthesis.getVoices();
      this.voice = this.selectBestVoice(voices);
      this.settings.voice = this.voice;
    }
  }

  /**
   * Get available voices
   */
  getAvailableVoices() {
    return this.synthesis ? this.synthesis.getVoices() : [];
  }

  /**
   * Test voice with sample text
   */
  async testVoice(text = "Hello! I'm Simon, and I'll be your host today!") {
    await this.speak(text);
  }

  /**
   * Set mock mode
   */
  setMockMode(enabled) {
    this.mockMode = enabled;
    console.log(`[PerformanceSystem] Mock mode ${enabled ? 'enabled' : 'disabled'}`);
  }
}

// Create singleton instance
const performanceSystem = new PerformanceSystem();

// Export both instance and class
export default performanceSystem;
export { PerformanceSystem };