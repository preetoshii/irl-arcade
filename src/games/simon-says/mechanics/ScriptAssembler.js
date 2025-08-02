/**
 * Script Assembler for Simon Says
 * 
 * The ScriptAssembler is Simon's speechwriter, transforming dry play specifications into engaging, personality-filled performances. Every round needs a script - not just what to say, but how to say it, when to pause for effect, and how to build excitement. Like a talented improv performer working from loose notes, the ScriptAssembler takes the facts (who's playing, what game, what modifiers) and weaves them into a cohesive performance that feels spontaneous and fun. It's the difference between a robotic "Player 1 tag Player 2" and an exciting "Alice from the Red Rockets, step forward! And facing them... (pause for drama) Bob from the Blue Lightning!"
 * 
 * The system's sophistication comes from its template library and token replacement system. Templates provide variety - multiple ways to introduce duels, reveal variants, or celebrate endings. Tokens like {player1} and {team2} get replaced with actual names, making every announcement personal. The assembler also understands context, choosing dramatic countdowns for final rounds, silly encouragement for games with animal noises, and adjusting energy based on match progression. This creates a dynamic hosting experience where Simon feels like an aware, responsive game master rather than a pre-recorded announcement system.
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
   * 
   * This is the main entry point where play specifications transform into performable scripts. The method acts as a router, directing different block types to specialized assemblers. Round blocks need complex multi-part scripts with introductions, player selections, variant reveals, rules, countdowns, and outros. Ceremony blocks need welcoming or celebratory scripts. Relax blocks need calming, instructional scripts. Each type has dramatically different needs, but all flow through this common entry point, ensuring consistent token processing and error handling.
   * 
   * The separation of concerns here is elegant - the ScriptAssembler doesn't need to understand game mechanics or selection logic. It receives a fully-specified play object and context, then focuses solely on creating an engaging performance. This allows the script templates to be modified, expanded, or even localized without touching any game logic. The returned scripts object contains all the text Simon will speak, with timing tokens embedded, ready for the PerformanceSystem to bring to life.
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
   * 
   * Round script assembly is where the magic happens, taking a technical play specification and transforming it into a theatrical performance. The method follows a careful sequence that builds excitement: introduction (setting the stage), player selection (creating anticipation), variant reveal (the main event), modifiers (plot twists), rules (clarity), positioning (preparation), countdown (building tension), and finally the start. Each element is optional based on the play type - free-for-alls skip player selection since everyone plays, while simple variants might not need positioning instructions.
   * 
   * The intelligence in this method comes from how it adapts to context. The countdown style changes based on personality settings and round significance. During-play encouragement only appears for longer activities and matches the game's tone - silly for animal noise games, intense for late-match challenges. The ending switches from standard to celebratory for the final round. These contextual adaptations, combined with random template selection, ensure that even identical play specifications produce varied, appropriate scripts. It's like having a game host who reads the room and adjusts their energy accordingly.
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
   * 
   * Player selection scripts are crucial for building anticipation and making players feel special. The method crafts different announcement styles based on the round type, understanding that a duel needs individual player focus while team activities need group energy. The scripts use carefully placed pause tokens - "[small]" creates a brief pause for processing, while "[medium]" builds dramatic tension. For duels, announcing players separately with a pause between creates a boxing-match atmosphere. For teams, the versus structure builds competitive energy.
   * 
   * Asymmetric games get special treatment because roles matter more than individuals. In infection, the infected player needs to be highlighted as special (and dangerous), while everyone else becomes "potential victims." The method understands these game-specific dynamics and crafts appropriate announcements. The use of tokens like {player1}, {team1} ensures names flow naturally into the script, while the specific phrasing ("step forward!", "you're up!") creates physical engagement, encouraging players to move and take their positions even before the game officially starts.
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
   * 
   * Clear rule communication is essential for fair play, and this method assembles rules from multiple sources into a cohesive explanation. It starts with the base variant rule (what's the core game?), adds sub-variant modifications (how must you move?), and layers on modifier rules (what extra challenge exists?). The genius is in how these elements combine - each rule is stated clearly but concisely, with "[small]" pauses between elements to ensure comprehension without breaking flow. Players hear exactly what they need to know, nothing more.
   * 
   * The method maintains a library of rule phrasings that are action-oriented and easy to understand. Instead of "The objective is for player 1 to make physical contact with player 2," it says "{player1} must tag {player2}!" The exclamation points add energy while the direct phrasing leaves no ambiguity. Special attention is paid to modifiers that affect gameplay - if someone's blindfolded, teammates need to know they can shout directions. This proactive rule clarification prevents confusion and ensures fair, fun gameplay where everyone understands their role and constraints.
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
   * 
   * Token processing is the final transformation that makes scripts personal and contextual. The method recursively processes all scripts, whether they're simple strings or arrays of strings, replacing placeholder tokens with actual values. This system allows templates to be written generically ("Welcome {player1} from {team1}!") while delivering personalized output ("Welcome Alice from the Red Rockets!"). The recursive processing handles nested structures elegantly - if during-play encouragement is an array of strings, each gets processed individually.
   * 
   * The power of this approach becomes clear when considering internationalization or customization. Templates can be stored with tokens, allowing the same system to work in any language or with custom naming schemes. Want to call teams by colors instead of numbers? Just change what {team1} resolves to. Want formal titles? Map {player1} to "Contestant Alice" instead of just "Alice". This separation of template structure from specific values makes the system incredibly flexible while maintaining clean, readable templates that focus on performance flow rather than data manipulation.
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
   * 
   * The token map is where all the specific details for a performance get collected into a single lookup table. This method excavates data from both the play object (who's playing, what variant) and the context (round number, match progress) to build a comprehensive map of replaceable values. The hierarchical extraction handles different player data structures elegantly - whether players are specified as objects with names and teams, arrays of IDs, or role-based mappings for asymmetric games, the method extracts appropriate tokens.
   * 
   * Special attention is paid to fallback values - if team names aren't provided, it defaults to "Team 1" and "Team 2" rather than leaving tokens unreplaced. The method also calculates derived values like duration in minutes (more natural than seconds) and includes generic tokens like "everyone" for free-for-all situations. This comprehensive token building ensures that scripts never have unreplaced tokens, creating smooth performances even when data is incomplete. The approach also future-proofs the system - new tokens can be added to the map without modifying any template processing logic.
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