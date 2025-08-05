import { useCallback, useRef } from 'react';

/**
 * Hook for managing game sounds with consistent volume and error handling
 */
function useSound() {
  const audioCache = useRef({});
  
  const playSound = useCallback((soundPath, volume = 0.3) => {
    try {
      // Use cached audio or create new
      if (!audioCache.current[soundPath]) {
        audioCache.current[soundPath] = new Audio(soundPath);
      }
      
      const audio = audioCache.current[soundPath];
      audio.volume = volume;
      audio.currentTime = 0; // Reset to start
      
      return audio.play().catch(err => {
        console.log(`Sound failed (${soundPath}):`, err);
      });
    } catch (err) {
      console.log(`Sound error (${soundPath}):`, err);
    }
  }, []);

  return {
    playHover: useCallback(() => playSound('/sounds/hover.wav'), [playSound]),
    playClick: useCallback(() => playSound('/sounds/click.wav'), [playSound]),
    playSwipe: useCallback(() => playSound('/sounds/sweep.wav'), [playSound]),
    playSelect: useCallback(() => playSound('/sounds/select.wav'), [playSound]),
    playSound // Generic function for custom sounds
  };
}

export default useSound;