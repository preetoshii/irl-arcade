/**
 * Match state management for Simon Says
 * 
 * The MatchState is like the game's memory and consciousness rolled into one. It knows everything about the current match - how long it's been running, which round we're on, what pattern of blocks we're following, and what has happened so far. Think of it as the stage manager for a theater production, keeping track of which scene we're in, what props have been used, and what comes next. Every other system can ask MatchState questions like "what round is this?" or "how long since the last break?" and get authoritative answers.
 * 
 * What makes MatchState special is its careful adherence to what Simon can actually know. While it tracks that a "Tag Duel between Alice and Bob" happened in round 3, it doesn't know who won - that's information Simon can never receive. It operates like a meticulous narrator who can only describe what was announced, not what actually occurred. This constraint shapes the entire design, creating a state system that tracks intentions and announcements rather than outcomes and scores.
 */

import { MatchStatus, BlockType } from './types';
import { STATE_CONFIG } from './constants';

// ============================================
// MATCH STATE DEFINITION
// ============================================

class MatchState {
  constructor() {
    this.reset();
  }

  /**
   * Reset to initial state
   */
  reset() {
    this.match = {
      // Identity
      id: null,
      startTime: null,
      
      // Configuration (set at match start)
      config: {
        roundCount: 10,
        difficultyCurve: 'gentle',
        difficultyLevel: 'moderate',
        pauseMultiplier: 1.0,
        selectedPattern: null
      },
      
      // Progress
      status: MatchStatus.SETUP,
      currentBlockIndex: -1,
      blocksCompleted: 0,
      timeElapsed: 0,
      lastUpdateTime: null,
      
      // Pattern & History
      patternSequence: [],     // The predetermined pattern
      blockHistory: [],        // Completed blocks
      
      // Current block
      currentBlock: null
    };
    
    // Track state changes
    this.listeners = [];
    this.lastCheckpoint = null;
  }

  // ============================================
  // MATCH LIFECYCLE
  // ============================================

  /**
   * Initialize a new match
   * 
   * Starting a new match is like setting up a new game board. This method takes the player's preferences (how many rounds, what difficulty) and creates a fresh match state. It generates a unique ID using the current date and time, which helps identify this specific match if we need to recover from a crash or analyze logs later. The configuration passed in becomes the unchangeable rules for this match - once set, the number of rounds and difficulty curve remain constant, ensuring a consistent experience from start to finish.
   */
  initializeMatch(config) {
    const matchId = this.generateMatchId();
    
    this.match = {
      id: matchId,
      startTime: Date.now(),
      config: { ...this.match.config, ...config },
      status: MatchStatus.SETUP,
      currentBlockIndex: -1,
      blocksCompleted: 0,
      timeElapsed: 0,
      lastUpdateTime: Date.now(),
      patternSequence: [],
      blockHistory: [],
      currentBlock: null
    };
    
    this.notifyListeners('match_initialized', this.match);
    return matchId;
  }

  /**
   * Set the block pattern for the match
   */
  setPattern(pattern) {
    if (this.match.status !== MatchStatus.SETUP) {
      throw new Error('Cannot set pattern after match has started');
    }
    
    this.match.patternSequence = pattern.sequence;
    this.match.config.selectedPattern = pattern.id;
    
    this.notifyListeners('pattern_set', pattern);
  }

  /**
   * Start the match
   */
  startMatch() {
    if (this.match.status !== MatchStatus.SETUP) {
      throw new Error('Match already started');
    }
    
    if (!this.match.patternSequence.length) {
      throw new Error('No pattern set');
    }
    
    this.match.status = MatchStatus.IN_PROGRESS;
    this.match.startTime = Date.now();
    this.match.lastUpdateTime = Date.now();
    
    this.notifyListeners('match_started', this.match);
  }

  /**
   * Complete the match
   */
  completeMatch() {
    this.match.status = MatchStatus.COMPLETED;
    this.updateElapsedTime();
    
    this.notifyListeners('match_completed', this.match);
  }

  /**
   * Abandon the match
   */
  abandonMatch(reason) {
    this.match.status = MatchStatus.ABANDONED;
    this.updateElapsedTime();
    
    this.notifyListeners('match_abandoned', { match: this.match, reason });
  }

  // ============================================
  // BLOCK MANAGEMENT
  // ============================================

  /**
   * Get the next block type from the pattern
   */
  getNextBlockType() {
    const nextIndex = this.match.currentBlockIndex + 1;
    if (nextIndex >= this.match.patternSequence.length) {
      return null; // Pattern complete
    }
    return this.match.patternSequence[nextIndex];
  }

  /**
   * Start a new block
   */
  startBlock(blockType, play = null) {
    this.updateElapsedTime();
    
    const block = {
      type: blockType,
      index: this.match.currentBlockIndex + 1,
      startTime: Date.now(),
      duration: null,
      plannedDuration: play?.duration || null,
      
      // Type-specific data
      play: blockType === BlockType.ROUND ? play : null,
      ceremonyType: blockType === BlockType.CEREMONY ? play?.ceremonyType : null,
      relaxActivity: blockType === BlockType.RELAX ? play?.activity : null
    };
    
    this.match.currentBlock = block;
    this.match.currentBlockIndex++;
    
    this.notifyListeners('block_started', block);
    return block;
  }

  /**
   * Complete the current block
   */
  completeBlock() {
    if (!this.match.currentBlock) {
      throw new Error('No active block to complete');
    }
    
    // Calculate actual duration
    this.match.currentBlock.duration = Date.now() - this.match.currentBlock.startTime;
    
    // Add to history
    this.match.blockHistory.push(this.match.currentBlock);
    this.match.blocksCompleted++;
    
    const completedBlock = this.match.currentBlock;
    this.match.currentBlock = null;
    
    this.updateElapsedTime();
    this.notifyListeners('block_completed', completedBlock);
    
    // Check if match is complete
    if (this.match.currentBlockIndex >= this.match.patternSequence.length - 1) {
      this.completeMatch();
    }
    
    return completedBlock;
  }

  // ============================================
  // STATE QUERIES
  // ============================================

  /**
   * Get current match status
   */
  getStatus() {
    return this.match.status;
  }

  /**
   * Get current round number (counting only round blocks)
   * 
   * This seemingly simple method solves an important problem: when Simon announces "Round 5!", players expect that to mean the 5th gameplay round, not the 5th block including ceremonies and breaks. This method counts only the actual ROUND blocks, skipping over ceremony and relax blocks. So even if we're technically on the 8th block of the pattern (after an opening ceremony, 3 rounds, a relax block, and 2 more rounds), this returns 5 - the number players actually care about.
   */
  getCurrentRoundNumber() {
    return this.match.blockHistory.filter(b => b.type === BlockType.ROUND).length + 
           (this.match.currentBlock?.type === BlockType.ROUND ? 1 : 0);
  }

  /**
   * Get total rounds in the match
   */
  getTotalRounds() {
    return this.match.config.roundCount;
  }

  /**
   * Get recent block history
   */
  getRecentBlocks(count = 5) {
    return this.match.blockHistory.slice(-count);
  }

  /**
   * Get blocks by type
   */
  getBlocksByType(type) {
    return this.match.blockHistory.filter(b => b.type === type);
  }

  /**
   * Get time since last block of type
   */
  getTimeSinceLastBlock(type) {
    const blocks = this.getBlocksByType(type);
    if (blocks.length === 0) return Infinity;
    
    const lastBlock = blocks[blocks.length - 1];
    return Date.now() - (lastBlock.startTime + lastBlock.duration);
  }

  /**
   * Get match progress percentage
   */
  getProgress() {
    return (this.match.blocksCompleted / this.match.patternSequence.length) * 100;
  }

  // ============================================
  // DIFFICULTY TRACKING
  // ============================================

  /**
   * Get current difficulty target based on progression
   * 
   * Difficulty progression is one of the subtle ways Simon Says creates a satisfying arc. This method looks at how far through the match we are and returns the target difficulty for the current round. If the player chose a 'gentle' curve, early rounds might target difficulty 1-2, slowly building to 4-5 by the end. A 'roller coaster' curve might jump between easy and hard, keeping players on their toes. The beauty is that this is just a target - the actual selection system will try to find activities near this difficulty, creating a natural flow from warm-up to challenge to triumphant finale.
   */
  getCurrentDifficultyTarget() {
    const roundNumber = this.getCurrentRoundNumber();
    const curve = this.match.config.difficultyCurve;
    const curveData = this.getDifficultyCurve(curve);
    
    // Get difficulty for current round (1-indexed)
    const index = Math.min(roundNumber - 1, curveData.length - 1);
    return curveData[Math.max(0, index)];
  }

  /**
   * Get difficulty curve array
   */
  getDifficultyCurve(curveName) {
    // Import from constants
    const curves = {
      gentle: [1, 1, 2, 2, 3, 3, 3, 4, 4, 5],
      steady: [2, 3, 3, 3, 3, 3, 3, 3, 4, 4],
      roller_coaster: [1, 3, 2, 4, 2, 5, 3, 4, 3, 5]
    };
    
    const curve = curves[curveName] || curves.gentle;
    
    // Extend curve if needed for longer matches
    const totalRounds = this.match.config.roundCount;
    if (totalRounds > curve.length) {
      const lastValue = curve[curve.length - 1];
      return [...curve, ...Array(totalRounds - curve.length).fill(lastValue)];
    }
    
    return curve.slice(0, totalRounds);
  }

  // ============================================
  // STATE PERSISTENCE
  // ============================================

  /**
   * Create a checkpoint of current state
   * 
   * Checkpoints are the game's insurance policy against the unexpected. Every 60 seconds, this method creates a complete snapshot of the match state - like a save game file. If someone's phone dies, the app crashes, or any other catastrophe strikes, we can restore from the last checkpoint and continue almost seamlessly. The checkpoint includes everything needed to reconstruct the exact game state: what pattern we're following, which block we're on, how much time has elapsed, and the complete history of what's been played so far. It's a safety net that players never see but would definitely miss if it wasn't there.
   */
  createCheckpoint() {
    const checkpoint = {
      timestamp: Date.now(),
      match: JSON.parse(JSON.stringify(this.match)), // Deep clone
      version: STATE_CONFIG.STATE_VERSION
    };
    
    this.lastCheckpoint = checkpoint;
    return checkpoint;
  }

  /**
   * Restore from checkpoint
   */
  restoreFromCheckpoint(checkpoint) {
    if (checkpoint.version !== STATE_CONFIG.STATE_VERSION) {
      console.warn('Checkpoint version mismatch');
      // Would need migration logic here
    }
    
    this.match = checkpoint.match;
    this.match.lastUpdateTime = Date.now();
    
    this.notifyListeners('state_restored', checkpoint);
  }

  // ============================================
  // UTILITIES
  // ============================================

  /**
   * Update elapsed time
   */
  updateElapsedTime() {
    if (this.match.status === MatchStatus.IN_PROGRESS && this.match.lastUpdateTime) {
      const now = Date.now();
      this.match.timeElapsed += (now - this.match.lastUpdateTime) / 1000;
      this.match.lastUpdateTime = now;
    }
  }

  /**
   * Generate match ID
   */
  generateMatchId() {
    const date = new Date();
    const dateStr = date.toISOString().split('T')[0];
    const timeStr = date.toTimeString().split(' ')[0].replace(/:/g, '');
    return `match_${dateStr}_${timeStr}`;
  }

  // ============================================
  // EVENT SYSTEM
  // ============================================

  /**
   * Subscribe to state changes
   */
  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /**
   * Notify all listeners of a change
   */
  notifyListeners(event, data) {
    this.listeners.forEach(listener => {
      try {
        listener(event, data);
      } catch (error) {
        console.error('Error in state listener:', error);
      }
    });
  }

  /**
   * Get full match state (for debugging)
   */
  getState() {
    return { ...this.match };
  }
}

// Create singleton instance
const matchState = new MatchState();

// Export both the instance and the class
export default matchState;
export { MatchState };