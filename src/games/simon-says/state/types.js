/**
 * Core type definitions for Simon Says
 * 
 * This file serves as the single source of truth for all data structures used throughout the Simon Says game. Think of it as the game's dictionary - whenever any part of the system needs to create or work with game data, it references these type definitions to ensure consistency. Every player, every game round, every tiny decision the game makes is structured according to these definitions.
 * 
 * The types defined here follow a hierarchical structure that mirrors the game itself. At the highest level, we have a Match, which contains Blocks (ceremonies, rounds, or relaxation periods), which contain Plays (the actual activities), which involve Players. This structure allows the game to maintain a clear understanding of what's happening at every moment, from the grand arc of an entire match down to the specific details of who's hopping on one foot while wearing a blindfold.
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
 * 
 * The Player type captures everything the game needs to know about each participant. Since Simon can only speak and never listen, we can't track actual performance or scores. Instead, we track what Simon CAN know: when players joined, which team they're on, and most importantly, when they were last selected for an activity. This selection tracking ensures fair rotation - if Alice hasn't been picked in 5 rounds while Bob has played 3 times, the system will boost Alice's chances of being selected next.
 * 
 * The stats object is particularly clever in its constraints. We track 'timesSelected' not 'timesPlayed' because Simon only knows who was chosen, not who actually participated. Similarly, 'recentPartners' helps prevent the same pairs from always competing - variety is the spice of life, after all.
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
 * 
 * A Play is the atomic unit of fun in Simon Says - it represents one complete activity from start to finish. The magic of the system is how it builds these plays through cascading selections. First it picks a round type (maybe 'duel'), then a variant (perhaps 'tag'), then a movement style ('crabWalk'), and possibly adds a modifier ('blindfold'). By the time all selections are made, you have a fully specified activity: 'Blindfolded Crab Walk Tag Duel between Alice and Bob'.
 * 
 * The scripts object contains all the text Simon will speak, pre-assembled with dramatic pauses and player names filled in. The performanceHints help the text-to-speech system adjust its delivery - speaking faster for high-difficulty rounds, building suspense for the final round, and so on. Every play is a miniature theatrical performance, complete with introduction, rules explanation, dramatic countdown, and celebratory outro.
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
export const Block = {
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
 * 
 * The SelectionContext is like a snapshot of everything the game knows at the moment it needs to choose the next activity. It's the information packet that gets passed through the selection pipeline, allowing each system to make informed decisions. When the PlaySelector needs to choose between tag and mirror match, it can check the recentPlays to ensure variety. When selecting players, it can see who's been waiting longest in the recentSelections data.
 * 
 * This context is rebuilt fresh for each selection, ensuring decisions are always based on the current state. It includes match progress (are we in the energetic beginning or the exhausting end?), player availability (who's still active?), and difficulty targets (should this be an easy warm-up or a challenging finale?). Every piece of information here shapes the final play selection, creating a dynamic experience that adapts to the game's flow while maintaining fairness and variety.
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