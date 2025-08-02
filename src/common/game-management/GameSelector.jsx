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
  const [currentIndex, setCurrentIndex] = useState(1); // Start at position 1 (first real game)
  const [isStarting, setIsStarting] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const [activeGameInfo, setActiveGameInfo] = useState(null);
  const carouselRef = useRef(null);
  const audioRef = useRef(null);
  const isJumpingRef = useRef(false);
  const scrollTimeoutRef = useRef(null);

  // Add duplicates for infinite scroll in both directions
  const gamesWithDuplicate = [
    games[games.length - 1], // Duplicate of last game at start
    ...games, 
    games[0] // Duplicate of first game at end
  ];

  // Determine which games to mount (current + adjacent, plus extras for smooth transitions)
  const gamesToMount = new Set([
    currentIndex - 2,
    currentIndex - 1,
    currentIndex,
    currentIndex + 1,
    currentIndex + 2
  ].filter(i => i >= 0 && i < gamesWithDuplicate.length));
  
  // Always mount the duplicates for smooth infinite scroll
  gamesToMount.add(0); // Duplicate of last game at start
  gamesToMount.add(gamesWithDuplicate.length - 1); // Duplicate of first game at end

  // Handle scroll to detect current game
  useEffect(() => {
    const carousel = carouselRef.current;
    if (!carousel) return;
    
    let scrollTimeout;

    const handleScroll = () => {
      if (isJumpingRef.current) return;
      
      // Set scrolling state immediately
      setIsScrolling(true);
      
      const slideWidth = carousel.offsetWidth;
      const scrollLeft = carousel.scrollLeft;
      const newIndex = Math.round(scrollLeft / slideWidth);
      
      // Update current index immediately for UI updates
      if (newIndex !== currentIndex && newIndex >= 0 && newIndex < gamesWithDuplicate.length) {
        setCurrentIndex(newIndex);
      }
      
      // Clear any pending scroll end check
      clearTimeout(scrollTimeout);
      clearTimeout(scrollTimeoutRef.current);
      
      // Check if we need to warp after scrolling stops
      scrollTimeout = setTimeout(() => {
        const finalScrollLeft = carousel.scrollLeft;
        const finalIndex = Math.round(finalScrollLeft / slideWidth);
        
        if (finalIndex === 0) {
          // We're on the duplicate of last game at start, warp to real last game
          isJumpingRef.current = true;
          carousel.scrollLeft = games.length * slideWidth;
          setCurrentIndex(games.length - 1);
          
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              isJumpingRef.current = false;
            });
          });
        } else if (finalIndex === gamesWithDuplicate.length - 1) {
          // We're on the duplicate of first game at end, warp to real first game
          isJumpingRef.current = true;
          carousel.scrollLeft = slideWidth;
          setCurrentIndex(0);
          
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              isJumpingRef.current = false;
            });
          });
        }
        
        // Set scrolling to false after we've settled
        scrollTimeoutRef.current = setTimeout(() => {
          setIsScrolling(false);
        }, 100);
      }, 150); // Wait 150ms after scroll stops
    };

    carousel.addEventListener('scroll', handleScroll);
    return () => {
      carousel.removeEventListener('scroll', handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, [currentIndex, games.length, gamesWithDuplicate.length]);


  // Set initial scroll position to first real game (skip duplicate at start)
  useEffect(() => {
    const carousel = carouselRef.current;
    if (!carousel) return;
    
    // Start at position 1 (first real game, not the duplicate)
    carousel.scrollLeft = carousel.offsetWidth;
  }, []);

  // Play jingle when active game changes
  useEffect(() => {
    if (!activeGameInfo?.titleJingle || !audioRef.current) return;

    // Fade out previous audio
    if (!audioRef.current.paused) {
      audioRef.current.volume = 0;
      audioRef.current.pause();
    }

    // Play new jingle
    audioRef.current.src = activeGameInfo.titleJingle;
    audioRef.current.volume = 0.5;
    audioRef.current.play().catch(e => {
      // User hasn't interacted yet, that's okay
      console.log('Audio autoplay prevented:', e);
    });
  }, [activeGameInfo]);

  const handleStartGame = () => {
    setIsStarting(true);
    
    // Fade out audio
    if (audioRef.current && !audioRef.current.paused) {
      audioRef.current.volume = 0;
      audioRef.current.pause();
    }

    // Small delay for transition
    setTimeout(() => {
      onGameSelect(activeGameInfo.id);
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
        {gamesWithDuplicate.map((game, index) => (
          <div key={`${game.id}-${index}`} className={styles.carouselSlide}>
            {gamesToMount.has(index) ? (
              <CarouselSlide
                game={game}
                isActive={index === currentIndex}
                mode="title"
                onActiveChange={setActiveGameInfo}
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
            {/* Game description - only show when not scrolling */}
            <AnimatePresence mode="wait">
              {!isScrolling && (
                <motion.div 
                  className={styles.gameDescriptionOverlay}
                  key={activeGameInfo?.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  <p>{activeGameInfo?.description}</p>
                </motion.div>
              )}
            </AnimatePresence>

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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default GameSelector;