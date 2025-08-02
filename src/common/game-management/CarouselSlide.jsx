/**
 * CarouselSlide.jsx - Individual slide component for game carousel
 * 
 * Handles:
 * - Dynamic loading of game components
 * - Passing the correct mode (title/playing) to games
 * - Managing active state for audio/visual feedback
 */

import { useState, useEffect, Suspense } from 'react';
import { motion } from 'framer-motion';
import styles from './GameSelector.module.css';

function CarouselSlide({ game, isActive, mode = 'title' }) {
  const [GameComponent, setGameComponent] = useState(null);
  const [loadError, setLoadError] = useState(null);

  // Dynamically import the game component
  useEffect(() => {
    let mounted = true;

    game.component()
      .then(module => {
        if (mounted) {
          setGameComponent(() => module.default);
        }
      })
      .catch(error => {
        console.error(`Failed to load game ${game.id}:`, error);
        if (mounted) {
          setLoadError(error.message);
        }
      });

    return () => {
      mounted = false;
    };
  }, [game]);

  if (loadError) {
    return (
      <div className={styles.slideError}>
        <h2>{game.name}</h2>
        <p>Failed to load game</p>
        <small>{loadError}</small>
      </div>
    );
  }

  return (
    <motion.div 
      className={styles.slideContent}
      animate={{
        scale: isActive ? 1 : 0.9,
        opacity: isActive ? 1 : 0.5
      }}
      transition={{ duration: 0.3 }}
    >
      <Suspense fallback={
        <div className={styles.slideLoading}>
          <h2>{game.name}</h2>
          <p>Loading...</p>
        </div>
      }>
        {GameComponent && (
          <GameComponent 
            mode={mode}
            isActive={isActive}
            gameConfig={game}
          />
        )}
      </Suspense>
    </motion.div>
  );
}

export default CarouselSlide;