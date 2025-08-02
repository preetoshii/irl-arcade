/**
 * GameSelector.jsx - UI for selecting which game to play
 * 
 * Displays available games and allows users to choose one.
 * This is the main menu for the multi-game system.
 */

import { motion } from 'framer-motion';
import gameRegistry from './GameRegistry';
import styles from './GameSelector.module.css';

function GameSelector({ onGameSelect }) {
  const games = gameRegistry.getAllGames();

  return (
    <div className={styles.gameSelector}>
      <motion.h1 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className={styles.title}
      >
        Choose Your Game
      </motion.h1>
      
      <div className={styles.gamesGrid}>
        {games.map((game, index) => (
          <motion.div
            key={game.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={styles.gameCard}
            onClick={() => onGameSelect(game.id)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <h2>{game.name}</h2>
            <p>{game.description}</p>
            <div className={styles.gameInfo}>
              <span>Players: {game.minPlayers}-{game.maxPlayers}</span>
              {game.requiresTeams && <span>Team Game</span>}
            </div>
          </motion.div>
        ))}
      </div>
      
      {games.length === 0 && (
        <p className={styles.noGames}>No games available. Check game registration!</p>
      )}
    </div>
  );
}

export default GameSelector;