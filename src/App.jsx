import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import GameSelector from './common/game-management/GameSelector'
import GameLoader from './common/game-management/GameLoader'
import SimonSaysDebugPage from './games/simon-says/debug/DebugPage'
import './App.css'

// Import and register all games
import './games'

// Global Game object for console experimentation
window.Game = {
  speak: null,
  // Add whatever you need here for experiments
}

function App() {
  const [selectedGame, setSelectedGame] = useState(null);
  const [showDebug, setShowDebug] = useState(false);

  // Initialize speech synthesis
  useEffect(() => {
    // Simple speak function ready to use
    const speak = (text, pitch = 1, rate = 1) => {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.pitch = pitch
      utterance.rate = rate
      window.speechSynthesis.speak(utterance)
    }
    
    // Make it available globally for console experiments
    window.Game.speak = speak
  }, [])

  const handleGameSelect = (gameId) => {
    console.log(`Selected game: ${gameId}`);
    setSelectedGame(gameId);
  };

  const handleExitGame = () => {
    setSelectedGame(null);
  };

  // Show debug page if requested
  if (showDebug) {
    return <SimonSaysDebugPage onBack={() => setShowDebug(false)} />;
  }

  return (
    <div className="App">
      {!selectedGame ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <GameSelector onGameSelect={handleGameSelect} />
          
          {/* Debug button - small and unobtrusive */}
          <button 
            onClick={() => setShowDebug(true)}
            style={{
              position: 'fixed',
              bottom: '20px',
              right: '20px',
              background: '#333',
              color: '#0f0',
              border: '1px solid #0f0',
              padding: '8px 16px',
              fontSize: '12px',
              fontFamily: 'JetBrains Mono, monospace',
              cursor: 'pointer',
              opacity: 0.7,
              transition: 'opacity 0.2s',
              zIndex: 1000
            }}
            onMouseEnter={(e) => e.target.style.opacity = '1'}
            onMouseLeave={(e) => e.target.style.opacity = '0.7'}
          >
            Debug Simon Says
          </button>
        </motion.div>
      ) : (
        <GameLoader 
          gameId={selectedGame} 
          onExit={handleExitGame}
        />
      )}
    </div>
  )
}

export default App