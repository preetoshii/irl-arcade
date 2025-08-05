/**
 * GameSelector.jsx - Carousel-based game selection interface
 * 
 * Features:
 * - Full-screen horizontal carousel with scroll-snap
 * - Sound effects and text-to-speech
 * - Dynamic color interpolation
 * - Navigation buttons and swipe support
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import gameRegistry from './GameRegistry';
import CarouselSlide from './CarouselSlide';
import PixelParticles from '../components/PixelParticles/PixelParticles';
import NavigationButton from '../components/NavigationButton';
import useScrollColorInterpolation from '../hooks/useScrollColorInterpolation';
import useSound from '../hooks/useSound';
import useTTS from '../hooks/useTTS';
import styles from './GameSelector.module.css';

function GameSelector({ onGameSelect, analyser, onColorChange }) {
  const games = gameRegistry.getAllGames();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isStarting, setIsStarting] = useState(false);
  const carouselRef = useRef(null);
  const isRecentering = useRef(false);
  
  // Custom hooks
  const { playHover, playClick, playSwipe, playSelect } = useSound();
  const { speak } = useTTS();
  
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
  
  // Get interpolated color
  const interpolatedColor = useScrollColorInterpolation(carouselRef, orderedGames, isRecentering);
  
  // Pass color up to parent
  useEffect(() => {
    if (onColorChange) {
      onColorChange(interpolatedColor);
    }
  }, [interpolatedColor, onColorChange]);

  // Handle scroll to detect current game and play sounds
  useEffect(() => {
    const carousel = carouselRef.current;
    if (!carousel) return;
    
    let scrollTimeout;
    let lastScrollPos = null;
    let swipeStarted = false;
    const centerIndex = Math.floor(games.length / 2);

    const handleScroll = () => {
      const slideWidth = carousel.offsetWidth;
      const scrollLeft = carousel.scrollLeft;
      const currentSlide = Math.round(scrollLeft / slideWidth);
      
      // Detect swipe start and play sound
      if (lastScrollPos !== null && !isRecentering.current) {
        const movement = Math.abs(scrollLeft - lastScrollPos);
        
        // Start of new swipe
        if (!swipeStarted && movement > 5) {
          swipeStarted = true;
          playSwipe();
          
          // Determine direction and announce target game
          const direction = scrollLeft > lastScrollPos ? 1 : -1;
          const targetIndex = (currentIndex + direction + games.length) % games.length;
          const targetGame = games[targetIndex];
          
          if (targetGame) {
            speak(targetGame.name);
          }
        }
      }
      
      lastScrollPos = scrollLeft;
      
      // Clear existing timeout
      clearTimeout(scrollTimeout);
      
      // After scrolling stops, update current index and recenter
      scrollTimeout = setTimeout(() => {
        swipeStarted = false;
        const offset = currentSlide - centerIndex;
        
        if (offset !== 0) {
          isRecentering.current = true;
          
          // Update the current index
          setCurrentIndex((prev) => (prev + offset + games.length) % games.length);
          
          // Snap back to center
          requestAnimationFrame(() => {
            carousel.scrollLeft = centerIndex * slideWidth;
            setTimeout(() => {
              isRecentering.current = false;
            }, 100);
          });
        }
      }, 150);
    };

    carousel.addEventListener('scroll', handleScroll);
    return () => {
      carousel.removeEventListener('scroll', handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, [currentIndex, games, speak, playSwipe]);

  // Initialize carousel to center position
  useEffect(() => {
    const carousel = carouselRef.current;
    if (!carousel) return;
    
    const centerIndex = Math.floor(games.length / 2);
    carousel.scrollLeft = centerIndex * carousel.offsetWidth;
  }, [games.length]);

  // Handle navigation
  const navigate = useCallback((direction) => {
    const carousel = carouselRef.current;
    if (!carousel) return;
    
    // Calculate next index
    const offset = direction === 'left' ? -1 : 1;
    const nextIndex = (currentIndex + offset + games.length) % games.length;
    const nextGame = games[nextIndex];
    
    // Play sounds
    playClick();
    setTimeout(playSwipe, 50);
    
    // Announce
    if (nextGame) {
      speak(nextGame.name);
    }
    
    // Scroll to next slide (will trigger the scroll handler to update state)
    const slideWidth = carousel.offsetWidth;
    const targetScroll = carousel.scrollLeft + (offset * slideWidth);
    
    carousel.scrollTo({
      left: targetScroll,
      behavior: 'smooth'
    });
  }, [currentIndex, games, playClick, playSwipe, speak]);

  const handleStartGame = useCallback(() => {
    const currentGame = games[currentIndex];
    if (!currentGame) return;
    
    playSelect();
    setIsStarting(true);
    
    setTimeout(() => {
      onGameSelect(currentGame.id);
    }, 300);
  }, [currentIndex, games, playSelect, onGameSelect]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') navigate('left');
      if (e.key === 'ArrowRight') navigate('right');
      if (e.key === 'Enter') handleStartGame();
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate, handleStartGame]);

  if (games.length === 0) {
    return (
      <div className={styles.noGames}>
        <p>No games available. Check game registration!</p>
      </div>
    );
  }

  return (
    <div className={styles.selectorContainer}>
      {/* Background particles */}
      <PixelParticles color={interpolatedColor} />
      
      {/* Game carousel */}
      <div 
        ref={carouselRef}
        className={styles.carousel}
        style={{ opacity: isStarting ? 0 : 1 }}
      >
        {orderedGames.map((game, index) => {
          const centerIndex = Math.floor(games.length / 2);
          const isActive = index === centerIndex;
          
          return (
            <div 
              key={game.id} 
              data-game-id={game.id}
              className={styles.carouselSlide}
            >
              <CarouselSlide
                game={game}
                isActive={isActive}
                mode="title"
                analyser={analyser}
              />
            </div>
          );
        })}
      </div>

      {/* Navigation buttons */}
      <NavigationButton
        onClick={() => navigate('left')}
        onHover={playHover}
        color={interpolatedColor}
        position={{ left: '2rem' }}
        initialAnimation={{ x: -20 }}
      >
        ◀
      </NavigationButton>

      <NavigationButton
        onClick={() => navigate('right')}
        onHover={playHover}
        color={interpolatedColor}
        position={{ right: '2rem' }}
        initialAnimation={{ x: 20 }}
      >
        ▶
      </NavigationButton>

      {/* Game info and start button */}
      <AnimatePresence>
        {!isStarting && (
          <motion.div 
            className={styles.overlayControls}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Game description */}
            <AnimatePresence mode="wait">
              {games[currentIndex] && (
                <motion.div 
                  className={styles.gameDescriptionOverlay}
                  key={games[currentIndex].id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  style={{ color: `rgb(${interpolatedColor})` }}
                >
                  <p>{games[currentIndex].description}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* START GAME button */}
            <motion.button
              className={styles.startButton}
              onClick={handleStartGame}
              onMouseEnter={playHover}
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