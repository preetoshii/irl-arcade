# TTS Cache Preloading

This system allows you to pre-generate TTS audio during development and ship it with the app, so users don't need to generate audio on first use.

## Benefits

- **Instant audio playback** - No generation delay for users
- **Works offline** - Cached audio doesn't need internet
- **Save API costs** - Users don't regenerate common phrases
- **Better first impression** - App feels faster

## How It Works

1. During development, the TTS service caches all generated audio in localStorage
2. You export this cache to a JSON file
3. The JSON file is included in the build
4. On first load, new users get the preloaded cache

## Creating a Preload Cache

### Step 1: Generate Cache During Development

1. Enable ElevenLabs in your `.env`:
```
VITE_TTS_PROVIDER=elevenlabs
VITE_ELEVENLABS_API_KEY=your_key
```

2. Use the app normally - navigate through all games, trigger all common phrases

3. Check your cache status:
```javascript
window.Game.ttsService.getCacheStats()
// Should show multiple cached entries
```

### Step 2: Export Your Cache

1. Open browser console in your dev environment
2. Copy and run the export script from: `scripts/export-tts-cache.js`
3. This will download `tts-cache-export.json`

### Step 3: Add to Project

1. Move the file to: `public/tts-cache-preload.json`
2. Commit it to your repository:
```bash
git add public/tts-cache-preload.json
git commit -m "Add TTS cache preload data"
```

## How Preloading Works

When a new user visits the app:
1. TTS service checks if they have existing cache
2. If not, it fetches `/tts-cache-preload.json`
3. Loads all cached audio into their localStorage
4. User gets instant audio playback!

## Updating the Preload Cache

As you add new features:
1. Clear your local cache: `window.Game.ttsService.clearCache()`
2. Generate fresh audio by using the app
3. Export and update the preload file
4. Commit the updated file

## Cache Contents

The preload file contains:
- Base64 encoded audio data
- Cache keys (text + voice ID)
- Metadata (version, export date)

Example structure:
```json
{
  "version": 1,
  "exportDate": "2024-01-15T10:30:00Z",
  "entries": 15,
  "cache": {
    "tts_cache_Simon Says_mtrellq69YZsNwzUSyXh": "data:audio/mpeg;base64,..."
  }
}
```

## Important Notes

- The preload file can get large (1-2MB for ~50 phrases)
- Consider using CDN for the JSON file if it gets too big
- Users with existing cache won't be affected
- Cache is voice-specific - changing voice ID requires new cache