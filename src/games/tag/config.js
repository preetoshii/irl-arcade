/**
 * config.js - Tag game configuration
 * 
 * Example of how to add a new game to the system.
 */

export default {
  id: 'tag',
  name: 'Audio Tag',
  description: 'chase the sound, don’t get caught',
  minPlayers: 3,
  maxPlayers: 50,
  requiresTeams: false,
  color: '0, 102, 255', // Blue
  
  // Systems this game requires
  requires: ['audio', 'timer'],
  
  // Dynamic import for the game component
  component: () => import('./index.jsx')
};