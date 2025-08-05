import { useCallback, useEffect, useRef } from 'react';

/**
 * Hook for text-to-speech with voice selection and cancellation
 */
function useTTS(options = {}) {
  const { 
    voicePreference = 'male', 
    pitch = 0.8, 
    rate = 0.95 
  } = options;
  
  const voicesLoaded = useRef(false);
  const americanMaleVoice = useRef(null);

  // Load voices once
  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      
      if (voices.length > 0) {
        voicesLoaded.current = true;
        
        // Find American male voice
        americanMaleVoice.current = voices.find(voice => {
          const name = voice.name.toLowerCase();
          const lang = voice.lang.toLowerCase();
          
          // Must be English
          if (!lang.includes('en')) return false;
          
          // Exclude female voices
          if (name.includes('female') || name.includes('samantha') || 
              name.includes('victoria') || name.includes('karen') || 
              name.includes('moira') || name.includes('fiona') ||
              name.includes('tessa') || name.includes('zira')) return false;
          
          // Prefer known male voices
          return name.includes('alex') || name.includes('fred') || 
                 name.includes('bruce') || name.includes('male') ||
                 name.includes('david') || name.includes('mark');
        });
      }
    };

    // Try to load immediately
    loadVoices();
    
    // Also set up listener for when voices change
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  const speak = useCallback((text) => {
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Use preferred voice if available
    if (americanMaleVoice.current) {
      utterance.voice = americanMaleVoice.current;
    }
    
    utterance.pitch = pitch;
    utterance.rate = rate;
    
    window.speechSynthesis.speak(utterance);
  }, [pitch, rate]);

  const cancel = useCallback(() => {
    window.speechSynthesis.cancel();
  }, []);

  return { speak, cancel };
}

export default useTTS;