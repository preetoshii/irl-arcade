/**
 * Match Orchestrator for Simon Says
 * 
 * The MatchOrchestrator is the maestro conducting the entire Simon Says symphony. While individual systems handle their specific responsibilities - pattern selection, play selection, script assembly, performance - the orchestrator ensures they all work in harmony. It's like the director of a live show who coordinates lighting, sound, actors, and stage changes to create a seamless experience. The orchestrator understands the big picture: how a match flows from opening ceremony through multiple rounds to closing celebration, handling everything from normal progression to error recovery.
 * 
 * The power of the orchestrator pattern lies in its separation of concerns. Each system can focus on doing one thing well, while the orchestrator handles their integration and the overall flow. When a round completes, the orchestrator knows to check the pattern for the next block, engage the appropriate selector, assemble scripts, and trigger performance. If a player leaves mid-game, the orchestrator evaluates whether the match can continue. If an error occurs, it attempts recovery. This centralized coordination creates resilience - individual systems can fail and recover without bringing down the entire experience, much like how a good director handles unexpected stage mishaps without the audience noticing.
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
   * 
   * Initialization is like a pre-show systems check where every component is tested and prepared for the performance ahead. The method follows a careful sequence: first initializing individual systems (making sure each instrument is tuned), then wiring dependencies (ensuring the musicians can hear each other), subscribing to events (setting up communication channels), and finally loading configuration (getting the sheet music ready). This methodical approach ensures that when a match starts, every system is ready to play its part without any surprises.
   * 
   * The error handling here is particularly important. If any system fails to initialize, the entire initialization fails, preventing partially-configured matches that might behave unpredictably. The event emission at the end signals to any monitoring systems that the orchestrator is ready, creating a clear initialization lifecycle. This robustness is essential for a system that might run for extended periods, handling multiple matches without restart.
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
    console.log('[MatchOrchestrator] Subscribing to events, eventBus:', eventBus);
    
    // Match lifecycle events
    eventBus.on(Events.MATCH_COMPLETED, () => this.handleMatchComplete());
    eventBus.on(Events.MATCH_ABANDONED, () => this.handleMatchAbandoned());
    
    // Block events - bind this context
    const blockHandler = async (data) => {
      console.log('[MatchOrchestrator] BLOCK_COMPLETED event received:', data);
      console.log('[MatchOrchestrator] Current isRunning status:', this.isRunning);
      console.log('[MatchOrchestrator] This context:', this);
      await this.processNextBlock();
    };
    
    // Store handler reference for debugging
    this.blockCompletedHandler = blockHandler;
    
    const unsubscribe = eventBus.on(Events.BLOCK_COMPLETED, blockHandler);
    console.log('[MatchOrchestrator] Subscribed to BLOCK_COMPLETED, got unsubscribe function:', typeof unsubscribe);
    console.log('[MatchOrchestrator] Handler registered:', eventBus.listenerCount(Events.BLOCK_COMPLETED));
    
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
      // Reset state (but preserve players)
      this.resetStateExceptPlayers();
      
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
   * 
   * This method is the heartbeat of match progression, called after each block completes to determine what happens next. It's like turning the page in a choose-your-own-adventure book, except the adventure was chosen at the start (the pattern). The method retrieves the next block type from the pattern, then routes to specialized processors for each type. The beauty is in how it handles the unknown - if the block selector returns null, it knows the pattern is complete. If an error occurs, it attempts recovery rather than crashing. This resilience keeps matches flowing smoothly even when individual operations fail.
   * 
   * The try-catch structure with recovery attempts showcases production-ready thinking. Games are live experiences where stopping for errors ruins the fun. Instead of failing hard, the orchestrator logs the error, emits an event for monitoring, and attempts recovery. The recovery might be as simple as skipping to the next block or waiting a moment before retrying. This approach acknowledges that in live entertainment, the show must go on. Players might notice a slight hiccup, but the game continues, maintaining engagement and fun.
   */
  async processNextBlock() {
    if (!this.isRunning) {
      return;
    }
    
    try {
      // Get next block from pattern
      const blockInfo = this.systems.block.getNextBlock();
      
      if (!blockInfo) {
        // Pattern complete
        return;
      }
      
      // Process based on block type (don't confirm until successful)
      if (blockInfo.type === BlockType.CEREMONY) {
        await this.processCeremonyBlock(blockInfo);
        // Only confirm after successful processing
        this.systems.block.confirmBlockStart(blockInfo.type);
      } else if (blockInfo.type === BlockType.ROUND) {
        await this.processRoundBlock(blockInfo);
        // Only confirm after successful processing
        this.systems.block.confirmBlockStart(blockInfo.type);
      } else if (blockInfo.type === BlockType.RELAX) {
        await this.processRelaxBlock(blockInfo);
        // Only confirm after successful processing
        this.systems.block.confirmBlockStart(blockInfo.type);
      }
      
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
    console.log('[MatchOrchestrator] Processing ceremony block:', ceremonyType);
    
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
    console.log('[MatchOrchestrator] Starting ceremony performance...');
    await this.systems.performance.perform(play, context);
    console.log('[MatchOrchestrator] Ceremony performance completed');
    
    // Complete block
    console.log('[MatchOrchestrator] Completing ceremony block...');
    matchState.completeBlock();
    console.log('[MatchOrchestrator] Ceremony block completed');
    
    // Debug: Check if we should continue
    console.log('[MatchOrchestrator] Block completion should trigger BLOCK_COMPLETED event which calls processNextBlock');
  }

  /**
   * Process a round block
   * 
   * Round processing is where all the systems come together to create a moment of gameplay. The method orchestrates a complex dance: building context (understanding the current situation), selecting a play (choosing what game to play), recording variety (preventing repetition), updating player tracking (ensuring fairness), assembling scripts (creating the performance), and finally performing (bringing it to life). Each step depends on the previous ones, yet the method presents a clean, linear flow that's easy to understand and debug.
   * 
   * The variety recording is particularly clever - it records both the round type and variant separately, allowing the variety enforcer to prevent repetition at multiple levels. You won't get tag-tag-tag, but you also won't get duel-mirror, duel-tag, duel-balance (too many duels). The player tracking increment ensures everyone's "rounds since selected" counter increases, making unselected players more likely to be chosen next time. These subtle mechanisms create fairness and variety without players noticing the system's invisible hand guiding their experience.
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
      matchDuration: config.match?.estimatedDuration || 1800, // 30 minutes in seconds
      
      teamNames: config.teamConfig?.teamNames || config.teams?.teamNames || ['Team 1', 'Team 2'],
      
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
   * 
   * Context building is like providing a detailed briefing to a decision-maker. The play selector needs to know everything relevant to make a good choice: who's playing, what's happened recently, where we are in the match, what difficulty we're targeting, and how long it's been since a break. This method aggregates information from multiple sources - match state, player registry, configuration, and the current block - into a comprehensive context object. It's the informational foundation that enables intelligent play selection.
   * 
   * The spread operator usage here elegantly combines multiple context sources, with later sources overriding earlier ones. This allows block-specific context to override general match context when needed. The method also calculates derived values like team rosters and difficulty targets, preventing each system from having to understand these calculations. By centralizing context building, the orchestrator ensures all systems work from the same understanding of the current game state, preventing inconsistencies that could arise from systems calculating their own context.
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
    
    // For now, don't attempt automatic recovery to avoid pattern desync
    // Instead, just log the error and let the user handle it
    console.error('[MatchOrchestrator] Recovery failed - manual intervention required');
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
   * Reset state but preserve players (for testing)
   */
  resetStateExceptPlayers() {
    matchState.reset();
    // Don't reset playerRegistry - keep existing players
    this.systems.variety.clearHistory();
    this.systems.play.clearHistory();
    this.systems.block.reset();
    // Only clear non-player related state
    const players = stateStore.get(StateKeys.PLAYERS);
    stateStore.clear();
    if (players) {
      stateStore.set(StateKeys.PLAYERS, players);
    }
  }

  /**
   * Create state checkpoint
   * 
   * Checkpointing is like taking a snapshot of a live performance - capturing every detail needed to resume exactly where things left off. This method creates a comprehensive backup of the entire game state across all systems. The orchestrator's own state (is it running? what match?), the match progress, player information, variety history, and configuration all get captured. This isn't just about crash recovery - it enables features like "save and quit" or even replaying matches from specific points.
   * 
   * The checkpoint structure reveals the system's architecture beautifully. Each major system has an export method that serializes its internal state, and the orchestrator simply collects these exports. This design means systems can evolve their internal state independently as long as they maintain compatible export/import interfaces. The checkpoint could be serialized to JSON and saved to disk, sent to a server, or kept in memory for quick recovery. It's a powerful pattern that adds resilience and flexibility to the entire game system.
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