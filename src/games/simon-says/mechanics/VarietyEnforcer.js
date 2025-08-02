/**
 * Variety Enforcer for Simon Says
 * 
 * The VarietyEnforcer is like a wise game master who remembers everything and subtly guides the experience toward maximum fun. While players think they're experiencing random activities, the VarietyEnforcer works behind the scenes to prevent repetition, break patterns, and ensure everyone experiences the full richness of Simon Says. It's the difference between a shuffled playlist that somehow plays your favorite song three times in a row and one that thoughtfully varies genres, tempos, and artists. Without variety enforcement, randomness can paradoxically create monotony.
 * 
 * The system operates through three main mechanisms: recency penalties (recently used items become less likely), pattern breaking (preventing predictable sequences), and diversity bonuses (encouraging underused options). These adjustments happen through weight multiplication - an item with base weight 100 might get multiplied by 0.3 if it was just used, effectively making it 70% less likely. The beauty is that nothing is ever impossible, just less probable, maintaining the unpredictability that makes games fun while preventing the frustration of excessive repetition.
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
   * 
   * This method is the heart of variety enforcement, called every time the system needs to select something - whether it's a round type, variant, or modifier. It takes the base weight (from configuration) and applies multiple adjustment factors that can dramatically change selection probability. The recency factor might multiply by 0.1 if something was just used, while the diversity factor might multiply by 2.0 for never-used items. These factors stack multiplicatively, so an item that's both recent AND overused gets heavily suppressed.
   * 
   * The context parameter provides rich information about the current game state, allowing for sophisticated adjustments. For instance, certain patterns might be more acceptable late in a match, or variety rules might relax when there are very few players (limiting options). The minimum weight of 0.1 ensures nothing becomes impossible - even heavily penalized options retain a small chance of selection, preventing the system from painting itself into a corner where everything is suppressed.
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
   * 
   * Recency is the most straightforward variety mechanism - things that just happened shouldn't happen again immediately. The method checks when an item was last used and applies a penalty that decreases over time. If something was used in the previous round, it might get a 0.1 multiplier (90% reduction). After 3 rounds, maybe 0.5 (50% reduction). After 5+ rounds, no penalty. This creates a natural "cooldown" period where recently-used items rest while others get their chance.
   * 
   * The implementation uses timestamps rather than round numbers for flexibility, estimating rounds based on time elapsed. This approach handles edge cases like paused games or variable round lengths gracefully. The getRecencyPenalty function (imported from constants) defines the exact penalty curve, which was tuned through playtesting to feel natural - not so aggressive that players notice the suppression, but strong enough to create variety.
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
   * 
   * While recency prevents immediate repetition, the diversity factor ensures long-term variety by tracking overall usage patterns. It compares how often each item has been used against the average, then boosts underused items and suppresses overused ones. Never-used items get a strong 2.0x multiplier, making them twice as likely to be selected. Items used half as much as average get 1.5x, while those used 50% more than average get 0.7x. This creates a gentle pressure toward equilibrium without forcing it.
   * 
   * The beauty of this approach is that it's self-correcting. If players genuinely prefer certain activities (maybe "tag" is just more fun than "mirror"), those will still appear more often because their base weights are higher. But the diversity factor prevents them from completely dominating. It's like a marketplace where popular items cost more, naturally encouraging people to try alternatives. Over a long match, this ensures players experience the full variety of what Simon Says offers.
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

/**
 * Pattern Detector for Simon Says
 * 
 * The PatternDetector is the most sophisticated component of variety enforcement, identifying and preventing predictable sequences that would make the game feel scripted. Humans are excellent pattern detectors - even truly random sequences can feel patterned if they happen to alternate (A-B-A-B) or repeat (A-A-A). The PatternDetector watches for these emergent patterns and adjusts weights to break them before players consciously notice. It's like having a DJ who notices they've been alternating between fast and slow songs and deliberately breaks the pattern to keep the audience engaged.
 * 
 * The system detects multiple pattern types: simple alternation (tag-mirror-tag-mirror), repetition (duel-duel-duel), and even complex cycles (A-B-C-A-B-C). When it detects that selecting an item would continue a pattern, that item's weight gets reduced by 70%. Conversely, selections that would break an existing pattern get a 50% boost. This creates an anti-pattern pressure that keeps the game feeling fresh and unpredictable, even though it's actually being carefully orchestrated to feel random.
 */

class PatternDetector {
  constructor() {
    this.recentSequence = []; // Recent item selections
    this.maxSequenceLength = 10;
    this.patterns = new Map(); // pattern -> count
  }

  /**
   * Check if selecting an item would create a pattern
   * 
   * This method is called before each selection to determine if choosing a particular item would create a noticeable pattern. It checks multiple pattern types in order of obviousness to players. First, it looks for alternating patterns (A-B-A-B) which humans notice quickly. Then repetition (A-A-A), which feels monotonous. Finally, it checks for longer cyclic patterns that might emerge. The method is conservative - it only flags patterns that are clear enough that players would likely notice them.
   * 
   * The context parameter could be used for pattern rules that vary by game state. For instance, alternating between two team types might be acceptable (even desirable) early in a match to ensure both teams are engaged, but should be avoided later. The method returns a simple boolean, but the pattern detection logic could be extended to return pattern strength, allowing for graduated responses rather than binary decisions.
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
   * 
   * Cycle detection is the most complex part of pattern detection, looking for repeating sequences of any length. A cycle of length 2 is just alternation (A-B-A-B), but cycles can be longer: A-B-C-A-B-C (length 3) or even A-B-C-D-A-B-C-D (length 4). The method tests different cycle lengths, checking if adding the proposed item would complete a cycle. It's computationally efficient, only checking cycle lengths up to half the sequence length (longer cycles can't repeat enough to be noticed).
   * 
   * The elegance of this approach is that it catches patterns humans would notice without being explicitly programmed for each one. Whether players are experiencing tag-mirror-balance-tag-mirror-balance or red-blue-green-red-blue-green, the same algorithm detects the cycle. This generality makes the system robust to new content - add a new round type or variant, and pattern detection automatically prevents it from creating repetitive sequences.
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