/**
 * ProgressiveFlowEngine.js - A more dynamic, theatrical flow engine
 * 
 * This engine makes selections progressively, building suspense
 * and allowing for more dynamic, game-show-like presentation.
 */

import { gameFlowData, selectWeighted } from './gameFlowData';

export class ProgressiveFlowEngine {
  constructor(gameState) {
    this.gameState = gameState;
    this.currentRound = {
      selections: {},
      players: {},
      phase: 'idle'
    };
    this.onSpeak = null;
    this.onPhaseChange = null;
    this.energy = 'normal'; // Can be: low, normal, high, chaos
  }

  /**
   * Executes a round with progressive selection and theatrical timing
   */
  async executeProgressiveRound() {
    // Start with just round number
    await this.speak(`Alright everyone, Round ${this.gameState.currentRound}!`, 2000);
    
    // Dramatic pause before revealing round type
    await this.speak("Let's see what we're doing...", 1500);
    await this.dramaticPause(1000);
    
    // Select and announce round type
    const roundType = selectWeighted(gameFlowData.roundTypes);
    this.currentRound.selections.roundType = roundType;
    
    await this.speakWithEmphasis(roundType.scripts.intro, 2500);
    
    // Handle round type
    if (roundType.id === 'duel_battle') {
      await this.executeDuelBattle(roundType);
    } else if (roundType.id === 'team_battle') {
      await this.executeTeamBattle(roundType);
    } else if (roundType.id === 'relief_round') {
      await this.executeReliefRound(roundType);
    }
    
    // Round outro
    await this.speak(roundType.scripts.outro || "Great job everyone!", 2000);
  }

  /**
   * Progressive duel battle with dynamic selection
   */
  async executeDuelBattle(roundType) {
    // Build suspense for variant selection
    await this.speak("What kind of duel will it be?", 1500);
    await this.dramaticPause(800);
    
    // Select variant with fanfare
    const variant = selectWeighted(roundType.variants);
    this.currentRound.selections.variant = variant;
    
    if (variant.id === 'tag') {
      await this.speakWithEmphasis("TAG DUEL!", 2000);
      await this.executeTagDuel(variant);
    } else {
      await this.speakWithEmphasis(variant.scripts.intro, 2000);
      // ... handle other variants
    }
  }

  /**
   * Progressive tag duel with maximum drama
   */
  async executeTagDuel(variant) {
    // Player selection with suspense
    await this.speak(variant.scripts.selectPlayers, 2000);
    
    // Select player 1 with drama
    const team1 = this.gameState.teams[0];
    await this.speak(`From ${team1.name}...`, 1500);
    await this.dramaticPause(1000);
    
    const player1 = this.selectRandomPlayer(team1);
    this.currentRound.players.player1 = player1.name;
    this.currentRound.players.team1 = team1.name;
    
    await this.speakWithEmphasis(`${player1.name}, step forward!`, 2500);
    
    // Select player 2 with drama
    const team2 = this.gameState.teams[1];
    await this.speak(`And from ${team2.name}...`, 1500);
    await this.dramaticPause(1000);
    
    const player2 = this.selectRandomPlayer(team2);
    this.currentRound.players.player2 = player2.name;
    this.currentRound.players.team2 = team2.name;
    
    await this.speakWithEmphasis(`${player2.name}, you're up!`, 2500);
    
    // Positions
    await this.speak("Take your positions!", 2000);
    
    // Now decide on sub-variant based on energy
    await this.checkEnergyLevel();
    
    if (this.energy === 'high' || this.energy === 'chaos') {
      await this.speak("You know what? Let's make this INTERESTING!", 2000);
      await this.dramaticPause(500);
    }
    
    // Select sub-variant
    const subVariant = selectWeighted(variant.subVariants);
    this.currentRound.selections.subVariant = subVariant;
    
    // Announce with appropriate energy
    if (subVariant.id === 'crab_walk_tag') {
      await this.speakWithEmphasis("CRAB WALK TAG!", 2000);
      await this.speak("Everyone get in crab position to show them!", 2000);
    } else if (subVariant.id === 'slow_motion_tag') {
      await this.speakSlowly("Slooooow... Mooootion... Taaaaaag!", 3000);
    } else {
      await this.speak(subVariant.scripts.setup, 2500);
    }
    
    // Rules explanation
    await this.speak(subVariant.scripts.rules, 3500);
    
    // Check if we should add a modifier (based on game progression)
    if (this.shouldAddModifier()) {
      await this.dramaticPause(1000);
      await this.speak("WAIT!", 1000);
      await this.speak("I just had an idea...", 1500);
      
      // Select modifier
      const modifier = selectWeighted(variant.modifiers);
      this.currentRound.selections.modifier = modifier;
      
      if (modifier.id === 'blindfold_it') {
        await this.speakWithEmphasis(
          `${this.currentRound.players.player1}, you're going to be BLINDFOLDED!`, 
          3000
        );
        await this.speak(
          `${this.currentRound.players.team1}, you'll need to guide them!`,
          2500
        );
      }
    }
    
    // Countdown with energy
    await this.executeCountdown(subVariant.scripts.countdown);
    
    // Gameplay
    await this.executeGameplay(subVariant);
  }

  /**
   * Dynamic countdown based on energy
   */
  async executeCountdown(countdownScript) {
    if (this.energy === 'high') {
      await this.speak("ARE YOU READY?!", 1500);
      await this.speak("3!", 500);
      await this.speak("2!", 500);
      await this.speak("1!", 500);
      await this.speakWithEmphasis("GOOOOO!", 1000);
    } else {
      await this.speak(countdownScript || "Ready? 3... 2... 1... GO!", 3000);
    }
  }

  /**
   * Gameplay with dynamic callouts
   */
  async executeGameplay(subVariant) {
    const duration = subVariant.duration * 1000;
    const startTime = Date.now();
    
    this.onPhaseChange?.('gameplay');
    
    while (Date.now() - startTime < duration) {
      const timeLeft = duration - (Date.now() - startTime);
      const progress = (Date.now() - startTime) / duration;
      
      // Dynamic callouts based on game state
      if (progress > 0.7 && timeLeft > 10000) {
        await this.speak(subVariant.scripts.almostDone, 2000);
        await this.wait(8000);
      } else if (Math.random() < 0.3) {
        // Random encouragement
        const callout = this.selectDynamicCallout(subVariant.scripts.during);
        await this.speak(callout, 2000);
        await this.wait(3000);
      } else {
        await this.wait(1000);
      }
    }
    
    await this.speakWithEmphasis(subVariant.scripts.timeUp, 2000);
  }

  /**
   * Theatrical speaking methods
   */
  async speak(text, duration = 2000) {
    if (!text) return;
    const filledText = this.fillTemplate(text);
    console.log(`SPEAKING: ${filledText}`);
    this.onSpeak?.(filledText);
    await this.wait(duration);
  }

  async speakWithEmphasis(text, duration = 2000) {
    // Could modify pitch/rate for emphasis
    await this.speak(text, duration);
  }

  async speakSlowly(text, duration = 3000) {
    // Would use slower rate in actual TTS
    await this.speak(text, duration);
  }

  async dramaticPause(duration = 1000) {
    console.log(`[DRAMATIC PAUSE - ${duration}ms]`);
    await this.wait(duration);
  }

  /**
   * Helper methods
   */
  checkEnergyLevel() {
    // Could check actual game state, time, or random
    const rand = Math.random();
    if (rand < 0.2) this.energy = 'low';
    else if (rand < 0.6) this.energy = 'normal';
    else if (rand < 0.9) this.energy = 'high';
    else this.energy = 'chaos';
  }

  shouldAddModifier() {
    // Could base on round number, energy, etc.
    return this.gameState.currentRound > 3 && Math.random() < 0.4;
  }

  selectRandomPlayer(team) {
    return team.players[Math.floor(Math.random() * team.players.length)];
  }

  selectDynamicCallout(callouts) {
    if (!callouts || callouts.length === 0) return "Keep going!";
    return callouts[Math.floor(Math.random() * callouts.length)];
  }

  fillTemplate(template) {
    if (!template) return '';
    const players = this.currentRound.players;
    return template
      .replace(/{player1}/g, players.player1 || '[Player 1]')
      .replace(/{player2}/g, players.player2 || '[Player 2]')
      .replace(/{team1}/g, players.team1 || '[Team 1]')
      .replace(/{team2}/g, players.team2 || '[Team 2]');
  }

  wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * The key differences in this progressive approach:
 * 
 * 1. Selections happen during the round, not before
 * 2. Dramatic pauses and emphasis for theatrical effect
 * 3. Energy levels affect presentation style
 * 4. Modifiers added based on game progression
 * 5. More dynamic and responsive to game state
 * 
 * This creates a more engaging, game-show-like experience
 * where players don't know what's coming next!
 */