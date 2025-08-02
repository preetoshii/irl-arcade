/**
 * Configuration Loader for Simon Says
 * Manages loading, merging, and accessing configuration
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

const DEFAULT_DEVELOPER_CONFIG = {
  // Match flow
  blockSequencing: {
    patterns: {
      // Patterns are defined per match length
      5: [
        { id: 'burst', sequence: ['opening', 'round', 'round', 'relax', 'round', 'round', 'round', 'closing'] },
        { id: 'steady', sequence: ['opening', 'round', 'round', 'round', 'relax', 'round', 'round', 'closing'] },
        { id: 'gentle', sequence: ['opening', 'round', 'relax', 'round', 'round', 'round', 'round', 'closing'] }
      ],
      10: [
        { id: 'classic', sequence: ['opening', 'round', 'round', 'round', 'relax', 'round', 'round', 'relax', 'round', 'round', 'round', 'round', 'closing'] },
        { id: 'rhythm', sequence: ['opening', 'round', 'round', 'relax', 'round', 'round', 'relax', 'round', 'round', 'relax', 'round', 'round', 'closing'] },
        { id: 'building', sequence: ['opening', 'round', 'relax', 'round', 'round', 'relax', 'round', 'round', 'round', 'relax', 'round', 'round', 'round', 'closing'] }
      ],
      15: [
        { id: 'three-acts', sequence: ['opening', 'round', 'round', 'round', 'relax', 'round', 'round', 'round', 'round', 'relax', 'round', 'round', 'round', 'round', 'round', 'round', 'closing'] },
        { id: 'regular', sequence: ['opening', 'round', 'round', 'relax', 'round', 'round', 'round', 'relax', 'round', 'round', 'relax', 'round', 'round', 'round', 'relax', 'round', 'round', 'closing'] },
        { id: 'endurance', sequence: ['opening', 'round', 'round', 'relax', 'round', 'round', 'round', 'round', 'relax', 'round', 'round', 'round', 'round', 'round', 'round', 'round', 'closing'] }
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
  const pattern = ['opening'];
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
  
  pattern.push('closing');
  return pattern;
}

function generateWavePattern(rounds) {
  const pattern = ['opening'];
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
  
  pattern.push('closing');
  return pattern;
}

function generateSprintPattern(rounds) {
  const pattern = ['opening'];
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
  
  pattern.push('closing');
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