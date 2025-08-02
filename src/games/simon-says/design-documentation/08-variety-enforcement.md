# Variety Enforcement

*This document covers how the system ensures diverse and inclusive gameplay.*

## Overview

Variety enforcement is the system's immune response to boredom. It prevents repetitive gameplay, ensures fair participation, and keeps the experience fresh throughout the match. Without variety enforcement, random selection could theoretically choose "Tag Duel" five times in a row or pick the same player repeatedly - technically possible but experientially terrible.

## Recent History Tracking

The system maintains a rolling history of recent gameplay to inform future selections:

### What Gets Tracked

**Round-Level History:**
- Last 5 Round Types played (Duel, Team, FFA, etc.)
- Last 3 Variants within each type (Tag, Mirror, etc.)
- Last 3 Sub-variants used
- Last 2 Modifiers applied
- Time since each was last played

**Block-Level History:**
- Sequence of all Blocks (Round, Relax, Ceremony)
- What type of activities were selected
- Time since last Relax block

### Penalty System

Recent plays receive weight penalties to reduce selection probability:

**Recency Penalties:**
```
Just played (current round): Weight × 0.2 (80% reduction)
1 round ago: Weight × 0.4 (60% reduction)
2 rounds ago: Weight × 0.7 (30% reduction)
3 rounds ago: Weight × 0.9 (10% reduction)
4+ rounds ago: Weight × 1.0 (no penalty)
```

**Stacking Penalties:**
If multiple factors match recent history:
- Same Round Type + Same Variant: Multiply penalties
- Same exact combination: Weight × 0.1 (90% reduction)
- Similar but not identical: Lesser penalty

### Variety Scoring

The system can calculate a "variety score" for potential selections:
```
Variety Score = Base Weight × Recency Penalty × Diversity Bonus
```

Higher variety scores indicate fresher, more diverse options.

## Player Rotation

Fair player selection based on what Simon tracks:

### Selection Tracking

**What Simon Knows:**
- Who was selected for each round
- When each player was last selected
- Which pairings have happened
- Current active player list

**Simple Rotation:**
- Track "rounds since last selected"
- Prioritize players not recently chosen
- Avoid immediate repeat pairings
- Balance selections between teams

### Selection Algorithms

**For Duel Battles:**
1. Filter by "rounds since selected"
2. Prioritize those not chosen recently
3. Avoid same pairing twice in a row
4. Balance team representation

**For Team Activities:**
1. Rotate which players are called out
2. Try to give everyone a spotlight moment
3. Mix up combinations

**Note:** Simon doesn't know who actually participated, only who was selected. Players self-manage actual participation.

### Inclusion Through Selection

**Simple Fairness:**
- If a player hasn't been selected in 3+ rounds, boost their weight
- Try to select each player at least once per 5 rounds
- Random selection with bias toward those waiting longest

**Team Balance:**
- Keep rough count of selections per team
- If one team is under-selected, boost their chances slightly

### Special Cases

**New Player Joins Mid-Match:**
- Get priority for next suitable round
- Given easier/fun variant
- Quick integration celebration

**Player Needs Break:**
- Marked as temporarily unavailable
- Not counted in sit-out tracking
- Welcomed back enthusiastically
- No penalty for taking breaks

## Preventing Predictable Patterns

Beyond simple repetition, the system prevents larger patterns that make gameplay predictable:

### Simple Pattern Prevention

**Basic Rules:**
- Don't repeat exact same play within 5 rounds
- Vary round types (don't do 3 duels in a row)
- Mix up movement styles

**Implementation:**
```javascript
// Simple check
if (lastTwoRoundTypes.every(type => type === "duel")) {
  // Reduce duel weight for next selection
  duelWeight *= 0.5;
}
```

### Controlled Chaos

**Surprise Elements:**
- 10% chance of "wildcard" selection
- Occasionally break established patterns
- Insert unexpected combinations
- Keep players guessing

**But Not Too Chaotic:**
- Follow difficulty progression
- Maintain inclusion principles  
- Keep safety paramount
- Preserve game flow

### Activity Variety

**Mix It Up:**
- Vary who gets selected for spotlights
- Alternate competitive and collaborative
- Mix physical and creative activities
- Change up the pace

## Implementation Strategies

### Memory Structures

**Recent History Stack:**
```javascript
recentHistory = {
  rounds: ["tag", "relay", "freezeDance", "mirror", "capture"],
  players: {
    "Alice": { lastPlayed: 2, totalPlays: 3 },
    "Bob": { lastPlayed: 0, totalPlays: 4 }
  },
  patterns: ["duel", "team", "duel", "team"] // Uh oh, pattern!
}
```

### Variety Algorithms

**Weighted Random with Constraints:**
1. Calculate base weights
2. Apply recency penalties
3. Apply inclusion bonuses
4. Check pattern breakers
5. Make selection
6. Update history

**Emergency Overrides:**
- If variety score too low everywhere, reset some penalties
- If player extremely under-represented, force inclusion
- If pattern too strong, inject randomness


## The Golden Rules

1. **Track selections, not participation** - Simon only knows who was chosen
2. **Simple fairness** - Basic rotation to give everyone chances
3. **Prevent obvious repetition** - Don't repeat recent activities
4. **Trust human judgment** - Players self-manage actual participation
5. **Fresh but familiar** - New combinations of known elements

Variety enforcement uses simple rules to keep the game fresh while giving everyone opportunities to be selected.