# Simon Says System Integration Analysis

*A comprehensive analysis of how all systems connect, data flows between them, and potential implementation concerns.*

## System Architecture Overview

### Core Constraint: One-Way Communication
The fundamental architectural constraint is that **Simon can only speak, never listen**. This shapes every integration:
- No feedback loop from players to system
- No real-time game state tracking
- Pure orchestration without verification
- Humans handle all actual game state

### System Layers

```
┌─────────────────────────────────────────────────────────┐
│                   Player Interface                       │
│              (Config Selection → Start)                  │
└─────────────────────┬───────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────┐
│                Configuration Layer                       │
│  (Player Config + Dev Config + Mermaid Charts)         │
└─────────────────────┬───────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────┐
│              Match Orchestration Layer                   │
│         (Pattern Selection → Block Sequencing)          │
└─────────────────────┬───────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────┐
│               Play Selection Layer                       │
│    (Round Type → Variant → Sub-variant → Modifier)     │
└─────────────────────┬───────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────┐
│              Performance Layer (Simon)                   │
│         (Scripts → TTS → Audio Output)                 │
└─────────────────────────────────────────────────────────┘
```

## Integration Points & Data Flow

### 1. Match Initialization Flow

```javascript
// Data flows from UI → Config → Match State
PlayerUI.startMatch()
  ↓
ConfigManager.buildMatchConfig({
  playerSettings: { rounds: 10, difficulty: "moderate" },
  developerConfig: loadedConfigs,
  mermaidFlow: parsedChart
})
  ↓
MatchOrchestrator.initialize({
  pattern: selectPattern(rounds),  // "Opening → 3R → Relax → 3R → Relax → 4R → Closing"
  players: playerRoster,
  config: mergedConfig
})
  ↓
StateManager.createMatchState()
```

**Integration Concerns:**
- Config merger must handle conflicts (player vs dev settings)
- Pattern selection must validate against player count
- State initialization needs all players before first selection

### 2. Block Selection Flow

```javascript
// Each block follows: Orchestrator → Selector → State → Performance
MatchOrchestrator.nextBlock()
  ↓
BlockSelector.selectBlock(currentIndex, pattern)
  ↓
// For Round Blocks:
PlaySelector.buildPlay({
  blockType: "round",
  targetDifficulty: getCurrentDifficulty(),
  recentHistory: getRecentPlays(),
  availablePlayers: getActivePlayers()
})
  ↓
VarietyEnforcer.applyConstraints(possiblePlays)
  ↓
StateManager.recordBlockStart(selectedPlay)
  ↓
Simon.perform(selectedPlay)
```

**Integration Concerns:**
- Difficulty progression must align with block position
- Variety enforcement needs access to full history
- Player availability affects possible selections
- State must be updated BEFORE performance starts

### 3. Play Construction Pipeline

```javascript
// Cascading selection with increasing specificity
RoundTypeSelector.select(weights, history)
  ↓ "duel" (30% weight)
VariantSelector.select(roundType.variants, history)
  ↓ "tag" (40% weight within duels)
SubVariantSelector.select(variant.subvariants, history)
  ↓ "crabWalk" (25% weight)
ModifierSelector.maybeAdd(difficulty, roundNumber)
  ↓ "blindfolded" (15% chance at difficulty 4+)
PlayerSelector.selectPlayers(requirements, rotation)
  ↓ { player1: "Alice", player2: "Bob" }
ScriptBuilder.buildScripts(allSelections)
  ↓ Complete Play object
```

**Dependencies:**
- Each level needs results from previous level
- Weight adjustments cascade through levels
- Player selection depends on round type requirements
- Scripts need all prior decisions

### 4. State Management Integration

```javascript
// State updates flow through multiple systems
StateManager.updateState(event)
  ↓
// Triggers:
VarietyEnforcer.updateHistory(event.play)
PlayerRotation.updateLastSelected(event.players)
DifficultyTracker.recordDifficulty(event.difficulty)
CheckpointSystem.markDirty()
  ↓
// If player changes:
TeamManager.rebalance()
PlaySelector.updateConstraints()
```

**Shared Dependencies:**
- Current player roster (used by 5+ systems)
- Recent play history (used by variety, selection)
- Time tracking (used by state, performance, checkpoints)
- Team assignments (used by selection, scripts)

### 5. Performance System Integration

```javascript
// Simon needs data from multiple sources
Simon.preparePerformance(play)
  ↓
// Gathers:
- Play details from selection
- Player names from state
- Team names from team manager
- Timing multipliers from difficulty
- Script variations from config
- Pause durations from timing config
  ↓
VoiceManager.configure(performanceHints)
  ↓
AudioSystem.speak(processedScript)
```

**Critical Timing:**
- Must wait for state updates before speaking
- Pause calculations need current multipliers
- Script tokens need current player/team data

## Missing Connections & Gaps

### 1. Player Join/Leave During Performance
**Gap:** No clear protocol for handling mid-performance changes
```javascript
// Current: Player leaves during a duel they're in
// Missing: How to handle this gracefully
// Need: Fallback scripts or abort protocols
```

### 2. Pattern Abort/Skip Handling
**Gap:** Predetermined patterns don't handle early endings well
```javascript
// Current: Pattern says "Relax block next"
// Scenario: Need to end match immediately
// Missing: Graceful pattern truncation
```

### 3. State Recovery Mid-Block
**Gap:** Checkpoints between blocks, but what about mid-performance?
```javascript
// Current: Checkpoint after block completes
// Scenario: Crash during 3-minute team relay
// Missing: Sub-block recovery points
```

### 4. Configuration Change Propagation
**Gap:** Hot reload of configs during active match
```javascript
// Current: Configs loaded at match start
// Scenario: Dev updates Mermaid chart mid-match
// Missing: Safe config update points
```

## Execution Order & Timing

### Critical Sequence: Round Block Execution

```
1. PRE-SELECTION (100ms)
   - Update available players
   - Calculate target difficulty
   - Load recent history
   
2. SELECTION (200ms)
   - Run selection cascade
   - Apply variety constraints
   - Validate player availability
   
3. STATE UPDATE (50ms)
   - Record block start
   - Update player stats
   - Checkpoint if needed
   
4. SCRIPT PREPARATION (150ms)
   - Token replacement
   - Timing calculations
   - Voice configuration
   
5. PERFORMANCE (variable)
   - Introduction (5-10s)
   - Player selection (10-15s)
   - Rules explanation (10-20s)
   - Gameplay (60-180s)
   - Conclusion (5-10s)
   
6. POST-BLOCK (100ms)
   - Update history
   - Record completion
   - Prepare for next
```

**Total: ~600ms overhead + 90-240s performance**

### Synchronization Points

Critical moments where systems must be synchronized:
1. **Match Start** - All configs merged, all players registered
2. **Block Boundaries** - State saved, history updated, next selected
3. **Player Changes** - Roster updated, selections adjusted, teams rebalanced
4. **Match End** - Final state saved, cleanup performed

## Potential Conflicts

### 1. Weight Modification Conflicts
Multiple systems modify selection weights:
- Player count adjuster
- Difficulty filter  
- Variety enforcer
- Config overrides

**Resolution:** Define clear precedence order

### 2. Timing Conflicts
Multiple timing modifiers:
- Difficulty-based speed
- Match progression speed
- Config-based multipliers
- Energy-based adjustments (removed but vestiges remain)

**Resolution:** Single multiplier calculation point

### 3. State Authority Conflicts
Who owns what state:
- Player roster (Team Manager vs State Manager)
- Selection history (Variety Enforcer vs State Manager)
- Current difficulty (Difficulty System vs Match Orchestrator)

**Resolution:** Single source of truth principle

### 4. Script Template Conflicts
Script sources:
- Mermaid chart scripts
- Config file scripts
- Default fallback scripts
- Dynamic generation

**Resolution:** Clear template hierarchy

## Shared Dependencies & Coupling

### Tightly Coupled Systems
These systems have deep dependencies:

1. **Selection ↔ Variety Enforcement**
   - Share history tracking
   - Modify each other's weights
   - Must stay synchronized

2. **State ↔ Player Management**
   - Player changes affect state
   - State recovery needs player data
   - Circular updates possible

3. **Performance ↔ Timing**
   - Scripts depend on timing
   - Timing affects performance duration
   - Feedback loop through difficulty

### Loosely Coupled Systems
These can operate more independently:

1. **Mermaid Parser** - Only runs on file change
2. **Checkpoint System** - Observes state changes
3. **Config Loader** - Runs once at start

## Implementation Recommendations

### 1. Clear Event Bus
```javascript
// Central event system for state changes
EventBus.emit('player.joined', { player, timestamp });
EventBus.emit('block.completed', { block, duration });
EventBus.emit('selection.made', { play, weights });
```

### 2. Strict Phase Management
```javascript
// Enforce clear phases with guards
class MatchPhases {
  canSelectNext() { return this.phase === 'BETWEEN_BLOCKS'; }
  canUpdatePlayers() { return this.phase !== 'PERFORMING'; }
  canCheckpoint() { return this.phase === 'BETWEEN_BLOCKS'; }
}
```

### 3. Dependency Injection
```javascript
// Reduce coupling through injection
class PlaySelector {
  constructor({ varietyEnforcer, playerManager, difficultySystem }) {
    this.variety = varietyEnforcer;
    this.players = playerManager;
    this.difficulty = difficultySystem;
  }
}
```

### 4. State Transaction Management
```javascript
// Atomic state updates
StateManager.transaction(() => {
  updatePlayerStats();
  recordBlockCompletion();
  prepareNextBlock();
}); // All succeed or all rollback
```

### 5. Integration Tests Focus
Priority test scenarios:
- Player leaves during their duel
- Match ends during Relax block
- Recovery after crash mid-performance
- Config reload during match
- Extreme player counts (1 vs 100)

## Conclusion

The Simon Says system is elegantly designed around its core constraint of one-way communication. The integration points are generally clean, with clear data flow from configuration through selection to performance. The main implementation challenges will be:

1. Managing the cascade of weight modifications
2. Ensuring state consistency across player changes
3. Graceful handling of interruptions
4. Maintaining performance during complex selections

The modular architecture supports these integrations well, but careful attention to execution order and state synchronization will be critical for a smooth player experience.