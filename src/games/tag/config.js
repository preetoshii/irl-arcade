/**
 * config.js - Tag game configuration
 * 
 * Example of how to add a new game to the system.
 */

export default {
  id: 'tag',
  name: 'Audio Tag',
  description: 'A sound-based tag game where players must avoid being "it" using only audio cues!',
  minPlayers: 3,
  maxPlayers: 50,
  requiresTeams: false,
  
  // Systems this game requires
  requires: ['audio', 'timer'],
  
  // 8-bit jingle that plays when this game is selected
  // TODO: Add actual audio file
  titleJingle: '/sounds/tag-intro.mp3',
  
  // TTS voice for this game (will announce game name and be used in-game)
  voice: 'Samantha', // Energetic, playful voice for tag
  
  // Dynamic import for the game component
  component: () => import('./index.jsx')
};