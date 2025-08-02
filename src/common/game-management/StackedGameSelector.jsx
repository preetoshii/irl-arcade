/**
 * StackedGameSelector.jsx - Native scroll stacked cards
 * 
 * Features:
 * - Each card is a scrollable container
 * - Scrolling top card reveals card underneath
 * - Pure native scroll, no tricks
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import gameRegistry from './GameRegistry';
import CarouselSlide from './CarouselSlide';
import styles from './StackedGameSelector.module.css';

function StackedGameSelector({ onGameSelect }) {
  const games = gameRegistry.getAllGames();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isStarting, setIsStarting] = useState(false);
  const [activeGameInfo, setActiveGameInfo] = useState(null);
  const [cardScrollStates, setCardScrollStates] = useState({});
  const audioRef = useRef(null);
  const cardRefs = useRef({});

  // Track scroll state for each card
  const handleCardScroll = (index) => {
    const card = cardRefs.current[index];
    if (!card) return;

    const scrollPercent = (card.scrollLeft - card.clientWidth) / card.clientWidth;
    
    setCardScrollStates(prev => ({
      ...prev,
      [index]: scrollPercent
    }));

    // If scrolled far enough, change to next/prev card
    if (Math.abs(scrollPercent) > 0.5) {
      if (scrollPercent > 0 && index === currentIndex) {
        // Scrolled right, go to next
        setCurrentIndex((currentIndex + 1) % games.length);
      } else if (scrollPercent < 0 && index === currentIndex) {
        // Scrolled left, go to previous
        setCurrentIndex((currentIndex - 1 + games.length) % games.length);
      }
      // Reset scroll position
      setTimeout(() => {
        card.scrollLeft = card.clientWidth;
      }, 100);
    }
  };

  // Initialize card scroll positions
  useEffect(() => {
    Object.keys(cardRefs.current).forEach(key => {
      const card = cardRefs.current[key];
      if (card) {
        card.scrollLeft = card.clientWidth; // Center position
      }
    });
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

      {/* Stack of scrollable cards */}
      <div className={styles.cardStack}>
        {games.map((game, index) => {
          const stackPosition = (index - currentIndex + games.length) % games.length;
          const isActive = index === currentIndex;
          const scrollState = cardScrollStates[index] || 0;
          
          // Stack positioning
          let scale = 1 - (stackPosition * 0.05);
          let y = stackPosition * 20;
          let zIndex = games.length - stackPosition;
          let opacity = stackPosition < 3 ? 1 : 0;
          
          // Hide cards that have been scrolled away
          if (stackPosition === 0 && Math.abs(scrollState) > 0.5) {
            opacity = 0;
          }
          
          return (
            <motion.div
              key={game.id}
              className={styles.gameCard}
              style={{ zIndex }}
              animate={{
                scale,
                y,
                opacity,
              }}
              transition={{ duration: 0.3 }}
            >
              {/* Scrollable container for this card */}
              <div
                ref={el => cardRefs.current[index] = el}
                className={styles.cardScrollContainer}
                onScroll={() => handleCardScroll(index)}
                style={{ 
                  pointerEvents: stackPosition === 0 ? 'auto' : 'none',
                  touchAction: 'pan-y pinch-zoom'
                }}
              >
                {/* 3x width content */}
                <div className={styles.cardContent}>
                  {/* Left spacer */}
                  <div className={styles.spacer} />
                  
                  {/* Center: actual game content */}
                  <div className={styles.gameContent}>
                    <CarouselSlide
                      game={game}
                      isActive={isActive}
                      mode="title"
                      onActiveChange={isActive ? setActiveGameInfo : undefined}
                    />
                  </div>
                  
                  {/* Right spacer */}
                  <div className={styles.spacer} />
                </div>
              </div>
            </motion.div>
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
            {/* Game description */}
            <AnimatePresence mode="wait">
              {activeGameInfo && (
                <motion.div 
                  className={styles.gameDescriptionOverlay}
                  key={activeGameInfo.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  <p>{activeGameInfo.description}</p>
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

export default StackedGameSelector;