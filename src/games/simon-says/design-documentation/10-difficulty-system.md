# Difficulty System

*This document covers how difficulty progression and pacing work in the game.*

## Overview

The Difficulty System provides simple, predictable control over game challenge and pacing. Each Play has a difficulty score, and developers can control how difficulty progresses throughout a match. This creates natural progression from easy warm-ups to challenging finales.

## Difficulty Scoring

### Play Difficulty Levels

Each combination of round type, variant, sub-variant, and modifiers has a difficulty score from 1-5:

**Level 1 - Very Easy**
- Simple movements (normal walking)
- Clear objectives (basic tag)
- No modifiers
- Example: "Normal Tag Duel"

**Level 2 - Easy**  
- Slightly constrained movement (backwards walking)
- Still straightforward objectives
- Example: "Backwards Tag Duel"

**Level 3 - Medium**
- Challenging movement (crab walk, hopping)
- Standard game complexity
- Example: "Crab Walk Tag Duel"

**Level 4 - Hard**
- Complex movements or rules
- May include one modifier
- Example: "Slow Motion Mirror Duel with Team Chanting"

**Level 5 - Very Hard**
- Multiple constraints
- Complex objectives
- Multiple modifiers
- Example: "Blindfolded Crab Walk Tag with Animal Noises"

### Difficulty Calculation

```javascript
playDifficulty = baseDifficulty + modifierDifficulty;

// Base difficulties
difficultyScores = {
  // Movement difficulties
  normal: 0,
  backwards: 1,
  crabWalk: 2,
  hop: 2,
  slowMotion: 1,
  
  // Modifiers add difficulty
  blindfold: 2,
  teamChant: 1,
  animalNoises: 1,
  sillyVoices: 1
};
```

## Difficulty Progression

### Match Difficulty Curves

**Gentle Start** (Default)
```
Rounds:  1  2  3  4  5  6  7  8  9  10
Difficulty: 1  1  2  2  3  3  3  4  4  5
```
- Start very easy for warm-up
- Gradual increase
- Peak at the end

**Steady Challenge**
```
Rounds:  1  2  3  4  5  6  7  8  9  10
Difficulty: 2  3  3  3  3  3  3  3  4  4
```
- Skip the very easy stuff
- Maintain consistent challenge
- Small spike at end

**Roller Coaster**
```
Rounds:  1  2  3  4  5  6  7  8  9  10  Difficulty: 1  3  2  4  2  5  3  4  3  5
```
- Varies between easy and hard
- Keeps players guessing
- Multiple peaks

### Developer Controls

```javascript
difficultyConfig = {
  // Starting difficulty (1-5)
  startDifficulty: 1,
  
  // How quickly to ramp up
  rampSpeed: "gradual", // gradual, steady, aggressive
  
  // Maximum difficulty allowed
  maxDifficulty: 5,
  
  // Curve type
  curveType: "gentle_start" // gentle_start, steady, roller_coaster
}
```

## Pacing Adjustments

### Speed Multiplier

Difficulty also affects game speed through pause multipliers:

```javascript
// Higher difficulty = faster pacing
speedMultipliers = {
  1: 1.2,  // 20% slower (more time to understand)
  2: 1.1,  // 10% slower  
  3: 1.0,  // Normal speed
  4: 0.9,  // 10% faster
  5: 0.8   // 20% faster
};
```

This makes easier games feel more relaxed and harder games feel more frantic.

### Round Duration

Higher difficulty rounds can be slightly shorter to prevent exhaustion:

```javascript
durationMultipliers = {
  1: 1.0,  // Full duration
  2: 1.0,  // Full duration
  3: 1.0,  // Full duration
  4: 0.9,  // 10% shorter
  5: 0.8   // 20% shorter
};
```

## Selection Integration

When choosing a Play, the system considers the target difficulty:

```javascript
function selectPlay(targetDifficulty) {
  // Filter plays by difficulty range
  const acceptableRange = [
    targetDifficulty - 1,
    targetDifficulty,
    targetDifficulty + 1
  ];
  
  const validPlays = allPlays.filter(play => 
    acceptableRange.includes(play.difficulty)
  );
  
  // Select from valid plays using normal weights
  return weightedSelect(validPlays);
}
```

## Difficulty Presets

### Player-Selectable Presets

**Gentle**
- Max difficulty: 3
- Slow progression
- Longer pauses
- Focus on fun over challenge

**Moderate** (Default)
- Max difficulty: 4
- Balanced progression
- Normal pacing
- Mix of fun and challenge

**Intense**
- Max difficulty: 5
- Fast progression
- Shorter pauses
- Challenge-focused

### Player Count Adjustments

Difficulty selection can consider initial player count:

```javascript
if (playerCount < 6) {
  // Small groups can handle more complex activities
  difficultyBonus = 0.5;
} else if (playerCount > 20) {
  // Large groups need simpler coordination
  difficultyBonus = -0.5;
}
```

## Difficulty and Patterns

Relax blocks are predetermined by the match pattern, not inserted dynamically. However, difficulty curves are designed with natural break points:

- Gentle curve: More Relax blocks in the pattern
- Intense curve: Fewer Relax blocks, but still at fixed positions
- Patterns ensure breaks come before difficulty spikes

## Example Difficulty Assignments

**Round Type Base Difficulties:**
- Free For All: +0.5 (coordination challenge)
- Team Battle: +0.3 (teamwork complexity)
- Duel: +0 (simple format)
- Asymmetric: +0.2 (unusual dynamics)

**Common Combinations:**
- Normal Tag Duel: 1
- Crab Walk Tag Duel: 3
- Blindfolded Crab Walk Tag: 5
- Team Relay Race: 2
- Team Relay with Silly Voices: 3
- Mirror Free-For-All: 2
- Slow Motion Balance Duel: 3

## Benefits of Simplification

This simplified system:
- Easy to understand and predict
- Clear progression path
- Simple developer controls
- No complex "energy detection" needed
- Works perfectly with one-way communication
- Players understand "difficulty" intuitively

The game naturally gets harder and faster as it progresses, creating excitement without complex systems trying to read player state.