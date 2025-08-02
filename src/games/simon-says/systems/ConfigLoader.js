/**
 * Configuration Loader for Simon Says
 * 
 * The ConfigLoader is like a master chef who takes ingredients from multiple sources and combines them into the perfect recipe for each match. It handles the complex task of merging player preferences ("I want a gentle 10-round game focused on silly activities") with developer settings (detailed weight tables, timing configurations, and game rules) to create a cohesive configuration that shapes every aspect of the game. This separation allows players to have simple, meaningful choices while developers retain fine-grained control over the experience.
 * 
 * The real magic happens in how ConfigLoader resolves potential conflicts and fills in gaps. When a player selects "intense difficulty," ConfigLoader knows to reduce pause durations, increase the probability of challenging activities, and adjust the difficulty curve accordingly. It's like having an experienced game master who understands that "intense" doesn't just mean harder activities - it means faster pacing, less rest time, and a more demanding overall experience. All these interconnected adjustments happen automatically, creating a cohesive experience from simple player choices.
 */

import eventBus, { Events } from './EventBus';
import { 
  MATCH_LENGTHS, 
  DEFAULT_ROUND_WEIGHTS,
  DIFFICULTY_CURVES,
  PAUSE_DURATIONS 
} from '../state/constants';

// ============================================
// DEFAULT CONFIGURATIONS
// ============================================

// The default player configuration represents the most common, accessible game settings. These defaults were carefully chosen through playtesting to create an experience that's fun for first-time players while still being engaging for veterans. A 10-round match hits the sweet spot of substantial gameplay without overstaying its welcome, while 'moderate' difficulty provides challenge without frustration. The 'competitive' and 'silly' focus creates a playful rivalry that keeps things light-hearted.

const DEFAULT_PLAYER_CONFIG = {
  matchLength: 10,                    // Number of rounds
  difficultyCurve: 'gentle',         // gentle, steady, roller_coaster
  difficultyLevel: 'moderate',       // gentle, moderate, intense
  gameFocus: ['competitive', 'silly'], // competitive, collaborative, silly, physical, creative
  teamConfig: {
    teamCount: 2,
    teamSelection: 'manual',         // manual, random, balanced, captains
    teamNames: ['Red Team', 'Blue Team']
  },
  accessibility: {
    visualAccommodations: false,     // Avoid blindfold modifiers
    mobilityAccommodations: false,   // Include sitting/standing options
    audioAccommodations: false       // Visual cues for audio instructions
  }
};

// The developer configuration is where the deep complexity lives. While players see simple choices, developers can tune every aspect of the game through these detailed settings. The block sequencing patterns define the rhythm of different match lengths - notice how shorter matches have fewer but more intense relax blocks, while longer matches space them out more evenly. The round type weights and variants create the variety players experience, while timing configurations ensure everything feels smooth and natural.

const DEFAULT_DEVELOPER_CONFIG = {
  // Match flow
  blockSequencing: {
    patterns: {
      // Patterns are defined per match length
      5: [
        { id: 'burst', sequence: ['ceremony', 'round', 'round', 'relax', 'round', 'round', 'round', 'ceremony'] },
        { id: 'steady', sequence: ['ceremony', 'round', 'round', 'round', 'relax', 'round', 'round', 'ceremony'] },
        { id: 'gentle', sequence: ['ceremony', 'round', 'relax', 'round', 'round', 'round', 'round', 'ceremony'] }
      ],
      10: [
        { id: 'classic', sequence: ['ceremony', 'round', 'round', 'round', 'relax', 'round', 'round', 'relax', 'round', 'round', 'round', 'round', 'ceremony'] },
        { id: 'rhythm', sequence: ['ceremony', 'round', 'round', 'relax', 'round', 'round', 'relax', 'round', 'round', 'relax', 'round', 'round', 'ceremony'] },
        { id: 'building', sequence: ['ceremony', 'round', 'relax', 'round', 'round', 'relax', 'round', 'round', 'round', 'relax', 'round', 'round', 'round', 'ceremony'] }
      ],
      15: [
        { id: 'three-acts', sequence: ['ceremony', 'round', 'round', 'round', 'relax', 'round', 'round', 'round', 'round', 'relax', 'round', 'round', 'round', 'round', 'round', 'round', 'ceremony'] },
        { id: 'regular', sequence: ['ceremony', 'round', 'round', 'relax', 'round', 'round', 'round', 'relax', 'round', 'round', 'relax', 'round', 'round', 'round', 'relax', 'round', 'round', 'ceremony'] },
        { id: 'endurance', sequence: ['ceremony', 'round', 'round', 'relax', 'round', 'round', 'round', 'round', 'relax', 'round', 'round', 'round', 'round', 'round', 'round', 'round', 'ceremony'] }
      ],
      30: [
        { id: 'quarters', sequence: generateQuartersPattern(30) },
        { id: 'waves', sequence: generateWavePattern(30) },
        { id: 'sprint', sequence: generateSprintPattern(30) }
      ]
    }
  },
  
  // Round type configuration
  roundTypes: {
    duel: { 
      weight: 30,
      minPlayers: 2,
      maxPlayers: 4,
      variants: ['tag', 'mirror', 'balance', 'speed']
    },
    team: {
      weight: 25,
      minPlayers: 4,
      maxPlayers: 40,
      variants: ['relay', 'capture', 'collective']
    },
    freeForAll: {
      weight: 35,
      minPlayers: 3,
      maxPlayers: 100,
      variants: ['elimination', 'collection', 'freeze']
    },
    asymmetric: {
      weight: 10,
      minPlayers: 3,
      maxPlayers: 30,
      variants: ['infection', 'protector', 'hunter']
    }
  },
  
  // Weight configuration
  weights: {
    defaultWeights: DEFAULT_ROUND_WEIGHTS,
    playerCountAdjustments: {
      small: { threshold: 6, multipliers: { duel: 1.5, team: 0.8, freeForAll: 0.7 } },
      large: { threshold: 20, multipliers: { duel: 0.5, team: 1.5, freeForAll: 1.5 } }
    }
  },
  
  // Script configuration
  scripts: {
    personality: {
      style: 'enthusiastic',      // enthusiastic, calm, silly, strict
      formality: 'casual',        // casual, formal, mixed
      humor: 'moderate',          // none, light, moderate, heavy
      pace: 'dynamic'             // slow, moderate, fast, dynamic
    }
  },
  
  // Timing configuration
  timing: {
    pauseTokens: PAUSE_DURATIONS,
    multipliers: {
      difficulty: {
        easy: 1.2,      // Slower for level 1-2
        medium: 1.0,    // Normal for level 3
        hard: 0.8       // Faster for level 4-5
      },
      progression: {
        early: 1.2,
        middle: 1.0,
        late: 0.8,
        overtime: 0.6
      }
    }
  },
  
  // Feature flags
  features: {
    predeterminedPatterns: true,
    varietyEnforcement: true,
    playerRotation: true,
    multiLanguageAudio: false
  },
  
  // System configuration
  system: {
    debugMode: false,
    verboseLogging: false,
    mockTTS: false,
    checkpointInterval: 60000
  }
};

// ============================================
// PATTERN GENERATORS
// ============================================

function generateQuartersPattern(rounds) {
  const pattern = ['ceremony'];
  const quarterSize = Math.floor(rounds / 4);
  
  for (let quarter = 0; quarter < 4; quarter++) {
    for (let i = 0; i < quarterSize; i++) {
      pattern.push('round');
    }
    if (quarter < 3) pattern.push('relax');
  }
  
  // Add remaining rounds
  const remaining = rounds - (quarterSize * 4);
  for (let i = 0; i < remaining; i++) {
    pattern.push('round');
  }
  
  pattern.push('ceremony');
  return pattern;
}

function generateWavePattern(rounds) {
  const pattern = ['ceremony'];
  const waves = [3, 4, 5, 5, 4, 3]; // Wave sizes
  let roundsAdded = 0;
  
  for (let i = 0; i < waves.length && roundsAdded < rounds; i++) {
    const waveSize = Math.min(waves[i], rounds - roundsAdded);
    for (let j = 0; j < waveSize; j++) {
      pattern.push('round');
    }
    roundsAdded += waveSize;
    
    if (roundsAdded < rounds) {
      pattern.push('relax');
    }
  }
  
  // Add remaining rounds
  while (roundsAdded < rounds) {
    pattern.push('round');
    roundsAdded++;
  }
  
  pattern.push('ceremony');
  return pattern;
}

function generateSprintPattern(rounds) {
  const pattern = ['ceremony'];
  const sprintPattern = [5, 3]; // Alternating sprint/recovery
  let roundsAdded = 0;
  let sprintIndex = 0;
  
  while (roundsAdded < rounds) {
    const size = Math.min(sprintPattern[sprintIndex % 2], rounds - roundsAdded);
    for (let i = 0; i < size; i++) {
      pattern.push('round');
    }
    roundsAdded += size;
    
    if (roundsAdded < rounds) {
      pattern.push('relax');
    }
    sprintIndex++;
  }
  
  pattern.push('ceremony');
  return pattern;
}

// ============================================
// CONFIG LOADER CLASS
// ============================================

class ConfigLoader {
  constructor() {
    this.playerConfig = { ...DEFAULT_PLAYER_CONFIG };
    this.developerConfig = { ...DEFAULT_DEVELOPER_CONFIG };
    this.mergedConfig = null;
    this.configSources = new Map(); // Track where config values came from
  }

  /**
   * Load player configuration
   * 
   * When players make their selections in the UI, this method takes those choices and integrates them with the defaults. The deep merge ensures that players only need to specify what they want to change - if they just set matchLength to 15, all other defaults remain intact. This approach prevents errors from missing configuration values while allowing complete customization when desired. The method also emits an event so other systems know the configuration has changed, enabling them to adjust their behavior accordingly.
   */
  loadPlayerConfig(config) {
    this.playerConfig = this.deepMerge(DEFAULT_PLAYER_CONFIG, config);
    this.configSources.set('player', config);
    this.updateMergedConfig();
    
    eventBus.emit(Events.CONFIG_LOADED, { type: 'player', config: this.playerConfig });
    return this.playerConfig;
  }

  /**
   * Load developer configuration
   */
  loadDeveloperConfig(config) {
    this.developerConfig = this.deepMerge(DEFAULT_DEVELOPER_CONFIG, config);
    this.configSources.set('developer', config);
    this.updateMergedConfig();
    
    eventBus.emit(Events.CONFIG_LOADED, { type: 'developer', config: this.developerConfig });
    return this.developerConfig;
  }

  /**
   * Load configuration from multiple sources
   */
  loadConfig(sources) {
    if (sources.player) {
      this.loadPlayerConfig(sources.player);
    }
    
    if (sources.developer) {
      this.loadDeveloperConfig(sources.developer);
    }
    
    return this.mergedConfig;
  }

  /**
   * Update merged configuration
   */
  updateMergedConfig() {
    // Start with developer config as base
    this.mergedConfig = { ...this.developerConfig };
    
    // Apply player preferences
    this.applyPlayerPreferences();
    
    // Calculate derived values
    this.calculateDerivedValues();
    
    eventBus.emit(Events.CONFIG_UPDATED, { config: this.mergedConfig });
  }

  /**
   * Apply player preferences to merged config
   * 
   * This is where simple player choices transform into comprehensive game adjustments. When a player selects 'gentle' difficulty, this method doesn't just set a flag - it adjusts maximum difficulty from 5 to 3, increases pause multipliers to give more thinking time, and reduces modifier probability to keep things manageable. Similarly, choosing a 'collaborative' focus doesn't just change some text; it increases team activity weights and reduces competitive duel weights. These cascading changes ensure that player choices meaningfully shape the entire experience, not just superficial elements.
   */
  applyPlayerPreferences() {
    const player = this.playerConfig;
    const merged = this.mergedConfig;
    
    // Match configuration
    merged.match = {
      roundCount: player.matchLength,
      difficultyCurve: player.difficultyCurve,
      difficultyLevel: player.difficultyLevel,
      estimatedDuration: MATCH_LENGTHS[Object.keys(MATCH_LENGTHS).find(
        key => MATCH_LENGTHS[key].rounds === player.matchLength
      )]?.estimatedMinutes || 30
    };
    
    // Difficulty settings
    const difficultySettings = {
      gentle: { maxDifficulty: 3, pauseMultiplier: 1.2, modifierProbability: 0.1 },
      moderate: { maxDifficulty: 4, pauseMultiplier: 1.0, modifierProbability: 0.3 },
      intense: { maxDifficulty: 5, pauseMultiplier: 0.8, modifierProbability: 0.5 }
    };
    
    merged.difficulty = difficultySettings[player.difficultyLevel] || difficultySettings.moderate;
    
    // Team configuration
    merged.teams = player.teamConfig;
    
    // Accessibility
    if (player.accessibility.visualAccommodations) {
      merged.excludeModifiers = merged.excludeModifiers || [];
      merged.excludeModifiers.push('blindfold');
    }
    
    // Game focus adjustments
    if (player.gameFocus.includes('competitive')) {
      merged.roundTypes.duel.weight *= 1.3;
      merged.roundTypes.team.weight *= 1.2;
    }
    
    if (player.gameFocus.includes('collaborative')) {
      merged.roundTypes.team.weight *= 1.5;
      merged.roundTypes.asymmetric.weight *= 0.7;
    }
    
    if (player.gameFocus.includes('silly')) {
      merged.modifierProbability = (merged.difficulty.modifierProbability || 0.3) * 1.5;
    }
  }

  /**
   * Calculate derived configuration values
   */
  calculateDerivedValues() {
    const merged = this.mergedConfig;
    
    // Select appropriate patterns for match length
    const roundCount = merged.match.roundCount;
    const patterns = merged.blockSequencing.patterns[roundCount] || 
                    merged.blockSequencing.patterns[10];
    
    merged.availablePatterns = patterns;
    
    // Calculate total weights
    let totalWeight = 0;
    Object.values(merged.roundTypes).forEach(type => {
      totalWeight += type.weight;
    });
    merged.totalRoundTypeWeight = totalWeight;
    
    // Set difficulty curve array
    merged.difficultyCurveArray = DIFFICULTY_CURVES[merged.match.difficultyCurve] || 
                                  DIFFICULTY_CURVES.gentle;
  }

  /**
   * Get configuration value by path
   * 
   * The dot-notation path system makes accessing nested configuration values elegant and safe. Instead of writing config.timing?.multipliers?.difficulty?.easy with defensive checks at each level, systems can simply request 'timing.multipliers.difficulty.easy' and trust they'll get a value or the specified default. This seemingly small feature dramatically reduces boilerplate code throughout the system and makes configuration access consistent and predictable. It's particularly valuable during development when configuration structures might change - the path-based access continues working even if intermediate objects are restructured.
   */
  get(path, defaultValue = null) {
    if (!this.mergedConfig) {
      this.updateMergedConfig();
    }
    
    const keys = path.split('.');
    let current = this.mergedConfig;
    
    for (const key of keys) {
      if (current && typeof current === 'object') {
        current = current[key];
      } else {
        return defaultValue;
      }
      
      if (current === undefined) {
        return defaultValue;
      }
    }
    
    return current;
  }

  /**
   * Get entire configuration object
   */
  getAll() {
    if (!this.mergedConfig) {
      this.updateMergedConfig();
    }
    return { ...this.mergedConfig };
  }

  /**
   * Get player configuration
   */
  getPlayerConfig() {
    return { ...this.playerConfig };
  }

  /**
   * Get developer configuration
   */
  getDeveloperConfig() {
    return { ...this.developerConfig };
  }

  /**
   * Update a specific configuration value
   */
  update(path, value) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    
    // Navigate to parent object
    let current = this.mergedConfig;
    for (const key of keys) {
      if (!current[key] || typeof current[key] !== 'object') {
        current[key] = {};
      }
      current = current[key];
    }
    
    // Set value
    current[lastKey] = value;
    
    // Emit update event
    eventBus.emit(Events.CONFIG_UPDATED, { path, value, config: this.mergedConfig });
  }

  /**
   * Deep merge two objects
   */
  deepMerge(target, source) {
    const output = { ...target };
    
    if (isObject(target) && isObject(source)) {
      Object.keys(source).forEach(key => {
        if (isObject(source[key])) {
          if (!(key in target)) {
            output[key] = source[key];
          } else {
            output[key] = this.deepMerge(target[key], source[key]);
          }
        } else {
          output[key] = source[key];
        }
      });
    }
    
    return output;
  }

  /**
   * Reset to default configuration
   */
  reset() {
    this.playerConfig = { ...DEFAULT_PLAYER_CONFIG };
    this.developerConfig = { ...DEFAULT_DEVELOPER_CONFIG };
    this.mergedConfig = null;
    this.configSources.clear();
    this.updateMergedConfig();
  }

  /**
   * Export current configuration
   */
  export() {
    return {
      player: this.playerConfig,
      developer: this.developerConfig,
      merged: this.mergedConfig
    };
  }

  /**
   * Import configuration
   */
  import(config) {
    if (config.player) {
      this.loadPlayerConfig(config.player);
    }
    
    if (config.developer) {
      this.loadDeveloperConfig(config.developer);
    }
    
    return this.mergedConfig;
  }
}

// Helper function
function isObject(item) {
  return item && typeof item === 'object' && !Array.isArray(item);
}

// Create singleton instance
const configLoader = new ConfigLoader();

// Export both instance and class
export default configLoader;
export { ConfigLoader, DEFAULT_PLAYER_CONFIG, DEFAULT_DEVELOPER_CONFIG };