# Configuration Management

*This document explains customization options for players and developers.*

## Overview

Configuration Management provides two distinct levels of customization: player-facing options that affect individual match experiences, and developer-facing options that shape the entire game system. The system is designed to be flexible without being overwhelming, providing sensible defaults while allowing deep customization when needed.

## Player Customization Points

Players can customize their match experience through a simple, intuitive interface before starting:

### Match Length

Choose number of rounds to play:

```javascript
matchLength: {
  type: "select",
  label: "How many rounds should we play?",
  options: [
    { value: 5, label: "Quick (5 rounds)", description: "~10-12 minutes" },
    { value: 10, label: "Standard (10 rounds)", description: "~20-25 minutes" },
    { value: 15, label: "Extended (15 rounds)", description: "~30-35 minutes" },
    { value: 30, label: "Marathon (30 rounds)", description: "~60-70 minutes" }
  ],
  default: 10
}
```

### Difficulty Level

Choose the challenge level:

```javascript
difficultyLevel: {
  type: "select",
  label: "How challenging should it be?",
  options: [
    { value: "gentle", label: "Gentle", description: "Easy-going, perfect for beginners" },
    { value: "moderate", label: "Moderate", description: "Balanced fun and challenge" },
    { value: "intense", label: "Intense", description: "Bring on the challenge!" }
  ],
  default: "moderate",
  
  // What this affects:
  effects: {
    gentle: {
      maxDifficulty: 3,
      difficultyRamp: "slow",
      pauseMultiplier: 1.2,
      modifierProbability: 0.1
    },
    moderate: {
      maxDifficulty: 4,
      difficultyRamp: "steady",
      pauseMultiplier: 1.0,
      modifierProbability: 0.3
    },
    intense: {
      maxDifficulty: 5,
      difficultyRamp: "fast",
      pauseMultiplier: 0.8,
      modifierProbability: 0.5
    }
  }
}
```

### Game Focus

Choose what types of activities to emphasize:

```javascript
gameFocus: {
  type: "multi-select",
  label: "What kind of games do you want?",
  options: [
    { value: "competitive", label: "Competitive", icon: "🏆" },
    { value: "collaborative", label: "Team Building", icon: "🤝" },
    { value: "silly", label: "Silly & Fun", icon: "🤪" },
    { value: "physical", label: "Physical", icon: "💪" },
    { value: "creative", label: "Creative", icon: "🎨" }
  ],
  default: ["competitive", "silly"],
  
  // Adjusts weights:
  effects: {
    competitive: {
      duelWeight: 1.5,
      teamBattleWeight: 1.3,
      winConditions: true
    },
    collaborative: {
      teamBattleWeight: 1.5,
      reliefRoundWeight: 1.3,
      mixedTeams: true
    },
    silly: {
      modifierProbability: 1.5,
      sillyModifierWeight: 2.0,
      laughterYogaWeight: 1.5
    }
  }
}
```

### Team Configuration

How teams are formed:

```javascript
teamConfig: {
  teamCount: {
    type: "select",
    label: "How many teams?",
    options: [2, 3, 4],
    default: 2
  },
  
  teamSelection: {
    type: "select", 
    label: "How should we make teams?",
    options: [
      { value: "manual", label: "We'll pick" },
      { value: "random", label: "Random" },
      { value: "balanced", label: "Auto-balance by skill" },
      { value: "captains", label: "Team captains pick" }
    ],
    default: "manual"
  },
  
  teamNames: {
    type: "text",
    label: "Custom team names (optional)",
    placeholder: ["Red Team", "Blue Team"],
    maxLength: 20
  }
}
```

### Accessibility Options

Ensure everyone can play:

```javascript
accessibility: {
  visualAccommodations: {
    type: "toggle",
    label: "Visual accommodations",
    description: "Avoid blindfold modifiers",
    default: false
  },
  
  mobilityAccommodations: {
    type: "toggle",
    label: "Mobility accommodations",
    description: "Include sitting/standing options",
    default: false
  },
  
  audioAccommodations: {
    type: "toggle",
    label: "Audio accommodations",
    description: "Visual cues for audio instructions",
    default: false
  }
}
```

### Quick Start Presets

For faster setup:

```javascript
quickPresets: [
  {
    name: "Kids Party",
    icon: "🎈",
    config: {
      duration: 1200,
      intensity: "gentle",
      focus: ["silly", "creative"],
      teamSelection: "random"
    }
  },
  {
    name: "Team Building",
    icon: "🏢",
    config: {
      duration: 2700,
      intensity: "moderate",
      focus: ["collaborative", "creative"],
      teamSelection: "balanced"
    }
  },
  {
    name: "Fitness Challenge",
    icon: "💦",
    config: {
      duration: 1800,
      intensity: "extreme",
      focus: ["competitive", "physical"],
      teamSelection: "manual"
    }
  }
]
```

## Developer Customization Points

Developers can deeply customize the game system through configuration files:

### Game Flow Configuration

Control the overall game structure:

```javascript
// gameflow.config.js
export default {
  // Block type distribution
  blockTypes: {
    round: { weight: 70, minGap: 0, maxConsecutive: 4 },
    relax: { weight: 20, minGap: 2, maxConsecutive: 1 },
    announcement: { weight: 10, minGap: 5, maxConsecutive: 1 }
  },
  
  // Round type configuration
  roundTypes: {
    duel: { 
      weight: 30,
      minPlayers: 2,
      maxPlayers: 4,
      variants: ["tag", "mirror", "balance", "speed"]
    },
    team: {
      weight: 25,
      minPlayers: 4,
      maxPlayers: 40,
      variants: ["relay", "capture", "collective"]
    },
    freeForAll: {
      weight: 20,
      minPlayers: 3,
      maxPlayers: 100,
      variants: ["elimination", "collection", "freeze"]
    },
    relief: {
      weight: 15,
      minPlayers: 2,
      maxPlayers: 100,
      variants: ["meditation", "stretch", "breathing"]
    },
    special: {
      weight: 10,
      minPlayers: 2,
      maxPlayers: 100,
      variants: ["custom", "seasonal", "experimental"]
    }
  }
}
```

### Weight Modifiers

Fine-tune selection probabilities:

```javascript
// weights.config.js
export default {
  // Base weights (can be overridden in Mermaid)
  defaultWeights: {
    tag: { normal: 25, crabWalk: 25, hop: 25, backwards: 15, slowMotion: 10 },
    mirror: { instant: 30, delayed: 30, opposite: 20, chain: 20 },
    balance: { statue: 25, yoga: 25, partner: 25, group: 25 }
  },
  
  // Player count adjustments
  playerCountAdjustments: {
    small: { // 2-6 players
      duel: 1.5,          // Increase duels
      freeForAll: 0.7,    // Reduce group activities
      team: 0.8
    },
    large: { // 20+ players
      duel: 0.5,          // Halve duels
      freeForAll: 1.5,    // Increase group activities
      team: 1.5
    }
  }
}
```

### Script Templates

Customize Simon's personality and language:

```javascript
// scripts.config.js
export default {
  // Voice personality
  personality: {
    style: "enthusiastic", // enthusiastic, calm, silly, strict
    formality: "casual",   // casual, formal, mixed
    humor: "moderate",     // none, light, moderate, heavy
    pace: "dynamic"        // slow, moderate, fast, dynamic
  },
  
  // Script templates by category
  templates: {
    roundIntros: [
      "Alright everyone, Round {roundNumber} coming up!",
      "Time for Round {roundNumber}! This is gonna be good!",
      "Round {roundNumber}... let's see what we've got!",
      // Add custom variations
    ],
    
    encouragement: {
      high: ["Amazing!", "Incredible!", "You're on fire!"],
      medium: ["Great job!", "Keep it up!", "Nice work!"],
      low: ["You got this!", "Almost there!", "Don't give up!"]
    },
    
    transitions: {
      smooth: ["Moving right along...", "Next up..."],
      dramatic: ["But wait!", "Plot twist!", "Surprise!"],
      gentle: ["Let's ease into...", "Time for something different..."]
    }
  },
  
  // Language localization
  localization: {
    enabled: true,
    defaultLanguage: "en",
    supportedLanguages: ["en", "es", "fr", "de", "jp"]
  }
}
```

### Timing Configuration

Control pacing throughout the game:

```javascript
// timing.config.js
export default {
  // Base durations (seconds)
  durations: {
    rounds: {
      duel: { min: 60, default: 90, max: 180 },
      team: { min: 120, default: 180, max: 300 },
      freeForAll: { min: 90, default: 150, max: 240 },
      relief: { min: 60, default: 90, max: 120 }
    },
    
    ceremonies: {
      opening: { min: 180, default: 300, max: 480 },
      closing: { min: 120, default: 180, max: 300 }
    },
    
    relaxBlocks: {
      standard: { min: 60, default: 90, max: 120 },
      extended: { min: 120, default: 150, max: 180 }
    }
  },
  
  // Pause token base values (milliseconds)
  pauseTokens: {
    micro: 500,
    small: 1000,
    medium: 2000,
    large: 3000,
    xlarge: 4000
  },
  
  // Multiplier ranges
  multipliers: {
    difficulty: {
      easy: 1.2,      // Slower for level 1-2
      medium: 1.0,    // Normal for level 3
      hard: 0.8       // Faster for level 4-5
    },
    progression: {
      early: 1.2,
      middle: 1.0,
      late: 0.8,
      overtime: 0.6
    }
  }
}
```

### Feature Flags

Enable/disable features for testing:

```javascript
// features.config.js
export default {
  // Core features
  features: {
    predeterminedPatterns: {
      enabled: true,
      description: "Use preset block patterns for each match length"
    },
    
    varietyEnforcement: {
      enabled: true,
      description: "Prevent recent activity repetition"
    },
    
    playerRotation: {
      enabled: true,
      description: "Track and rotate player selections fairly"
    },
    
    multiLanguageAudio: {
      enabled: false,
      description: "Support multiple languages for TTS"
    }
  },
  
  // Experimental features
  experimental: {
    mermaidHotReload: true,
    voiceCommands: false,
    augmentedReality: false,
    networkMultiplayer: false
  }
}
```

### Integration Points

Configure external service connections:

```javascript
// integrations.config.js
export default {
  // Text-to-Speech
  tts: {
    provider: "webspeech", // webspeech, elevenlabs, aws, azure
    elevenLabs: {
      apiKey: process.env.ELEVEN_LABS_KEY,
      voiceId: "simon_energetic",
      model: "eleven_turbo_v2"
    }
  },
  
  // Analytics
  analytics: {
    enabled: false,
    provider: "mixpanel",
    events: ["match_start", "match_end", "round_complete"],
    anonymize: true
  },
  
  // Cloud Storage
  cloudStorage: {
    enabled: false,
    provider: "firebase",
    autoSync: true,
    syncInterval: 60 // seconds
  }
}
```

### Environment-Specific Configuration

Different settings for different contexts:

```javascript
// environments.config.js
export default {
  development: {
    debugMode: true,
    verboseLogging: true,
    skipCeremonies: true,
    quickRounds: true,
    defaultDuration: 600 // 10 min for testing
  },
  
  staging: {
    debugMode: true,
    verboseLogging: false,
    skipCeremonies: false,
    quickRounds: false,
    defaultDuration: 1800
  },
  
  production: {
    debugMode: false,
    verboseLogging: false,
    skipCeremonies: false,
    quickRounds: false,
    defaultDuration: 1800
  }
}
```

## Configuration Loading

### Load Order

Configurations are loaded and merged in order:

1. Default configurations (built-in)
2. Developer configurations (files)
3. Environment overrides
4. Player selections (runtime)
5. URL parameters (testing)

### Configuration Validation

```javascript
function validateConfig(config) {
  const schema = {
    matchDuration: { type: 'number', min: 300, max: 7200 },
    intensityLevel: { type: 'enum', values: ['gentle', 'moderate', 'energetic', 'extreme'] },
    blockTypes: { type: 'object', required: ['round', 'relax'] },
    // ... more validation
  };
  
  return validateAgainstSchema(config, schema);
}
```

### Hot Reload Support

Developer configs can be hot-reloaded:

```javascript
if (process.env.NODE_ENV === 'development') {
  watchConfigFiles('./config/', (changed) => {
    console.log(`Config changed: ${changed}`);
    reloadConfig(changed);
    applyConfigUpdates();
  });
}
```

## Best Practices

### For Players
- Keep options simple and visual
- Provide sensible defaults
- Use presets for common scenarios
- Show effects of choices clearly

### For Developers
- Comment configuration intent
- Use environment variables for secrets
- Version control config files
- Test edge case configurations
- Document custom variants

The configuration system ensures Simon Says can adapt to any group, any setting, and any play style while maintaining its core fun factor.