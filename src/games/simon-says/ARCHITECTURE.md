# Simon Says Architecture Implementation

This document describes the completed architecture for Simon Says, showing how all systems integrate to create a cohesive game experience.

## Overview

The Simon Says game is built with a modular, event-driven architecture that respects the fundamental constraint: **Simon can only speak, never listen**. The system is organized into four main layers:

1. **State Layer** (`/state/`) - Core data structures and state management
2. **Systems Layer** (`/systems/`) - Infrastructure and support services  
3. **Mechanics Layer** (`/mechanics/`) - Game logic and rules
4. **Helpers Layer** (`/helpers/`) - Pure utility functions

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     Match Orchestrator                       │
│  (Coordinates all systems and manages game flow)            │
└────────────┬────────────────────────────────────┬───────────┘
             │                                    │
┌────────────▼────────────┐          ┌───────────▼────────────┐
│    Selection Pipeline   │          │   Performance System    │
│ ┌─────────────────────┐ │          │ ┌───────────────────┐ │
│ │  Pattern Selector   │ │          │ │ Script Assembler  │ │
│ └──────────┬──────────┘ │          │ └─────────┬─────────┘ │
│ ┌──────────▼──────────┐ │          │ ┌─────────▼─────────┐ │
│ │   Block Selector    │ │          │ │   TTS Engine      │ │
│ └──────────┬──────────┘ │          │ └───────────────────┘ │
│ ┌──────────▼──────────┐ │          └───────────────────────┘
│ │   Play Selector     │ │                      ▲
│ └──────────┬──────────┘ │                      │
│ ┌──────────▼──────────┐ │                      │
│ │  Variety Enforcer   │ │                      │
│ └─────────────────────┘ │                      │
└─────────────────────────┴──────────────────────┘
                                                  
┌─────────────────────────────────────────────────────────────┐
│                    Infrastructure Layer                      │
│ ┌──────────┐ ┌──────────────┐ ┌──────────┐ ┌─────────────┐│
│ │ EventBus │ │ StateStore   │ │ConfigLoader│ │MatchState  ││
│ └──────────┘ └──────────────┘ └──────────┘ └─────────────┘│
└─────────────────────────────────────────────────────────────┘
```

## Core Flow

### 1. Match Initialization
```javascript
// User starts match with configuration
matchOrchestrator.startMatch({
  roundCount: 10,
  difficultyCurve: 'gentle',
  difficultyLevel: 'moderate'
});

// Orchestrator:
// 1. Loads configuration
// 2. Initializes match state
// 3. Selects pattern (e.g., "3 rounds → relax → 3 rounds → relax → 4 rounds")
// 4. Begins first block
```

### 2. Block Processing
```javascript
// For each block in the pattern:
processNextBlock() {
  // 1. Get next block type from pattern
  const blockInfo = blockSelector.getNextBlock();
  
  // 2. Process based on type
  if (blockInfo.type === 'round') {
    // Select specific play
    const play = await playSelector.selectPlay(context);
    
    // Apply variety enforcement
    varietyEnforcer.recordSelection(play);
    
    // Assemble scripts
    play.scripts = scriptAssembler.assembleScripts(play);
    
    // Perform
    await performanceSystem.perform(play);
  }
}
```

### 3. Play Selection Pipeline
```javascript
// Cascading selection with variety enforcement:
selectPlay(context) {
  // 1. Select round type (duel/team/ffa)
  const roundType = weightedSelect(roundTypes, varietyWeights);
  
  // 2. Select variant (tag/mirror/balance)
  const variant = weightedSelect(variants[roundType], varietyWeights);
  
  // 3. Select movement (normal/crabwalk/backwards)
  const subVariant = weightedSelect(movements, difficultyWeights);
  
  // 4. Maybe add modifier (blindfold/chanting)
  const modifier = probabilitySelect(modifiers, difficulty);
  
  // 5. Select players fairly
  const players = selectPlayers(roundType, playerWeights);
  
  return { roundType, variant, subVariant, modifier, players };
}
```

## Key Systems

### State Management
- **MatchState**: Tracks match progress, blocks, timing
- **PlayerRegistry**: Manages player roster and selection fairness
- **StateStore**: Centralized state with pub/sub
- **Types & Constants**: Shared data structures

### Infrastructure Systems
- **EventBus**: Decoupled communication between systems
- **ConfigLoader**: Merges player and developer configuration
- **PerformanceSystem**: Text-to-speech and script delivery

### Game Mechanics
- **MatchOrchestrator**: Master coordinator
- **PatternSelector**: Chooses block sequences
- **BlockSelector**: Follows patterns
- **PlaySelector**: Core selection algorithm
- **VarietyEnforcer**: Prevents repetition
- **ScriptAssembler**: Builds performance scripts

## Integration Points

### 1. Event-Driven Communication
```javascript
// Systems communicate through events:
eventBus.emit(Events.PLAY_SELECTED, { play, context });
eventBus.emit(Events.BLOCK_COMPLETED, { block });
eventBus.emit(Events.PLAYER_ADDED, { player });
```

### 2. Dependency Injection
```javascript
// Orchestrator provides dependencies:
playSelector.setVarietyEnforcer(varietyEnforcer);
blockSelector.initialize(pattern);
```

### 3. State Synchronization
```javascript
// State updates trigger system reactions:
stateStore.subscribe('match.status', (change) => {
  if (change.newValue === 'completed') {
    performanceSystem.perform(closingCeremony);
  }
});
```

## Key Design Decisions

### 1. One-Way Communication
- Simon only outputs audio, never receives feedback
- No score tracking, winner detection, or performance monitoring
- Players self-manage all game state

### 2. Round-by-Round Selection
- Plays are selected fresh each round
- Allows adaptation to changing player lists
- Maintains variety through history tracking

### 3. Pattern-Based Flow
- Predetermined block sequences for consistent pacing
- Different patterns for different match lengths
- Relax blocks strategically placed

### 4. Weighted Random Selection
- Everything uses weights for probability
- Weights modified by variety enforcement
- Ensures fair player rotation

### 5. Modular Architecture
- Clear separation of concerns
- Easy to test individual systems
- Can swap implementations (e.g., TTS providers)

## Configuration

### Player Configuration
```javascript
{
  matchLength: 10,           // Number of rounds
  difficultyCurve: 'gentle', // Progression style
  difficultyLevel: 'moderate', // Overall difficulty
  gameFocus: ['silly', 'competitive'], // Emphasis
  teamConfig: { /* team setup */ },
  accessibility: { /* accommodations */ }
}
```

### Developer Configuration
```javascript
{
  roundTypes: { /* weights and variants */ },
  blockSequencing: { /* patterns */ },
  scripts: { /* personality */ },
  timing: { /* durations and pauses */ },
  features: { /* feature flags */ }
}
```

## Error Handling

### Graceful Degradation
- If TTS fails, fall back to console
- If player count drops, adapt games
- If pattern incomplete, end gracefully

### Recovery Mechanisms
- State checkpointing every 60 seconds
- Can resume from any block
- Handles player disconnections

## Performance Optimizations

### Efficient Selection
- Pre-calculated cumulative weights
- Cached variety calculations
- Minimal state updates

### Memory Management
- History limited to recent items
- Old checkpoints pruned
- Event listeners properly cleaned

## Extension Points

### Adding New Round Types
1. Add to configuration
2. Create variant definitions
3. Add script templates
4. System automatically includes

### Custom Scripts
```javascript
scriptAssembler.addCustomTemplates('roundIntros', [
  "Let's get wild with round {roundNumber}!",
  "Buckle up for something special!"
]);
```

### New Modifiers
Simply add to configuration with:
- Weight value
- Difficulty impact
- Script templates

## Testing Strategy

### Unit Tests
- Individual systems tested in isolation
- Mock dependencies injected
- Focus on pure functions

### Integration Tests
- Full pipeline tests
- Event flow verification
- State consistency checks

### Scenario Tests
- Complete match simulations
- Edge cases (1 player, 100 players)
- Error recovery paths

## Conclusion

This architecture successfully implements Simon Says with:
- ✅ Respects one-way communication constraint
- ✅ Clean separation of concerns
- ✅ Extensible and maintainable
- ✅ Handles real-world complexity
- ✅ Provides delightful variety

The modular design allows for easy improvements while the event-driven architecture keeps systems decoupled. Most importantly, the implementation stays true to the core vision: creating magical moments of human connection through the simple joy of playing together.