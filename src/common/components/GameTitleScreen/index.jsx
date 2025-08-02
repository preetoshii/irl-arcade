/**
 * GameTitleScreen.jsx - Reusable title screen component for all games
 * 
 * Provides consistent retro-minimal title screen layout.
 * Each game passes in its specific content and colors.
 */

import styles from './GameTitleScreen.module.css';

function GameTitleScreen({ 
  title,
  icon,
  stats = [],
  backgroundColor = '#000',
  className = ''
}) {
  return (
    <div 
      className={`${styles.titleScreen} ${className}`}
      style={{ backgroundColor }}
    >
      <h1 className={styles.gameTitle}>
        {title}
      </h1>
      
      {icon && (
        <div className={styles.gameIcon}>
          {icon}
        </div>
      )}

      {stats.length > 0 && (
        <div className={styles.gameStats}>
          {stats.map((stat, index) => (
            <span key={index}>{stat}</span>
          ))}
        </div>
      )}
    </div>
  );
}

export default GameTitleScreen;