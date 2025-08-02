# Choosing a Play

*This document explains how the system builds a Play - the final, ready-to-perform game moment.*

## Play Definition

A Play is the complete, ready-to-perform specification for a single Block. It contains every decision needed for execution, leaving no ambiguity for Simon or the players. Think of it as a detailed recipe that Simon follows to create a theatrical moment.

### Anatomy of a Play

**For a Round Block Play:**
```javascript
{
  blockType: "round",
  roundType: "duel",
  variant: "tag",
  subVariant: "crabWalk",
  modifier: "chanting-team-name",
  players: {
    player1: { name: "Alice", team: "Red" },
    player2: { name: "Bob", team: "Blue" }
  },
  duration: 90,
  scripts: {
    intro: "Time for a TAG DUEL!",
    playerSelect: "Alice from Red, Bob from Blue!",
    rules: "Alice, you have to tag Bob. But here's the twist...",
    modifier: "you have to walk like a crab!",
    start: "Ready... Set... GO!"
  }
}
```

**For a Relax Block Play:**
```javascript
{
  blockType: "relax",
  activity: "groupStretching",
  formation: "circle",
  duration: 90,
  scripts: {
    intro: "Time to catch our breath!",
    instruction: "Everyone reach up high... and down low..."
  }
}
```

## Selection Process

The system builds a Play through a cascading decision tree, with each level narrowing the possibilities:

### Step 1: Block Type Selection
First, determine what kind of Block comes next based on:
- Match pattern (predetermined sequence for the match length)
- Current position in the pattern


### Step 2: Type-Specific Selection

**For Round Blocks:**
1. **Round Type** (Duel/Team/FFA/Relief/Special)
   - Weighted selection based on defaults
   - Modified by recent history
   - Influenced by player count

2. **Variant** (Tag/Mirror/Balance/etc.)
   - Each Round Type has specific variants
   - Weighted within that type's options
   - Some variants require minimum players

3. **Sub-Variant** (Normal/CrabWalk/Hop/etc.)
   - Further specialization of movement
   - Can be universal or variant-specific
   - Affects difficulty and fun factor

4. **Modifier** (Optional: Blindfold/Chanting/etc.)
   - Probability of adding decreases with complexity
   - More likely in later rounds
   - Can stack (but rarely)

5. **Player Selection**
   - Based on Round Type requirements
   - Considers recent participation
   - Balances teams and matchups

**For Relax Blocks:**
1. **Activity Type** (Stretching/Breathing/Creative/Social)
   - Variety from recent Relax Blocks
   - Group number considerations

2. **Specific Activity** (Which stretch routine, etc.)
   - Detailed implementation
   - Duration consideration


**For Ceremony Blocks:**
1. **Ceremony Type** (Opening/Closing)
   - Determined by match position
   - Has relatively fixed structure


### Step 3: Script Selection
Once all gameplay decisions are made:
- Pull appropriate script templates
- Fill in player names and team details
- Add contextual flourishes
- Include timing and pauses

### Step 4: Final Assembly
Combine all selections into a complete Play object that Simon can execute theatrically.

## Weightages

Weights determine the probability of each option being selected. They create the "feel" of the game by making some things common and others rare.

### Default Weight Examples

**Round Type Weights:**
- Duel Battle: 30% (frequent but not overwhelming)
- Team Battle: 25% (good for larger groups)
- Free For All: 20% (inclusive but chaotic)
- Relief Round: 15% (necessary breathers)
- Special Round: 10% (keep it special)

**Tag Variant Weights (within Duel):**
- Normal Tag: 25% (the classic)
- Crab Walk: 25% (equally common, very fun)
- Hop Tag: 25% (accessible silliness)
- Backwards: 15% (bit harder)
- Slow Motion: 10% (special treat)

### Weight Modification Factors

**Recent History Penalty:**
- If just played: Weight × 0.3
- If played 1 round ago: Weight × 0.6
- If played 2 rounds ago: Weight × 0.8
- If played 3+ rounds ago: Weight × 1.0

**Player Count Scaling:**
- Few players (2-6): Boost Duel weights
- Many players (15+): Boost Team/FFA weights
- Adjust weights to match group size

### Difficulty Progression

**Based on Round Number:**
- Early rounds (1-3): Prefer easier variants (difficulty 1-2)
- Middle rounds: Use full range (difficulty 2-4)
- Final rounds: Allow harder variants (difficulty 3-5)
- Follows the selected difficulty curve (gentle/steady/roller coaster)

## Player Count Adaptations

The system intelligently adapts selections based on how many players are present:

### Small Groups (2-6 players)

**Adjustments:**
- Boost Duel Battle to 40-50%
- Reduce Team Battle to 10-15%
- Free For All becomes more intimate
- Relax Blocks might be shorter
- Everyone plays in almost every round

**Special Considerations:**
- More individual attention
- Longer turns per player
- Can do more complex individual challenges
- Team formation might be fixed pairs

### Medium Groups (7-15 players)

**Adjustments:**
- Standard weight distribution
- All round types work well
- Teams of 3-7 each
- Good mix of participation

**Special Considerations:**
- Ideal for most variants
- Can have spectator moments
- Team dynamics emerge
- Standard selection rotation

### Large Groups (16-30 players)

**Adjustments:**
- Boost Team Battle to 35%
- Boost Free For All to 30%
- Reduce Duel to 15-20%
- More frequent Relax Blocks
- Shorter individual turns

**Special Considerations:**
- Emphasis on inclusive activities
- May need assistant coaches
- Louder Simon delivery needed
- Quick player selection important

### Huge Groups (30+ players)

**Adjustments:**
- Team and FFA dominate (70%+)
- Duels become special showcases
- Relief rounds more frequent
- Multiple simultaneous activities

**Special Considerations:**
- May split into sub-groups
- Need very clear instructions
- Visual cues helpful
- Energy management crucial

### Odd Number Adaptations

**For Duels with Odd Players:**
- Three-way duels
- Rotating "judge" role
- Team assistance allowed
- Winner stays format

**For Team Activities:**
- Uneven teams are fine
- Smaller team gets advantages
- Rotating extra player
- Special roles for odd player out

## Selection Summary

The selection process appears random to players but is actually a structured system that:
- Prevents recent repeats through history tracking
- Adapts to player count automatically
- Follows a predetermined difficulty progression
- Ensures variety through weighted random selection
- Creates surprising and delightful combinations

Each Play is selected fresh at the start of each round, using the current player list and simple rules to create engaging moments.