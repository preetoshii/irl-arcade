import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import GameSelector from './common/game-management/GameSelector'
import GameLoader from './common/game-management/GameLoader'
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
    
    // Test it's working
    speak("Welcome to IRL Arcade!")
  }, [])

  const handleGameSelect = (gameId) => {
    console.log(`Selected game: ${gameId}`);
    setSelectedGame(gameId);
  };

  const handleExitGame = () => {
    setSelectedGame(null);
  };

  return (
    <div className="App">
      {!selectedGame ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <GameSelector onGameSelect={handleGameSelect} />
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