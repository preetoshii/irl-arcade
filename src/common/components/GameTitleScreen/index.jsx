/**
 * GameTitleScreen.jsx - Reusable title screen component for all games
 * 
 * Provides consistent retro-minimal title screen layout.
 * Each game passes in its specific content and colors.
 */

import styles from './GameTitleScreen.module.css';

function GameTitleScreen({ 
  title,
  backgroundColor = '#000',
  className = ''
}) {
  return (
    <div 
      className={`${styles.titleScreen} ${className}`}
      style={{ backgroundColor }}
    >
      <h1 className={styles.gameTitle}>
        {title.split('').map((letter, index) => (
          <span 
            key={index} 
            style={{ 
              animationDelay: `${index * 0.1}s`
            }}
          >
            {letter === ' ' ? '\u00A0' : letter}
          </span>
        ))}
      </h1>
    </div>
  );
}

export default GameTitleScreen;