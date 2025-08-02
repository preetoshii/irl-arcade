/**
 * GameSelector.jsx - Carousel-based game selection interface
 * 
 * Features:
 * - Full-screen horizontal carousel with scroll-snap
 * - Adjacent game preloading for smooth swiping
 * - Fixed "START GAME" button overlay
 * - 8-bit jingles that play when landing on games
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import gameRegistry from './GameRegistry';
import CarouselSlide from './CarouselSlide';
import styles from './GameSelector.module.css';

function GameSelector({ onGameSelect }) {
  const games = gameRegistry.getAllGames();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isStarting, setIsStarting] = useState(false);
  const carouselRef = useRef(null);
  const audioRef = useRef(null);

  // Determine which games to mount (current + adjacent)
  const gamesToMount = new Set([
    currentIndex - 1,
    currentIndex,
    currentIndex + 1
  ].filter(i => i >= 0 && i < games.length));

  // Handle scroll to detect current game
  useEffect(() => {
    const carousel = carouselRef.current;
    if (!carousel) return;

    const handleScroll = () => {
      const slideWidth = carousel.offsetWidth;
      const scrollLeft = carousel.scrollLeft;
      const newIndex = Math.round(scrollLeft / slideWidth);
      
      if (newIndex !== currentIndex && newIndex >= 0 && newIndex < games.length) {
        setCurrentIndex(newIndex);
      }
    };

    carousel.addEventListener('scroll', handleScroll);
    return () => carousel.removeEventListener('scroll', handleScroll);
  }, [currentIndex, games.length]);

  // Play jingle when current game changes
  useEffect(() => {
    const currentGame = games[currentIndex];
    if (!currentGame?.titleJingle || !audioRef.current) return;

    // Fade out previous audio
    if (!audioRef.current.paused) {
      audioRef.current.volume = 0;
      audioRef.current.pause();
    }

    // Play new jingle
    audioRef.current.src = currentGame.titleJingle;
    audioRef.current.volume = 0.5;
    audioRef.current.play().catch(e => {
      // User hasn't interacted yet, that's okay
      console.log('Audio autoplay prevented:', e);
    });
  }, [currentIndex, games]);

  const handleStartGame = () => {
    setIsStarting(true);
    
    // Fade out audio
    if (audioRef.current && !audioRef.current.paused) {
      audioRef.current.volume = 0;
      audioRef.current.pause();
    }

    // Small delay for transition
    setTimeout(() => {
      onGameSelect(games[currentIndex].id);
    }, 300);
  };

  if (games.length === 0) {
    return (
      <div className={styles.noGames}>
        <p>No games available. Check game registration!</p>
      </div>
    );
  }

  return (
    <div className={styles.selectorContainer}>
      {/* Hidden audio element for jingles */}
      <audio ref={audioRef} loop />

      {/* Carousel */}
      <div 
        ref={carouselRef}
        className={styles.carousel}
        style={{ opacity: isStarting ? 0 : 1 }}
      >
        {games.map((game, index) => (
          <div key={game.id} className={styles.carouselSlide}>
            {gamesToMount.has(index) ? (
              <CarouselSlide
                game={game}
                isActive={index === currentIndex}
                mode="title"
              />
            ) : (
              <div className={styles.slidePlaceholder}>
                <h2>{game.name}</h2>
                <p>Swipe to load</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Fixed overlay controls */}
      <AnimatePresence>
        {!isStarting && (
          <motion.div 
            className={styles.overlayControls}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Game description */}
            <motion.div 
              className={styles.gameDescriptionOverlay}
              key={games[currentIndex]?.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <p>{games[currentIndex]?.description}</p>
            </motion.div>

            {/* START GAME button */}
            <motion.button
              className={styles.startButton}
              onClick={handleStartGame}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              START GAME
            </motion.button>

            {/* Slide indicators */}
            <div className={styles.indicators}>
              {games.map((_, index) => (
                <button
                  key={index}
                  className={`${styles.indicator} ${
                    index === currentIndex ? styles.indicatorActive : ''
                  }`}
                  onClick={() => {
                    carouselRef.current?.scrollTo({
                      left: index * carouselRef.current.offsetWidth,
                      behavior: 'smooth'
                    });
                  }}
                  aria-label={`Go to ${games[index].name}`}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default GameSelector;