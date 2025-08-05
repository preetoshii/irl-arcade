import { useState, useEffect } from 'react';
import WireframeModel from './WireframeModel';
import WireframeModelOptimized from './WireframeModelOptimized';

/**
 * Performance monitoring component
 */
function PerformanceMonitor({ label }) {
  const [fps, setFps] = useState(0);
  
  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    
    const measureFPS = () => {
      frameCount++;
      const currentTime = performance.now();
      
      if (currentTime >= lastTime + 1000) {
        setFps(Math.round((frameCount * 1000) / (currentTime - lastTime)));
        frameCount = 0;
        lastTime = currentTime;
      }
      
      requestAnimationFrame(measureFPS);
    };
    
    measureFPS();
  }, []);
  
  return (
    <div style={{
      position: 'absolute',
      top: 10,
      left: 10,
      background: 'rgba(0,0,0,0.7)',
      color: 'white',
      padding: '5px 10px',
      fontFamily: 'monospace',
      fontSize: '14px',
      zIndex: 1000
    }}>
      {label}: {fps} FPS
    </div>
  );
}

/**
 * Test component to compare performance
 */
function PerformanceTest() {
  const [showOriginal, setShowOriginal] = useState(true);
  const [instanceCount, setInstanceCount] = useState(1);
  
  return (
    <div style={{ padding: '20px' }}>
      <div style={{ marginBottom: '20px' }}>
        <h2>WireframeModel Performance Test</h2>
        
        <div style={{ marginBottom: '10px' }}>
          <button onClick={() => setShowOriginal(!showOriginal)}>
            Switch to {showOriginal ? 'Optimized' : 'Original'} Version
          </button>
          
          <label style={{ marginLeft: '20px' }}>
            Instance Count: 
            <input 
              type="range" 
              min="1" 
              max="5" 
              value={instanceCount}
              onChange={(e) => setInstanceCount(Number(e.target.value))}
            />
            {instanceCount}
          </label>
        </div>
        
        <div style={{ 
          fontSize: '12px', 
          color: '#666',
          marginBottom: '10px'
        }}>
          {showOriginal ? 'Original' : 'Optimized'} Version - {instanceCount} instance(s)
        </div>
      </div>
      
      <div style={{ 
        display: 'flex', 
        flexWrap: 'wrap', 
        gap: '20px',
        position: 'relative'
      }}>
        <PerformanceMonitor label={showOriginal ? 'Original' : 'Optimized'} />
        
        {Array.from({ length: instanceCount }).map((_, index) => (
          <div key={index} style={{ position: 'relative' }}>
            {showOriginal ? (
              <WireframeModel 
                color="255, 255, 255"
                modelType="running-man"
                size={200}
              />
            ) : (
              <WireframeModelOptimized
                color="255, 255, 255"
                modelType="running-man"
                size={200}
                enablePerformanceMode={true}
              />
            )}
            <div style={{
              position: 'absolute',
              bottom: 5,
              left: 5,
              fontSize: '12px',
              background: 'rgba(0,0,0,0.5)',
              color: 'white',
              padding: '2px 5px'
            }}>
              Instance {index + 1}
            </div>
          </div>
        ))}
      </div>
      
      <div style={{ marginTop: '20px', fontSize: '14px', color: '#666' }}>
        <h3>Performance Optimizations Applied:</h3>
        <ul>
          <li>Reduced animation frame rate (30fps instead of 60fps)</li>
          <li>Eliminated duplicate requestAnimationFrame loops</li>
          <li>Batch pixel drawing operations</li>
          <li>Use offscreen canvas for better performance</li>
          <li>Simplified 3D model geometry</li>
          <li>Instance limiting to prevent resource exhaustion</li>
          <li>Dynamic frame skipping based on active instances</li>
          <li>WebGL context optimizations</li>
        </ul>
      </div>
    </div>
  );
}

export default PerformanceTest;