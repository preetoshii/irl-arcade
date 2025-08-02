/**
 * GameRegistry.js - Central registry for all available games
 * 
 * This system manages game discovery and metadata.
 * Each game registers itself here with its configuration.
 */

class GameRegistry {
  constructor() {
    this.games = new Map();
  }

  /**
   * Register a new game
   * @param {Object} gameConfig - Game configuration object
   */
  register(gameConfig) {
    if (!gameConfig.id) {
      throw new Error('Game must have an id');
    }
    
    this.games.set(gameConfig.id, {
      ...gameConfig,
      loadComponent: gameConfig.component || (() => Promise.reject('No component defined'))
    });
    
    console.log(`Registered game: ${gameConfig.name || gameConfig.id}`);
  }

  /**
   * Get all registered games
   * @returns {Array} Array of game configurations
   */
  getAllGames() {
    return Array.from(this.games.values());
  }

  /**
   * Get a specific game by ID
   * @param {string} gameId - The game's unique ID
   * @returns {Object|null} Game configuration or null
   */
  getGame(gameId) {
    return this.games.get(gameId) || null;
  }

  /**
   * Check if a game is registered
   * @param {string} gameId - The game's unique ID
   * @returns {boolean}
   */
  hasGame(gameId) {
    return this.games.has(gameId);
  }

  /**
   * Get games that match certain criteria
   * @param {Function} filterFn - Filter function
   * @returns {Array} Filtered games
   */
  getGamesWhere(filterFn) {
    return this.getAllGames().filter(filterFn);
  }
}

// Create singleton instance
const gameRegistry = new GameRegistry();

// Expose to global for debugging
if (typeof window !== 'undefined') {
  window.Game = window.Game || {};
  window.Game.registry = gameRegistry;
}

export default gameRegistry;