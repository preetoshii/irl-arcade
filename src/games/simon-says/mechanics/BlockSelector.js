/**
 * Block Selector for Simon Says
 * Determines the next block type based on the pattern
 */

import { eventBus, Events, stateStore, StateKeys } from '../systems';
import { matchState } from '../state';
import { BlockType } from '../state/types';

// ============================================
// BLOCK SELECTOR CLASS
// ============================================

class BlockSelector {
  constructor() {
    this.pattern = null;
    this.currentIndex = -1;
  }

  /**
   * Initialize with a pattern
   * @param {Object} pattern - The selected pattern
   */
  initialize(pattern) {
    if (!pattern || !pattern.sequence) {
      throw new Error('Invalid pattern provided to BlockSelector');
    }
    
    this.pattern = pattern;
    this.currentIndex = -1;
    
    // Store pattern in state
    stateStore.set(StateKeys.PATTERN_SEQUENCE, pattern.sequence);
    stateStore.set(StateKeys.PATTERN_INDEX, this.currentIndex);
    
    console.log('[BlockSelector] Initialized with pattern:', pattern.id);
    console.log('[BlockSelector] Pattern sequence:', pattern.sequence.join(' → '));
  }

  /**
   * Get the next block type in the sequence
   * @returns {Object} Next block information
   */
  getNextBlock() {
    if (!this.pattern) {
      throw new Error('BlockSelector not initialized with pattern');
    }
    
    const nextIndex = this.currentIndex + 1;
    
    // Check if we've reached the end
    if (nextIndex >= this.pattern.sequence.length) {
      eventBus.emit(Events.PATTERN_COMPLETE, {
        pattern: this.pattern,
        blocksCompleted: nextIndex
      });
      return null;
    }
    
    const blockType = this.pattern.sequence[nextIndex];
    
    // Prepare block information
    const blockInfo = {
      type: blockType,
      index: nextIndex,
      isFirst: nextIndex === 0,
      isLast: nextIndex === this.pattern.sequence.length - 1,
      sequencePosition: `${nextIndex + 1} of ${this.pattern.sequence.length}`,
      
      // Additional context
      context: this.getBlockContext(blockType, nextIndex)
    };
    
    // Don't update index yet - wait for confirmation
    return blockInfo;
  }

  /**
   * Confirm that a block has been selected and started
   * @param {string} blockType - The block type that was started
   */
  confirmBlockStart(blockType) {
    const nextIndex = this.currentIndex + 1;
    
    // Verify this matches what we expected
    if (this.pattern.sequence[nextIndex] !== blockType) {
      console.error('[BlockSelector] Block mismatch:', {
        expected: this.pattern.sequence[nextIndex],
        actual: blockType
      });
    }
    
    // Update index
    this.currentIndex = nextIndex;
    stateStore.set(StateKeys.PATTERN_INDEX, this.currentIndex);
    
    eventBus.emit(Events.BLOCK_SELECTION_COMPLETED, {
      blockType,
      index: this.currentIndex,
      pattern: this.pattern.id
    });
  }

  /**
   * Get context information for a block
   */
  getBlockContext(blockType, index) {
    const context = {
      blockType,
      patternPosition: index,
      patternLength: this.pattern.sequence.length
    };
    
    // Add block-specific context
    switch (blockType) {
      case BlockType.CEREMONY:
        context.ceremonyType = index === 0 ? 'opening' : 'closing';
        context.isOpening = index === 0;
        context.isClosing = index === this.pattern.sequence.length - 1;
        break;
        
      case BlockType.ROUND:
        context.roundNumber = this.getRoundNumber(index);
        context.totalRounds = this.getTotalRounds();
        context.isFirstRound = context.roundNumber === 1;
        context.isLastRound = context.roundNumber === context.totalRounds;
        context.roundsSinceRelax = this.getRoundsSinceRelax(index);
        break;
        
      case BlockType.RELAX:
        context.relaxNumber = this.getRelaxNumber(index);
        context.totalRelaxBlocks = this.getTotalRelaxBlocks();
        context.roundsBefore = this.getRoundsBeforeRelax(index);
        context.roundsAfter = this.getRoundsAfterRelax(index);
        break;
    }
    
    // Add timing context
    context.progress = (index + 1) / this.pattern.sequence.length;
    context.isEarlyMatch = context.progress < 0.33;
    context.isMidMatch = context.progress >= 0.33 && context.progress < 0.67;
    context.isLateMatch = context.progress >= 0.67;
    
    return context;
  }

  /**
   * Get the round number for a round block
   */
  getRoundNumber(index) {
    let roundCount = 0;
    for (let i = 0; i <= index; i++) {
      if (this.pattern.sequence[i] === BlockType.ROUND) {
        roundCount++;
      }
    }
    return roundCount;
  }

  /**
   * Get total number of rounds in the pattern
   */
  getTotalRounds() {
    return this.pattern.sequence.filter(block => block === BlockType.ROUND).length;
  }

  /**
   * Get the relax block number
   */
  getRelaxNumber(index) {
    let relaxCount = 0;
    for (let i = 0; i <= index; i++) {
      if (this.pattern.sequence[i] === BlockType.RELAX) {
        relaxCount++;
      }
    }
    return relaxCount;
  }

  /**
   * Get total number of relax blocks
   */
  getTotalRelaxBlocks() {
    return this.pattern.sequence.filter(block => block === BlockType.RELAX).length;
  }

  /**
   * Get rounds since last relax block
   */
  getRoundsSinceRelax(index) {
    let roundCount = 0;
    
    // Count backwards from current position
    for (let i = index - 1; i >= 0; i--) {
      if (this.pattern.sequence[i] === BlockType.RELAX) {
        break;
      }
      if (this.pattern.sequence[i] === BlockType.ROUND) {
        roundCount++;
      }
    }
    
    return roundCount;
  }

  /**
   * Get rounds before this relax block
   */
  getRoundsBeforeRelax(index) {
    let roundCount = 0;
    
    // Count backwards from relax position
    for (let i = index - 1; i >= 0; i--) {
      if (this.pattern.sequence[i] === BlockType.RELAX) {
        break;
      }
      if (this.pattern.sequence[i] === BlockType.ROUND) {
        roundCount++;
      }
    }
    
    return roundCount;
  }

  /**
   * Get rounds after this relax block
   */
  getRoundsAfterRelax(index) {
    let roundCount = 0;
    
    // Count forwards from relax position
    for (let i = index + 1; i < this.pattern.sequence.length; i++) {
      if (this.pattern.sequence[i] === BlockType.RELAX) {
        break;
      }
      if (this.pattern.sequence[i] === BlockType.ROUND) {
        roundCount++;
      }
    }
    
    return roundCount;
  }

  /**
   * Peek at upcoming blocks without advancing
   * @param {number} count - Number of blocks to peek ahead
   */
  peekUpcoming(count = 3) {
    const upcoming = [];
    const startIndex = this.currentIndex + 1;
    
    for (let i = 0; i < count && startIndex + i < this.pattern.sequence.length; i++) {
      const index = startIndex + i;
      const blockType = this.pattern.sequence[index];
      
      upcoming.push({
        type: blockType,
        index: index,
        context: this.getBlockContext(blockType, index)
      });
    }
    
    return upcoming;
  }

  /**
   * Get pattern progress information
   */
  getProgress() {
    return {
      currentIndex: this.currentIndex,
      totalBlocks: this.pattern.sequence.length,
      blocksCompleted: this.currentIndex + 1,
      blocksRemaining: this.pattern.sequence.length - this.currentIndex - 1,
      percentComplete: ((this.currentIndex + 1) / this.pattern.sequence.length) * 100,
      
      roundsCompleted: this.getRoundNumber(this.currentIndex),
      roundsRemaining: this.getTotalRounds() - this.getRoundNumber(this.currentIndex),
      
      currentBlock: this.currentIndex >= 0 ? this.pattern.sequence[this.currentIndex] : null,
      nextBlock: this.currentIndex < this.pattern.sequence.length - 1 
        ? this.pattern.sequence[this.currentIndex + 1] 
        : null
    };
  }

  /**
   * Skip to a specific position (for recovery)
   * @param {number} index - Pattern index to skip to
   */
  skipToIndex(index) {
    if (index < 0 || index >= this.pattern.sequence.length) {
      throw new Error(`Invalid index ${index} for pattern of length ${this.pattern.sequence.length}`);
    }
    
    this.currentIndex = index;
    stateStore.set(StateKeys.PATTERN_INDEX, this.currentIndex);
    
    console.log('[BlockSelector] Skipped to index:', index);
    
    return this.getBlockContext(this.pattern.sequence[index], index);
  }

  /**
   * Reset to beginning of pattern
   */
  reset() {
    this.currentIndex = -1;
    stateStore.set(StateKeys.PATTERN_INDEX, this.currentIndex);
  }

  /**
   * Get current pattern
   */
  getPattern() {
    return this.pattern;
  }

  /**
   * Get visualization of pattern progress
   */
  getPatternVisualization() {
    if (!this.pattern) return '';
    
    return this.pattern.sequence.map((block, index) => {
      const symbol = {
        [BlockType.CEREMONY]: index === 0 ? '🎭' : '🎬',
        [BlockType.ROUND]: '🎮',
        [BlockType.RELAX]: '😌'
      }[block] || '?';
      
      // Highlight current position
      if (index === this.currentIndex) {
        return `[${symbol}]`;
      } else if (index < this.currentIndex) {
        return `✓${symbol}`;
      } else {
        return symbol;
      }
    }).join(' ');
  }
}

// Create singleton instance
const blockSelector = new BlockSelector();

// Export both instance and class
export default blockSelector;
export { BlockSelector };