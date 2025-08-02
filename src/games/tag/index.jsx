/**
 * index.jsx - Tag game entry point
 * 
 * Example placeholder for a second game.
 */

import { motion } from 'framer-motion';

function TagGame({ onExit }) {
  return (
    <div className="tag-game">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{ textAlign: 'center', padding: '2rem' }}
      >
        <h1>Audio Tag</h1>
        <p>Coming soon! This will be an audio-based tag game.</p>
        
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

export default TagGame;