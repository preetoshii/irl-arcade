#!/usr/bin/env node

/**
 * Export TTS Cache from Browser
 * 
 * Run this in your browser console to export your localStorage cache:
 * 
 * 1. Open the app in your browser
 * 2. Open Developer Console
 * 3. Copy and paste this entire script
 * 4. Save the output to src/common/data/tts-cache-preload.json
 */

(function exportTTSCache() {
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
  
  // Output as JSON
  console.log('=== COPY EVERYTHING BELOW THIS LINE ===');
  console.log(JSON.stringify(exportData, null, 2));
  console.log('=== COPY EVERYTHING ABOVE THIS LINE ===');
  
  // Also offer download
  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'tts-cache-export.json';
  a.click();
  
  console.log(`Exported ${Object.keys(cache).length} cache entries`);
  console.log('File downloaded as: tts-cache-export.json');
})();