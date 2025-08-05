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
import ParticleStarfield from '../components/ParticleStarfield';
import NavigationButton from '../components/NavigationButton';
import WireframeModel from '../components/WireframeModel';
import { useThemeColor, useThemeController } from '../contexts/ThemeContext';
import useSound from '../hooks/useSound';
import useRhythm from '../hooks/useRhythm';
import styles from './GameSelector.module.css';

function GameSelector({ onGameSelect, analyser }) {
  const games = gameRegistry.getAllGames();
  const [targetIndex, setTargetIndex] = useState(0);
  const [isStarting, setIsStarting] = useState(false);
  const carouselRef = useRef(null);
  
  // Track scroll state to prevent duplicate announcements
  const scrollStateRef = useRef({
    hasAnnounced: false,
    lastPosition: 0,
    isScrolling: false,
    scrollTimeout: null
  });
  
  // Custom hooks
  const { playHover, playClick, playSwipe, playSelect } = useSound();
  // Only use rhythm when analyser is available (music is on)
  const { isBeat, bounce } = useRhythm(analyser);
  
  // Theme context
  const themeColor = useThemeColor();
  const setThemeColor = useThemeController();
  
  
  // Helper to get normalized game index (handles wrapping)
  const normalizeIndex = (index) => {
    return ((index % games.length) + games.length) % games.length;
  };

  // Intent-based scroll handling with color interpolation
  useEffect(() => {
    const carousel = carouselRef.current;
    if (!carousel || games.length === 0) return;

    const handleScroll = () => {
      const scrollLeft = carousel.scrollLeft;
      const slideWidth = carousel.offsetWidth;
      const position = scrollLeft / slideWidth; // Raw position including clones
      
      // Update color interpolation based on exact position
      const index1 = Math.floor(position);
      const index2 = Math.ceil(position);
      const fraction = position - index1;
      
      // Get games for interpolation (handling clones)
      let game1, game2;
      if (index1 === 0) {
        game1 = games[games.length - 1]; // Clone of last game
      } else if (index1 > games.length) {
        game1 = games[0]; // Clone of first game
      } else {
        game1 = games[index1 - 1];
      }
      
      if (index2 === 0) {
        game2 = games[games.length - 1];
      } else if (index2 > games.length) {
        game2 = games[0];
      } else {
        game2 = games[index2 - 1];
      }
      
      // Interpolate colors
      if (game1 && game2) {
        const color1 = game1.color || '255, 255, 255';
        const color2 = game2.color || '255, 255, 255';
        
        const rgb1 = color1.split(',').map(v => parseInt(v.trim()));
        const rgb2 = color2.split(',').map(v => parseInt(v.trim()));
        
        const r = Math.round(rgb1[0] + (rgb2[0] - rgb1[0]) * fraction);
        const g = Math.round(rgb1[1] + (rgb2[1] - rgb1[1]) * fraction);
        const b = Math.round(rgb1[2] + (rgb2[2] - rgb1[2]) * fraction);
        
        setThemeColor(`${r}, ${g}, ${b}`);
      }
      
      // Detect intent - which game are we heading toward?
      const gamePosition = position - 1; // Adjust for clone at start
      const nearestGameIndex = Math.round(gamePosition);
      const targetGameIndex = normalizeIndex(nearestGameIndex);
      
      // Detect when target changes
      if (targetGameIndex !== targetIndex && !scrollStateRef.current.hasAnnounced) {
        setTargetIndex(targetGameIndex);
        playSwipe();
        scrollStateRef.current.hasAnnounced = true;
      }
      
      // Reset announcement flag when settling
      const progress = gamePosition - Math.floor(gamePosition);
      if (progress < 0.1 || progress > 0.9) {
        scrollStateRef.current.hasAnnounced = false;
      }
      
      scrollStateRef.current.lastPosition = position;
      scrollStateRef.current.isScrolling = true;
      
      // Handle scroll end for wrapping
      clearTimeout(scrollStateRef.current.scrollTimeout);
      scrollStateRef.current.scrollTimeout = setTimeout(() => {
        scrollStateRef.current.isScrolling = false;
        
        // Check if we're on a clone and need to reset position
        const currentPosition = Math.round(scrollLeft / slideWidth);
        
        if (currentPosition === 0) {
          // On last game clone, jump to real last game
          carousel.scrollLeft = games.length * slideWidth;
        } else if (currentPosition === games.length + 1) {
          // On first game clone, jump to real first game
          carousel.scrollLeft = slideWidth;
        }
      }, 150);
    };

    carousel.addEventListener('scroll', handleScroll);
    
    // Initial setup
    setTimeout(() => {
      handleScroll();
    }, 100);
    
    return () => {
      carousel.removeEventListener('scroll', handleScroll);
      clearTimeout(scrollStateRef.current.scrollTimeout);
    };
  }, [games, targetIndex, setThemeColor, playSwipe]);

  // Unified navigation for buttons and keyboard
  const navigate = useCallback((direction) => {
    const carousel = carouselRef.current;
    if (!carousel) return;
    
    // Calculate direction
    const directionValue = direction === 'left' ? -1 : 1;
    
    playClick();
    
    // Calculate target position based on current scroll position
    const currentScroll = carousel.scrollLeft;
    const slideWidth = carousel.offsetWidth;
    const currentPosition = Math.round(currentScroll / slideWidth);
    const targetPosition = currentPosition + directionValue;
    
    // Scroll to target position
    carousel.scrollTo({
      left: targetPosition * slideWidth,
      behavior: 'smooth'
    });
  }, [playClick]);

  // Watch for target changes and speak game name
  useEffect(() => {
    if (games.length === 0) return;
    
    const targetGame = games[targetIndex];
    if (targetGame) {
      // Simple TTS
      const utterance = new SpeechSynthesisUtterance(targetGame.name);
      utterance.pitch = 0.8;
      utterance.rate = 0.95;
      window.speechSynthesis.speak(utterance);
    }
  }, [targetIndex, games]);

  // Initialize carousel position to first real game (skip clone)
  useEffect(() => {
    const carousel = carouselRef.current;
    if (!carousel || games.length === 0) return;
    
    // Position at first real game (index 1 because of clone at start)
    carousel.scrollLeft = carousel.offsetWidth;
  }, [games.length]);
  

  const handleStartGame = useCallback(() => {
    const currentGame = games[targetIndex];
    if (!currentGame) return;
    
    playSelect();
    setIsStarting(true);
    
    setTimeout(() => {
      onGameSelect(currentGame.id);
    }, 300);
  }, [targetIndex, games, playSelect, onGameSelect]);

  // Track button animations
  const [leftButtonPressed, setLeftButtonPressed] = useState(false);
  const [rightButtonPressed, setRightButtonPressed] = useState(false);
  const [startButtonPressed, setStartButtonPressed] = useState(false);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') {
        setLeftButtonPressed(true);
        navigate('left');
      }
      if (e.key === 'ArrowRight') {
        setRightButtonPressed(true);
        navigate('right');
      }
      if (e.key === 'Enter') {
        setStartButtonPressed(true);
        handleStartGame();
      }
    };
    
    const handleKeyUp = (e) => {
      if (e.key === 'ArrowLeft') setLeftButtonPressed(false);
      if (e.key === 'ArrowRight') setRightButtonPressed(false);
      if (e.key === 'Enter') setStartButtonPressed(false);
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [navigate, handleStartGame]);

  if (games.length === 0) {
    return (
      <div className={styles.noGames}>
        <p>No games available. Check game registration!</p>
      </div>
    );
  }

  // Get the current game's model type
  const currentGameModel = games[targetIndex]?.id === 'tag' ? 'running-fbx' :
                          games[targetIndex]?.id === 'sexy-mama' ? 'sexy-mama-fbx' :
                          games[targetIndex]?.id === 'simon-says' ? 'simon-says-fbx' :
                          'running-man';

  return (
    <div className={styles.selectorContainer}>
      {/* Background starfield */}
      <ParticleStarfield color={themeColor} />
      
      {/* Fixed 3D model in background */}
      <AnimatePresence mode="wait">
        <motion.div 
          key={currentGameModel}
          className={styles.backgroundModel}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          <WireframeModel 
            color={themeColor}
            modelType={currentGameModel}
            size={1200}
          />
        </motion.div>
      </AnimatePresence>
      
      {/* Game carousel with clone slides for wrapping */}
      <div 
        ref={carouselRef}
        className={styles.carousel}
        style={{ opacity: isStarting ? 0 : 1 }}
      >
        {/* Clone of last game at start */}
        <div 
          key="clone-last"
          data-game-id={games[games.length - 1].id}
          data-game-index={-1}
          className={styles.carouselSlide}
        >
          <CarouselSlide
            game={games[games.length - 1]}
            isActive={false}
            mode="title"
            analyser={analyser}
          />
        </div>
        
        {/* All regular games */}
        {games.map((game, index) => (
          <div 
            key={game.id} 
            data-game-id={game.id}
            data-game-index={index}
            className={styles.carouselSlide}
          >
            <CarouselSlide
              game={game}
              isActive={index === targetIndex}
              mode="title"
              analyser={analyser}
            />
          </div>
        ))}
        
        {/* Clone of first game at end */}
        <div 
          key="clone-first"
          data-game-id={games[0].id}
          data-game-index={games.length}
          className={styles.carouselSlide}
        >
          <CarouselSlide
            game={games[0]}
            isActive={false}
            mode="title"
            analyser={analyser}
          />
        </div>
      </div>

      {/* Navigation buttons */}
      <NavigationButton
        onClick={() => navigate('left')}
        onHover={playHover}
        color={themeColor}
        position={{ left: '2rem' }}
        initialAnimation={{ x: -20 }}
        isPressed={leftButtonPressed}
        beatScale={1 + bounce * 0.1} // Subtle 10% bounce
      >
        ◀
      </NavigationButton>

      <NavigationButton
        onClick={() => navigate('right')}
        onHover={playHover}
        color={themeColor}
        position={{ right: '2rem' }}
        initialAnimation={{ x: 20 }}
        isPressed={rightButtonPressed}
        beatScale={1 + bounce * 0.1} // Subtle 10% bounce
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
              {games[targetIndex] && (
                <motion.div 
                  className={styles.gameDescriptionOverlay}
                  key={games[targetIndex].id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  style={{ color: `rgb(${themeColor})` }}
                >
                  <p>{games[targetIndex].description}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* START GAME button */}
            <motion.button
              className={styles.startButton}
              onClick={handleStartGame}
              onMouseEnter={playHover}
              style={{
                borderColor: startButtonPressed ? '#fff' : `rgb(${themeColor})`,
                color: startButtonPressed ? '#000' : `rgb(${themeColor})`,
                backgroundColor: startButtonPressed ? 'rgba(255, 255, 255, 1)' : 'rgba(0, 0, 0, 0)'
              }}
              whileHover={{ 
                scale: 1.1,
                backgroundColor: 'rgba(255, 255, 255, 1)',
                color: '#000',
                borderColor: '#fff'
              }}
              whileTap={{ scale: 0.95 }}
              initial={{ y: 20, opacity: 0 }}
              animate={{ 
                y: 0, 
                opacity: 1,
                scale: startButtonPressed ? 0.95 : (1 + bounce * 0.15), // Bigger bounce for start button
                transition: { 
                  y: { delay: 0.5 },
                  opacity: { delay: 0.5 }
                }
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