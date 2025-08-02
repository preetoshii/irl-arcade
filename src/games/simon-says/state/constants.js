/**
 * Shared constants for Simon Says
 * Central location for all magic numbers and configuration values
 */

// ============================================
// TIMING CONSTANTS (milliseconds)
// ============================================

export const PAUSE_DURATIONS = {
  MICRO: 500,    // Quick breath, comma-like
  SMALL: 1000,   // Period pause, moment to process
  MEDIUM: 2000,  // Dramatic beat, anticipation
  LARGE: 3000,   // Major transition, big reveal
  XLARGE: 4000   // Maximum suspense, rare use
};

// Round durations in seconds
export const ROUND_DURATIONS = {
  DUEL: { min: 60, default: 90, max: 180 },
  TEAM: { min: 120, default: 180, max: 300 },
  FREE_FOR_ALL: { min: 90, default: 150, max: 240 },
  ASYMMETRIC: { min: 90, default: 120, max: 180 }
};

// Block durations in seconds
export const BLOCK_DURATIONS = {
  CEREMONY: {
    OPENING: { min: 60, default: 90, max: 120 },
    CLOSING: { min: 60, default: 90, max: 120 }
  },
  RELAX: {
    STANDARD: { min: 60, default: 90, max: 120 },
    EXTENDED: { min: 120, default: 150, max: 180 }
  }
};

// ============================================
// MATCH CONFIGURATION
// ============================================

export const MATCH_LENGTHS = {
  QUICK: { rounds: 5, estimatedMinutes: 12 },
  STANDARD: { rounds: 10, estimatedMinutes: 25 },
  EXTENDED: { rounds: 15, estimatedMinutes: 35 },
  MARATHON: { rounds: 30, estimatedMinutes: 70 }
};

// Difficulty progression curves
export const DIFFICULTY_CURVES = {
  GENTLE: [1, 1, 2, 2, 3, 3, 3, 4, 4, 5],
  STEADY: [2, 3, 3, 3, 3, 3, 3, 3, 4, 4],
  ROLLER_COASTER: [1, 3, 2, 4, 2, 5, 3, 4, 3, 5]
};

// Difficulty-based speed multipliers
export const DIFFICULTY_SPEED_MULTIPLIERS = {
  1: 1.2,  // 20% slower (more time to understand)
  2: 1.1,  // 10% slower
  3: 1.0,  // Normal speed
  4: 0.9,  // 10% faster
  5: 0.8   // 20% faster
};

// ============================================
// SELECTION WEIGHTS
// ============================================

// Default round type weights
export const DEFAULT_ROUND_WEIGHTS = {
  DUEL: 30,
  TEAM: 25,
  FREE_FOR_ALL: 35,
  ASYMMETRIC: 10
};

// Player count adjustments
export const PLAYER_COUNT_ADJUSTMENTS = {
  SMALL: {  // 2-6 players
    threshold: 6,
    weights: {
      DUEL: 1.5,
      TEAM: 0.8,
      FREE_FOR_ALL: 0.7,
      ASYMMETRIC: 1.0
    }
  },
  LARGE: {  // 20+ players
    threshold: 20,
    weights: {
      DUEL: 0.5,
      TEAM: 1.5,
      FREE_FOR_ALL: 1.5,
      ASYMMETRIC: 0.8
    }
  }
};

// ============================================
// VARIETY ENFORCEMENT
// ============================================

// How much to penalize recent selections
export const RECENCY_PENALTIES = {
  JUST_PLAYED: 0.2,    // 80% reduction
  ONE_ROUND_AGO: 0.4,  // 60% reduction
  TWO_ROUNDS_AGO: 0.7, // 30% reduction
  THREE_ROUNDS_AGO: 0.9, // 10% reduction
  FOUR_PLUS_AGO: 1.0   // No penalty
};

// History tracking limits
export const HISTORY_LIMITS = {
  RECENT_PLAYS: 5,        // Track last 5 plays
  RECENT_SELECTIONS: 10,  // Track last 10 player selections
  PARTNER_HISTORY: 3      // Track last 3 partners per player
};

// ============================================
// PLAYER MANAGEMENT
// ============================================

export const PLAYER_LIMITS = {
  MIN_PLAYERS: 2,
  MAX_PLAYERS: 100,
  MIN_PER_TEAM: 1,
  MAX_PER_TEAM: 50
};

// Selection fairness
export const SELECTION_FAIRNESS = {
  MAX_ROUNDS_WITHOUT_SELECTION: 5,  // Boost weight after this
  SELECTION_BOOST_FACTOR: 2.0,      // Double chance if waiting too long
  RECENT_PARTNER_PENALTY: 0.5       // Halve chance of same partner
};

// ============================================
// SCRIPT CONFIGURATION
// ============================================

export const SCRIPT_VARIATIONS = {
  MIN_VARIATIONS: 3,   // Minimum script variations per type
  MAX_VARIATIONS: 10   // Maximum to prevent bloat
};

// Voice performance settings
export const VOICE_SETTINGS = {
  DEFAULT_RATE: 1.0,
  DEFAULT_PITCH: 1.0,
  DEFAULT_VOLUME: 1.0,
  EXCITEMENT_PITCH_BOOST: 1.1,
  EXCITEMENT_RATE_BOOST: 1.05
};

// ============================================
// PATTERN DEFINITIONS
// ============================================

// Pattern selection rules
export const PATTERN_RULES = {
  MIN_ROUNDS_BETWEEN_RELAX: 2,
  MAX_CONSECUTIVE_ROUNDS: 6,
  ALWAYS_START_WITH_OPENING: true,
  ALWAYS_END_WITH_CLOSING: true,
  NEVER_END_ON_RELAX: true
};

// ============================================
// STATE MANAGEMENT
// ============================================

export const STATE_CONFIG = {
  CHECKPOINT_INTERVAL: 60000,  // Save state every 60 seconds
  MAX_CHECKPOINT_AGE: 3600000, // Delete checkpoints older than 1 hour
  STATE_VERSION: '1.0.0'
};

// ============================================
// ERROR RECOVERY
// ============================================

export const RECOVERY_CONFIG = {
  MAX_RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,         // 1 second between retries
  PERFORMANCE_TIMEOUT: 30000, // Max 30 seconds for any performance
  SELECTION_TIMEOUT: 5000     // Max 5 seconds for selection
};

// ============================================
// DEBUG SETTINGS
// ============================================

export const DEBUG_CONFIG = {
  LOG_SELECTIONS: true,
  LOG_PERFORMANCE: true,
  LOG_STATE_CHANGES: true,
  SHOW_WEIGHT_CALCULATIONS: false,
  MOCK_TTS: false  // Use console.log instead of real TTS
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get pause duration in milliseconds
 */
export function getPauseDuration(pauseType, multiplier = 1.0) {
  const baseDuration = PAUSE_DURATIONS[pauseType.toUpperCase()] || PAUSE_DURATIONS.MEDIUM;
  return Math.round(baseDuration * multiplier);
}

/**
 * Get round duration for a round type
 */
export function getRoundDuration(roundType, setting = 'default') {
  const durations = ROUND_DURATIONS[roundType.toUpperCase()];
  return durations ? durations[setting] : 90;
}

/**
 * Calculate adjusted weight based on player count
 */
export function getPlayerCountAdjustment(playerCount, roundType) {
  if (playerCount <= PLAYER_COUNT_ADJUSTMENTS.SMALL.threshold) {
    return PLAYER_COUNT_ADJUSTMENTS.SMALL.weights[roundType] || 1.0;
  } else if (playerCount >= PLAYER_COUNT_ADJUSTMENTS.LARGE.threshold) {
    return PLAYER_COUNT_ADJUSTMENTS.LARGE.weights[roundType] || 1.0;
  }
  return 1.0;
}

/**
 * Get recency penalty based on rounds since last played
 */
export function getRecencyPenalty(roundsSinceLastPlayed) {
  if (roundsSinceLastPlayed === 0) return RECENCY_PENALTIES.JUST_PLAYED;
  if (roundsSinceLastPlayed === 1) return RECENCY_PENALTIES.ONE_ROUND_AGO;
  if (roundsSinceLastPlayed === 2) return RECENCY_PENALTIES.TWO_ROUNDS_AGO;
  if (roundsSinceLastPlayed === 3) return RECENCY_PENALTIES.THREE_ROUNDS_AGO;
  return RECENCY_PENALTIES.FOUR_PLUS_AGO;
}