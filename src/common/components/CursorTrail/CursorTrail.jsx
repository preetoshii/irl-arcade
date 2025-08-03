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

    // Track mouse position and movement
    const lastMouseRef = useRef({ x: 0, y: 0 });
    const isMovingRef = useRef(false);
    const movementTimeoutRef = useRef(null);
    
    const handleMouseMove = (e) => {
      const dx = e.clientX - lastMouseRef.current.x;
      const dy = e.clientY - lastMouseRef.current.y;
      
      // Check if mouse actually moved
      if (Math.abs(dx) > 0.1 || Math.abs(dy) > 0.1) {
        isMovingRef.current = true;
        mouseRef.current = { x: e.clientX, y: e.clientY };
        lastMouseRef.current = { x: e.clientX, y: e.clientY };
        
        // Clear any existing timeout
        clearTimeout(movementTimeoutRef.current);
        
        // Set mouse as not moving after 100ms of no movement
        movementTimeoutRef.current = setTimeout(() => {
          isMovingRef.current = false;
        }, 100);
      }
    };
    window.addEventListener('mousemove', handleMouseMove);

    // Trail settings
    const maxTrailLength = 15; // Number of trail segments
    
    // Trail segment class
    class TrailSegment {
      constructor(x, y, index) {
        this.x = x;
        this.y = y;
        this.life = 1;
        this.index = index;
      }
      
      update(targetX, targetY) {
        // Smooth follow with elastic effect
        const dx = targetX - this.x;
        const dy = targetY - this.y;
        
        this.x += dx * 0.2;
        this.y += dy * 0.2;
        
        // Fade based on position in trail
        this.life = 1 - (this.index / maxTrailLength);
      }
      
      draw(ctx) {
        if (this.life <= 0) return;
        
        const alpha = this.life * 0.5; // Semi-transparent
        const scale = this.life * 0.8 + 0.2; // Scale from 100% to 20%
        
        // Draw triangle cursor shape
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.scale(scale, scale);
        
        ctx.strokeStyle = `rgba(${color}, ${alpha})`;
        ctx.lineWidth = 2;
        ctx.lineJoin = 'round';
        
        // Draw triangle path (matching cursor shape)
        ctx.beginPath();
        ctx.moveTo(-8, -10); // Left point
        ctx.lineTo(12, 0);   // Right point (tip)
        ctx.lineTo(-8, 10);  // Bottom point
        ctx.closePath();
        ctx.stroke();
        
        ctx.restore();
      }
    }
    
    // Initialize trail
    let frameCount = 0;
    
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      frameCount++;
      
      // Only add new segments when mouse is moving
      if (frameCount % 2 === 0 && isMovingRef.current) {
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
      
      // Remove segments faster when not moving
      if (!isMovingRef.current && trailRef.current.length > 0) {
        trailRef.current.pop();
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