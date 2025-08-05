import { useRef, useEffect, Suspense, useState } from 'react';
import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber';
import { Box, Sphere, Cylinder, useGLTF, useAnimations } from '@react-three/drei';
import * as THREE from 'three';
import { FBXLoader } from 'three-stdlib';

/**
 * FBX model loader
 */
function FBXModel({ color = 'white', modelPath }) {
  const groupRef = useRef();
  const fbx = useLoader(FBXLoader, modelPath);
  
  // Apply wireframe material to all meshes
  useEffect(() => {
    if (fbx) {
      fbx.traverse((child) => {
        if (child.isMesh) {
          // Use a simpler geometry to reduce wireframe density
          const geometry = child.geometry;
          
          child.material = new THREE.MeshBasicMaterial({
            color: new THREE.Color(color),
            wireframe: false
          });
        }
      });
    }
  }, [fbx, color]);
  
  // Animate if it has animations
  useEffect(() => {
    if (fbx.animations && fbx.animations.length > 0) {
      const mixer = new THREE.AnimationMixer(fbx);
      const action = mixer.clipAction(fbx.animations[0]);
      action.play();
      
      // Update animation in render loop
      const clock = new THREE.Clock();
      const animate = () => {
        requestAnimationFrame(animate);
        mixer.update(clock.getDelta());
      };
      animate();
      
      return () => mixer.stopAllAction();
    }
  }, [fbx]);
  
  // Rotate the model
  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.5;
    }
  });
  
  return (
    <group ref={groupRef} position={[0, -1, 0]}>
      <primitive object={fbx} scale={0.015} />
    </group>
  );
}

/**
 * High-fidelity 3D model loader
 */
function RunningModel({ color = 'white', modelPath }) {
  const groupRef = useRef();
  const { scene, animations } = useGLTF(modelPath);
  const { actions } = useAnimations(animations, groupRef);
  
  // Play running animation
  useEffect(() => {
    if (actions) {
      const firstAnimation = Object.keys(actions)[0];
      if (firstAnimation) {
        actions[firstAnimation].play();
      }
    }
  }, [actions]);
  
  // Apply wireframe material to all meshes
  useEffect(() => {
    if (scene) {
      scene.traverse((child) => {
        if (child.isMesh) {
          // Create bright wireframe material
          child.material = new THREE.MeshBasicMaterial({
            color: new THREE.Color(color),
            wireframe: false
          });
        }
      });
    }
  }, [scene, color]);
  
  // Rotate the model
  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.5;
    }
  });
  
  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      <primitive object={scene} scale={0.05} />
    </group>
  );
}

/**
 * Simple running man made from basic geometric shapes
 * Animated in a running pose
 */
function RunningMan({ color = 'white' }) {
  const groupRef = useRef();
  const legPhase = useRef(0);
  
  // Rotate the entire model
  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.5; // Slow rotation
      
      // Animate legs
      legPhase.current += delta * 8;
      const legSwing = Math.sin(legPhase.current) * 0.4;
      
      // Animate left leg
      if (groupRef.current.children[3]) {
        groupRef.current.children[3].rotation.x = legSwing;
      }
      // Animate right leg (opposite phase)
      if (groupRef.current.children[4]) {
        groupRef.current.children[4].rotation.x = -legSwing;
      }
      
      // Animate arms (opposite to legs)
      if (groupRef.current.children[5]) {
        groupRef.current.children[5].rotation.x = -legSwing * 0.7;
      }
      if (groupRef.current.children[6]) {
        groupRef.current.children[6].rotation.x = legSwing * 0.7;
      }
    }
  });
  
  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {/* Just a large sphere for now */}
      <Sphere args={[3, 16, 12]} position={[0, 0, 0]}>
        <meshBasicMaterial color={color} wireframe />
      </Sphere>
    </group>
  );
}

/**
 * Pixelation effect component
 */
function PixelatedCanvas({ children, size, color }) {
  const canvasRef = useRef(null);
  const pixelCanvasRef = useRef(null);
  const [isReady, setIsReady] = useState(false);
  
  useEffect(() => {
    if (!canvasRef.current || !pixelCanvasRef.current) return;
    
    const canvas = canvasRef.current.querySelector('canvas');
    if (!canvas) return;
    
    const pixelCanvas = pixelCanvasRef.current;
    const ctx = pixelCanvas.getContext('2d');
    
    // Set canvas size for pixelation
    const pixelSize = 4; // Same as blob pixelation
    const lowResWidth = Math.ceil(size / pixelSize);
    const lowResHeight = Math.ceil(size / pixelSize);
    
    pixelCanvas.width = size;
    pixelCanvas.height = size;
    
    const animate = () => {
      // Clear canvas
      ctx.clearRect(0, 0, pixelCanvas.width, pixelCanvas.height);
      
      // Draw 3D canvas to 2D canvas at low resolution
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(canvas, 0, 0, lowResWidth, lowResHeight);
      
      // Get image data and redraw pixelated
      const imageData = ctx.getImageData(0, 0, lowResWidth, lowResHeight);
      const data = imageData.data;
      
      ctx.clearRect(0, 0, pixelCanvas.width, pixelCanvas.height);
      
      // Draw pixels
      for (let y = 0; y < lowResHeight; y++) {
        for (let x = 0; x < lowResWidth; x++) {
          const i = (y * lowResWidth + x) * 4;
          const alpha = data[i + 3] / 255;
          
          if (alpha > 0.1) { // Only draw visible pixels
            ctx.fillStyle = `rgba(${color}, ${alpha})`;
            ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize - 1, pixelSize - 1);
          }
        }
      }
      
      requestAnimationFrame(animate);
    };
    
    // Start animation after a brief delay
    setTimeout(() => {
      setIsReady(true);
      animate();
    }, 100);
  }, [size, color]);
  
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
          imageRendering: 'pixelated',
          imageRendering: '-moz-crisp-edges',
          imageRendering: 'crisp-edges'
        }}
      />
    </>
  );
}

/**
 * Wireframe 3D model component
 * Displays a rotating wireframe model with customizable color
 */
function WireframeModel({ 
  color = '255, 255, 255',
  modelType = 'running-man',
  size = 200
}) {
  // Convert RGB string to hex for Three.js
  const rgbValues = color.split(',').map(v => parseInt(v.trim()));
  const hexColor = `#${rgbValues.map(v => v.toString(16).padStart(2, '0')).join('')}`;
  
  return (
    <div style={{ 
      width: `${size}px`, 
      height: `${size}px`,
      position: 'relative'
    }}>
      <PixelatedCanvas size={size} color={color}>
        <Canvas
          camera={{ position: [0, 2, 8], fov: 50 }}
          style={{ background: 'transparent' }}
          dpr={[1, 2]}
          gl={{ antialias: false, alpha: true }}
        >
          <ambientLight intensity={1} />
          <pointLight position={[10, 10, 10]} intensity={1} />
          <pointLight position={[-10, -10, -10]} intensity={1} />
          
          <Suspense fallback={
            <Sphere args={[2, 16, 12]} position={[0, 0, 0]}>
              <meshBasicMaterial color={hexColor} wireframe />
            </Sphere>
          }>
            {modelType === 'running-man' && <RunningMan color={hexColor} />}
            {modelType === 'running-model' && <RunningModel color={hexColor} modelPath="/models/running-person.glb" />}
            {modelType === 'running-fbx' && <FBXModel color={hexColor} modelPath="/models/running-man.fbx" />}
          </Suspense>
        </Canvas>
      </PixelatedCanvas>
    </div>
  );
}

// Preload the model
useGLTF.preload('/models/running-person.glb');

export default WireframeModel;