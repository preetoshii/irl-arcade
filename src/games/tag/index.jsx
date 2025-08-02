/**
 * index.jsx - Audio Tag game main component
 * 
 * Handles both title screen and gameplay modes.
 * The title screen shows when browsing in the carousel,
 * and gameplay starts when the user presses START GAME.
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './Tag.module.css';

function TagGame({ mode = 'title', isActive, onExit }) {
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
    <motion.div 
      className={`${styles.titleScreen} gameTitleScreen`}
      initial={{ opacity: 0 }}
      animate={{ opacity: isActive ? 1 : 0.3 }}
      transition={{ duration: 0.5 }}
    >
      <motion.h1
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 100 }}
        className={styles.gameTitle}
      >
        AUDIO TAG
      </motion.h1>
      
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className={styles.gameIcon}
      >
        🏃‍♂️
      </motion.div>
      
      <motion.p
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6 }}
        className={styles.gameDescription}
      >
        Run, hide, and listen! The speaker reveals who's "it" through audio cues.
        Can you avoid being tagged using only your ears?
      </motion.p>

      <motion.div
        className={styles.gameStats}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        <span>3-50 Players</span>
        <span>•</span>
        <span>Free for All</span>
      </motion.div>
    </motion.div>
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
            <motion.div
              className={styles.statusDisplay}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
            >
              <h3>{currentIt ? `${currentIt} is IT!` : "Starting game..."}</h3>
            </motion.div>
            
            <div className={styles.audioIndicator}>
              <motion.div
                className={styles.soundWave}
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
              />
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