/**
 * Match Orchestrator for Simon Says
 * Coordinates all game mechanics and manages match flow
 */

import { 
  eventBus, 
  Events, 
  configLoader, 
  stateStore, 
  StateKeys,
  performanceSystem 
} from '../systems';

import { 
  matchState, 
  playerRegistry,
  MatchStatus,
  BlockType
} from '../state';

import patternSelector from './PatternSelector';
import blockSelector from './BlockSelector';
import playSelector from './PlaySelector';
import varietyEnforcer from './VarietyEnforcer';
import scriptAssembler from './ScriptAssembler';

// ============================================
// MATCH ORCHESTRATOR CLASS
// ============================================

class MatchOrchestrator {
  constructor() {
    this.initialized = false;
    this.currentMatch = null;
    this.systems = {};
    this.isRunning = false;
  }

  /**
   * Initialize the orchestrator and all systems
   */
  async initialize() {
    console.log('[MatchOrchestrator] Initializing...');
    
    try {
      // Initialize systems
      this.initializeSystems();
      
      // Wire up dependencies
      this.wireDependencies();
      
      // Subscribe to events
      this.subscribeToEvents();
      
      // Load configuration
      await this.loadConfiguration();
      
      this.initialized = true;
      eventBus.emit(Events.SYSTEM_READY, { system: 'orchestrator' });
      
      console.log('[MatchOrchestrator] Initialization complete');
      
    } catch (error) {
      console.error('[MatchOrchestrator] Initialization failed:', error);
      eventBus.emit(Events.SYSTEM_ERROR, { system: 'orchestrator', error });
      throw error;
    }
  }

  /**
   * Initialize all systems
   */
  initializeSystems() {
    // Pattern system
    patternSelector.initialize();
    
    // Selection system with variety enforcement
    playSelector.setVarietyEnforcer(varietyEnforcer);
    
    // Store references
    this.systems = {
      pattern: patternSelector,
      block: blockSelector,
      play: playSelector,
      variety: varietyEnforcer,
      script: scriptAssembler,
      performance: performanceSystem
    };
  }

  /**
   * Wire up system dependencies
   */
  wireDependencies() {
    // Play selector needs variety enforcer
    this.systems.play.setVarietyEnforcer(this.systems.variety);
  }

  /**
   * Subscribe to system events
   */
  subscribeToEvents() {
    // Match lifecycle events
    eventBus.on(Events.MATCH_COMPLETED, () => this.handleMatchComplete());
    eventBus.on(Events.MATCH_ABANDONED, () => this.handleMatchAbandoned());
    
    // Block events
    eventBus.on(Events.BLOCK_COMPLETED, () => this.processNextBlock());
    
    // Player events
    eventBus.on(Events.PLAYER_ADDED, (data) => this.handlePlayerAdded(data));
    eventBus.on(Events.PLAYER_REMOVED, (data) => this.handlePlayerRemoved(data));
    
    // Error handling
    eventBus.on(Events.SYSTEM_ERROR, (data) => this.handleSystemError(data));
  }

  /**
   * Load configuration
   */
  async loadConfiguration() {
    // This would load from saved config or defaults
    const playerConfig = {}; // Would come from UI
    const developerConfig = {}; // Would come from files
    
    configLoader.loadConfig({ player: playerConfig, developer: developerConfig });
  }

  // ============================================
  // MATCH LIFECYCLE
  // ============================================

  /**
   * Start a new match
   * @param {Object} config - Match configuration
   */
  async startMatch(config) {
    if (!this.initialized) {
      throw new Error('Orchestrator not initialized');
    }
    
    if (this.isRunning) {
      throw new Error('Match already in progress');
    }
    
    console.log('[MatchOrchestrator] Starting match with config:', config);
    
    try {
      // Reset state
      this.resetState();
      
      // Load match configuration
      configLoader.loadPlayerConfig(config);
      
      // Initialize match
      const matchId = matchState.initializeMatch(config);
      
      // Select pattern
      const pattern = this.systems.pattern.selectPattern(
        config.roundCount || 10,
        { difficulty: config.difficultyLevel }
      );
      
      // Initialize block selector with pattern
      this.systems.block.initialize(pattern);
      matchState.setPattern(pattern);
      
      // Create match object
      this.currentMatch = {
        id: matchId,
        config: config,
        pattern: pattern,
        startTime: Date.now()
      };
      
      // Update state
      this.isRunning = true;
      matchState.startMatch();
      
      // Start first block
      await this.processNextBlock();
      
    } catch (error) {
      console.error('[MatchOrchestrator] Failed to start match:', error);
      this.isRunning = false;
      throw error;
    }
  }

  /**
   * Process the next block in the sequence
   */
  async processNextBlock() {
    if (!this.isRunning) {
      console.log('[MatchOrchestrator] Not running, skipping block processing');
      return;
    }
    
    try {
      // Get next block from pattern
      const blockInfo = this.systems.block.getNextBlock();
      
      if (!blockInfo) {
        // Pattern complete
        console.log('[MatchOrchestrator] Pattern complete');
        return;
      }
      
      console.log('[MatchOrchestrator] Processing block:', blockInfo);
      
      // Process based on block type
      if (blockInfo.type === BlockType.CEREMONY) {
        await this.processCeremonyBlock(blockInfo);
      } else if (blockInfo.type === BlockType.ROUND) {
        await this.processRoundBlock(blockInfo);
      } else if (blockInfo.type === BlockType.RELAX) {
        await this.processRelaxBlock(blockInfo);
      }
      
      // Confirm block started
      this.systems.block.confirmBlockStart(blockInfo.type);
      
    } catch (error) {
      console.error('[MatchOrchestrator] Error processing block:', error);
      eventBus.emit(Events.SYSTEM_ERROR, { system: 'orchestrator', error });
      
      // Try to recover
      this.attemptRecovery(error);
    }
  }

  /**
   * Process a ceremony block
   */
  async processCeremonyBlock(blockInfo) {
    const ceremonyType = blockInfo.context.ceremonyType;
    
    // Create ceremony play
    const play = {
      blockType: BlockType.CEREMONY,
      ceremonyType: ceremonyType,
      duration: ceremonyType === 'opening' ? 90 : 90
    };
    
    // Get context
    const context = this.buildContext();
    
    // Assemble scripts
    play.scripts = scriptAssembler.assembleScripts(play, context);
    
    // Start block
    matchState.startBlock(BlockType.CEREMONY, play);
    
    // Perform
    await this.systems.performance.perform(play, context);
    
    // Complete block
    matchState.completeBlock();
  }

  /**
   * Process a round block
   */
  async processRoundBlock(blockInfo) {
    // Build selection context
    const context = this.buildSelectionContext(blockInfo);
    
    // Select play
    const play = await this.systems.play.selectPlay(context);
    
    // Record variety
    this.systems.variety.recordSelection(play.roundType, context);
    this.systems.variety.recordSelection(play.variant, context);
    
    // Update player tracking
    playerRegistry.incrementRoundsSinceSelected();
    
    // Assemble scripts
    play.scripts = scriptAssembler.assembleScripts(play, context);
    
    // Start block
    matchState.startBlock(BlockType.ROUND, play);
    
    // Perform
    await this.systems.performance.perform(play, context);
    
    // Complete block
    matchState.completeBlock();
  }

  /**
   * Process a relax block
   */
  async processRelaxBlock(blockInfo) {
    // Select relax activity
    const activities = ['stretching', 'breathing', 'groupActivity'];
    const activity = activities[Math.floor(Math.random() * activities.length)];
    
    // Create relax play
    const play = {
      blockType: BlockType.RELAX,
      activity: activity,
      duration: 90
    };
    
    // Get context
    const context = this.buildContext();
    
    // Assemble scripts
    play.scripts = scriptAssembler.assembleScripts(play, context);
    
    // Start block
    matchState.startBlock(BlockType.RELAX, play);
    
    // Perform
    await this.systems.performance.perform(play, context);
    
    // Complete block
    matchState.completeBlock();
  }

  /**
   * Build context for current state
   */
  buildContext() {
    const progress = matchState.getProgress();
    const config = configLoader.getAll();
    
    return {
      matchId: this.currentMatch?.id,
      currentRound: matchState.getCurrentRoundNumber(),
      totalRounds: matchState.getTotalRounds(),
      timeElapsed: matchState.getState().timeElapsed,
      matchDuration: config.match?.estimatedDuration || 30,
      
      teamNames: config.teams?.teamNames || ['Team 1', 'Team 2'],
      
      isFirstRound: matchState.getCurrentRoundNumber() === 1,
      isLastRound: matchState.getCurrentRoundNumber() === matchState.getTotalRounds(),
      isEarlyMatch: progress < 33,
      isMidMatch: progress >= 33 && progress < 67,
      isLateMatch: progress >= 67,
      
      personalityStyle: config.scripts?.personality?.style || 'enthusiastic'
    };
  }

  /**
   * Build selection context for play selection
   */
  buildSelectionContext(blockInfo) {
    const baseContext = this.buildContext();
    const activePlayers = playerRegistry.getActivePlayers();
    
    return {
      ...baseContext,
      ...blockInfo.context,
      
      // Players
      activePlayerList: activePlayers,
      playerCount: activePlayers.length,
      teamRoster: this.buildTeamRoster(),
      
      // History
      recentPlays: this.systems.play.getRecentPlays(),
      recentSelections: stateStore.get(StateKeys.RECENT_SELECTIONS, {}),
      
      // Difficulty
      targetDifficulty: matchState.getCurrentDifficultyTarget(),
      difficultyCurve: configLoader.get('match.difficultyCurve', 'gentle'),
      
      // Block context
      roundsSinceRelax: blockInfo.context.roundsSinceRelax || 0
    };
  }

  /**
   * Build team roster mapping
   */
  buildTeamRoster() {
    const teams = playerRegistry.getActiveTeams();
    const roster = {};
    
    teams.forEach(team => {
      roster[team.id] = team.players.map(p => p.id);
    });
    
    return roster;
  }

  // ============================================
  // MATCH CONTROL
  // ============================================

  /**
   * Pause the current match
   */
  pauseMatch() {
    if (!this.isRunning) return;
    
    console.log('[MatchOrchestrator] Pausing match');
    
    this.isRunning = false;
    matchState.match.status = MatchStatus.PAUSED;
    
    // Interrupt any ongoing performance
    this.systems.performance.interrupt();
    
    eventBus.emit(Events.MATCH_PAUSED);
  }

  /**
   * Resume the current match
   */
  resumeMatch() {
    if (this.isRunning) return;
    if (matchState.getStatus() !== MatchStatus.PAUSED) return;
    
    console.log('[MatchOrchestrator] Resuming match');
    
    this.isRunning = true;
    matchState.match.status = MatchStatus.IN_PROGRESS;
    
    eventBus.emit(Events.MATCH_RESUMED);
    
    // Continue with next block
    this.processNextBlock();
  }

  /**
   * End the current match
   */
  endMatch(reason = 'user_ended') {
    if (!this.currentMatch) return;
    
    console.log('[MatchOrchestrator] Ending match:', reason);
    
    this.isRunning = false;
    
    if (reason === 'completed') {
      matchState.completeMatch();
    } else {
      matchState.abandonMatch(reason);
    }
    
    // Clean up
    this.currentMatch = null;
  }

  // ============================================
  // EVENT HANDLERS
  // ============================================

  /**
   * Handle match completion
   */
  handleMatchComplete() {
    console.log('[MatchOrchestrator] Match completed successfully');
    this.isRunning = false;
    this.currentMatch = null;
  }

  /**
   * Handle match abandonment
   */
  handleMatchAbandoned() {
    console.log('[MatchOrchestrator] Match abandoned');
    this.isRunning = false;
    this.currentMatch = null;
  }

  /**
   * Handle player addition
   */
  handlePlayerAdded(data) {
    console.log('[MatchOrchestrator] Player added:', data.player.name);
    
    // Could trigger announcement
    if (this.isRunning && this.currentMatch) {
      // Queue welcome announcement
    }
  }

  /**
   * Handle player removal
   */
  handlePlayerRemoved(data) {
    console.log('[MatchOrchestrator] Player removed:', data.player.name);
    
    // Check if match can continue
    const activePlayers = playerRegistry.getActivePlayers();
    if (activePlayers.length < 2) {
      console.warn('[MatchOrchestrator] Not enough players, ending match');
      this.endMatch('insufficient_players');
    }
  }

  /**
   * Handle system errors
   */
  handleSystemError(data) {
    console.error('[MatchOrchestrator] System error:', data);
    
    // Determine severity
    if (data.critical) {
      this.endMatch('system_error');
    } else {
      // Try to continue
      this.attemptRecovery(data.error);
    }
  }

  /**
   * Attempt to recover from error
   */
  attemptRecovery(error) {
    console.log('[MatchOrchestrator] Attempting recovery from:', error.message);
    
    // Simple recovery: try next block
    setTimeout(() => {
      if (this.isRunning) {
        this.processNextBlock();
      }
    }, 2000);
  }

  // ============================================
  // STATE MANAGEMENT
  // ============================================

  /**
   * Reset all state
   */
  resetState() {
    matchState.reset();
    playerRegistry.reset();
    this.systems.variety.clearHistory();
    this.systems.play.clearHistory();
    this.systems.block.reset();
    stateStore.clear();
  }

  /**
   * Create state checkpoint
   */
  createCheckpoint() {
    return {
      orchestrator: {
        isRunning: this.isRunning,
        currentMatch: this.currentMatch
      },
      match: matchState.createCheckpoint(),
      players: playerRegistry.export(),
      variety: this.systems.variety.export(),
      config: configLoader.export()
    };
  }

  /**
   * Restore from checkpoint
   */
  restoreFromCheckpoint(checkpoint) {
    // Restore orchestrator state
    this.isRunning = checkpoint.orchestrator.isRunning;
    this.currentMatch = checkpoint.orchestrator.currentMatch;
    
    // Restore system states
    matchState.restoreFromCheckpoint(checkpoint.match);
    playerRegistry.import(checkpoint.players);
    this.systems.variety.import(checkpoint.variety);
    configLoader.import(checkpoint.config);
    
    // Re-initialize systems with restored state
    if (checkpoint.match.match.config.selectedPattern) {
      this.systems.block.initialize({
        id: checkpoint.match.match.config.selectedPattern,
        sequence: checkpoint.match.match.patternSequence
      });
      this.systems.block.skipToIndex(checkpoint.match.match.currentBlockIndex);
    }
  }

  // ============================================
  // UTILITIES
  // ============================================

  /**
   * Get orchestrator status
   */
  getStatus() {
    return {
      initialized: this.initialized,
      isRunning: this.isRunning,
      currentMatch: this.currentMatch ? {
        id: this.currentMatch.id,
        startTime: this.currentMatch.startTime,
        pattern: this.currentMatch.pattern.id
      } : null,
      
      matchStatus: matchState.getStatus(),
      blockProgress: this.systems.block.getProgress(),
      playerCount: playerRegistry.getActivePlayers().length,
      
      systemStatus: {
        pattern: !!this.systems.pattern,
        block: !!this.systems.block.getPattern(),
        play: !!this.systems.play,
        variety: !!this.systems.variety,
        script: !!this.systems.script,
        performance: !!this.systems.performance
      }
    };
  }

  /**
   * Get current block visualization
   */
  getVisualization() {
    return this.systems.block.getPatternVisualization();
  }
}

// Create singleton instance
const matchOrchestrator = new MatchOrchestrator();

// Export both instance and class
export default matchOrchestrator;
export { MatchOrchestrator };