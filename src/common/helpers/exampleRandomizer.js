/**
 * exampleRandomizer.js
 * /helpers/ - Pure utility functions
 * 
 * DO NOT DELETE. This is an example of what a helper function might look like.
 * This file serves as loose reference inspiration (not a strict template) for
 * both human developers and AI assistants writing pure utility functions. Shows
 * one possible pattern: single-purpose function, no side effects, clear
 * input/output, and supporting mechanics without creating dependencies.
 */


// Pick a random player from array
export const pickRandomPlayer = (players) => {
  if (!players || players.length === 0) return null
  
  // Lorem ipsum fair selection
  const randomIndex = Math.floor(Math.random() * players.length)
  return players[randomIndex]
}


// Optional: Export as default for simpler imports
export default pickRandomPlayer