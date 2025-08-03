/**
 * GameTitleScreen.jsx - Reusable title screen component for all games
 * 
 * Provides consistent retro-minimal title screen layout.
 * Each game passes in its specific content and colors.
 */

import { useEffect, useRef } from 'react';
import styles from './GameTitleScreen.module.css';

// Individual letter blob component
function LetterBlob({ letter, index, color = '255, 255, 255', analyser }) {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Set canvas size to match container
    const resize = () => {
      const rect = canvas.parentElement.getBoundingClientRect();
      canvas.width = 160;  // Larger canvas for more space
      canvas.height = 160;
      canvas.style.width = '160px';
      canvas.style.height = '160px';
    };
    resize();
    window.addEventListener('resize', resize);

    // Pixel size
    const pixelSize = 4;
    let time = 0;
    
    // Create unique offset for each letter
    const letterOffset = letter.charCodeAt(0) * 0.1 + index * 0.5;
    
    // Audio data for scaling
    const bufferLength = analyser ? analyser.frequencyBinCount : 0;
    const dataArray = new Uint8Array(bufferLength);
    
    const draw = () => {
      const cols = Math.ceil(canvas.width / pixelSize);
      const rows = Math.ceil(canvas.height / pixelSize);
      
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      time += 0.02;
      
      // Get audio data if available
      let audioScale = 1;
      if (analyser) {
        analyser.getByteFrequencyData(dataArray);
        // Use different frequency ranges for different letters
        const freqIndex = index % 3;
        let freqValue = 0;
        if (freqIndex === 0) {
          // Bass for first third of letters
          freqValue = dataArray.slice(0, 10).reduce((a, b) => a + b, 0) / 10 / 255;
        } else if (freqIndex === 1) {
          // Mids for second third
          freqValue = dataArray.slice(20, 80).reduce((a, b) => a + b, 0) / 60 / 255;
        } else {
          // Highs for last third
          freqValue = dataArray.slice(100, 150).reduce((a, b) => a + b, 0) / 50 / 255;
        }
        // Scale between 0.8 and 1.5 based on audio
        audioScale = 0.8 + freqValue * 0.7;
      }
      
      // Center of canvas
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const baseRadius = canvas.width * 0.1875 * audioScale; // Same absolute size as before (30% of 100 = 18.75% of 160)
      
      // Draw pixelated blob
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const pixelX = x * pixelSize + pixelSize / 2;
          const pixelY = y * pixelSize + pixelSize / 2;
          
          // Distance and angle from center
          const dx = pixelX - centerX;
          const dy = pixelY - centerY;
          const angle = Math.atan2(dy, dx);
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          // Create fiery, organic shape using multiple sine waves - unique per letter
          const wave1 = Math.sin(angle * 3 + time + letterOffset) * 8;
          const wave2 = Math.sin(angle * 5 - time * 1.5 + letterOffset * 2) * 5;
          const wave3 = Math.sin(angle * 7 + time * 0.7 - letterOffset) * 4;
          const wave4 = Math.sin(angle * 2 - time * 0.5 + letterOffset * 1.5) * 6;
          
          // Combine waves for complex shape
          const radiusVariation = wave1 + wave2 + wave3 + wave4;
          
          // Add pulsing - only expand, never shrink below base
          const pulse = Math.sin(time * 2) * 5 + Math.sin(time * 3.7) * 3;
          const expandOnly = Math.max(0, pulse);
          
          // Calculate dynamic radius - ensure it never goes below baseRadius
          const dynamicRadius = baseRadius + Math.max(0, radiusVariation) + expandOnly;
          
          // Add noise for more organic feel - only positive to avoid shrinking
          const noise = (Math.sin(x * 0.2 + time) * Math.cos(y * 0.2 - time) + 1) * 5;
          const finalRadius = dynamicRadius + noise;
          
          // Check if pixel is within blob
          if (distance < finalRadius) {
            ctx.fillStyle = `rgba(${color}, 1)`;
            ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize - 1, pixelSize - 1);
          }
        }
      }
      
      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [letter, index, color, analyser]);

  return (
    <canvas 
      ref={canvasRef} 
      className={styles.letterBlob}
    />
  );
}

function GameTitleScreen({ 
  title,
  backgroundColor = 'transparent',
  blobColor = '255, 255, 255', // RGB values as string
  className = '',
  analyser
}) {
  return (
    <div 
      className={`${styles.titleScreen} ${className}`}
      style={{ backgroundColor }}
    >
      <h1 className={styles.gameTitle}>
        {title.split('').map((letter, index) => (
          <span 
            key={index} 
            style={{ 
              animationDelay: `${index * 0.1}s`,
              position: 'relative'
            }}
          >
            {letter !== ' ' && <LetterBlob letter={letter} index={index} color={blobColor} analyser={analyser} />}
            <span className={styles.letterText}>{letter === ' ' ? '\u00A0' : letter}</span>
          </span>
        ))}
      </h1>
    </div>
  );
}

export default GameTitleScreen;