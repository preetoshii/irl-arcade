# Text-to-Speech (TTS) Setup

The IRL Arcade supports two TTS providers:

## 1. Browser TTS (Default)
- Uses the browser's built-in Web Speech API
- Free and works offline
- Quality varies by browser and OS
- **Works best in Safari on macOS**
- Chrome may have issues loading voices

## 2. ElevenLabs (Premium)
- High-quality AI voices
- Requires API key and internet connection
- More natural sounding
- Consistent across all browsers

## Configuration

### Using Browser TTS (Default)
No configuration needed. This is the default.

### Using ElevenLabs

1. Get an API key from [ElevenLabs](https://elevenlabs.io)
2. Add to your `.env` file:
```
VITE_ELEVENLABS_API_KEY=your_api_key_here
VITE_TTS_PROVIDER=elevenlabs
```

3. (Optional) Choose a different voice:
```
VITE_ELEVENLABS_VOICE_ID=voice_id_here
```

Default voice ID: `mtrellq69YZsNwzUSyXh`

## Runtime Switching

You can switch providers at runtime in the browser console:

```javascript
// Switch to ElevenLabs
window.Game.ttsService.setProvider('elevenlabs')

// Switch back to browser TTS
window.Game.ttsService.setProvider('webspeech')

// Check current provider
window.Game.ttsService.provider
```

## Testing

Test TTS in the browser console:
```javascript
// Test current provider
window.Game.speak("Hello, this is a test")

// Test specific provider
window.Game.ttsService.speakWebSpeech("Browser TTS test", 1, 1)
window.Game.ttsService.speakElevenLabs("ElevenLabs test")
```

## Troubleshooting

### Browser TTS Not Working
1. **Safari**: Usually works best on macOS
2. **Chrome**: May need to:
   - Check chrome://settings/content/sound
   - Enable sound for the site
   - Check system accessibility settings
3. **Firefox**: Check audio permissions

### ElevenLabs Not Working
1. Check API key is valid
2. Check you have credits remaining
3. Check browser console for errors
4. Ensure internet connection

## Cost Considerations

- **Browser TTS**: Free
- **ElevenLabs**: Charges per character generated
  - Using `eleven_turbo_v2` model (cheapest option)
  - Lower quality audio format (mp3_22050_32) to reduce costs
  - Automatic caching prevents regenerating the same phrases
  - Game names are short (~10-20 characters each)
  - Estimated cost: ~$0.18 per 1000 characters with turbo model

## Cost Optimization Features

1. **Caching**: Audio is cached in memory, so repeated phrases (like game names) are only generated once
2. **Turbo Model**: Uses the cheapest ElevenLabs model (eleven_turbo_v2)
3. **Reduced Quality**: Uses lower bitrate audio (22khz, 32kbps) which is fine for short phrases
4. **No Style/Boost**: Disables expensive features like style and speaker boost
5. **Streaming Optimization**: Set to maximum latency optimization (4) for faster response