import { useState, useEffect, useRef } from 'react';
import useBPM from './useBPM';

/**
 * Hook that provides rhythm-synced animations and values
 * Returns oscillating values, pulses, and phase information synced to music
 */
function useRhythm(analyser) {
  const { bpm, isBeat } = useBPM(analyser);
  const [phase, setPhase] = useState(0); // 0-1 phase within current beat
  const [beatCount, setBeatCount] = useState(0);
  const phaseRef = useRef(0);
  const lastTimeRef = useRef(Date.now());
  
  useEffect(() => {
    if (!analyser || !bpm || bpm === 0) return;
    
    const beatDuration = 60000 / bpm; // milliseconds per beat
    let animationId;
    
    const updatePhase = () => {
      const now = Date.now();
      const deltaTime = now - lastTimeRef.current;
      lastTimeRef.current = now;
      
      // Update phase based on BPM
      phaseRef.current += (deltaTime / beatDuration);
      
      // Wrap phase and count beats
      if (phaseRef.current >= 1) {
        phaseRef.current -= 1;
        setBeatCount(prev => prev + 1);
      }
      
      setPhase(phaseRef.current);
      animationId = requestAnimationFrame(updatePhase);
    };
    
    updatePhase();
    
    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [bpm]);
  
  // Reset phase on beat detection for better sync
  useEffect(() => {
    if (analyser && isBeat && bpm > 0) {
      phaseRef.current = 0;
    }
  }, [analyser, isBeat, bpm]);
  
  // Calculate rhythm values
  const pulse = analyser ? Math.sin(phase * Math.PI * 2) * 0.5 + 0.5 : 0.5;
  const kick = analyser ? 1 - phase : 1;
  const bounce = analyser ? Math.abs(Math.sin(phase * Math.PI)) : 0;
  
  return {
    bpm: analyser ? bpm : 0,
    isBeat: analyser ? isBeat : false,
    phase: analyser ? phase : 0,
    beatCount: analyser ? beatCount : 0,
    pulse,     // Smooth 0-1 oscillation
    kick,      // Sharp 1-0 decay
    bounce,    // 0-1-0 bounce per beat
  };
}

export default useRhythm;