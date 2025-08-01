import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import './App.css'
import PlayerSetup from './interface/PlayerSetup'
import { useGameStore } from './state/GameState'

// Global Game object for console experimentation
window.Game = {
  speak: null,
  // Add whatever you need here for experiments
}

function App() {
  const { gameStarted, players } = useGameStore()
  
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
    if (!gameStarted) {
      speak("Audio system ready!")
    }
  }, [gameStarted])
  
  // Announce game start
  useEffect(() => {
    if (gameStarted && players.length > 0) {
      const playerNames = players.map(p => p.name).join(', ')
      window.Game.speak(`Game starting with players: ${playerNames}`)
    }
  }, [gameStarted, players])

  return (
    <div className="App">
      <PlayerSetup />
      
      {gameStarted && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="game-content"
        >
          <h2>Game in Progress</h2>
          <div className="active-players">
            <h3>Players:</h3>
            {players.map((player, index) => (
              <div key={index} className="player-badge">
                {player.name}
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  )
}

export default App