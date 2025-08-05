import { useEffect, useRef } from 'react';
import styles from './ParticleStarfield.module.css';

function ParticleStarfield({ color = '255, 255, 255' }) {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const particlesRef = useRef([]);
  const colorRef = useRef(color);

  // Update color ref when prop changes
  useEffect(() => {
    colorRef.current = color;
  }, [color]);

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
        
        // Parallax: distant stars move slower, close stars move faster
        this.depth = Math.random(); // 0 = far, 1 = close
        const baseSpeed = 0.8 + this.depth * 6; // Gentle warp speed
        const speed = baseSpeed + Math.random() * 2;
        
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        
        // Calculate distance to screen edge for this angle
        const distToEdge = this.getDistanceToEdge(angle, canvas.width, canvas.height);
        
        // Lifespan based on distance to travel
        this.life = 1;
        this.maxLife = distToEdge / speed; // Time to reach edge
        this.decay = 1 / this.maxLife; // Decay rate to reach edge
        
        // Size based on depth - closer stars are bigger
        this.size = this.depth > 0.7 ? 2 : 1;
        
        // Store previous positions for trail effect
        this.prevX = this.x;
        this.prevY = this.y;
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
        // Store previous position for trail
        this.prevX = this.x;
        this.prevY = this.y;
        
        // Moderate acceleration as stars get closer (like warp speed)
        const acceleration = 1 + (1 - this.life) * 1; // Up to 2x faster as they approach edge
        
        this.x += this.vx * acceleration;
        this.y += this.vy * acceleration;
        this.life -= this.decay;
        
        // Return false if particle is dead
        return this.life > 0;
      }
      
      draw(ctx, pixelSize) {
        // Draw as long as particle is alive
        if (this.life <= 0) return;
        
        // Brightness based on depth - closer stars are brighter
        const brightness = 0.3 + this.depth * 0.7; // 30% to 100% brightness
        
        // Calculate speed for trail length
        const dx = this.x - this.prevX;
        const dy = this.y - this.prevY;
        const speed = Math.sqrt(dx * dx + dy * dy);
        
        // Only draw trails for fast-moving stars
        if (speed > 5 && this.depth > 0.3) {
          // Draw motion blur trail
          ctx.strokeStyle = `rgba(${colorRef.current}, ${brightness * 0.8})`;
          ctx.lineWidth = this.size * pixelSize;
          ctx.beginPath();
          ctx.moveTo(this.prevX, this.prevY);
          ctx.lineTo(this.x, this.y);
          ctx.stroke();
        } else {
          // Draw normal pixel for slow stars
          const pixelX = Math.floor(this.x / pixelSize) * pixelSize;
          const pixelY = Math.floor(this.y / pixelSize) * pixelSize;
          ctx.fillStyle = `rgba(${colorRef.current}, ${brightness})`;
          const particleSize = this.size * pixelSize;
          ctx.fillRect(pixelX, pixelY, particleSize - 1, particleSize - 1);
        }
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
      
      // Spawn new particles at moderate rate
      if (frameCount % 6 === 0) { // Every 6 frames (10 per second at 60fps)
        particlesRef.current.push(new Particle());
      }
      
      // Update and draw particles
      particlesRef.current = particlesRef.current.filter(particle => {
        const alive = particle.update();
        if (alive) {
          particle.draw(ctx, pixelSize);
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
  }, []); // Remove analyser dependency

  return <canvas ref={canvasRef} className={styles.canvas} />;
}

export default ParticleStarfield;