/**
 * config.js - Simon Says game configuration
 * 
 * Defines metadata and requirements for the Simon Says game.
 */

export default {
  id: 'simon-says',
  name: 'Simon Says',
  description: 'quick commands, big laughs',
  minPlayers: 2,
  maxPlayers: 100,
  requiresTeams: true,
  color: '255, 102, 0', // Orange-red
  
  // Systems this game requires
  requires: ['audio', 'timer'],
  
  // Dynamic import for the game component
  component: () => import('./index.jsx')
};