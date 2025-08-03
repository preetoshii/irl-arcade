import { useEffect, useRef } from 'react';
import styles from './CursorTrail.module.css';

function CursorTrail({ color = '255, 255, 255' }) {
  const canvasRef = useRef(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const trailRef = useRef([]);
  const animationRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Set canvas size
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Track mouse position
    const handleMouseMove = (e) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener('mousemove', handleMouseMove);

    // Pixel size (matching blob pixel size)
    const pixelSize = 4;
    const maxTrailLength = 20; // Number of trail segments
    
    // Trail segment class
    class TrailSegment {
      constructor(x, y, index) {
        this.x = x;
        this.y = y;
        this.life = 1;
        this.index = index;
        this.size = 1;
        
        // Random blob-like variations
        this.offsetX = (Math.random() - 0.5) * pixelSize;
        this.offsetY = (Math.random() - 0.5) * pixelSize;
        this.phase = Math.random() * Math.PI * 2;
      }
      
      update(targetX, targetY) {
        // Smooth follow with elastic effect
        const dx = targetX - this.x;
        const dy = targetY - this.y;
        
        this.x += dx * 0.15;
        this.y += dy * 0.15;
        
        // Add subtle wobble
        this.phase += 0.1;
        this.offsetX = Math.sin(this.phase) * pixelSize * 0.5;
        this.offsetY = Math.cos(this.phase * 1.3) * pixelSize * 0.5;
        
        // Fade based on position in trail
        this.life = 1 - (this.index / maxTrailLength);
      }
      
      draw(ctx) {
        if (this.life <= 0) return;
        
        // Pixelated position
        const pixelX = Math.floor((this.x + this.offsetX) / pixelSize) * pixelSize;
        const pixelY = Math.floor((this.y + this.offsetY) / pixelSize) * pixelSize;
        
        // Blob-like shape with varying sizes
        const baseSize = pixelSize * (1 + Math.sin(this.phase) * 0.3);
        const alpha = this.life * 0.6; // Semi-transparent
        
        ctx.fillStyle = `rgba(${color}, ${alpha})`;
        
        // Draw pixelated blob shape
        const size = Math.floor(baseSize / pixelSize) * pixelSize;
        ctx.fillRect(pixelX - size/2, pixelY - size/2, size, size);
        
        // Add some extra pixels for blob effect
        if (this.life > 0.5) {
          ctx.fillRect(pixelX - size/2 - pixelSize, pixelY, pixelSize, pixelSize);
          ctx.fillRect(pixelX + size/2, pixelY, pixelSize, pixelSize);
          ctx.fillRect(pixelX, pixelY - size/2 - pixelSize, pixelSize, pixelSize);
          ctx.fillRect(pixelX, pixelY + size/2, pixelSize, pixelSize);
        }
      }
    }
    
    // Initialize trail
    let frameCount = 0;
    
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      frameCount++;
      
      // Add new segment every few frames
      if (frameCount % 2 === 0) {
        // Add to front of trail
        trailRef.current.unshift(new TrailSegment(
          mouseRef.current.x,
          mouseRef.current.y,
          0
        ));
        
        // Update indices
        trailRef.current.forEach((segment, i) => {
          segment.index = i;
        });
        
        // Limit trail length
        if (trailRef.current.length > maxTrailLength) {
          trailRef.current.pop();
        }
      }
      
      // Update and draw trail segments
      trailRef.current.forEach((segment, i) => {
        const target = i === 0 ? mouseRef.current : trailRef.current[i - 1];
        segment.update(target.x, target.y);
        segment.draw(ctx);
      });
      
      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [color]);

  return <canvas ref={canvasRef} className={styles.canvas} />;
}

export default CursorTrail;