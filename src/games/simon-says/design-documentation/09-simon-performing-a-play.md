# Simon Performing a Play

*This document explains how Simon theatrically delivers the selected Play.*

## Overview

Simon is the main orchestrator - transforming data structures into theatrical experiences. The performance system takes a fully-specified Play and brings it to life through carefully crafted speech, dramatic timing, and responsive delivery. Players experience Simon as fun, oddly robotic host who makes every moment feel special and spontaneous.

## What is Passed to Simon

### The Play Object

Simon receives a complete Play object containing all necessary information:

```javascript
{
  // Core identifiers
  blockType: "round",
  roundType: "duel",
  variant: "tag",
  subVariant: "crabWalk",
  modifier: "blindfolded",
  
  // Selected players
  players: {
    player1: { name: "Alice", team: "Red Rockets" },
    player2: { name: "Bob", team: "Blue Lightning" }
  },
  
  // Timing information
  duration: 90,
  intensity: "high",
  
  // Script templates
  scripts: {
    intro: "Time for a {roundType} battle!",
    playerSelect: "{player1} from {team1}, step forward! And facing them... {player2} from {team2}!",
    variantReveal: "This will be... [medium] TAG!",
    subVariantReveal: "But wait... [small] CRAB WALK ONLY!",
    modifierReveal: "Oh, and {player1}... [large] you'll be BLINDFOLDED!",
    rules: "Remember, {player1} is IT and must tag {player2} while blindfolded. {team1} can shout directions!",
    positioning: "Take your positions... {player1} in the center, {player2} at the edge!",
    countdown: "Ready... [small] Set... [small] GO!",
    during: [
      "Keep going, {player1}!",
      "{player2}, watch out!",
      "30 seconds left!",
      "{team1}, guide your player!"
    ],
    ending: "TIME'S UP! [medium] Everyone freeze!",
    outro: "Incredible effort from both players!"
  },
  
  // Performance hints
  performanceHints: {
    energy: "high",
    buildSuspense: true,
    audienceFocus: "player1",
    comedyPotential: "high"
  }
}
```

### Context Information

Beyond the Play itself, Simon also receives:

```javascript
{
  matchState: {
    currentRound: 5,
    totalRounds: 10,
    timeElapsed: "12:34",
    timeRemaining: "17:26"
  },
  
  recentHistory: {
    lastRoundType: "team",
    lastWinner: "Blue Lightning",
    playerMoods: { alice: "confident", bob: "nervous" }
  },
  
  environmentalContext: {
    energyLevel: 0.75,
    pauseMultiplier: 0.9,
    audienceSize: 24,
    weather: "sunny"
  }
}
```

## Pausing System/Tokens

### Pause Token Definitions

Pauses are the breath of theatrical delivery. They build suspense, allow processing time, and create rhythm:

**Base Pause Durations:**
- `[micro]` = 500ms - Quick breath, comma-like
- `[small]` = 1000ms - Period pause, moment to process
- `[medium]` = 2000ms - Dramatic beat, anticipation
- `[large]` = 3000ms - Major transition, big reveal
- `[xlarge]` = 4000ms - Maximum suspense, rare use

### Pause Token Usage

**In Script Templates:**
```
"Alright everyone... [medium] Round 5!"
"The winner is... [large] BLUE TEAM!"
"3 [micro] 2 [micro] 1 [micro] GO!"
```

**Dynamic Pause Insertion:**
Simon can insert pauses based on context:
- Before player names (build anticipation)
- Before revealing variants (create suspense)
- After surprising announcements (let it sink in)
- Between instruction steps (ensure understanding)

### Pause Multiplier System

All pauses are modified by the current multiplier:

```javascript
actualPause = basePauseDuration * pauseMultiplier;

// Examples:
// High energy (0.7x): [medium] = 2000ms * 0.7 = 1400ms
// Low energy (1.3x): [medium] = 2000ms * 1.3 = 2600ms
// Speed round (0.5x): [small] = 1000ms * 0.5 = 500ms
```

### Advanced Pause Techniques

**Crescendo Pauses:**
Increasing pause length for building excitement:
```
"The variants will be... [small] Tag... [medium] Crab Walk... [large] BLINDFOLDED!"
```

**Staccato Pauses:**
Rapid-fire delivery with micro pauses:
```
"Go [micro] go [micro] go [micro] FASTER!"
```

**Pregnant Pauses:**
Extended pauses for maximum impact:
```
"And the winner... [xlarge] [exhale sound] ... is..."
```

## Script Tokens

### Variable Tokens

Scripts use tokens that get replaced with actual values:

**Player Tokens:**
- `{player1}`, `{player2}` - Player names
- `{team1}`, `{team2}` - Team names
- `{winner}`, `{loser}` - Result-based names
- `{everyone}` - All players
- `{spectators}` - Non-playing players

**Game State Tokens:**
- `{roundNumber}` - Current round
- `{timeLeft}` - Remaining time
- `{score}` - Current score
- `{variant}` - Selected variant name

**Dynamic Tokens:**
- `{excitement}` - Excitement word based on energy
- `{encouragement}` - Contextual encouragement
- `{transition}` - Appropriate transition phrase

### Script Variation System

To prevent repetition, many script points have multiple options:

```javascript
introVariations: [
  "Alright everyone, time for Round {roundNumber}!",
  "Here we go with Round {roundNumber}!",
  "Round {roundNumber} coming right up!",
  "Let's dive into Round {roundNumber}!",
  "Who's ready for Round {roundNumber}?"
]

// Simon randomly selects from variations
selectedIntro = randomChoice(introVariations);
```

### Contextual Script Modifiers

Scripts adapt based on context:

**Energy-Based Variations:**
```javascript
highEnergy: "LET'S GO! {player1} versus {player2}!"
mediumEnergy: "Next up, {player1} faces {player2}!"
lowEnergy: "Gently now, {player1} and {player2}, take your time."
```

**Time-Based Variations:**
```javascript
earlyMatch: "Let me explain the rules carefully..."
midMatch: "You know the drill..."
lateMatch: "Quick rules reminder..."
```

### Special Script Categories

**Hype Scripts:**
Building excitement and energy

**Instruction Scripts:**
Clear, step-by-step guidance

**Transition Scripts:**
Smooth movement between segments

**Recovery Scripts:**
Calming and centering language

**Celebration Scripts:**
Acknowledging achievements

## TTS Voice Management

### Voice Architecture

The system is designed for voice provider flexibility:

```javascript
class VoiceManager {
  constructor(provider = "webspeech") {
    this.provider = provider;
    this.voiceConfig = this.loadVoiceConfig();
  }
  
  async speak(text, options = {}) {
    switch(this.provider) {
      case "webspeech":
        return this.speakWebSpeech(text, options);
      case "elevenlabs":
        return this.speakElevenLabs(text, options);
      case "amazon":
        return this.speakPolly(text, options);
    }
  }
}
```

### Web Speech API (Default)

Current implementation uses browser's built-in TTS:

```javascript
speakWebSpeech(text, options) {
  const utterance = new SpeechSynthesisUtterance(text);
  
  // Voice selection
  utterance.voice = this.selectedVoice || this.findBestVoice();
  
  // Prosody controls
  utterance.rate = options.rate || 1.0;
  utterance.pitch = options.pitch || 1.0;
  utterance.volume = options.volume || 1.0;
  
  // Speak
  speechSynthesis.speak(utterance);
}
```

### Eleven Labs Integration (Future)

Prepared for premium voice integration:

```javascript
async speakElevenLabs(text, options) {
  const response = await fetch('https://api.elevenlabs.io/v1/text-to-speech', {
    method: 'POST',
    headers: {
      'xi-api-key': process.env.ELEVEN_LABS_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      text: text,
      voice_id: options.voiceId || 'simon_default',
      voice_settings: {
        stability: 0.75,
        similarity_boost: 0.75,
        style: options.style || 'enthusiastic',
        use_speaker_boost: true
      }
    })
  });
  
  const audio = await response.blob();
  return this.playAudio(audio);
}
```

### Voice Performance Options

**Expression Styles:**
- Excited: Higher pitch, faster rate
- Calm: Lower pitch, slower rate
- Mysterious: Lower pitch, many pauses
- Urgent: Higher rate, louder volume
- Celebration: Varied pitch, high energy

**Dynamic Adjustments:**
```javascript
// Adjust based on content
if (text.includes("!")) {
  options.pitch *= 1.1;  // Slightly higher for excitement
  options.rate *= 1.05;  // Slightly faster
}

// Adjust based on energy
options.rate *= (0.8 + energyLevel * 0.4); // 0.8x to 1.2x
```

## Performance Flow

### Pre-Performance Phase
1. Receive Play object
2. Process context information
3. Select script variations
4. Calculate timing adjustments
5. Prepare voice settings

### Performance Phases

**1. Introduction Phase**
- Announce what's coming
- Build anticipation
- Set the tone

**2. Selection Phase**
- Dramatically reveal players
- Create personal moments
- Build investment

**3. Explanation Phase**
- Clear rules delivery
- Ensure understanding
- Build complexity gradually

**4. Preparation Phase**
- Position players
- Final reminders
- Build to start

**5. Action Phase**
- Initiate gameplay
- Provide commentary
- Maintain energy

**6. Conclusion Phase**
- Clear ending
- Celebrate effort
- Transition smoothly

### Performance Adaptations

**For Different Round Types:**
- Duels: Focus on individual drama
- Teams: Emphasize collaboration
- FFA: Create controlled chaos
- Relief: Gentle, inclusive tone

**For Different Energy Levels:**
- High: Rapid delivery, short pauses
- Medium: Balanced pacing
- Low: Gentle delivery, longer pauses

**For Different Group Sizes:**
- Small: Intimate, personal
- Medium: Balanced projection
- Large: Big, clear, repeated info



### Common Performance Patterns

**The Build-Up:**
Start calm → Build excitement → Peak at "GO!"

**The Reveal:**
Tease → Pause → Reveal → React

**The Wind-Down:**
High energy → Acknowledge → Calm → Transition

**The Surprise:**
Normal → Normal → UNEXPECTED! → Process

## Integration Examples

### High-Energy Duel Performance
```
Simon: "ROUND 7!" [small]
"Who's ready for something INTENSE?" [medium]
"Alice from the Red Rockets!" [small]
"Versus..." [large]
"Bob from Blue Lightning!" [small]
"This is going to be..." [medium]
"MIRROR MATCH MADNESS!" [micro]
"Here's the twist..." [large]
"EVERYTHING IN SLOW MOTION!"
```

### Calm Relax Block Performance
```
Simon: "Beautiful work everyone." [medium]
"Let's take a moment..." [large]
"Everyone find some space..." [medium]
"And breeeeathe with me..." [large]
"In..." [xlarge]
"And out..." [xlarge]
"Feel that? That's teamwork in your lungs."
```

The performance system transforms mechanical game management into memorable experiences, making every match feel like a custom show created just for that group.