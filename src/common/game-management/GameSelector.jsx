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
  const [currentIndex, setCurrentIndex] = useState(0); // Current game in original array
  const [isStarting, setIsStarting] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const [activeGameInfo, setActiveGameInfo] = useState(null);
  const [voicesLoaded, setVoicesLoaded] = useState(false);
  const carouselRef = useRef(null);
  const isJumpingRef = useRef(false);
  const scrollTimeoutRef = useRef(null);

  // Get the order of games with current game in the middle
  const getGameOrder = () => {
    const order = [];
    const halfLength = Math.floor(games.length / 2);
    
    // Add games before current (wrapping around)
    for (let i = halfLength; i > 0; i--) {
      const index = (currentIndex - i + games.length) % games.length;
      order.push(games[index]);
    }
    
    // Add current game
    order.push(games[currentIndex]);
    
    // Add games after current (wrapping around)
    for (let i = 1; i < games.length - halfLength; i++) {
      const index = (currentIndex + i) % games.length;
      order.push(games[index]);
    }
    
    return order;
  };

  const orderedGames = getGameOrder();
  
  // Ensure we always have active game info
  useEffect(() => {
    if (!activeGameInfo && games.length > 0) {
      setActiveGameInfo(games[currentIndex]);
    }
  }, [currentIndex, games, activeGameInfo]);

  // Handle scroll to detect current game
  useEffect(() => {
    const carousel = carouselRef.current;
    if (!carousel) return;
    
    let scrollTimeout;
    const centerIndex = Math.floor(games.length / 2);

    const handleScroll = () => {
      // Set scrolling state immediately
      setIsScrolling(true);
      
      const slideWidth = carousel.offsetWidth;
      const scrollLeft = carousel.scrollLeft;
      const currentSlide = Math.round(scrollLeft / slideWidth);
      
      // Clear any pending scroll end check
      clearTimeout(scrollTimeout);
      clearTimeout(scrollTimeoutRef.current);
      
      // After scrolling stops, update current index based on offset from center
      scrollTimeout = setTimeout(() => {
        const offset = currentSlide - centerIndex;
        
        if (offset !== 0) {
          // Update the current index and re-center
          setCurrentIndex((prev) => (prev + offset + games.length) % games.length);
          
          // Snap back to center position
          requestAnimationFrame(() => {
            carousel.scrollLeft = centerIndex * slideWidth;
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
  }, [currentIndex, games.length]);

  // Initialize carousel to center position
  useEffect(() => {
    const carousel = carouselRef.current;
    if (!carousel) return;
    
    const centerIndex = Math.floor(games.length / 2);
    carousel.scrollLeft = centerIndex * carousel.offsetWidth;
  }, [games.length]);

  // Load voices when component mounts
  useEffect(() => {
    if ('speechSynthesis' in window) {
      // Function to check if voices are loaded
      const loadVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
          setVoicesLoaded(true);
        }
      };

      // Try to load voices immediately
      loadVoices();

      // Chrome loads voices asynchronously
      window.speechSynthesis.onvoiceschanged = loadVoices;

      return () => {
        window.speechSynthesis.onvoiceschanged = null;
      };
    }
  }, []);


  // Play jingle and speak game name when active game changes
  useEffect(() => {
    if (!activeGameInfo || isScrolling || !voicesLoaded) return;

    // Speak the game name using default male voice
    if ('speechSynthesis' in window) {
      // Store game info in a variable to prevent closure issues
      const gameToSpeak = activeGameInfo.name;
      
      // Use a microtask to avoid React batching issues
      Promise.resolve().then(() => {
        const utterance = new SpeechSynthesisUtterance(gameToSpeak);
        utterance.rate = 0.9;
        utterance.pitch = 1.0;
        utterance.volume = 0.8;
        window.speechSynthesis.speak(utterance);
      });
    }

  }, [activeGameInfo, isScrolling, voicesLoaded]);

  const handleStartGame = () => {
    setIsStarting(true);
    
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
      {/* Carousel */}
      <div 
        ref={carouselRef}
        className={styles.carousel}
        style={{ opacity: isStarting ? 0 : 1 }}
      >
        {orderedGames.map((game, index) => {
          const centerIndex = Math.floor(games.length / 2);
          const isActive = index === centerIndex;
          
          return (
            <div key={game.id} className={styles.carouselSlide}>
              <CarouselSlide
                game={game}
                isActive={isActive}
                mode="title"
                onActiveChange={isActive ? setActiveGameInfo : undefined}
              />
            </div>
          );
        })}
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
                  <p>{activeGameInfo?.description || games[currentIndex]?.description}</p>
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