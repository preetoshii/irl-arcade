/**
 * GameSelector.jsx - Carousel-based game selection interface
 * 
 * Features:
 * - Full-screen horizontal carousel with scroll-snap
 * - Sound effects and text-to-speech
 * - Dynamic color interpolation
 * - Navigation buttons and swipe support
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import gameRegistry from './GameRegistry';
import CarouselSlide from './CarouselSlide';
import PixelParticles from '../components/PixelParticles/PixelParticles';
import NavigationButton from '../components/NavigationButton';
import { useThemeColor, useThemeController } from '../contexts/ThemeContext';
import useSound from '../hooks/useSound';
import useTTS from '../hooks/useTTS';
import styles from './GameSelector.module.css';

function GameSelector({ onGameSelect, analyser }) {
  const games = gameRegistry.getAllGames();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isStarting, setIsStarting] = useState(false);
  const carouselRef = useRef(null);
  
  // Custom hooks
  const { playHover, playClick, playSwipe, playSelect } = useSound();
  const { speak } = useTTS();
  
  // Theme context
  const themeColor = useThemeColor();
  const setThemeColor = useThemeController();
  
  // Update theme color based on scroll position
  useEffect(() => {
    const carousel = carouselRef.current;
    if (!carousel || games.length === 0) return;

    const updateColor = () => {
      const slides = carousel.querySelectorAll('[data-game-id]');
      const carouselRect = carousel.getBoundingClientRect();
      const centerX = carouselRect.left + carouselRect.width / 2;
      
      let closestSlide = null;
      let secondClosestSlide = null;
      let minDistance = Infinity;
      let secondMinDistance = Infinity;
      
      slides.forEach((slide) => {
        const rect = slide.getBoundingClientRect();
        const slideCenter = rect.left + rect.width / 2;
        const distance = Math.abs(slideCenter - centerX);
        
        if (distance < minDistance) {
          secondClosestSlide = closestSlide;
          secondMinDistance = minDistance;
          closestSlide = { slide, distance };
          minDistance = distance;
        } else if (distance < secondMinDistance) {
          secondClosestSlide = { slide, distance };
          secondMinDistance = distance;
        }
      });
      
      if (closestSlide) {
        const gameIndex1 = parseInt(closestSlide.slide.dataset.gameIndex);
        const game1 = games[gameIndex1];
        
        if (secondClosestSlide && game1) {
          const gameIndex2 = parseInt(secondClosestSlide.slide.dataset.gameIndex);
          const game2 = games[gameIndex2];
          
          if (game2) {
            const totalDistance = closestSlide.distance + secondClosestSlide.distance;
            const factor = closestSlide.distance / totalDistance;
            
            const color1 = game1.color || '255, 255, 255';
            const color2 = game2.color || '255, 255, 255';
            
            const rgb1 = color1.split(',').map(v => parseInt(v.trim()));
            const rgb2 = color2.split(',').map(v => parseInt(v.trim()));
            
            const r = Math.round(rgb1[0] + (rgb2[0] - rgb1[0]) * factor);
            const g = Math.round(rgb1[1] + (rgb2[1] - rgb1[1]) * factor);
            const b = Math.round(rgb1[2] + (rgb2[2] - rgb1[2]) * factor);
            
            setThemeColor(`${r}, ${g}, ${b}`);
          } else if (game1) {
            setThemeColor(game1.color || '255, 255, 255');
          }
        } else if (game1) {
          setThemeColor(game1.color || '255, 255, 255');
        }
      }
    };

    carousel.addEventListener('scroll', updateColor);
    setTimeout(updateColor, 100); // Initial update
    
    return () => carousel.removeEventListener('scroll', updateColor);
  }, [games, setThemeColor]);

  // TODO: Implement carousel navigation
  const navigate = useCallback((direction) => {
    console.log('Navigate:', direction);
    // Will implement clean navigation logic
  }, []);

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
      <PixelParticles color={themeColor} />
      
      {/* Game carousel - Simple linear layout for now */}
      <div 
        ref={carouselRef}
        className={styles.carousel}
        style={{ opacity: isStarting ? 0 : 1 }}
      >
        {games.map((game, index) => (
          <div 
            key={game.id} 
            data-game-id={game.id}
            data-game-index={index}
            className={styles.carouselSlide}
          >
            <CarouselSlide
              game={game}
              isActive={index === currentIndex}
              mode="title"
              analyser={analyser}
            />
          </div>
        ))}
      </div>

      {/* Navigation buttons */}
      <NavigationButton
        onClick={() => navigate('left')}
        onHover={playHover}
        color={themeColor}
        position={{ left: '2rem' }}
        initialAnimation={{ x: -20 }}
      >
        ◀
      </NavigationButton>

      <NavigationButton
        onClick={() => navigate('right')}
        onHover={playHover}
        color={themeColor}
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
                  style={{ color: `rgb(${themeColor})` }}
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
                borderColor: `rgb(${themeColor})`,
                color: `rgb(${themeColor})`,
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