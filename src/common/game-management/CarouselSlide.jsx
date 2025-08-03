/**
 * CarouselSlide.jsx - Individual slide component for game carousel
 * 
 * Handles:
 * - Dynamic loading of game components
 * - Passing the correct mode (title/playing) to games
 * - Managing active state for audio/visual feedback
 */

import { useState, useEffect, Suspense, memo } from 'react';
import { motion } from 'framer-motion';
import styles from './GameSelector.module.css';

const CarouselSlide = memo(function CarouselSlide({ game, isActive, mode = 'title', onActiveChange, analyser }) {
  const [GameComponent, setGameComponent] = useState(null);
  const [loadError, setLoadError] = useState(null);
  
  // Report when this slide becomes active
  useEffect(() => {
    if (isActive && onActiveChange) {
      onActiveChange(game);
    }
  }, [isActive, game, onActiveChange]);

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
    <div className={styles.slideContent}>
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
            analyser={analyser}
          />
        )}
      </Suspense>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison to prevent unnecessary re-renders
  return (
    prevProps.game.id === nextProps.game.id &&
    prevProps.isActive === nextProps.isActive &&
    prevProps.mode === nextProps.mode &&
    prevProps.analyser === nextProps.analyser
  );
});

export default CarouselSlide;