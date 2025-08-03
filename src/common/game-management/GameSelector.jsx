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
import PixelParticles from '../components/PixelParticles/PixelParticles';
import useScrollColorInterpolation from '../hooks/useScrollColorInterpolation';
import styles from './GameSelector.module.css';

function GameSelector({ onGameSelect, analyser, onColorChange }) {
  const games = gameRegistry.getAllGames();
  const [currentIndex, setCurrentIndex] = useState(0); // Current game in original array
  const [isStarting, setIsStarting] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const [activeGameInfo, setActiveGameInfo] = useState(null);
  const carouselRef = useRef(null);
  const isJumpingRef = useRef(false);
  const scrollTimeoutRef = useRef(null);
  const lastScrollPositionRef = useRef(0);
  const hasPlayedSweepRef = useRef(false);

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
  
  // Get interpolated color based on scroll position
  const interpolatedColor = useScrollColorInterpolation(carouselRef, orderedGames);
  
  // Pass color up to parent
  useEffect(() => {
    if (onColorChange) {
      onColorChange(interpolatedColor);
    }
  }, [interpolatedColor, onColorChange]);

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
      
      // Play sweep sound when starting to scroll away
      const scrollDelta = Math.abs(scrollLeft - lastScrollPositionRef.current);
      if (scrollDelta > slideWidth * 0.1 && !hasPlayedSweepRef.current) {
        const audio = new Audio('/sounds/sweep.wav');
        audio.volume = 0.3;
        audio.play().catch(err => console.log('Sweep sound failed:', err));
        hasPlayedSweepRef.current = true;
      }
      
      lastScrollPositionRef.current = scrollLeft;
      
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
          hasPlayedSweepRef.current = false; // Reset for next swipe
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



  // Simple TTS - just speak the game name when it changes
  useEffect(() => {
    if (!activeGameInfo) return;
    
    const utterance = new SpeechSynthesisUtterance(activeGameInfo.name);
    
    // Use American male voice - filter out female voices
    const voices = window.speechSynthesis.getVoices();
    console.log('Available voices:', voices.map(v => v.name));
    
    const americanMaleVoice = voices.find(voice => {
      const name = voice.name.toLowerCase();
      const lang = voice.lang.toLowerCase();
      
      // Must be English
      if (!lang.includes('en')) return false;
      
      // Exclude female voices
      if (name.includes('female') || name.includes('samantha') || 
          name.includes('victoria') || name.includes('karen') || 
          name.includes('moira') || name.includes('fiona') ||
          name.includes('tessa') || name.includes('zira')) return false;
      
      // Prefer known male voices
      return name.includes('alex') || name.includes('fred') || 
             name.includes('bruce') || name.includes('male') ||
             name.includes('david') || name.includes('mark');
    });
    
    if (americanMaleVoice) {
      utterance.voice = americanMaleVoice;
      console.log('Selected voice:', americanMaleVoice.name);
    }
    
    utterance.pitch = 0.8; // Lower pitch for more masculine sound
    utterance.rate = 0.95;
    
    window.speechSynthesis.speak(utterance);
  }, [activeGameInfo]);

  const handleStartGame = () => {
    // Play select sound for game selection
    const audio = new Audio('/sounds/select.wav');
    audio.volume = 0.3;
    audio.play().catch(err => console.log('Select sound failed:', err));
    
    setIsStarting(true);
    
    // Small delay for transition
    setTimeout(() => {
      onGameSelect(activeGameInfo.id);
    }, 300);
  };

  const handleButtonHover = () => {
    // Play hover sound
    const audio = new Audio('/sounds/hover.wav');
    audio.volume = 0.3;
    audio.play().catch(err => console.log('Hover sound failed:', err));
  };

  const handleNavigate = (direction) => {
    const carousel = carouselRef.current;
    if (!carousel) return;
    
    // Play click sound
    const audio = new Audio('/sounds/click.wav');
    audio.volume = 0.3;
    audio.play().catch(err => console.log('Click sound failed:', err));
    
    const slideWidth = carousel.offsetWidth;
    const currentScroll = carousel.scrollLeft;
    const targetScroll = direction === 'left' 
      ? currentScroll - slideWidth 
      : currentScroll + slideWidth;
    
    carousel.scrollTo({
      left: targetScroll,
      behavior: 'smooth'
    });
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
      {/* Particles using interpolated color */}
      <PixelParticles color={interpolatedColor} />
      
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
                analyser={analyser}
              />
            </div>
          );
        })}
      </div>

      {/* Left navigation button */}
      <motion.button
        className={styles.navButton}
        onClick={() => handleNavigate('left')}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        style={{ 
          left: '2rem',
          color: `rgb(${interpolatedColor})`,
          borderColor: `rgb(${interpolatedColor})`
        }}
      >
        ◀
      </motion.button>

      {/* Right navigation button */}
      <motion.button
        className={styles.navButton}
        onClick={() => handleNavigate('right')}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        style={{ 
          right: '2rem',
          color: `rgb(${interpolatedColor})`,
          borderColor: `rgb(${interpolatedColor})`
        }}
      >
        ▶
      </motion.button>

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
                  style={{ color: `rgb(${interpolatedColor})` }}
                >
                  <p>{activeGameInfo?.description}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* START GAME button */}
            <motion.button
              className={styles.startButton}
              onClick={handleStartGame}
              onMouseEnter={handleButtonHover}
              style={{
                borderColor: `rgb(${interpolatedColor})`,
                color: `rgb(${interpolatedColor})`,
                backgroundColor: 'transparent'
              }}
              whileHover={{ 
                scale: 1.1,
                backgroundColor: '#fff',
                color: '#000',
                borderColor: '#fff'
              }}
              whileTap={{ scale: 0.95 }}
              initial={{ y: 20, opacity: 0 }}
              animate={{ 
                y: 0, 
                opacity: 1,
                transition: { delay: 0.5 }
              }}
              transition={{ 
                type: "spring",
                stiffness: 400,
                damping: 17
              }}
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