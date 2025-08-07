import { useRef, useEffect, Suspense, useState, useMemo } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { Sphere, useGLTF, useAnimations } from '@react-three/drei';
import * as THREE from 'three';
import { FBXLoader } from 'three-stdlib';

/**
 * Pixelated compositor that renders a low-res Three canvas and upscales it
 * to the display size using nearest-neighbor. No per-pixel loops, 60fps.
 */
function OptimizedPixelatedCanvas({ children, size, pixelSize = 4 }) {
  const canvasHostRef = useRef(null);
  const pixelCanvasRef = useRef(null);
  const gridCanvasRef = useRef(null);
  const animationFrameRef = useRef(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!canvasHostRef.current || !pixelCanvasRef.current) return;

    // The Three.js canvas will be the first canvas inside host
    const glCanvas = canvasHostRef.current.querySelector('canvas');
    if (!glCanvas) return;

    const pixelCanvas = pixelCanvasRef.current;
    const ctx = pixelCanvas.getContext('2d', { alpha: true, desynchronized: true });

    // Visible output size
    pixelCanvas.width = size;
    pixelCanvas.height = size;
    pixelCanvas.style.imageRendering = 'pixelated';
    pixelCanvas.style.imageRendering = '-moz-crisp-edges';
    pixelCanvas.style.imageRendering = 'crisp-edges';

    // Build a cached grid overlay (black 1px lines) matching the pixel grid
    const buildGrid = () => {
      const grid = document.createElement('canvas');
      grid.width = size;
      grid.height = size;
      const gctx = grid.getContext('2d');
      gctx.clearRect(0, 0, size, size);
      gctx.strokeStyle = 'rgba(0,0,0,1)';
      gctx.lineWidth = 1;
      gctx.translate(0.5, 0.5); // crisp 1px lines
      // Vertical lines
      for (let x = 0; x <= size; x += pixelSize) {
        gctx.beginPath();
        gctx.moveTo(x, 0);
        gctx.lineTo(x, size);
        gctx.stroke();
      }
      // Horizontal lines
      for (let y = 0; y <= size; y += pixelSize) {
        gctx.beginPath();
        gctx.moveTo(0, y);
        gctx.lineTo(size, y);
        gctx.stroke();
      }
      gctx.setTransform(1, 0, 0, 1, 0, 0);
      gridCanvasRef.current = grid;
    };

    buildGrid();

    // Animate at 60fps
    const animate = () => {
      // Draw low-res source to full-size destination with nearest neighbor
      ctx.imageSmoothingEnabled = false;
      ctx.clearRect(0, 0, size, size);
      ctx.drawImage(glCanvas, 0, 0, glCanvas.width, glCanvas.height, 0, 0, size, size);
      // Overlay grid
      if (gridCanvasRef.current) {
        ctx.drawImage(gridCanvasRef.current, 0, 0);
      }
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    // Start compositing once the GL canvas is present and sized
    const start = () => {
      setIsReady(true);
      animate();
    };

    // Delay slightly to ensure the inner Canvas has mounted and sized
    const t = setTimeout(start, 50);
    return () => {
      clearTimeout(t);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [size, pixelSize]);

  // Low-res size for the Three canvas (internal render resolution)
  const lowRes = Math.max(1, Math.floor(size / pixelSize));

  return (
    <>
      {/* Low-res Three canvas host (hidden behind pixel canvas once ready) */}
      <div
        ref={canvasHostRef}
        style={{
          position: 'absolute',
          width: `${lowRes}px`,
          height: `${lowRes}px`,
          opacity: isReady ? 0 : 1
        }}
      >
        {children}
      </div>
      {/* Upscaled pixelated output */}
      <canvas
        ref={pixelCanvasRef}
        style={{ position: 'absolute', top: 0, left: 0, width: `${size}px`, height: `${size}px` }}
      />
    </>
  );
}

/** FBX model with animation support */
function FBXModel({ color = 'white', modelPath }) {
  const groupRef = useRef();
  const fbx = useLoader(FBXLoader, modelPath);

  // Apply material once and on color change
  useEffect(() => {
    if (fbx) {
      fbx.traverse((child) => {
        if (child.isMesh) {
          child.material = new THREE.MeshBasicMaterial({ color: new THREE.Color(color) });
        }
      });
    }
  }, [fbx, color]);

  // Animation
  const mixerRef = useRef(null);
  const clockRef = useRef(new THREE.Clock());
  useEffect(() => {
    if (fbx && fbx.animations && fbx.animations.length > 0) {
      mixerRef.current = new THREE.AnimationMixer(fbx);
      const action = mixerRef.current.clipAction(fbx.animations[0]);
      action.play();
      return () => mixerRef.current?.stopAllAction();
    }
  }, [fbx]);

  useFrame((_, delta) => {
    if (groupRef.current) groupRef.current.rotation.y += delta * 0.5;
    if (mixerRef.current) mixerRef.current.update(clockRef.current.getDelta());
  });

  return (
    <group ref={groupRef} position={[0, -1, 0]}>
      <primitive object={fbx} scale={0.015} />
    </group>
  );
}

/** GLB running model with animations */
function RunningModel({ color = 'white', modelPath }) {
  const groupRef = useRef();
  const { scene, animations } = useGLTF(modelPath);
  const { actions } = useAnimations(animations, groupRef);

  useEffect(() => {
    const first = actions ? Object.keys(actions)[0] : null;
    if (first) actions[first].play();
  }, [actions]);

  useEffect(() => {
    if (scene) {
      scene.traverse((child) => {
        if (child.isMesh) {
          child.material = new THREE.MeshBasicMaterial({ color: new THREE.Color(color) });
        }
      });
    }
  }, [scene, color]);

  useFrame((_, delta) => {
    if (groupRef.current) groupRef.current.rotation.y += delta * 0.5;
  });

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      <primitive object={scene} scale={0.05} />
    </group>
  );
}

/** Simple placeholder model (not used if FBX/GLB requested) */
function RunningMan({ color = 'white' }) {
  const groupRef = useRef();
  useFrame((_, delta) => {
    if (groupRef.current) groupRef.current.rotation.y += delta * 0.5;
  });
  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      <Sphere args={[3, 16, 12]} position={[0, 0, 0]}>
        <meshBasicMaterial color={color} wireframe />
      </Sphere>
    </group>
  );
}

/** Optimized wireframe model that keeps the pixel grid look at 60fps */
function WireframeModelOptimized({ color = '255, 255, 255', modelType = 'running-man', size = 200, pixelSize = 4 }) {
  const rgb = color.split(',').map(v => parseInt(v.trim()));
  const hexColor = `#${rgb.map(v => v.toString(16).padStart(2, '0')).join('')}`;
  const lowRes = Math.max(1, Math.floor(size / pixelSize));

  return (
    <div style={{ width: `${size}px`, height: `${size}px`, position: 'relative' }}>
      <OptimizedPixelatedCanvas size={size} pixelSize={pixelSize}>
        <Canvas
          camera={{ position: [0, 2, 8], fov: 50 }}
          style={{ background: 'transparent', width: `${lowRes}px`, height: `${lowRes}px` }}
          dpr={1}
          gl={{ antialias: false, alpha: true, powerPreference: 'low-power', preserveDrawingBuffer: false }}
        >
          <ambientLight intensity={1} />
          <pointLight position={[10, 10, 10]} intensity={1} />
          <pointLight position={[-10, -10, -10]} intensity={1} />

          <Suspense fallback={null}>
            {modelType === 'running-man' && <RunningMan color={hexColor} />}
            {modelType === 'running-model' && <RunningModel color={hexColor} modelPath="/models/running-person.glb" />}
            {modelType === 'running-fbx' && <FBXModel color={hexColor} modelPath="/models/running-man.fbx" />}
            {modelType === 'sexy-mama-fbx' && <FBXModel color={hexColor} modelPath="/models/sexy-mama.fbx" />}
            {modelType === 'simon-says-fbx' && <FBXModel color={hexColor} modelPath="/models/simon-says.fbx" />}
          </Suspense>
        </Canvas>
      </OptimizedPixelatedCanvas>
    </div>
  );
}

export default WireframeModelOptimized;