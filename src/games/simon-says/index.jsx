/**
 * index.jsx - Simon Says game main component
 * 
 * Handles both title screen and gameplay modes.
 * The title screen shows when browsing in the carousel,
 * and gameplay starts when the user presses START GAME.
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './SimonSays.module.css';

function SimonSaysGame({ mode = 'title', isActive, onExit }) {
  const [gameState, setGameState] = useState('waiting'); // waiting, playing, ended
  const [currentCommand, setCurrentCommand] = useState('');
  const [score, setScore] = useState(0);

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
        SIMON SAYS
      </motion.h1>
      
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className={styles.gameIcon}
      >
        🎯
      </motion.div>
      
      <motion.p
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6 }}
        className={styles.gameDescription}
      >
        Follow Simon's commands! But only when Simon says so...
        Teams compete in hilarious physical challenges.
      </motion.p>

      <motion.div
        className={styles.gameStats}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        <span>2-100 Players</span>
        <span>•</span>
        <span>Team Game</span>
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
        <h2>Simon Says</h2>
        <div className={styles.score}>Score: {score}</div>
      </div>

      <div className={styles.gameContent}>
        {gameState === 'playing' ? (
          <>
            <motion.div
              className={styles.commandDisplay}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
            >
              <h3>{currentCommand || "Get ready..."}</h3>
            </motion.div>
            
            <p className={styles.instructions}>
              Game implementation coming soon!
              This is where commands would appear and teams would compete.
            </p>
          </>
        ) : (
          <div className={styles.gameOver}>
            <h2>Game Over!</h2>
            <p>Final Score: {score}</p>
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

export default SimonSaysGame;