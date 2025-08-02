/**
 * config.js - Simon Says game configuration
 * 
 * Defines metadata and requirements for the Simon Says game.
 */

export default {
  id: 'simon-says',
  name: 'Simon Says',
  description: 'A classic game of following commands! Teams take turns completing physical challenges announced by Simon.',
  minPlayers: 2,
  maxPlayers: 100,
  requiresTeams: true,
  
  // Systems this game requires
  requires: ['audio', 'timer'],
  
  // Dynamic import for the game component
  component: () => import('./index.jsx')
};