/**
 * ExampleMechanic.jsx
 * /mechanics/ - Self-contained game feature
 * 
 * DO NOT DELETE. This is an example of what a game mechanic might look like.
 * This file serves as loose reference inspiration (not a strict template) for
 * both human developers and AI assistants to understand how mechanics could be
 * structured in our architecture. Shows possible patterns: commenting style,
 * state management, console access, and shared state interaction.
 */

import { useState, useEffect } from 'react'
import { useGameState } from '../state/GameState'


// ========================================
// Configuration
// ========================================


const CHALLENGE_INTERVAL = 15000  // How often to issue challenges
const RESPONSE_WINDOW = 5000      // Time players have to respond


// ========================================
// Local State
// ========================================


const ExampleMechanic = () => {
  const [isActive, setIsActive] = useState(true)
  const [currentChallenge, setCurrentChallenge] = useState(null)
  const [responseCount, setResponseCount] = useState(0)


  // Get shared state we need
  const { players, gameStatus } = useGameState()




  // ========================================
  // Effects & Game Logic
  // ========================================


  useEffect(() => {
    // Main game loop for this mechanic
    if (!isActive || !gameStatus.isRunning) return


    const interval = setInterval(() => {
      // Pick random player and create challenge
      const targetPlayer = players[Math.floor(Math.random() * players.length)]
      
      Game.speak(`${targetPlayer.name}, lorem ipsum challenge!`)
      setCurrentChallenge({ player: targetPlayer, timestamp: Date.now() })
    }, CHALLENGE_INTERVAL)


    return () => clearInterval(interval)
  }, [isActive, players, gameStatus])




  // ========================================
  // Response Handlers
  // ========================================


  const handlePlayerResponse = (playerId) => {
    // Check if response is within time window
    if (!currentChallenge) return
    
    const responseTime = Date.now() - currentChallenge.timestamp
    
    if (responseTime < RESPONSE_WINDOW) {
      Game.speak("Lorem ipsum success!")
      setResponseCount(prev => prev + 1)
    }
  }


  // --- Console Access ---
  useEffect(() => {
    // Make mechanic available for park experimentation
    window.Game.exampleMechanic = {
      trigger: () => handlePlayerResponse('console'),
      toggle: () => setIsActive(!isActive),
      status: () => ({ isActive, responseCount })
    }
  }, [isActive, responseCount])




  // ========================================
  // Render (if needed)
  // ========================================


  // This mechanic is audio-only, no visual component
  return null
}


export default ExampleMechanic