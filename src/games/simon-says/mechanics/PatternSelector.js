/**
 * Pattern Selector for Simon Says
 * Selects block sequencing patterns based on match configuration
 */

import { configLoader, eventBus, Events } from '../systems';
import { PATTERN_RULES } from '../state/constants';

// ============================================
// PATTERN SELECTOR CLASS
// ============================================

class PatternSelector {
  constructor() {
    this.availablePatterns = new Map(); // roundCount -> patterns array
    this.selectedPattern = null;
  }

  /**
   * Initialize with configuration
   */
  initialize() {
    // Load patterns from config
    const patterns = configLoader.get('blockSequencing.patterns', {});
    
    // Store patterns by round count
    Object.entries(patterns).forEach(([roundCount, patternList]) => {
      this.availablePatterns.set(parseInt(roundCount), patternList);
    });
    
    console.log('[PatternSelector] Initialized with patterns for round counts:', 
      Array.from(this.availablePatterns.keys()));
  }

  /**
   * Select a pattern for the match
   * @param {number} roundCount - Number of rounds in the match
   * @param {Object} preferences - Optional preferences for pattern selection
   * @returns {Object} Selected pattern
   */
  selectPattern(roundCount, preferences = {}) {
    // Get patterns for this round count
    let patterns = this.availablePatterns.get(roundCount);
    
    if (!patterns || patterns.length === 0) {
      // Fallback to nearest available pattern
      patterns = this.findNearestPatterns(roundCount);
      
      if (!patterns) {
        throw new Error(`No patterns available for ${roundCount} rounds`);
      }
    }
    
    // Filter patterns based on preferences
    let eligiblePatterns = this.filterPatterns(patterns, preferences);
    
    // If no patterns match preferences, use all patterns
    if (eligiblePatterns.length === 0) {
      console.warn('[PatternSelector] No patterns match preferences, using all patterns');
      eligiblePatterns = patterns;
    }
    
    // Select pattern
    let selected;
    if (preferences.patternId) {
      // Specific pattern requested
      selected = eligiblePatterns.find(p => p.id === preferences.patternId);
      if (!selected) {
        console.warn(`[PatternSelector] Requested pattern ${preferences.patternId} not found`);
        selected = this.randomSelect(eligiblePatterns);
      }
    } else {
      // Random selection with optional weighting
      selected = this.weightedSelect(eligiblePatterns, preferences);
    }
    
    // Validate selected pattern
    this.validatePattern(selected);
    
    // Store selection
    this.selectedPattern = {
      ...selected,
      roundCount,
      selectedAt: Date.now()
    };
    
    // Emit event
    eventBus.emit(Events.PATTERN_SELECTED, this.selectedPattern);
    
    return this.selectedPattern;
  }

  /**
   * Find patterns for the nearest round count
   */
  findNearestPatterns(targetRounds) {
    const availableCounts = Array.from(this.availablePatterns.keys()).sort((a, b) => a - b);
    
    // Find closest count
    let closest = availableCounts[0];
    let minDiff = Math.abs(targetRounds - closest);
    
    for (const count of availableCounts) {
      const diff = Math.abs(targetRounds - count);
      if (diff < minDiff) {
        minDiff = diff;
        closest = count;
      }
    }
    
    console.log(`[PatternSelector] Using patterns for ${closest} rounds (requested ${targetRounds})`);
    
    // Get patterns and adjust if needed
    const patterns = this.availablePatterns.get(closest);
    
    if (closest !== targetRounds) {
      // Adjust patterns to match target round count
      return patterns.map(pattern => this.adjustPatternLength(pattern, targetRounds));
    }
    
    return patterns;
  }

  /**
   * Adjust pattern length to match target rounds
   */
  adjustPatternLength(pattern, targetRounds) {
    const sequence = [...pattern.sequence];
    
    // Count current rounds
    const currentRounds = sequence.filter(block => block === 'round').length;
    
    if (currentRounds === targetRounds) {
      return pattern; // No adjustment needed
    }
    
    if (currentRounds < targetRounds) {
      // Need to add rounds
      const roundsToAdd = targetRounds - currentRounds;
      
      // Find good insertion points (after existing rounds, before closing)
      const closingIndex = sequence.lastIndexOf('closing');
      const insertionPoint = closingIndex - 1;
      
      // Insert additional rounds
      for (let i = 0; i < roundsToAdd; i++) {
        sequence.splice(insertionPoint, 0, 'round');
      }
      
    } else {
      // Need to remove rounds
      const roundsToRemove = currentRounds - targetRounds;
      let removed = 0;
      
      // Remove rounds from the end (before closing)
      for (let i = sequence.length - 2; i >= 0 && removed < roundsToRemove; i--) {
        if (sequence[i] === 'round') {
          sequence.splice(i, 1);
          removed++;
        }
      }
    }
    
    return {
      ...pattern,
      id: `${pattern.id}_adjusted`,
      sequence,
      adjusted: true,
      originalRounds: currentRounds
    };
  }

  /**
   * Filter patterns based on preferences
   */
  filterPatterns(patterns, preferences) {
    return patterns.filter(pattern => {
      // Check difficulty preference
      if (preferences.difficulty) {
        const relaxCount = pattern.sequence.filter(b => b === 'relax').length;
        const roundCount = pattern.sequence.filter(b => b === 'round').length;
        const relaxRatio = relaxCount / roundCount;
        
        // Gentle = more breaks, Intense = fewer breaks
        if (preferences.difficulty === 'gentle' && relaxRatio < 0.2) {
          return false;
        }
        if (preferences.difficulty === 'intense' && relaxRatio > 0.3) {
          return false;
        }
      }
      
      // Check pacing preference
      if (preferences.pacing === 'consistent') {
        // Prefer patterns with regular break intervals
        if (!this.hasConsistentPacing(pattern)) {
          return false;
        }
      }
      
      return true;
    });
  }

  /**
   * Check if pattern has consistent pacing
   */
  hasConsistentPacing(pattern) {
    const sequence = pattern.sequence;
    const roundPositions = [];
    
    // Find all round positions
    sequence.forEach((block, index) => {
      if (block === 'round') {
        roundPositions.push(index);
      }
    });
    
    // Check intervals between rounds
    const intervals = [];
    for (let i = 1; i < roundPositions.length; i++) {
      intervals.push(roundPositions[i] - roundPositions[i - 1]);
    }
    
    // Calculate variance
    if (intervals.length === 0) return true;
    
    const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const variance = intervals.reduce((sum, interval) => {
      return sum + Math.pow(interval - avg, 2);
    }, 0) / intervals.length;
    
    // Low variance = consistent pacing
    return variance < 2.0;
  }

  /**
   * Weighted selection of patterns
   */
  weightedSelect(patterns, preferences) {
    // For now, just random selection
    // Could add weights based on pattern characteristics
    return this.randomSelect(patterns);
  }

  /**
   * Random pattern selection
   */
  randomSelect(patterns) {
    const index = Math.floor(Math.random() * patterns.length);
    return patterns[index];
  }

  /**
   * Validate pattern structure
   */
  validatePattern(pattern) {
    const errors = [];
    const sequence = pattern.sequence;
    
    // Check required rules
    if (!PATTERN_RULES.ALWAYS_START_WITH_OPENING || sequence[0] !== 'opening') {
      errors.push('Pattern must start with opening ceremony');
    }
    
    if (!PATTERN_RULES.ALWAYS_END_WITH_CLOSING || sequence[sequence.length - 1] !== 'closing') {
      errors.push('Pattern must end with closing ceremony');
    }
    
    if (PATTERN_RULES.NEVER_END_ON_RELAX && sequence[sequence.length - 2] === 'relax') {
      errors.push('Pattern cannot end with relax block before closing');
    }
    
    // Check consecutive rounds
    let consecutiveRounds = 0;
    for (const block of sequence) {
      if (block === 'round') {
        consecutiveRounds++;
        if (consecutiveRounds > PATTERN_RULES.MAX_CONSECUTIVE_ROUNDS) {
          errors.push(`Too many consecutive rounds (max ${PATTERN_RULES.MAX_CONSECUTIVE_ROUNDS})`);
          break;
        }
      } else {
        consecutiveRounds = 0;
      }
    }
    
    if (errors.length > 0) {
      console.error('[PatternSelector] Pattern validation errors:', errors);
      // Don't throw - just warn and continue
    }
    
    return errors.length === 0;
  }

  /**
   * Get pattern statistics
   */
  getPatternStats(pattern) {
    const sequence = pattern.sequence;
    const stats = {
      totalBlocks: sequence.length,
      rounds: 0,
      relaxBlocks: 0,
      ceremonies: 0,
      maxConsecutiveRounds: 0,
      averageRoundsBetweenRelax: 0
    };
    
    let currentConsecutive = 0;
    let roundsSinceRelax = 0;
    let relaxIntervals = [];
    
    sequence.forEach(block => {
      if (block === 'round') {
        stats.rounds++;
        currentConsecutive++;
        roundsSinceRelax++;
        stats.maxConsecutiveRounds = Math.max(stats.maxConsecutiveRounds, currentConsecutive);
      } else {
        currentConsecutive = 0;
        
        if (block === 'relax') {
          stats.relaxBlocks++;
          if (roundsSinceRelax > 0) {
            relaxIntervals.push(roundsSinceRelax);
            roundsSinceRelax = 0;
          }
        } else if (block === 'opening' || block === 'closing') {
          stats.ceremonies++;
        }
      }
    });
    
    // Calculate average rounds between relax
    if (relaxIntervals.length > 0) {
      stats.averageRoundsBetweenRelax = 
        relaxIntervals.reduce((a, b) => a + b, 0) / relaxIntervals.length;
    }
    
    return stats;
  }

  /**
   * Get the currently selected pattern
   */
  getSelectedPattern() {
    return this.selectedPattern;
  }

  /**
   * Get all available patterns for a round count
   */
  getAvailablePatterns(roundCount) {
    return this.availablePatterns.get(roundCount) || [];
  }

  /**
   * Clear selection
   */
  clearSelection() {
    this.selectedPattern = null;
  }
}

// Create singleton instance
const patternSelector = new PatternSelector();

// Export both instance and class
export default patternSelector;
export { PatternSelector };