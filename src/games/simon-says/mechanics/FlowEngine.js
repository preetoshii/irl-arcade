/**
 * FlowEngine.js - Executes game rounds based on gameFlowData
 * 
 * This engine:
 * 1. Selects round types based on weights
 * 2. Builds complete round from nested variants
 * 3. Generates audio scripts with player names
 * 4. Manages round execution timing
 */

import { gameFlowData, selectWeighted } from './gameFlowData';

export class FlowEngine {
  constructor(gameState) {
    this.gameState = gameState; // Has players, teams, etc.
    this.currentRound = null;
    this.onSpeak = null; // Callback for TTS
    this.onPhaseChange = null; // Callback for UI updates
  }

  /**
   * Builds a complete round by traversing the game flow tree
   */
  buildRound() {
    // Level 1: Select round type
    const roundType = selectWeighted(gameFlowData.roundTypes);
    console.log(`Selected round type: ${roundType.name}`);

    // Level 2: Select variant (if applicable)
    let variant = null;
    if (roundType.variants) {
      variant = selectWeighted(roundType.variants);
      console.log(`Selected variant: ${variant.name}`);
    }

    // Level 3: Select sub-variant (if applicable)
    let subVariant = null;
    if (variant?.subVariants) {
      subVariant = selectWeighted(variant.subVariants);
      console.log(`Selected sub-variant: ${subVariant.name}`);
    }

    // Level 4: Select modifier (if applicable)
    let modifier = null;
    if (variant?.modifiers) {
      modifier = selectWeighted(variant.modifiers);
      console.log(`Selected modifier: ${modifier.name}`);
    }

    // Build complete round object
    this.currentRound = {
      type: roundType,
      variant: variant,
      subVariant: subVariant,
      modifier: modifier,
      players: this.selectPlayers(variant || roundType),
      startTime: null,
      phase: 'intro'
    };

    return this.currentRound;
  }

  /**
   * Selects players based on round requirements
   */
  selectPlayers(roundConfig) {
    const players = {};
    
    if (roundConfig.id === 'tag') {
      // Select one player from each team
      const team1Players = this.gameState.teams[0].players;
      const team2Players = this.gameState.teams[1].players;
      
      players.player1 = team1Players[Math.floor(Math.random() * team1Players.length)];
      players.player2 = team2Players[Math.floor(Math.random() * team2Players.length)];
      players.team1 = this.gameState.teams[0].name;
      players.team2 = this.gameState.teams[1].name;
      
      // Handle multi-IT modifier
      if (this.currentRound?.modifier?.requiresExtra) {
        players.player3 = team1Players[Math.floor(Math.random() * team1Players.length)];
      }
    }
    
    return players;
  }

  /**
   * Executes the current round with timed phases
   */
  async executeRound() {
    if (!this.currentRound) {
      throw new Error('No round built. Call buildRound() first.');
    }

    const round = this.currentRound;
    const scripts = this.collectScripts(round);
    
    // Execute round phases
    await this.runPhase('intro', scripts.intro, 3000);
    
    if (round.variant?.id === 'tag') {
      await this.runPhase('selectPlayers', scripts.selectPlayers, 2000);
      await this.runPhase('callPlayer1', scripts.callPlayer1, 3000);
      await this.runPhase('callPlayer2', scripts.callPlayer2, 3000);
      await this.runPhase('positions', scripts.positions, 2000);
      
      // Sub-variant specific setup
      if (round.subVariant) {
        await this.runPhase('setup', scripts.setup, 3000);
        await this.runPhase('rules', scripts.rules, 4000);
        
        if (scripts.demo) {
          await this.runPhase('demo', scripts.demo, 3000);
        }
        
        // Modifier setup
        if (round.modifier && round.modifier.id !== 'no_modifier') {
          await this.runPhase('modifierAnnounce', scripts.modifierAnnounce, 2000);
          await this.runPhase('modifierSetup', scripts.modifierSetup, 3000);
          
          if (scripts.modifierRules) {
            await this.runPhase('modifierRules', scripts.modifierRules, 3000);
          }
        }
        
        // Countdown
        await this.runPhase('countdown', scripts.countdown, 4000);
        
        // Main gameplay
        const duration = round.subVariant.duration * 1000;
        await this.runGameplay(scripts, duration);
        
        // End
        await this.runPhase('timeUp', scripts.timeUp, 2000);
      }
    }
    
    await this.runPhase('outro', scripts.outro, 2000);
  }

  /**
   * Runs the main gameplay phase with periodic callouts
   */
  async runGameplay(scripts, duration) {
    this.onPhaseChange?.('gameplay');
    
    const startTime = Date.now();
    const calloutInterval = 5000; // Random callout every 5 seconds
    let lastCallout = startTime;
    
    while (Date.now() - startTime < duration) {
      const timeLeft = duration - (Date.now() - startTime);
      
      // Almost done warning
      if (timeLeft < 11000 && timeLeft > 9000 && scripts.almostDone) {
        await this.speak(scripts.almostDone);
        await this.wait(2000);
      }
      
      // Random during callouts
      if (Date.now() - lastCallout > calloutInterval && scripts.during?.length > 0) {
        const randomCallout = scripts.during[Math.floor(Math.random() * scripts.during.length)];
        await this.speak(randomCallout);
        lastCallout = Date.now();
      }
      
      // Handle freeze modifier
      if (this.currentRound.modifier?.id === 'freeze_whistle' && Math.random() < 0.1) {
        await this.speak(scripts.whistle);
        await this.wait(3000);
        await this.speak(scripts.unfreeze);
      }
      
      await this.wait(100); // Small delay to not block
    }
  }

  /**
   * Collects all relevant scripts for the current round
   */
  collectScripts(round) {
    const scripts = {};
    const players = round.players;
    
    // Helper to fill in player names
    const fillTemplate = (template) => {
      if (!template) return '';
      return template
        .replace(/{player1}/g, players.player1)
        .replace(/{player2}/g, players.player2)
        .replace(/{player3}/g, players.player3 || '')
        .replace(/{team1}/g, players.team1)
        .replace(/{team2}/g, players.team2);
    };
    
    // Collect from all levels
    if (round.type.scripts) {
      Object.entries(round.type.scripts).forEach(([key, script]) => {
        scripts[key] = fillTemplate(script);
      });
    }
    
    if (round.variant?.scripts) {
      Object.entries(round.variant.scripts).forEach(([key, script]) => {
        scripts[key] = fillTemplate(script);
      });
    }
    
    if (round.subVariant?.scripts) {
      Object.entries(round.subVariant.scripts).forEach(([key, script]) => {
        if (Array.isArray(script)) {
          scripts[key] = script.map(s => fillTemplate(s));
        } else {
          scripts[key] = fillTemplate(script);
        }
      });
    }
    
    if (round.modifier?.scripts) {
      Object.entries(round.modifier.scripts).forEach(([key, script]) => {
        scripts[`modifier${key.charAt(0).toUpperCase() + key.slice(1)}`] = fillTemplate(script);
      });
    }
    
    return scripts;
  }

  /**
   * Runs a single phase with speech
   */
  async runPhase(phaseName, script, duration) {
    if (!script) return;
    
    this.onPhaseChange?.(phaseName);
    await this.speak(script);
    await this.wait(duration);
  }

  /**
   * Speaks text using TTS callback
   */
  async speak(text) {
    if (!text) return;
    console.log(`SPEAKING: ${text}`);
    this.onSpeak?.(text);
  }

  /**
   * Waits for specified milliseconds
   */
  wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Example usage:
/*
const gameState = {
  teams: [
    { name: 'Red Team', players: ['Alice', 'Bob', 'Charlie'] },
    { name: 'Blue Team', players: ['David', 'Eve', 'Frank'] }
  ],
  currentRound: 1,
  totalRounds: 10
};

const engine = new FlowEngine(gameState);
engine.onSpeak = (text) => {
  // Use TTS to speak
  window.speechSynthesis.speak(new SpeechSynthesisUtterance(text));
};

// Build and execute a round
engine.buildRound();
await engine.executeRound();
*/