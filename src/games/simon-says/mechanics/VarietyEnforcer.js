/**
 * Variety Enforcer for Simon Says
 * Ensures diverse gameplay by adjusting selection weights
 */

import { stateStore, StateKeys } from '../systems';
import { getRecencyPenalty, HISTORY_LIMITS } from '../state/constants';

// ============================================
// VARIETY ENFORCER CLASS
// ============================================

class VarietyEnforcer {
  constructor() {
    this.historyTracker = new Map(); // itemId -> usage history
    this.patternDetector = new PatternDetector();
  }

  /**
   * Adjust weight based on variety rules
   * @param {string} itemId - Identifier for the item being selected
   * @param {number} baseWeight - Original weight
   * @param {Object} context - Selection context
   * @returns {number} Adjusted weight
   */
  adjustWeight(itemId, baseWeight, context) {
    let adjustedWeight = baseWeight;
    
    // Apply recency penalty
    const recencyFactor = this.getRecencyFactor(itemId);
    adjustedWeight *= recencyFactor;
    
    // Apply pattern breaking
    const patternFactor = this.getPatternFactor(itemId, context);
    adjustedWeight *= patternFactor;
    
    // Apply diversity bonus
    const diversityFactor = this.getDiversityFactor(itemId, context);
    adjustedWeight *= diversityFactor;
    
    // Ensure minimum weight
    adjustedWeight = Math.max(0.1, adjustedWeight);
    
    // Log significant adjustments
    if (Math.abs(adjustedWeight - baseWeight) > baseWeight * 0.5) {
      console.log(`[VarietyEnforcer] ${itemId}: ${baseWeight} → ${adjustedWeight.toFixed(1)}`);
    }
    
    return adjustedWeight;
  }

  /**
   * Get recency factor based on how recently item was used
   */
  getRecencyFactor(itemId) {
    const history = this.historyTracker.get(itemId);
    if (!history || history.length === 0) {
      return 1.0; // Never used
    }
    
    const lastUsed = history[0];
    const roundsSince = this.getRoundsSinceTimestamp(lastUsed.timestamp);
    
    return getRecencyPenalty(roundsSince);
  }

  /**
   * Get pattern breaking factor
   */
  getPatternFactor(itemId, context) {
    // Check if selecting this would create a pattern
    const wouldCreatePattern = this.patternDetector.wouldCreatePattern(itemId, context);
    
    if (wouldCreatePattern) {
      // Reduce weight to break pattern
      return 0.3;
    }
    
    // Check if this would break an existing pattern
    const wouldBreakPattern = this.patternDetector.wouldBreakPattern(itemId, context);
    
    if (wouldBreakPattern) {
      // Increase weight to encourage pattern breaking
      return 1.5;
    }
    
    return 1.0;
  }

  /**
   * Get diversity factor to encourage variety
   */
  getDiversityFactor(itemId, context) {
    // Check how much this item has been used compared to others
    const usageStats = this.getUsageStatistics();
    const itemUsage = usageStats.get(itemId) || 0;
    const averageUsage = this.calculateAverageUsage(usageStats);
    
    if (itemUsage === 0) {
      // Never used - strong bonus
      return 2.0;
    }
    
    if (itemUsage < averageUsage * 0.5) {
      // Under-used - moderate bonus
      return 1.5;
    }
    
    if (itemUsage > averageUsage * 1.5) {
      // Over-used - penalty
      return 0.7;
    }
    
    return 1.0;
  }

  /**
   * Record that an item was selected
   */
  recordSelection(itemId, context = {}) {
    // Get or create history
    if (!this.historyTracker.has(itemId)) {
      this.historyTracker.set(itemId, []);
    }
    
    const history = this.historyTracker.get(itemId);
    
    // Add to history
    history.unshift({
      timestamp: Date.now(),
      round: context.currentRound || 0,
      context: context
    });
    
    // Trim history
    if (history.length > HISTORY_LIMITS.RECENT_PLAYS) {
      history.splice(HISTORY_LIMITS.RECENT_PLAYS);
    }
    
    // Update pattern detector
    this.patternDetector.recordSelection(itemId);
  }

  /**
   * Get rounds since a timestamp
   */
  getRoundsSinceTimestamp(timestamp) {
    // This is simplified - in real implementation would track actual rounds
    const timeSince = Date.now() - timestamp;
    const estimatedRoundDuration = 3 * 60 * 1000; // 3 minutes per round estimate
    return Math.floor(timeSince / estimatedRoundDuration);
  }

  /**
   * Get usage statistics
   */
  getUsageStatistics() {
    const stats = new Map();
    
    this.historyTracker.forEach((history, itemId) => {
      stats.set(itemId, history.length);
    });
    
    return stats;
  }

  /**
   * Calculate average usage
   */
  calculateAverageUsage(usageStats) {
    if (usageStats.size === 0) return 0;
    
    let total = 0;
    usageStats.forEach(count => {
      total += count;
    });
    
    return total / usageStats.size;
  }

  /**
   * Get variety score (0-1, higher is more varied)
   */
  getVarietyScore() {
    const usageStats = this.getUsageStatistics();
    if (usageStats.size === 0) return 1.0;
    
    // Calculate standard deviation
    const values = Array.from(usageStats.values());
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    
    // Normalize (0 = no variety, 1 = high variety)
    const maxStdDev = mean; // Maximum possible standard deviation
    const varietyScore = 1 - (stdDev / maxStdDev);
    
    return Math.max(0, Math.min(1, varietyScore));
  }

  /**
   * Clear history
   */
  clearHistory() {
    this.historyTracker.clear();
    this.patternDetector.clear();
  }

  /**
   * Export state
   */
  export() {
    return {
      history: Array.from(this.historyTracker.entries()),
      patterns: this.patternDetector.export()
    };
  }

  /**
   * Import state
   */
  import(data) {
    if (data.history) {
      this.historyTracker = new Map(data.history);
    }
    
    if (data.patterns) {
      this.patternDetector.import(data.patterns);
    }
  }
}

// ============================================
// PATTERN DETECTOR
// ============================================

class PatternDetector {
  constructor() {
    this.recentSequence = []; // Recent item selections
    this.maxSequenceLength = 10;
    this.patterns = new Map(); // pattern -> count
  }

  /**
   * Check if selecting an item would create a pattern
   */
  wouldCreatePattern(itemId, context) {
    if (this.recentSequence.length < 2) return false;
    
    // Check for simple alternating pattern (A-B-A-B)
    if (this.recentSequence.length >= 3) {
      const last3 = this.recentSequence.slice(-3);
      if (last3[0] === itemId && last3[1] === last3[2] && last3[1] !== itemId) {
        return true; // Would create A-B-A-B pattern
      }
    }
    
    // Check for repeating pattern (A-A-A)
    const last2 = this.recentSequence.slice(-2);
    if (last2[0] === itemId && last2[1] === itemId) {
      return true; // Would create third repeat
    }
    
    // Check for cyclic pattern (A-B-C-A-B-C)
    if (this.recentSequence.length >= 5) {
      const possibleCycle = this.detectCycle(this.recentSequence, itemId);
      if (possibleCycle) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Check if selecting an item would break a pattern
   */
  wouldBreakPattern(itemId, context) {
    if (this.recentSequence.length < 3) return false;
    
    // Detect current pattern
    const currentPattern = this.detectCurrentPattern();
    if (!currentPattern) return false;
    
    // Check if this selection would break it
    const expectedNext = this.predictNextInPattern(currentPattern);
    return expectedNext && expectedNext !== itemId;
  }

  /**
   * Record a selection
   */
  recordSelection(itemId) {
    this.recentSequence.push(itemId);
    
    // Trim sequence
    if (this.recentSequence.length > this.maxSequenceLength) {
      this.recentSequence.shift();
    }
    
    // Update pattern tracking
    this.updatePatternTracking();
  }

  /**
   * Detect if sequence would create a cycle
   */
  detectCycle(sequence, nextItem) {
    // Try different cycle lengths
    for (let cycleLength = 2; cycleLength <= Math.floor(sequence.length / 2); cycleLength++) {
      const testSequence = [...sequence, nextItem];
      if (this.isCyclicPattern(testSequence, cycleLength)) {
        return cycleLength;
      }
    }
    
    return null;
  }

  /**
   * Check if sequence follows a cyclic pattern
   */
  isCyclicPattern(sequence, cycleLength) {
    if (sequence.length < cycleLength * 2) return false;
    
    for (let i = cycleLength; i < sequence.length; i++) {
      if (sequence[i] !== sequence[i % cycleLength]) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * Detect current pattern in sequence
   */
  detectCurrentPattern() {
    // Simple implementation - detect alternating or repeating
    if (this.recentSequence.length < 3) return null;
    
    const last3 = this.recentSequence.slice(-3);
    
    // Alternating pattern
    if (last3[0] === last3[2] && last3[0] !== last3[1]) {
      return { type: 'alternating', items: [last3[0], last3[1]] };
    }
    
    // Repeating pattern
    if (last3[0] === last3[1] && last3[1] === last3[2]) {
      return { type: 'repeating', item: last3[0] };
    }
    
    return null;
  }

  /**
   * Predict next item in pattern
   */
  predictNextInPattern(pattern) {
    if (!pattern) return null;
    
    if (pattern.type === 'alternating') {
      const lastItem = this.recentSequence[this.recentSequence.length - 1];
      return pattern.items.find(item => item !== lastItem);
    }
    
    if (pattern.type === 'repeating') {
      return pattern.item;
    }
    
    return null;
  }

  /**
   * Update pattern tracking
   */
  updatePatternTracking() {
    // Track 2-grams, 3-grams, etc.
    for (let n = 2; n <= 4 && n <= this.recentSequence.length; n++) {
      const ngram = this.recentSequence.slice(-n).join('-');
      this.patterns.set(ngram, (this.patterns.get(ngram) || 0) + 1);
    }
  }

  /**
   * Clear pattern history
   */
  clear() {
    this.recentSequence = [];
    this.patterns.clear();
  }

  /**
   * Export state
   */
  export() {
    return {
      sequence: [...this.recentSequence],
      patterns: Array.from(this.patterns.entries())
    };
  }

  /**
   * Import state
   */
  import(data) {
    if (data.sequence) {
      this.recentSequence = [...data.sequence];
    }
    
    if (data.patterns) {
      this.patterns = new Map(data.patterns);
    }
  }
}

// Create singleton instance
const varietyEnforcer = new VarietyEnforcer();

// Export both instance and class
export default varietyEnforcer;
export { VarietyEnforcer, PatternDetector };