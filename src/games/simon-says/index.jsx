/**
 * index.jsx - Simon Says game main component
 * 
 * Handles both title screen and gameplay modes.
 * The title screen shows when browsing in the carousel,
 * and gameplay starts when the user presses START GAME.
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GameTitleScreen from '../../common/components/GameTitleScreen';
import styles from './SimonSays.module.css';

function SimonSaysGame({ mode = 'title', isActive, onExit, analyser }) {
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
    <GameTitleScreen
      title="SIMON SAYS"
      icon="🎯"
      stats={['2-100 Players', '•', 'Team Game']}
      blobColor="255, 102, 0"  // Orange-red
      analyser={analyser}
      show3DModel={true}
      modelType="simon-says-fbx"
      isActive={isActive}
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
        <h2>Simon Says</h2>
        <div className={styles.score}>Score: {score}</div>
      </div>

      <div className={styles.gameContent}>
        {gameState === 'playing' ? (
          <>
            <div className={styles.commandDisplay}>
              <h3>{currentCommand || "Get ready..."}</h3>
            </div>
            
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