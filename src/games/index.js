/**
 * index.js - Game registration
 * 
 * This file imports all game configs and registers them.
 * Add new games here as they're created.
 */

import gameRegistry from '../common/game-management/GameRegistry';

// Import all game configs
import simonSaysConfig from './simon-says/config';
import tagConfig from './tag/config';

// Register all games
gameRegistry.register(simonSaysConfig);
gameRegistry.register(tagConfig);

export default gameRegistry;