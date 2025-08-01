import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import './App.css'

// Global Game object for console experimentation
window.Game = {
  speak: null,
  // Add whatever you need here for experiments
}

function App() {
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
    speak("Audio system ready!")
  }, [])

  return (
    <div className="App">
      <motion.h1 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        Audio Game Lab
      </motion.h1>
      
      <p>Open console and try: <code>Game.speak("Hello world")</code></p>
    </div>
  )
}

export default App