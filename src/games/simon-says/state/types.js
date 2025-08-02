/**
 * Core type definitions for Simon Says
 * These interfaces define the shape of all major data structures
 */

// ============================================
// ENUMS & CONSTANTS
// ============================================

export const BlockType = {
  CEREMONY: 'ceremony',
  ROUND: 'round',
  RELAX: 'relax'
};

export const CeremonyType = {
  OPENING: 'opening',
  CLOSING: 'closing'
};

export const RoundType = {
  DUEL: 'duel',
  TEAM: 'team',
  FREE_FOR_ALL: 'freeForAll',
  ASYMMETRIC: 'asymmetric'
};

export const PlayerStatus = {
  ACTIVE: 'active',
  BREAK: 'break',
  DEPARTED: 'departed'
};

export const MatchStatus = {
  SETUP: 'setup',
  IN_PROGRESS: 'in_progress',
  PAUSED: 'paused',
  COMPLETED: 'completed',
  ABANDONED: 'abandoned'
};

export const DifficultyLevel = {
  VERY_EASY: 1,
  EASY: 2,
  MEDIUM: 3,
  HARD: 4,
  VERY_HARD: 5
};

export const DifficultyCurve = {
  GENTLE: 'gentle',
  STEADY: 'steady',
  ROLLER_COASTER: 'roller_coaster'
};

// ============================================
// PLAYER TYPES
// ============================================

/**
 * Represents a player in the match
 */
export const PlayerType = {
  id: 'string',
  name: 'string',
  team: 'string',
  status: 'PlayerStatus',
  joinedAt: 'timestamp',
  
  // Selection tracking (what Simon knows)
  stats: {
    timesSelected: 'number',
    lastSelectedRound: 'number',
    roundsSinceSelected: 'number',
    recentPartners: 'array<string>',
    recentActivities: 'array<string>'
  }
};

// ============================================
// PLAY TYPES
// ============================================

/**
 * A complete specification for a single activity
 */
export const PlayType = {
  // Identifiers
  blockType: 'BlockType',
  roundType: 'RoundType',
  variant: 'string',        // 'tag', 'mirror', 'balance', etc.
  subVariant: 'string',     // 'normal', 'crabWalk', 'backwards', etc.
  modifier: 'string|null',  // 'blindfolded', 'teamChant', etc.
  
  // Participants
  players: 'object',        // Varies by round type
  
  // Configuration
  duration: 'number',       // seconds
  difficulty: 'number',     // 1-5
  
  // Performance
  scripts: {
    intro: 'string',
    playerSelect: 'string',
    rules: 'string',
    start: 'string',
    during: 'array<string>',
    ending: 'string',
    outro: 'string'
  },
  
  // Hints for performance
  performanceHints: {
    difficulty: 'number',
    buildSuspense: 'boolean',
    roundNumber: 'number',
    isNearEnd: 'boolean'
  }
};

// ============================================
// BLOCK TYPES
// ============================================

/**
 * A block is a segment of the match (ceremony, round, relax)
 */
export const BlockType = {
  type: 'BlockType',
  index: 'number',          // Position in match
  startTime: 'timestamp',
  duration: 'number',       // Actual duration
  plannedDuration: 'number', // Expected duration
  
  // For Round blocks
  play: 'Play|null',
  
  // For Ceremony blocks  
  ceremonyType: 'CeremonyType|null',
  
  // For Relax blocks
  relaxActivity: 'string|null'
};

// ============================================
// MATCH TYPES
// ============================================

/**
 * Top-level match container
 */
export const MatchType = {
  // Identity
  id: 'string',
  startTime: 'timestamp',
  
  // Configuration
  config: {
    roundCount: 'number',        // 5, 10, 15, 30
    difficultyCurve: 'DifficultyCurve',
    difficultyLevel: 'string',   // 'gentle', 'moderate', 'intense'
    pauseMultiplier: 'number',
    selectedPattern: 'string'    // Which block pattern was chosen
  },
  
  // Progress
  status: 'MatchStatus',
  currentBlockIndex: 'number',
  blocksCompleted: 'number',
  timeElapsed: 'number',
  
  // History
  blockHistory: 'array<Block>',
  patternSequence: 'array<BlockType>' // The predetermined pattern
};

// ============================================
// SELECTION CONTEXT
// ============================================

/**
 * Context passed to selection systems
 */
export const SelectionContextType = {
  // Match info
  currentRound: 'number',
  totalRounds: 'number',
  timeElapsed: 'number',
  
  // Players
  activePlayerList: 'array<Player>',
  teamRoster: 'object<string, array<string>>', // teamId -> playerIds
  
  // History
  recentPlays: 'array<string>',     // Last 5 play identifiers
  recentSelections: 'object',       // playerId -> last selection info
  
  // Current state
  targetDifficulty: 'number',
  currentPattern: 'string',
  nextBlockType: 'BlockType'
};

// ============================================
// PATTERN TYPES
// ============================================

/**
 * Block sequencing pattern
 */
export const PatternType = {
  id: 'string',
  name: 'string',
  roundCount: 'number',
  sequence: 'array<BlockType>',
  description: 'string',
  estimatedDuration: 'number'
};

// ============================================
// WEIGHT MODIFICATION
// ============================================

/**
 * Weight adjustment for variety
 */
export const WeightModificationType = {
  baseWeight: 'number',
  modifiers: [
    {
      type: 'string',     // 'recency', 'playerCount', etc.
      factor: 'number',   // Multiplication factor
      reason: 'string'    // Why this modification
    }
  ],
  finalWeight: 'number'
};

// ============================================
// SCRIPT TOKENS
// ============================================

/**
 * Available tokens for script templates
 */
export const ScriptTokens = {
  // Players
  '{player1}': 'Selected player 1 name',
  '{player2}': 'Selected player 2 name',
  '{team1}': 'Team 1 name',
  '{team2}': 'Team 2 name',
  '{everyone}': 'All players',
  '{teams}': 'Both team names',
  
  // Game state
  '{roundNumber}': 'Current round number',
  '{roundType}': 'Type of round',
  '{variant}': 'Current variant',
  '{duration}': 'Round duration',
  
  // Pauses
  '[micro]': '500ms pause',
  '[small]': '1000ms pause',
  '[medium]': '2000ms pause',
  '[large]': '3000ms pause',
  '[xlarge]': '4000ms pause'
};

// ============================================
// VALIDATION HELPERS
// ============================================

/**
 * Check if a value is a valid enum value
 */
export function isValidEnumValue(enumObj, value) {
  return Object.values(enumObj).includes(value);
}

/**
 * Create a new player object
 */
export function createPlayer(name, team) {
  return {
    id: generateId(),
    name,
    team,
    status: PlayerStatus.ACTIVE,
    joinedAt: Date.now(),
    stats: {
      timesSelected: 0,
      lastSelectedRound: 0,
      roundsSinceSelected: 0,
      recentPartners: [],
      recentActivities: []
    }
  };
}

/**
 * Create a play identifier for history tracking
 */
export function getPlayIdentifier(play) {
  const parts = [play.roundType, play.variant];
  if (play.subVariant && play.subVariant !== 'normal') {
    parts.push(play.subVariant);
  }
  if (play.modifier) {
    parts.push(play.modifier);
  }
  return parts.join('-');
}

/**
 * Simple ID generator
 */
function generateId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}