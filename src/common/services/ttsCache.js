/**
 * TTS Cache Manager - Handles persistent storage with fallbacks
 * 
 * Storage hierarchy:
 * 1. localStorage (default, 5-10MB limit)
 * 2. IndexedDB (fallback, 50MB+ limit)
 * 3. In-memory only (if all else fails)
 */

class TTSCacheManager {
  constructor() {
    this.dbName = 'tts_cache_db';
    this.storeName = 'audio_cache';
    this.db = null;
    this.useIndexedDB = false;
    
    // Test localStorage availability
    this.localStorageAvailable = this.testLocalStorage();
    
    // Initialize IndexedDB if needed
    if (!this.localStorageAvailable) {
      this.initIndexedDB();
    }
  }
  
  /**
   * Test if localStorage is available and working
   */
  testLocalStorage() {
    try {
      const test = '__tts_test__';
      localStorage.setItem(test, 'test');
      localStorage.removeItem(test);
      return true;
    } catch (e) {
      console.warn('[TTSCache] localStorage not available, will use IndexedDB');
      return false;
    }
  }
  
  /**
   * Initialize IndexedDB as fallback
   */
  async initIndexedDB() {
    try {
      const request = indexedDB.open(this.dbName, 1);
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: 'key' });
        }
      };
      
      this.db = await new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      
      this.useIndexedDB = true;
      console.log('[TTSCache] IndexedDB initialized');
    } catch (error) {
      console.error('[TTSCache] Failed to initialize IndexedDB:', error);
    }
  }
  
  /**
   * Save audio data to cache
   */
  async save(key, data) {
    // Try localStorage first
    if (this.localStorageAvailable) {
      try {
        localStorage.setItem(key, data);
        return true;
      } catch (e) {
        console.warn('[TTSCache] localStorage full, trying IndexedDB');
        if (!this.useIndexedDB) await this.initIndexedDB();
      }
    }
    
    // Try IndexedDB
    if (this.useIndexedDB && this.db) {
      try {
        const transaction = this.db.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);
        await new Promise((resolve, reject) => {
          const request = store.put({ key, data, timestamp: Date.now() });
          request.onsuccess = resolve;
          request.onerror = reject;
        });
        return true;
      } catch (error) {
        console.error('[TTSCache] IndexedDB save failed:', error);
      }
    }
    
    return false;
  }
  
  /**
   * Load audio data from cache
   */
  async load(key) {
    // Try localStorage first
    if (this.localStorageAvailable) {
      try {
        return localStorage.getItem(key);
      } catch (e) {
        // Fall through to IndexedDB
      }
    }
    
    // Try IndexedDB
    if (this.useIndexedDB && this.db) {
      try {
        const transaction = this.db.transaction([this.storeName], 'readonly');
        const store = transaction.objectStore(this.storeName);
        const result = await new Promise((resolve, reject) => {
          const request = store.get(key);
          request.onsuccess = () => resolve(request.result);
          request.onerror = reject;
        });
        return result?.data;
      } catch (error) {
        console.error('[TTSCache] IndexedDB load failed:', error);
      }
    }
    
    return null;
  }
  
  /**
   * Clear all cached data
   */
  async clear() {
    // Clear localStorage
    if (this.localStorageAvailable) {
      try {
        Object.keys(localStorage)
          .filter(key => key.startsWith('tts_cache_'))
          .forEach(key => localStorage.removeItem(key));
      } catch (e) {
        // Ignore
      }
    }
    
    // Clear IndexedDB
    if (this.useIndexedDB && this.db) {
      try {
        const transaction = this.db.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);
        store.clear();
      } catch (error) {
        console.error('[TTSCache] IndexedDB clear failed:', error);
      }
    }
  }
}

export default TTSCacheManager;