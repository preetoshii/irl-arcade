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
  const carouselRef = useRef(null);
  const audioRef = useRef(null);
  const isJumpingRef = useRef(false);
  const scrollTimeoutRef = useRef(null);
  const [voicesLoaded, setVoicesLoaded] = useState(false);

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

  // Load voices when available
  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        setVoicesLoaded(true);
      }
    };

    // Load voices
    loadVoices();
    
    // Chrome loads voices asynchronously
    if ('speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []);

  // Play jingle and speak game name when active game changes
  useEffect(() => {
    if (!activeGameInfo) return;

    // Speak the game name using the game's voice
    if (activeGameInfo.voice && 'speechSynthesis' in window && voicesLoaded) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();
      
      // Create utterance with game's voice
      const utterance = new SpeechSynthesisUtterance(activeGameInfo.name);
      
      // Try to find and set the specified voice
      const voices = window.speechSynthesis.getVoices();
      
      // Debug: log available voices
      console.log('Available voices:', voices.map(v => v.name));
      console.log('Looking for voice:', activeGameInfo.voice);
      
      const gameVoice = voices.find(voice => 
        voice.name.toLowerCase().includes(activeGameInfo.voice.toLowerCase())
      );
      
      if (gameVoice) {
        utterance.voice = gameVoice;
        console.log('Found voice:', gameVoice.name);
      } else {
        console.log('Voice not found, using default');
        // Try to use different voices based on index for variety
        const voiceIndex = games.findIndex(g => g.id === activeGameInfo.id);
        if (voices.length > voiceIndex) {
          utterance.voice = voices[voiceIndex % voices.length];
        }
      }
      
      utterance.rate = 0.9;
      utterance.pitch = 1.0;
      utterance.volume = 0.8;
      
      // Speak after a short delay to avoid overlapping with scroll
      setTimeout(() => {
        window.speechSynthesis.speak(utterance);
      }, 100);
    }

    // Play jingle if available
    if (activeGameInfo.titleJingle && audioRef.current) {
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
    }
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