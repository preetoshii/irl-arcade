/**
 * Block Selector for Simon Says
 * 
 * The BlockSelector is like a GPS navigator for the match, always knowing exactly where we are and what comes next. Once a pattern is chosen (like "opening → round → round → relax → round → closing"), the BlockSelector's job is to follow that pattern faithfully, keeping track of our position and providing the next destination. It's a simple but crucial responsibility - imagine if Simon forgot whether we were on round 3 or 4, or accidentally did two opening ceremonies! This system prevents such chaos by maintaining a clear sense of position and progression.
 * 
 * What makes BlockSelector particularly clever is the context it provides with each block. It doesn't just say "next is a round block" - it provides rich information like "this is round 3 of 10, it's been 2 rounds since the last break, and we're in the middle third of the match." This context flows downstream to help other systems make intelligent decisions. The play selector might choose a gentler activity knowing it's been a while since a break, or ramp up difficulty knowing we're approaching the finale. It's like having a wise narrator who not only knows what chapter we're on but understands the story's arc.
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
   * 
   * This method is called repeatedly throughout a match, each time providing the blueprint for what happens next. It's like turning pages in a choose-your-own-adventure book, except the adventure was chosen at the start. The method returns rich block information including not just the type (round, relax, ceremony) but also contextual data about where this block fits in the overall match. When it reaches the end of the pattern, it emits a PATTERN_COMPLETE event, signaling that the match's predetermined structure has been fully executed - time for the closing ceremony and then celebration!
   * 
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
   * 
   * Context is everything in Simon Says. This method enriches a simple block type with layers of meaningful information that help downstream systems make smart decisions. For a round block, it calculates what round number this is (players care about "round 5", not "block 7"), how many rounds since the last break, and whether we're early, middle, or late in the match. For ceremony blocks, it determines if this is the opening or closing. This contextual awareness allows the game to adapt its personality - Simon might be more encouraging in early rounds, more intense in the middle, and celebratory near the end.
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
   * 
   * This method answers a crucial question for pacing: how hard have the players been working? By counting backwards from the current position to find the last relax block, it provides a fatigue indicator. If this returns 4 or 5, players have been going hard and the next round might need to be gentler. If it returns 1, they just had a break and can handle something intense. This information flows into play selection, helping create natural ebbs and flows in energy rather than relentless intensity that exhausts players.
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
   * 
   * This method provides a comprehensive progress report, like a fitness tracker for the match. It tells you not just where you are (block 7 of 15) but interprets that information in multiple ways: percentage complete, rounds finished versus rounds remaining, and what type of block is currently active. This information serves multiple purposes - the UI can show a progress bar, the difficulty system can ramp up as the match progresses, and the script system can add comments like "halfway there!" or "final round!" It transforms raw positional data into meaningful game context.
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
   * 
   * This delightful method creates a visual representation of the entire match pattern using emojis, making it easy to see the match structure at a glance. Ceremonies get theater masks, rounds get game controllers, and relax blocks get zen faces. The current position is highlighted with brackets, while completed blocks get checkmarks. It's particularly useful for debugging and monitoring - a developer or game master can instantly see where the match is and what's coming next. The visualization might look like: ✓🎭 ✓🎮 ✓🎮 [😌] 🎮 🎮 🎬, telling a complete story in a single line.
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