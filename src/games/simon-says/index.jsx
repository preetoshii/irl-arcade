/**
 * index.jsx - Simon Says game entry point
 * 
 * This is the main component for the Simon Says game.
 * It orchestrates all game-specific mechanics and UI.
 */

import { useState } from 'react';
import { motion } from 'framer-motion';

function SimonSaysGame({ onExit }) {
  const [gameState, setGameState] = useState('setup');

  return (
    <div className="simon-says-game">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{ textAlign: 'center', padding: '2rem' }}
      >
        <h1>Simon Says</h1>
        <p>Game implementation coming soon!</p>
        <p>Current state: {gameState}</p>
        
        <button 
          onClick={onExit}
          style={{ 
            marginTop: '2rem',
            padding: '0.8rem 2rem',
            fontSize: '1.1rem',
            background: 'rgba(255, 0, 0, 0.2)',
            border: '2px solid rgba(255, 0, 0, 0.5)',
            borderRadius: '8px',
            color: 'white',
            cursor: 'pointer'
          }}
        >
          Back to Menu
        </button>
      </motion.div>
    </div>
  );
}

export default SimonSaysGame;