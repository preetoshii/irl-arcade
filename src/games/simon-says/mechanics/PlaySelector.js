/**
 * Play Selector for Simon Says
 * Core selection algorithm for choosing plays
 */

import { eventBus, Events, configLoader, stateStore, StateKeys } from '../systems';
import { playerRegistry, RoundType, getPlayIdentifier } from '../state';
import { 
  DEFAULT_ROUND_WEIGHTS, 
  getPlayerCountAdjustment,
  HISTORY_LIMITS 
} from '../state/constants';

// ============================================
// PLAY SELECTOR CLASS
// ============================================

class PlaySelector {
  constructor() {
    this.recentPlays = [];
    this.varietyEnforcer = null; // Will be injected
  }

  /**
   * Set the variety enforcer
   */
  setVarietyEnforcer(varietyEnforcer) {
    this.varietyEnforcer = varietyEnforcer;
  }

  /**
   * Select a play for a round block
   * @param {Object} context - Selection context
   * @returns {Object} Selected play
   */
  async selectPlay(context) {
    eventBus.emit(Events.BLOCK_SELECTION_STARTED, { context });
    
    try {
      // Step 1: Select round type
      const roundType = this.selectRoundType(context);
      
      // Step 2: Select variant
      const variant = this.selectVariant(roundType, context);
      
      // Step 3: Select sub-variant (movement style)
      const subVariant = this.selectSubVariant(variant, context);
      
      // Step 4: Optionally add modifier
      const modifier = this.selectModifier(subVariant, context);
      
      // Step 5: Select players
      const players = this.selectPlayers(roundType, variant, context);
      
      // Step 6: Determine duration
      const duration = this.calculateDuration(roundType, variant, context);
      
      // Step 7: Assemble the play
      const play = {
        blockType: 'round',
        roundType,
        variant,
        subVariant,
        modifier,
        players,
        duration,
        difficulty: this.calculateDifficulty(variant, subVariant, modifier),
        
        // Will be filled by script assembler
        scripts: {},
        
        // Performance hints
        performanceHints: {
          difficulty: context.targetDifficulty || 3,
          roundNumber: context.currentRound,
          totalRounds: context.totalRounds,
          isNearEnd: context.currentRound >= context.totalRounds - 2,
          buildSuspense: this.shouldBuildSuspense(context)
        }
      };
      
      // Record selection
      this.recordSelection(play);
      
      // Update state
      stateStore.set(StateKeys.RECENT_PLAYS, this.recentPlays.slice(0, HISTORY_LIMITS.RECENT_PLAYS));
      
      eventBus.emit(Events.PLAY_SELECTED, { play, context });
      
      return play;
      
    } catch (error) {
      console.error('[PlaySelector] Selection error:', error);
      eventBus.emit(Events.SYSTEM_ERROR, { system: 'playSelector', error });
      throw error;
    }
  }

  /**
   * Select round type based on weights and context
   */
  selectRoundType(context) {
    const config = configLoader.get('roundTypes', {});
    const playerCount = context.activePlayerList.length;
    
    // Build options with weights
    const options = [];
    
    Object.entries(config).forEach(([type, settings]) => {
      // Check player count requirements
      if (playerCount < settings.minPlayers || playerCount > settings.maxPlayers) {
        return; // Skip this type
      }
      
      // Base weight
      let weight = settings.weight || DEFAULT_ROUND_WEIGHTS[type.toUpperCase()] || 10;
      
      // Apply player count adjustment
      weight *= getPlayerCountAdjustment(playerCount, type.toUpperCase());
      
      // Apply variety enforcement
      if (this.varietyEnforcer) {
        weight = this.varietyEnforcer.adjustWeight(type, weight, context);
      }
      
      options.push({ type, weight, settings });
    });
    
    // Select from weighted options
    const selected = this.weightedRandom(options);
    
    if (!selected) {
      throw new Error('No valid round types available');
    }
    
    return selected.type;
  }

  /**
   * Select variant for the round type
   */
  selectVariant(roundType, context) {
    const config = configLoader.get(`roundTypes.${roundType}`, {});
    const variants = config.variants || [];
    
    if (variants.length === 0) {
      throw new Error(`No variants configured for round type: ${roundType}`);
    }
    
    // Get variant weights (could be configured per variant)
    const options = variants.map(variant => {
      let weight = 100; // Default equal weight
      
      // Apply variety enforcement
      const playId = `${roundType}-${variant}`;
      if (this.varietyEnforcer) {
        weight = this.varietyEnforcer.adjustWeight(playId, weight, context);
      }
      
      return { variant, weight };
    });
    
    // Select from weighted options
    const selected = this.weightedRandom(options);
    return selected.variant;
  }

  /**
   * Select sub-variant (movement style)
   */
  selectSubVariant(variant, context) {
    // Sub-variants can be variant-specific or universal
    const universalSubVariants = [
      { name: 'normal', weight: 40, difficulty: 0 },
      { name: 'backwards', weight: 20, difficulty: 1 },
      { name: 'crabWalk', weight: 20, difficulty: 2 },
      { name: 'hop', weight: 15, difficulty: 2 },
      { name: 'slowMotion', weight: 5, difficulty: 1 }
    ];
    
    // Filter by difficulty
    const targetDifficulty = context.targetDifficulty || 3;
    const maxSubVariantDifficulty = Math.min(2, targetDifficulty - 1);
    
    const options = universalSubVariants
      .filter(sv => sv.difficulty <= maxSubVariantDifficulty)
      .map(sv => {
        let weight = sv.weight;
        
        // Apply variety enforcement
        if (this.varietyEnforcer) {
          weight = this.varietyEnforcer.adjustWeight(sv.name, weight, context);
        }
        
        return { subVariant: sv.name, weight };
      });
    
    const selected = this.weightedRandom(options);
    return selected.subVariant;
  }

  /**
   * Select optional modifier
   */
  selectModifier(subVariant, context) {
    // Check if we should add a modifier
    const modifierProbability = configLoader.get('difficulty.modifierProbability', 0.3);
    const targetDifficulty = context.targetDifficulty || 3;
    
    // Adjust probability based on difficulty
    const adjustedProbability = modifierProbability * (targetDifficulty / 3);
    
    if (Math.random() > adjustedProbability) {
      return null; // No modifier
    }
    
    // Available modifiers
    const modifiers = [
      { name: 'blindfold', weight: 10, difficulty: 2 },
      { name: 'teamChant', weight: 30, difficulty: 1 },
      { name: 'animalNoises', weight: 25, difficulty: 1 },
      { name: 'sillyVoices', weight: 25, difficulty: 1 },
      { name: 'countdown', weight: 10, difficulty: 1 }
    ];
    
    // Filter out excluded modifiers
    const excludedModifiers = configLoader.get('excludeModifiers', []);
    const availableModifiers = modifiers.filter(m => !excludedModifiers.includes(m.name));
    
    // Don't stack too much difficulty
    const currentDifficulty = this.getSubVariantDifficulty(subVariant);
    const maxModifierDifficulty = Math.max(0, 5 - currentDifficulty - 1);
    
    const options = availableModifiers
      .filter(m => m.difficulty <= maxModifierDifficulty)
      .map(m => ({ modifier: m.name, weight: m.weight }));
    
    if (options.length === 0) {
      return null;
    }
    
    const selected = this.weightedRandom(options);
    return selected.modifier;
  }

  /**
   * Select players for the activity
   */
  selectPlayers(roundType, variant, context) {
    const activePlayers = context.activePlayerList;
    const playerCount = activePlayers.length;
    
    switch (roundType) {
      case 'duel':
        return this.selectDuelPlayers(activePlayers, context);
        
      case 'team':
        return this.selectTeamPlayers(activePlayers, context);
        
      case 'freeForAll':
        return { all: activePlayers.map(p => p.id) };
        
      case 'asymmetric':
        return this.selectAsymmetricPlayers(activePlayers, variant, context);
        
      default:
        throw new Error(`Unknown round type: ${roundType}`);
    }
  }

  /**
   * Select players for a duel
   */
  selectDuelPlayers(activePlayers, context) {
    // Get selection weights from player registry
    const weights = playerRegistry.getSelectionWeights(activePlayers.map(p => p.id));
    
    // Select first player
    const player1Options = activePlayers.map(player => ({
      player,
      weight: weights.get(player.id) || 1
    }));
    
    const player1 = this.weightedRandom(player1Options).player;
    
    // Select second player (avoid recent partners)
    const player2Options = activePlayers
      .filter(p => p.id !== player1.id)
      .map(player => {
        let weight = weights.get(player.id) || 1;
        
        // Reduce weight if recent partner
        if (playerRegistry.wereRecentPartners(player1.id, player.id)) {
          weight *= 0.5;
        }
        
        // Prefer different teams
        if (player.team !== player1.team) {
          weight *= 1.2;
        }
        
        return { player, weight };
      });
    
    if (player2Options.length === 0) {
      throw new Error('Not enough players for duel');
    }
    
    const player2 = this.weightedRandom(player2Options).player;
    
    return {
      player1: { id: player1.id, name: player1.name, team: player1.team },
      player2: { id: player2.id, name: player2.name, team: player2.team }
    };
  }

  /**
   * Select players for team activities
   */
  selectTeamPlayers(activePlayers, context) {
    const teams = playerRegistry.getActiveTeams();
    
    if (teams.length < 2) {
      // Fall back to splitting players
      const half = Math.floor(activePlayers.length / 2);
      return {
        team1: activePlayers.slice(0, half).map(p => p.id),
        team2: activePlayers.slice(half).map(p => p.id)
      };
    }
    
    // Select subset of players from each team if needed
    const playersPerTeam = Math.min(5, Math.floor(activePlayers.length / teams.length));
    
    const selectedTeams = {};
    teams.forEach((team, index) => {
      const teamKey = `team${index + 1}`;
      const teamPlayers = team.players;
      
      if (teamPlayers.length <= playersPerTeam) {
        selectedTeams[teamKey] = teamPlayers.map(p => p.id);
      } else {
        // Select subset with fair rotation
        const weights = playerRegistry.getSelectionWeights(teamPlayers.map(p => p.id));
        const selected = this.selectMultipleWeighted(teamPlayers, playersPerTeam, weights);
        selectedTeams[teamKey] = selected.map(p => p.id);
      }
    });
    
    return selectedTeams;
  }

  /**
   * Select players for asymmetric games
   */
  selectAsymmetricPlayers(activePlayers, variant, context) {
    // Different variants have different player distributions
    const distributions = {
      infection: { infected: 1, survivors: 'rest' },
      protector: { protector: 1, protected: 3, hunters: 'rest' },
      hunter: { hunter: 2, prey: 'rest' }
    };
    
    const dist = distributions[variant] || { special: 1, others: 'rest' };
    const result = {};
    const remaining = [...activePlayers];
    const weights = playerRegistry.getSelectionWeights(activePlayers.map(p => p.id));
    
    // Select special roles first
    Object.entries(dist).forEach(([role, count]) => {
      if (count === 'rest') {
        result[role] = remaining.map(p => p.id);
      } else {
        const selected = this.selectMultipleWeighted(remaining, count, weights);
        result[role] = selected.map(p => p.id);
        
        // Remove selected from remaining
        selected.forEach(p => {
          const index = remaining.findIndex(r => r.id === p.id);
          if (index >= 0) remaining.splice(index, 1);
        });
      }
    });
    
    return result;
  }

  /**
   * Calculate duration for the play
   */
  calculateDuration(roundType, variant, context) {
    const baseConfig = configLoader.get(`timing.durations.rounds.${roundType}`, {});
    const baseDuration = baseConfig.default || 90;
    
    // Adjust based on difficulty
    const difficultyMultiplier = configLoader.get(
      `timing.multipliers.difficulty.${context.targetDifficulty > 3 ? 'hard' : context.targetDifficulty < 3 ? 'easy' : 'medium'}`,
      1.0
    );
    
    // Adjust based on progression
    const progressMultiplier = context.isLateMatch 
      ? configLoader.get('timing.multipliers.progression.late', 0.8)
      : context.isEarlyMatch
      ? configLoader.get('timing.multipliers.progression.early', 1.2)
      : 1.0;
    
    return Math.round(baseDuration * difficultyMultiplier * progressMultiplier);
  }

  /**
   * Calculate play difficulty
   */
  calculateDifficulty(variant, subVariant, modifier) {
    let difficulty = 1; // Base
    
    // Add variant difficulty
    const variantDifficulties = {
      tag: 0,
      mirror: 1,
      balance: 1,
      speed: 1,
      relay: 1,
      capture: 2,
      collective: 1
    };
    difficulty += variantDifficulties[variant] || 0;
    
    // Add sub-variant difficulty
    difficulty += this.getSubVariantDifficulty(subVariant);
    
    // Add modifier difficulty
    if (modifier) {
      const modifierDifficulties = {
        blindfold: 2,
        teamChant: 1,
        animalNoises: 1,
        sillyVoices: 1,
        countdown: 1
      };
      difficulty += modifierDifficulties[modifier] || 0;
    }
    
    // Cap at 5
    return Math.min(5, Math.max(1, difficulty));
  }

  /**
   * Get sub-variant difficulty
   */
  getSubVariantDifficulty(subVariant) {
    const difficulties = {
      normal: 0,
      backwards: 1,
      crabWalk: 2,
      hop: 2,
      slowMotion: 1
    };
    return difficulties[subVariant] || 0;
  }

  /**
   * Determine if should build suspense
   */
  shouldBuildSuspense(context) {
    // Build suspense for special moments
    return context.isFirstRound || 
           context.isLastRound || 
           context.currentRound === Math.floor(context.totalRounds / 2);
  }

  /**
   * Record play selection
   */
  recordSelection(play) {
    const playId = getPlayIdentifier(play);
    
    // Add to recent plays
    this.recentPlays.unshift({
      id: playId,
      timestamp: Date.now(),
      play: play
    });
    
    // Trim history
    if (this.recentPlays.length > HISTORY_LIMITS.RECENT_PLAYS) {
      this.recentPlays = this.recentPlays.slice(0, HISTORY_LIMITS.RECENT_PLAYS);
    }
    
    // Update player selection tracking
    if (play.players) {
      const playerIds = this.extractPlayerIds(play.players);
      const partners = playerIds.length > 1 ? playerIds : [];
      
      playerIds.forEach(playerId => {
        const otherPlayers = partners.filter(id => id !== playerId);
        playerRegistry.recordSelection(
          playerId, 
          matchState.getCurrentRoundNumber(),
          playId,
          otherPlayers
        );
      });
    }
  }

  /**
   * Extract player IDs from various player formats
   */
  extractPlayerIds(players) {
    const ids = [];
    
    Object.values(players).forEach(value => {
      if (typeof value === 'string') {
        ids.push(value);
      } else if (Array.isArray(value)) {
        ids.push(...value);
      } else if (value && value.id) {
        ids.push(value.id);
      }
    });
    
    return [...new Set(ids)]; // Remove duplicates
  }

  /**
   * Weighted random selection
   */
  weightedRandom(options) {
    if (options.length === 0) return null;
    if (options.length === 1) return options[0];
    
    // Calculate total weight
    const totalWeight = options.reduce((sum, option) => sum + (option.weight || 0), 0);
    
    if (totalWeight === 0) {
      // Equal selection if all weights are 0
      return options[Math.floor(Math.random() * options.length)];
    }
    
    // Random selection
    let random = Math.random() * totalWeight;
    
    for (const option of options) {
      random -= option.weight || 0;
      if (random <= 0) {
        return option;
      }
    }
    
    // Fallback
    return options[options.length - 1];
  }

  /**
   * Select multiple items with weights
   */
  selectMultipleWeighted(items, count, weights) {
    const selected = [];
    const remaining = [...items];
    
    while (selected.length < count && remaining.length > 0) {
      const options = remaining.map(item => ({
        item,
        weight: weights.get(item.id) || 1
      }));
      
      const chosen = this.weightedRandom(options).item;
      selected.push(chosen);
      
      // Remove from remaining
      const index = remaining.findIndex(r => r.id === chosen.id);
      if (index >= 0) remaining.splice(index, 1);
    }
    
    return selected;
  }

  /**
   * Get recent play history
   */
  getRecentPlays() {
    return this.recentPlays;
  }

  /**
   * Clear history
   */
  clearHistory() {
    this.recentPlays = [];
  }
}

// Create singleton instance
const playSelector = new PlaySelector();

// Export both instance and class
export default playSelector;
export { PlaySelector };