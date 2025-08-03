import { useEffect, useRef } from 'react';
import styles from './PixelParticles.module.css';

function PixelParticles({ color = '255, 255, 255' }) {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const particlesRef = useRef([]);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Set canvas size
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      console.log('Particle canvas size:', canvas.width, 'x', canvas.height);
      console.log('Window size:', window.innerWidth, 'x', window.innerHeight);
    };
    resize();
    window.addEventListener('resize', resize);

    // Pixel size matching blob pixel size
    const pixelSize = 4;
    
    // Particle class
    class Particle {
      constructor() {
        // Start at center
        this.x = canvas.width / 2;
        this.y = canvas.height / 2;
        
        // Random angle for radial movement
        const angle = Math.random() * Math.PI * 2;
        const speed = 1 + Math.random() * 3; // Faster to reach screen edges
        
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        
        // Calculate distance to screen edge for this angle
        const distToEdge = this.getDistanceToEdge(angle, canvas.width, canvas.height);
        
        // Lifespan based on distance to travel
        this.life = 1;
        this.maxLife = distToEdge / speed; // Time to reach edge
        this.decay = 1 / this.maxLife; // Decay rate to reach edge
        
        // Size variation
        this.size = Math.random() > 0.8 ? 2 : 1;
      }
      
      getDistanceToEdge(angle, canvasWidth, canvasHeight) {
        const centerX = canvasWidth / 2;
        const centerY = canvasHeight / 2;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        
        // Calculate distance to each edge
        const distRight = (canvasWidth - centerX) / Math.abs(cos);
        const distLeft = centerX / Math.abs(cos);
        const distBottom = (canvasHeight - centerY) / Math.abs(sin);
        const distTop = centerY / Math.abs(sin);
        
        // Find the minimum valid distance
        let minDist = Infinity;
        
        if (cos > 0) minDist = Math.min(minDist, distRight);
        if (cos < 0) minDist = Math.min(minDist, distLeft);
        if (sin > 0) minDist = Math.min(minDist, distBottom);
        if (sin < 0) minDist = Math.min(minDist, distTop);
        
        return minDist;
      }
      
      update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= this.decay;
        
        // No gravity - constant velocity like stars
        
        // Return false if particle is dead
        return this.life > 0;
      }
      
      draw(ctx) {
        // Only draw if above threshold for solid pixels
        if (this.life > 0.3) {
          ctx.fillStyle = `rgba(${color}, 1)`; // Solid color matching game
        } else {
          // Don't draw - creates discrete on/off effect
          return;
        }
        
        // Snap to pixel grid
        const pixelX = Math.floor(this.x / pixelSize) * pixelSize;
        const pixelY = Math.floor(this.y / pixelSize) * pixelSize;
        
        // Draw pixelated particle
        const particleSize = this.size * pixelSize;
        ctx.fillRect(pixelX, pixelY, particleSize - 1, particleSize - 1);
      }
    }
    
    // Initialize particles array
    particlesRef.current = [];
    
    // Spawn new particles periodically
    let frameCount = 0;
    
    const draw = () => {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      frameCount++;
      
      // Spawn new particles - VERY minimal
      if (frameCount % 30 === 0) { // Every half second at 60fps
        particlesRef.current.push(new Particle()); // Just 1 particle
      }
      
      // Update and draw particles
      particlesRef.current = particlesRef.current.filter(particle => {
        const alive = particle.update();
        if (alive) {
          particle.draw(ctx);
        }
        return alive;
      });
      
      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [color]);

  return <canvas ref={canvasRef} className={styles.canvas} />;
}

export default PixelParticles;