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
  const [targetGameInfo, setTargetGameInfo] = useState(null);
  const carouselRef = useRef(null);
  const isJumpingRef = useRef(false);
  const scrollTimeoutRef = useRef(null);
  const isRecentering = useRef(false);
  const lastScrollPosRef = useRef(null);
  const swipeStartedRef = useRef(false);
  const lastScrollTimeRef = useRef(Date.now());
  const isProgrammaticScrollRef = useRef(false);
  const lastAnnouncedGameRef = useRef(null);
  
  // Load voices on mount and set initial game info
  useEffect(() => {
    // Voices might not be loaded immediately
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    }
    // Also try to load them immediately
    window.speechSynthesis.getVoices();
    
    // Set initial game info
    if (games.length > 0 && !targetGameInfo) {
      setTargetGameInfo(games[currentIndex]);
    }
  }, []);

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
  const interpolatedColor = useScrollColorInterpolation(carouselRef, orderedGames, isRecentering);
  
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
      
      // Detect target game when starting to scroll (but not during recentering)
      if (!swipeStartedRef.current && lastScrollPosRef.current !== null && !isRecentering.current && !isProgrammaticScrollRef.current) {
        const movement = scrollLeft - lastScrollPosRef.current;
        if (Math.abs(movement) > 20) { // Significant movement
          // Determine direction: right = next game, left = previous game
          const direction = movement > 0 ? 1 : -1;
          
          // Calculate the actual game index in the original array
          const targetGameIndex = (currentIndex + direction + games.length) % games.length;
          const targetGame = games[targetGameIndex];
          
          // Announce target game and show its description
          if (targetGame) {
            setTargetGameInfo(targetGame);
            
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(targetGame.name);
            
            // Use American male voice - filter out female voices
            const voices = window.speechSynthesis.getVoices();
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
            }
            
            utterance.pitch = 0.8;
            utterance.rate = 0.95;
            window.speechSynthesis.speak(utterance);
          }
        }
      }
      
      // Detect start of new swipe for sweep sound
      if (lastScrollPosRef.current !== null && !isProgrammaticScrollRef.current) {
        const movement = Math.abs(scrollLeft - lastScrollPosRef.current);
        const currentTime = Date.now();
        const timeDelta = currentTime - lastScrollTimeRef.current;
        const velocity = timeDelta > 0 ? movement / timeDelta : 0;
        
        // Detect if this is a new swipe starting
        if (!swipeStartedRef.current && movement > 5 && velocity > 0.5) {
          // Play sweep sound once at the start of swipe
          const audio = new Audio('/sounds/sweep.wav');
          audio.volume = 0.3;
          audio.play().catch(err => console.log('Sweep sound failed:', err));
          swipeStartedRef.current = true;
        }
        
        // Reset swipe flag if movement stops (velocity drops)
        if (velocity < 0.1 && swipeStartedRef.current) {
          swipeStartedRef.current = false;
        }
        
        lastScrollTimeRef.current = currentTime;
      }
      
      lastScrollPosRef.current = scrollLeft;
      
      // Clear any pending scroll end check
      clearTimeout(scrollTimeout);
      clearTimeout(scrollTimeoutRef.current);
      
      // After scrolling stops, update current index based on offset from center
      scrollTimeout = setTimeout(() => {
        const offset = currentSlide - centerIndex;
        
        if (offset !== 0) {
          // Mark that we're recentering to prevent color flash
          isRecentering.current = true;
          
          // Update the current index and re-center
          setCurrentIndex((prev) => (prev + offset + games.length) % games.length);
          
          // Snap back to center position
          requestAnimationFrame(() => {
            isProgrammaticScrollRef.current = true;
            carousel.scrollLeft = centerIndex * slideWidth;
            // Reset flags after snap
            setTimeout(() => {
              isRecentering.current = false;
              isProgrammaticScrollRef.current = false;
            }, 100);
          });
        }
        
        // Set scrolling to false after we've settled
        scrollTimeoutRef.current = setTimeout(() => {
          setIsScrolling(false);
          // Reset for next navigation
          lastAnnouncedGameRef.current = null;
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
    
    // Announce target game
    const offset = direction === 'left' ? -1 : 1;
    const targetGameIndex = (currentIndex + offset + games.length) % games.length;
    const targetGame = games[targetGameIndex];
    
    if (targetGame) {
      setTargetGameInfo(targetGame);
      
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(targetGame.name);
      
      // Use American male voice - filter out female voices
      const voices = window.speechSynthesis.getVoices();
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
      }
      
      utterance.pitch = 0.8;
      utterance.rate = 0.95;
      window.speechSynthesis.speak(utterance);
    }
    
    // Play click sound immediately, then sweep sound
    const clickAudio = new Audio('/sounds/click.wav');
    clickAudio.volume = 0.3;
    clickAudio.play().catch(err => console.log('Click sound failed:', err));
    
    setTimeout(() => {
      const sweepAudio = new Audio('/sounds/sweep.wav');
      sweepAudio.volume = 0.3;
      sweepAudio.play().catch(err => console.log('Sweep sound failed:', err));
    }, 50);
    
    const slideWidth = carousel.offsetWidth;
    const currentScroll = carousel.scrollLeft;
    const targetScroll = direction === 'left' 
      ? currentScroll - slideWidth 
      : currentScroll + slideWidth;
    
    isProgrammaticScrollRef.current = true;
    carousel.scrollTo({
      left: targetScroll,
      behavior: 'smooth'
    });
    
    // Reset flag after scroll animation completes
    setTimeout(() => {
      isProgrammaticScrollRef.current = false;
    }, 800); // Increased to ensure scroll completes
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
        onMouseEnter={handleButtonHover}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        style={{ 
          left: '2rem',
          color: `rgb(${interpolatedColor})`,
          borderColor: `rgb(${interpolatedColor})`,
          backgroundColor: 'transparent'
        }}
        whileHover={{ 
          scale: 1.1,
          backgroundColor: '#fff',
          color: '#000',
          borderColor: '#fff'
        }}
        whileTap={{ scale: 0.95 }}
        transition={{ 
          type: "spring",
          stiffness: 400,
          damping: 17
        }}
      >
        ◀
      </motion.button>

      {/* Right navigation button */}
      <motion.button
        className={styles.navButton}
        onClick={() => handleNavigate('right')}
        onMouseEnter={handleButtonHover}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        style={{ 
          right: '2rem',
          color: `rgb(${interpolatedColor})`,
          borderColor: `rgb(${interpolatedColor})`,
          backgroundColor: 'transparent'
        }}
        whileHover={{ 
          scale: 1.1,
          backgroundColor: '#fff',
          color: '#000',
          borderColor: '#fff'
        }}
        whileTap={{ scale: 0.95 }}
        transition={{ 
          type: "spring",
          stiffness: 400,
          damping: 17
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
            {/* Game description - show target game when scrolling, active when not */}
            <AnimatePresence mode="wait">
              {(targetGameInfo || activeGameInfo) && (
                <motion.div 
                  className={styles.gameDescriptionOverlay}
                  key={(targetGameInfo || activeGameInfo)?.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  style={{ color: `rgb(${interpolatedColor})` }}
                >
                  <p>{(targetGameInfo || activeGameInfo)?.description}</p>
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