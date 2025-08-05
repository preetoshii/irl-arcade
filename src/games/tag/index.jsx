/**
 * index.jsx - Audio Tag game main component
 * 
 * Handles both title screen and gameplay modes.
 * The title screen shows when browsing in the carousel,
 * and gameplay starts when the user presses START GAME.
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GameTitleScreen from '../../common/components/GameTitleScreen';
import styles from './Tag.module.css';

function TagGame({ mode = 'title', isActive, onExit, analyser }) {
  const [gameState, setGameState] = useState('waiting'); // waiting, playing, ended
  const [currentIt, setCurrentIt] = useState('');
  const [timeRemaining, setTimeRemaining] = useState(60);

  // Start the game when mode changes to 'playing'
  useEffect(() => {
    if (mode === 'playing' && gameState === 'waiting') {
      setGameState('playing');
      // Initialize game logic here
    }
  }, [mode, gameState]);

  // Title screen content
  const renderTitleScreen = () => (
    <GameTitleScreen
      title="AUDIO TAG"
      icon="🏃‍♂️"
      stats={['3-50 Players', '•', 'Free for All']}
      blobColor="0, 102, 255"  // Blue
      analyser={analyser}
      show3DModel={true}
      modelType="running-fbx"
    />
  );

  // Game screen content
  const renderGameScreen = () => (
    <motion.div
      className={styles.gameScreen}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
    >
      <div className={styles.gameHeader}>
        <h2>Audio Tag</h2>
        <div className={styles.timer}>Time: {timeRemaining}s</div>
      </div>

      <div className={styles.gameContent}>
        {gameState === 'playing' ? (
          <>
            <div className={styles.statusDisplay}>
              <h3>{currentIt ? `${currentIt} is IT!` : "Starting game..."}</h3>
            </div>
            
            <div className={styles.audioIndicator}>
              <div className={styles.soundWave} />
              <p>Audio cues will play through the speaker</p>
            </div>
            
            <p className={styles.instructions}>
              Game implementation coming soon!
              Audio will announce who's "it" and provide directional hints.
            </p>
          </>
        ) : (
          <div className={styles.gameOver}>
            <h2>Game Over!</h2>
            <p>Thanks for playing!</p>
          </div>
        )}
      </div>

      <button 
        onClick={onExit}
        className={styles.exitButton}
      >
        Exit to Menu
      </button>
    </motion.div>
  );

  return (
    <AnimatePresence mode="wait">
      {mode === 'title' ? (
        <motion.div key="title" className={styles.container}>
          {renderTitleScreen()}
        </motion.div>
      ) : (
        <motion.div key="game" className={styles.container}>
          {renderGameScreen()}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default TagGame;