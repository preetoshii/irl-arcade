/**
 * Script Assembler for Simon Says
 * Builds performance scripts for plays
 */

import { configLoader } from '../systems';
import { RoundType } from '../state/types';

// ============================================
// SCRIPT TEMPLATES
// ============================================

const SCRIPT_TEMPLATES = {
  // Round intros by type
  roundIntros: {
    duel: [
      "Alright everyone, time for a DUEL!",
      "Two players, one challenge, let's go!",
      "It's time for a head-to-head battle!",
      "Get ready for an epic showdown!"
    ],
    team: [
      "Teams, assemble! It's battle time!",
      "Time for some teamwork, everyone!",
      "Teams, get ready to compete!",
      "Let's see which team reigns supreme!"
    ],
    freeForAll: [
      "EVERYONE plays in this one!",
      "All players, get ready!",
      "It's every player for themselves!",
      "Free for all madness coming up!"
    ],
    asymmetric: [
      "Time for something special!",
      "This one's a little different...",
      "Get ready for a unique challenge!",
      "Here comes a twist!"
    ]
  },

  // Variant reveals
  variantReveals: {
    tag: "This will be... [medium] TAG!",
    mirror: "Time for... [medium] MIRROR MATCH!",
    balance: "Let's test your... [medium] BALANCE!",
    speed: "How fast can you go? [medium] SPEED CHALLENGE!",
    relay: "It's a... [medium] RELAY RACE!",
    capture: "Get ready for... [medium] CAPTURE THE FLAG!",
    collective: "Everyone together for... [medium] GROUP CHALLENGE!",
    elimination: "Last one standing in... [medium] ELIMINATION!",
    freeze: "Don't move! It's... [medium] FREEZE TAG!",
    infection: "Watch out! [medium] INFECTION is spreading!",
    protector: "Defend your team in... [medium] PROTECTOR!",
    hunter: "The hunt begins! [medium] HUNTER mode!"
  },

  // Sub-variant reveals
  subVariantReveals: {
    backwards: "But wait... [small] you must go BACKWARDS!",
    crabWalk: "Oh, and... [small] CRAB WALK ONLY!",
    hop: "Plot twist... [small] you can only HOP!",
    slowMotion: "Everything must be in... [small] SLOW MOTION!"
  },

  // Modifier reveals
  modifierReveals: {
    blindfold: "AND {player1}... [large] you'll be BLINDFOLDED!",
    teamChant: "While you play... [medium] your team must CHANT your name!",
    animalNoises: "Everyone must make... [medium] ANIMAL NOISES!",
    sillyVoices: "Use your SILLIEST voice... [medium] the whole time!",
    countdown: "You have exactly... [medium] 30 SECONDS!"
  },

  // Countdowns
  countdowns: {
    standard: "Ready... [small] Set... [small] GO!",
    dramatic: "3 [micro] 2 [micro] 1 [micro] GO GO GO!",
    silly: "Ready... [small] Spaghetti... [small] RAVIOLI!",
    quick: "GO!"
  },

  // During play encouragement
  duringPlay: {
    general: [
      "Keep going!",
      "You're doing great!",
      "30 seconds left!",
      "Almost there!",
      "Don't give up!"
    ],
    intense: [
      "FASTER! FASTER!",
      "This is INTENSE!",
      "Push yourself!",
      "INCREDIBLE effort!"
    ],
    silly: [
      "This is hilarious!",
      "I can't stop laughing!",
      "Pure chaos!",
      "Beautiful madness!"
    ]
  },

  // Endings
  endings: {
    standard: "TIME'S UP! [medium] Everyone freeze!",
    dramatic: "AND... [large] STOP! [medium] Nobody move!",
    celebration: "AMAZING! [medium] That was incredible!"
  },

  // Outros
  outros: {
    general: [
      "Incredible effort from everyone!",
      "That was absolutely fantastic!",
      "Give yourselves a round of applause!",
      "You all played amazingly!"
    ],
    duel: [
      "What a battle!",
      "Both players gave it their all!",
      "That was an epic showdown!"
    ],
    team: [
      "Fantastic teamwork!",
      "Both teams were incredible!",
      "That's how you work together!"
    ]
  },

  // Ceremony scripts
  ceremony: {
    opening: {
      welcome: [
        "WELCOME WELCOME WELCOME to Simon Says!",
        "Hello everyone! Ready for some FUN?",
        "Greetings players! Time for Simon Says!"
      ],
      explanation: [
        "We'll play {totalRounds} amazing rounds of games!",
        "Get ready for {duration} minutes of pure fun!",
        "Here's how it works: I'll tell you what to play, and you play it!"
      ],
      teamBuilding: [
        "{team1}, let me hear your battle cry!",
        "Teams, show me your victory dance!",
        "Each team, create your secret handshake!"
      ]
    },
    closing: {
      celebration: [
        "THAT WAS AMAZING! Everyone jump and cheer!",
        "You've all been INCREDIBLE players!",
        "What an absolutely fantastic match!"
      ],
      thanks: [
        "Thank you all for bringing such amazing energy!",
        "You've made this so much fun!",
        "Until next time, keep playing!"
      ]
    }
  },

  // Relax block scripts
  relax: {
    intro: [
      "Time to catch our breath!",
      "Let's take a moment to relax.",
      "Everyone, let's calm down for a bit."
    ],
    activities: {
      stretching: [
        "Reach up high... [large] and down to your toes!",
        "Roll your shoulders back... [medium] and forward.",
        "Stretch to the left... [medium] and to the right!"
      ],
      breathing: [
        "Take a deep breath in... [large] and out...",
        "Breathe in through your nose... [medium] out through your mouth.",
        "Feel that oxygen filling your lungs!"
      ],
      groupActivity: [
        "Everyone form a circle!",
        "Find a partner and give them a high five!",
        "Let's do the wave!"
      ]
    },
    outro: [
      "Feeling refreshed? Let's keep playing!",
      "All relaxed? Time for more games!",
      "That was nice! Ready for more action?"
    ]
  }
};

// ============================================
// SCRIPT ASSEMBLER CLASS
// ============================================

class ScriptAssembler {
  constructor() {
    this.templates = SCRIPT_TEMPLATES;
    this.customTemplates = new Map();
  }

  /**
   * Assemble scripts for a play
   * @param {Object} play - The play object
   * @param {Object} context - Additional context
   * @returns {Object} Assembled scripts
   */
  assembleScripts(play, context) {
    // Route to appropriate assembler
    if (play.blockType === 'round') {
      return this.assembleRoundScripts(play, context);
    } else if (play.blockType === 'ceremony') {
      return this.assembleCeremonyScripts(play, context);
    } else if (play.blockType === 'relax') {
      return this.assembleRelaxScripts(play, context);
    }
    
    throw new Error(`Unknown block type: ${play.blockType}`);
  }

  /**
   * Assemble scripts for a round play
   */
  assembleRoundScripts(play, context) {
    const scripts = {};
    const personality = this.getPersonality();
    
    // Introduction
    scripts.intro = this.selectScript(
      this.templates.roundIntros[play.roundType],
      personality
    );
    
    // Player selection (for non-FFA)
    if (play.roundType !== 'freeForAll') {
      scripts.playerSelect = this.buildPlayerSelectScript(play, context);
    }
    
    // Variant reveal
    if (this.templates.variantReveals[play.variant]) {
      scripts.variantReveal = this.templates.variantReveals[play.variant];
    } else {
      scripts.variantReveal = `Time for... [medium] ${play.variant.toUpperCase()}!`;
    }
    
    // Sub-variant reveal
    if (play.subVariant && play.subVariant !== 'normal') {
      scripts.subVariantReveal = this.templates.subVariantReveals[play.subVariant] ||
        `And you must... [small] ${play.subVariant.toUpperCase()}!`;
    }
    
    // Modifier reveal
    if (play.modifier) {
      scripts.modifierReveal = this.templates.modifierReveals[play.modifier] ||
        `Plus... [medium] ${play.modifier.toUpperCase()}!`;
    }
    
    // Rules explanation
    scripts.rules = this.buildRulesScript(play, context);
    
    // Positioning (if needed)
    if (this.needsPositioning(play)) {
      scripts.positioning = this.buildPositioningScript(play, context);
    }
    
    // Countdown
    const countdownStyle = this.getCountdownStyle(play, context);
    scripts.countdown = this.templates.countdowns[countdownStyle];
    
    // During play (optional)
    if (play.duration > 60) {
      scripts.during = this.selectMultipleScripts(
        this.templates.duringPlay[this.getEncouragementStyle(play, context)],
        3
      );
    }
    
    // Ending
    const endingStyle = context.isLastRound ? 'celebration' : 'standard';
    scripts.ending = this.templates.endings[endingStyle];
    
    // Outro
    const outroCategory = play.roundType === 'duel' ? 'duel' : 
                         play.roundType === 'team' ? 'team' : 'general';
    scripts.outro = this.selectScript(this.templates.outros[outroCategory]);
    
    // Process tokens
    return this.processTokens(scripts, play, context);
  }

  /**
   * Assemble scripts for a ceremony
   */
  assembleCeremonyScripts(play, context) {
    const scripts = {};
    const ceremonyType = play.ceremonyType;
    const templates = this.templates.ceremony[ceremonyType];
    
    if (ceremonyType === 'opening') {
      scripts.welcome = this.selectScript(templates.welcome);
      scripts.explanation = this.selectScript(templates.explanation);
      scripts.teamBuilding = this.selectScript(templates.teamBuilding);
    } else if (ceremonyType === 'closing') {
      scripts.celebration = this.selectScript(templates.celebration);
      scripts.thanks = this.selectScript(templates.thanks);
    }
    
    return this.processTokens(scripts, play, context);
  }

  /**
   * Assemble scripts for a relax block
   */
  assembleRelaxScripts(play, context) {
    const scripts = {};
    
    scripts.intro = this.selectScript(this.templates.relax.intro);
    
    // Select activity
    const activity = play.activity || 'stretching';
    const activityScripts = this.templates.relax.activities[activity] || 
                          this.templates.relax.activities.stretching;
    
    scripts.instructions = this.selectMultipleScripts(activityScripts, 3);
    scripts.outro = this.selectScript(this.templates.relax.outro);
    
    return this.processTokens(scripts, play, context);
  }

  /**
   * Build player selection script
   */
  buildPlayerSelectScript(play, context) {
    const players = play.players;
    
    if (play.roundType === 'duel') {
      return `{player1} from {team1}, step forward! [small] And facing them... ` +
             `[medium] {player2} from {team2}!`;
    }
    
    if (play.roundType === 'team') {
      return `{team1}, you're up! [small] Versus... [medium] {team2}!`;
    }
    
    if (play.roundType === 'asymmetric') {
      // Custom script based on variant
      if (play.variant === 'infection') {
        return `{infected} from {team1}, you're infected! [medium] Everyone else... RUN!`;
      }
      return `Special players selected! [small] Listen carefully for your role!`;
    }
    
    return "Players selected!";
  }

  /**
   * Build rules explanation script
   */
  buildRulesScript(play, context) {
    const rules = [];
    
    // Base rule for variant
    const variantRules = {
      tag: "{player1} must tag {player2}!",
      mirror: "{player2} must copy everything {player1} does!",
      balance: "Hold your balance position as long as possible!",
      speed: "Complete the challenge as fast as you can!",
      relay: "Pass the baton to your teammates!",
      capture: "Steal the flag from the other team!",
      freeze: "If you're tagged, freeze until a teammate saves you!",
      infection: "If you're tagged, you become infected too!"
    };
    
    rules.push(variantRules[play.variant] || "Follow the rules!");
    
    // Add sub-variant rule
    if (play.subVariant && play.subVariant !== 'normal') {
      const subVariantRules = {
        backwards: "Remember, only move backwards!",
        crabWalk: "Stay in crab walk position the whole time!",
        hop: "Both feet must leave the ground!",
        slowMotion: "Everything in slow motion - no rushing!"
      };
      rules.push(subVariantRules[play.subVariant] || "");
    }
    
    // Add modifier rule
    if (play.modifier) {
      const modifierRules = {
        blindfold: "{team1} can shout directions!",
        teamChant: "Teams, keep chanting!",
        animalNoises: "I better hear those animal sounds!",
        sillyVoices: "Normal voices = disqualified!",
        countdown: "You have exactly 30 seconds!"
      };
      rules.push(modifierRules[play.modifier] || "");
    }
    
    return rules.filter(r => r).join(" [small] ");
  }

  /**
   * Build positioning script
   */
  buildPositioningScript(play, context) {
    if (play.roundType === 'duel') {
      return "Take your positions... [medium] {player1} in the center, {player2} at the edge!";
    }
    
    if (play.roundType === 'team') {
      return "Teams, line up on opposite sides!";
    }
    
    return "Everyone find your starting position!";
  }

  /**
   * Check if play needs positioning instructions
   */
  needsPositioning(play) {
    return play.roundType === 'duel' || 
           play.roundType === 'team' ||
           play.variant === 'relay';
  }

  /**
   * Get countdown style
   */
  getCountdownStyle(play, context) {
    if (context.isLastRound) return 'dramatic';
    if (play.modifier === 'countdown') return 'quick';
    if (context.personalityStyle === 'silly') return 'silly';
    return 'standard';
  }

  /**
   * Get encouragement style
   */
  getEncouragementStyle(play, context) {
    if (play.modifier && ['sillyVoices', 'animalNoises'].includes(play.modifier)) {
      return 'silly';
    }
    if (play.difficulty >= 4 || context.isLateMatch) {
      return 'intense';
    }
    return 'general';
  }

  /**
   * Select a random script from options
   */
  selectScript(options, style = null) {
    if (!options || options.length === 0) return "";
    
    // Could implement style-based selection here
    const index = Math.floor(Math.random() * options.length);
    return options[index];
  }

  /**
   * Select multiple scripts without repetition
   */
  selectMultipleScripts(options, count) {
    if (!options || options.length === 0) return [];
    
    const selected = [];
    const available = [...options];
    
    for (let i = 0; i < count && available.length > 0; i++) {
      const index = Math.floor(Math.random() * available.length);
      selected.push(available[index]);
      available.splice(index, 1);
    }
    
    return selected;
  }

  /**
   * Process tokens in scripts
   */
  processTokens(scripts, play, context) {
    const tokens = this.buildTokenMap(play, context);
    const processed = {};
    
    Object.entries(scripts).forEach(([key, value]) => {
      if (typeof value === 'string') {
        processed[key] = this.replaceTokens(value, tokens);
      } else if (Array.isArray(value)) {
        processed[key] = value.map(v => this.replaceTokens(v, tokens));
      } else {
        processed[key] = value;
      }
    });
    
    return processed;
  }

  /**
   * Build token map from play and context
   */
  buildTokenMap(play, context) {
    const tokens = {};
    
    // Player tokens
    if (play.players) {
      if (play.players.player1) {
        tokens.player1 = play.players.player1.name;
        tokens.team1 = play.players.player1.team;
      }
      if (play.players.player2) {
        tokens.player2 = play.players.player2.name;
        tokens.team2 = play.players.player2.team;
      }
      
      // Team tokens
      if (play.players.team1) {
        tokens.team1 = context.teamNames?.[0] || "Team 1";
      }
      if (play.players.team2) {
        tokens.team2 = context.teamNames?.[1] || "Team 2";
      }
      
      // Special role tokens
      Object.entries(play.players).forEach(([role, data]) => {
        if (data && data.name) {
          tokens[role] = data.name;
        }
      });
    }
    
    // Context tokens
    tokens.roundNumber = context.currentRound || 1;
    tokens.totalRounds = context.totalRounds || 10;
    tokens.duration = Math.round((context.matchDuration || 1800) / 60);
    
    // Generic tokens
    tokens.everyone = "everyone";
    tokens.teams = "all teams";
    
    return tokens;
  }

  /**
   * Replace tokens in text
   */
  replaceTokens(text, tokens) {
    let processed = text;
    
    Object.entries(tokens).forEach(([key, value]) => {
      const regex = new RegExp(`\\{${key}\\}`, 'g');
      processed = processed.replace(regex, value);
    });
    
    return processed;
  }

  /**
   * Get personality settings
   */
  getPersonality() {
    return configLoader.get('scripts.personality', {
      style: 'enthusiastic',
      formality: 'casual',
      humor: 'moderate',
      pace: 'dynamic'
    });
  }

  /**
   * Add custom templates
   */
  addCustomTemplates(category, templates) {
    if (!this.customTemplates.has(category)) {
      this.customTemplates.set(category, []);
    }
    
    const existing = this.customTemplates.get(category);
    existing.push(...templates);
  }

  /**
   * Get all templates for a category
   */
  getTemplates(category) {
    const standard = this.templates[category] || [];
    const custom = this.customTemplates.get(category) || [];
    return [...standard, ...custom];
  }
}

// Create singleton instance
const scriptAssembler = new ScriptAssembler();

// Export both instance and class
export default scriptAssembler;
export { ScriptAssembler, SCRIPT_TEMPLATES };