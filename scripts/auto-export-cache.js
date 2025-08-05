/**
 * Auto Export Cache Script
 * 
 * Add this to your App.jsx temporarily to auto-export cache
 */

// Add this to App.jsx in development only
if (import.meta.env.DEV) {
  // Auto-export cache every 30 seconds if there are changes
  let lastCacheSize = 0;
  
  setInterval(() => {
    const cacheStats = window.Game?.ttsService?.getCacheStats();
    if (!cacheStats) return;
    
    // Check if cache has grown
    if (cacheStats.count > lastCacheSize) {
      lastCacheSize = cacheStats.count;
      
      // Export cache
      const cachePrefix = 'tts_cache_';
      const cacheIndexKey = 'tts_cache_index';
      const cache = {};
      
      // Get all TTS cache entries
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith(cachePrefix)) {
          cache[key] = localStorage.getItem(key);
        }
      });
      
      // Get the index
      const index = localStorage.getItem(cacheIndexKey);
      if (index) {
        cache[cacheIndexKey] = index;
      }
      
      // Create export object
      const exportData = {
        version: 1,
        exportDate: new Date().toISOString(),
        entries: Object.keys(cache).length,
        cache: cache
      };
      
      // Send to backend (you'll need to set up an endpoint)
      fetch('/api/save-tts-cache', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(exportData)
      }).catch(() => {
        // Fallback: Log to console for manual copy
        console.log('TTS_CACHE_EXPORT:', JSON.stringify(exportData));
      });
      
      console.log(`[TTS Cache] Auto-exported ${cacheStats.count} entries`);
    }
  }, 30000); // Check every 30 seconds
}