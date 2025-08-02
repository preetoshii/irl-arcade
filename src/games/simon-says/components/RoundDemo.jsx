/**
 * RoundDemo.jsx - Demo component showing the flow engine in action
 * 
 * This demonstrates how the Mermaid chart data drives actual gameplay.
 */

import { useState, useRef } from 'react';
import { FlowEngine } from '../mechanics/FlowEngine';
import styles from './RoundDemo.module.css';

function RoundDemo() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentPhase, setCurrentPhase] = useState('');
  const [currentScript, setCurrentScript] = useState('');
  const [roundInfo, setRoundInfo] = useState(null);
  const engineRef = useRef(null);

  // Demo game state
  const gameState = {
    teams: [
      { name: 'Red Rockets', players: ['Alice', 'Bob', 'Charlie', 'Dana'] },
      { name: 'Blue Lightning', players: ['Eve', 'Frank', 'Grace', 'Henry'] }
    ],
    currentRound: 1,
    totalRounds: 10
  };

  const startRound = async () => {
    setIsPlaying(true);
    
    // Create engine
    const engine = new FlowEngine(gameState);
    engineRef.current = engine;
    
    // Set up callbacks
    engine.onSpeak = (text) => {
      setCurrentScript(text);
      // Use TTS
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    };
    
    engine.onPhaseChange = (phase) => {
      setCurrentPhase(phase);
    };
    
    // Build and display round
    const round = engine.buildRound();
    setRoundInfo({
      type: round.type.name,
      variant: round.variant?.name,
      subVariant: round.subVariant?.name,
      modifier: round.modifier?.name,
      players: round.players
    });
    
    // Execute round
    try {
      await engine.executeRound();
    } catch (error) {
      console.error('Round execution error:', error);
    }
    
    setIsPlaying(false);
    setCurrentPhase('complete');
  };

  const stopRound = () => {
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    setCurrentPhase('stopped');
  };

  return (
    <div className={styles.demoContainer}>
      <h2>Simon Says Flow Engine Demo</h2>
      
      <div className={styles.controls}>
        {!isPlaying ? (
          <button onClick={startRound} className={styles.startButton}>
            Start Random Round
          </button>
        ) : (
          <button onClick={stopRound} className={styles.stopButton}>
            Stop Round
          </button>
        )}
      </div>

      {roundInfo && (
        <div className={styles.roundInfo}>
          <h3>Current Round</h3>
          <div className={styles.infoGrid}>
            <div>
              <strong>Type:</strong> {roundInfo.type}
            </div>
            {roundInfo.variant && (
              <div>
                <strong>Variant:</strong> {roundInfo.variant}
              </div>
            )}
            {roundInfo.subVariant && (
              <div>
                <strong>Style:</strong> {roundInfo.subVariant}
              </div>
            )}
            {roundInfo.modifier && roundInfo.modifier !== 'No Modifier' && (
              <div>
                <strong>Modifier:</strong> {roundInfo.modifier}
              </div>
            )}
            {roundInfo.players.player1 && (
              <div>
                <strong>Players:</strong> {roundInfo.players.player1} vs {roundInfo.players.player2}
              </div>
            )}
          </div>
        </div>
      )}

      <div className={styles.scriptDisplay}>
        <div className={styles.phaseIndicator}>
          Phase: <span className={styles.phase}>{currentPhase || 'waiting'}</span>
        </div>
        <div className={styles.scriptText}>
          {currentScript || 'Click "Start Random Round" to begin...'}
        </div>
      </div>

      <div className={styles.explanation}>
        <h4>How it works:</h4>
        <ol>
          <li>The engine randomly selects from our weighted game flow tree</li>
          <li>It builds a complete round with all variants and modifiers</li>
          <li>Scripts are filled with actual player names</li>
          <li>The round executes with proper timing and TTS</li>
        </ol>
        <p>
          This demo shows how updating the Mermaid chart (via gameFlowData.js) 
          automatically updates the game experience!
        </p>
      </div>
    </div>
  );
}

export default RoundDemo;