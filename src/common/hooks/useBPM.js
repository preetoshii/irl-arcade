import { useState, useEffect, useRef } from 'react';

/**
 * Hook for detecting BPM and rhythm from audio analyser
 * Uses beat detection algorithm to find tempo and provide beat events
 */
function useBPM(analyser) {
  const [bpm, setBPM] = useState(0);
  const [isBeat, setIsBeat] = useState(false);
  
  // Beat detection state
  const beatDetectorRef = useRef({
    energyHistory: [],
    beatTimes: [],
    lastBeatTime: 0,
    threshold: 1.3, // Beat detected when energy is 1.3x average
  });
  
  useEffect(() => {
    if (!analyser) return;
    
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    let animationId;
    
    const detectBeat = () => {
      analyser.getByteFrequencyData(dataArray);
      
      // Focus on bass frequencies (0-250Hz range for kick drums)
      const bassEnd = Math.floor(bufferLength * 250 / 24000); // Assuming 48kHz sample rate
      let bassEnergy = 0;
      
      for (let i = 0; i < bassEnd; i++) {
        bassEnergy += dataArray[i];
      }
      bassEnergy /= bassEnd;
      
      const detector = beatDetectorRef.current;
      detector.energyHistory.push(bassEnergy);
      
      // Keep only last 43 samples (~1 second at 60fps)
      if (detector.energyHistory.length > 43) {
        detector.energyHistory.shift();
      }
      
      // Calculate average energy
      const avgEnergy = detector.energyHistory.reduce((a, b) => a + b, 0) / detector.energyHistory.length;
      
      // Detect beat
      const now = Date.now();
      const timeSinceLastBeat = now - detector.lastBeatTime;
      
      // Beat detected if energy spike and enough time passed (min 200ms between beats)
      if (bassEnergy > avgEnergy * detector.threshold && timeSinceLastBeat > 200) {
        detector.lastBeatTime = now;
        detector.beatTimes.push(now);
        
        // Flash beat indicator
        setIsBeat(true);
        setTimeout(() => setIsBeat(false), 50);
        
        // Keep only beats from last 5 seconds
        const fiveSecondsAgo = now - 5000;
        detector.beatTimes = detector.beatTimes.filter(time => time > fiveSecondsAgo);
        
        // Calculate BPM from recent beats
        if (detector.beatTimes.length > 3) {
          const intervals = [];
          for (let i = 1; i < detector.beatTimes.length; i++) {
            intervals.push(detector.beatTimes[i] - detector.beatTimes[i - 1]);
          }
          
          // Get median interval (more stable than average)
          intervals.sort((a, b) => a - b);
          const medianInterval = intervals[Math.floor(intervals.length / 2)];
          const estimatedBPM = Math.round(60000 / medianInterval);
          
          // Only update if reasonable BPM (60-200)
          if (estimatedBPM >= 60 && estimatedBPM <= 200) {
            setBPM(estimatedBPM);
          }
        }
      }
      
      animationId = requestAnimationFrame(detectBeat);
    };
    
    detectBeat();
    
    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [analyser]);
  
  return { bpm, isBeat };
}

export default useBPM;