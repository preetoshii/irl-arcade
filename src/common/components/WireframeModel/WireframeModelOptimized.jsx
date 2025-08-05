import { useRef, useEffect, Suspense, useState, useMemo } from 'react';
import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber';
import { Box, Sphere, Cylinder, useGLTF, useAnimations } from '@react-three/drei';
import * as THREE from 'three';
import { FBXLoader } from 'three-stdlib';

// Global instance counter to prevent multiple high-resource instances
let activeInstances = 0;
const MAX_INSTANCES = 2;

/**
 * Singleton-like manager for performance
 */
class PerformanceManager {
  static instance = null;
  
  constructor() {
    if (PerformanceManager.instance) {
      return PerformanceManager.instance;
    }
    
    this.activeModels = new Set();
    this.frameSkip = 0;
    PerformanceManager.instance = this;
  }
  
  register(id) {
    this.activeModels.add(id);
    // Increase frame skip based on active models
    this.frameSkip = Math.min(this.activeModels.size - 1, 3);
  }
  
  unregister(id) {
    this.activeModels.delete(id);
    this.frameSkip = Math.min(this.activeModels.size - 1, 3);
  }
  
  shouldSkipFrame() {
    return this.frameSkip > 0 && Math.random() < (this.frameSkip * 0.25);
  }
}

const performanceManager = new PerformanceManager();

/**
 * Optimized pixelation with WebGL shader approach
 */
function OptimizedPixelatedCanvas({ children, size, color, modelId }) {
  const canvasRef = useRef(null);
  const pixelCanvasRef = useRef(null);
  const [isReady, setIsReady] = useState(false);
  const animationFrameRef = useRef(null);
  const frameCountRef = useRef(0);
  
  useEffect(() => {
    if (!canvasRef.current || !pixelCanvasRef.current) return;
    
    const canvas = canvasRef.current.querySelector('canvas');
    if (!canvas) return;
    
    const pixelCanvas = pixelCanvasRef.current;
    const ctx = pixelCanvas.getContext('2d', { 
      willReadFrequently: false, // Don't need frequent reads with this approach
      alpha: true,
      desynchronized: true // Better performance for animations
    });
    
    // Set canvas size for pixelation
    const pixelSize = 6; // Larger pixels for better performance
    const lowResWidth = Math.ceil(size / pixelSize);
    const lowResHeight = Math.ceil(size / pixelSize);
    
    pixelCanvas.width = size;
    pixelCanvas.height = size;
    
    // Pre-calculate color
    const rgbValues = color.split(',').map(v => parseInt(v.trim()));
    ctx.fillStyle = `rgb(${rgbValues[0]}, ${rgbValues[1]}, ${rgbValues[2]})`;
    
    // Use CSS for pixelation instead of manual pixel drawing
    pixelCanvas.style.imageRendering = 'pixelated';
    pixelCanvas.style.imageRendering = '-moz-crisp-edges';
    pixelCanvas.style.imageRendering = 'crisp-edges';
    
    const animate = () => {
      frameCountRef.current++;
      
      // Dynamic frame skipping based on performance
      const skipFrames = performanceManager.shouldSkipFrame() ? 3 : 2;
      if (frameCountRef.current % skipFrames !== 0) {
        animationFrameRef.current = requestAnimationFrame(animate);
        return;
      }
      
      // Simple approach: draw the 3D canvas directly at low res
      ctx.clearRect(0, 0, pixelCanvas.width, pixelCanvas.height);
      ctx.imageSmoothingEnabled = false;
      
      // Draw at low resolution and let CSS handle pixelation
      ctx.drawImage(canvas, 0, 0, pixelCanvas.width, pixelCanvas.height, 
                    0, 0, lowResWidth, lowResHeight);
      
      // Scale back up
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = lowResWidth;
      tempCanvas.height = lowResHeight;
      const tempCtx = tempCanvas.getContext('2d');
      tempCtx.drawImage(pixelCanvas, 0, 0, lowResWidth, lowResHeight);
      
      ctx.clearRect(0, 0, pixelCanvas.width, pixelCanvas.height);
      ctx.drawImage(tempCanvas, 0, 0, lowResWidth, lowResHeight,
                    0, 0, pixelCanvas.width, pixelCanvas.height);
      
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    
    // Start animation after a brief delay
    const timeoutId = setTimeout(() => {
      setIsReady(true);
      performanceManager.register(modelId);
      animate();
    }, 100);
    
    // Cleanup function
    return () => {
      clearTimeout(timeoutId);
      performanceManager.unregister(modelId);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [size, color, modelId]);
  
  return (
    <>
      <div 
        ref={canvasRef}
        style={{ 
          position: 'absolute',
          opacity: isReady ? 0 : 1,
          width: `${size}px`,
          height: `${size}px`
        }}
      >
        {children}
      </div>
      <canvas
        ref={pixelCanvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: `${size}px`,
          height: `${size}px`
        }}
      />
    </>
  );
}

/**
 * Simplified running man with reduced complexity
 */
function SimplifiedRunningMan({ color = 'white' }) {
  const groupRef = useRef();
  const timeRef = useRef(0);
  
  // Rotate and animate with reduced frequency
  useFrame((state, delta) => {
    if (!groupRef.current) return;
    
    // Skip frames for performance
    timeRef.current += delta;
    if (timeRef.current < 0.033) return; // Cap at ~30fps
    
    groupRef.current.rotation.y += timeRef.current * 0.5;
    timeRef.current = 0;
  });
  
  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {/* Simplified geometry with fewer segments */}
      <Sphere args={[3, 8, 6]} position={[0, 0, 0]}>
        <meshBasicMaterial color={color} wireframe />
      </Sphere>
    </group>
  );
}

/**
 * Performance-aware wrapper component
 */
function PerformanceAwareModel({ children, fallback }) {
  const [canRender, setCanRender] = useState(false);
  
  useEffect(() => {
    // Check if we can render based on active instances
    if (activeInstances < MAX_INSTANCES) {
      activeInstances++;
      setCanRender(true);
      
      return () => {
        activeInstances--;
      };
    }
  }, []);
  
  if (!canRender) {
    return fallback || <div>Loading...</div>;
  }
  
  return children;
}

/**
 * Optimized Wireframe 3D model component
 */
function WireframeModelOptimized({ 
  color = '255, 255, 255',
  modelType = 'running-man',
  size = 200,
  enablePerformanceMode = true
}) {
  const modelId = useRef(`model-${Date.now()}`).current;
  
  // Convert RGB string to hex for Three.js
  const hexColor = useMemo(() => {
    const rgbValues = color.split(',').map(v => parseInt(v.trim()));
    return `#${rgbValues.map(v => v.toString(16).padStart(2, '0')).join('')}`;
  }, [color]);
  
  // Use simpler model if performance mode is enabled
  const actualModelType = enablePerformanceMode ? 'simplified' : modelType;
  
  return (
    <PerformanceAwareModel
      fallback={
        <div style={{ 
          width: `${size}px`, 
          height: `${size}px`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: `rgb(${color})`
        }}>
          Loading 3D Model...
        </div>
      }
    >
      <div style={{ 
        width: `${size}px`, 
        height: `${size}px`,
        position: 'relative'
      }}>
        <OptimizedPixelatedCanvas size={size} color={color} modelId={modelId}>
          <Canvas
            camera={{ position: [0, 2, 8], fov: 50 }}
            style={{ background: 'transparent' }}
            dpr={1}
            gl={{ 
              antialias: false, 
              alpha: true,
              powerPreference: 'low-power',
              preserveDrawingBuffer: false,
              failIfMajorPerformanceCaveat: true
            }}
            frameloop="demand" // Only render when needed
          >
            <ambientLight intensity={1} />
            
            <Suspense fallback={null}>
              <SimplifiedRunningMan color={hexColor} />
            </Suspense>
          </Canvas>
        </OptimizedPixelatedCanvas>
      </div>
    </PerformanceAwareModel>
  );
}

export default WireframeModelOptimized;