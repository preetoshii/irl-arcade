import { useCallback } from 'react';
import ttsService from '../services/ttsService';

/**
 * Hook for text-to-speech using the unified TTS service
 * Now supports both browser TTS and ElevenLabs
 */
function useTTS(options = {}) {
  const { 
    pitch = 0.8, 
    rate = 0.95 
  } = options;

  const speak = useCallback(async (text) => {
    try {
      await ttsService.speak(text, pitch, rate);
    } catch (error) {
      console.error('[useTTS] Speech error:', error);
    }
  }, [pitch, rate]);

  const cancel = useCallback(() => {
    ttsService.cancel();
  }, []);

  return { speak, cancel };
}

export default useTTS;