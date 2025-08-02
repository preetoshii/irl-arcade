/**
 * Play Selector for Simon Says
 * 
 * The PlaySelector is the heart of Simon Says' decision-making engine. Every round, it faces a complex question: given the current players, their history, the match progress, and configuration preferences, what activity should happen next? It's like being a DJ at a party - you need to read the room, remember what songs you've already played, balance different musical tastes, and keep the energy flowing. The PlaySelector orchestrates this dance of decisions through a sophisticated multi-step process that considers dozens of factors while appearing effortless to players.
 * 
 * The brilliance of the PlaySelector lies in how it balances competing concerns. It needs to be fair (giving everyone a chance to be selected), varied (not repeating the same activities), appropriate (matching activities to player count and preferences), and progressive (adjusting difficulty over time). All these considerations happen in milliseconds, resulting in a selection that feels both random and intentional. Players notice when selection is done well - everyone gets picked, activities feel fresh, and the game maintains its momentum without anyone feeling left out or overwhelmed.
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
   * 
   * This method is called for every round in a match, making it one of the most frequently executed pieces of logic in the game. It follows a carefully designed cascade of decisions, each building on the previous. First, it selects the round type (duel, team, free-for-all, or asymmetric) based on player count and weighted preferences. Then it drills down to variant (like tag vs mirror for duels), sub-variant (movement style like crab-walking), and potentially a modifier (silly additions like animal noises). Finally, it selects which players participate and calculates timing. Each decision influences the next - selecting 'elimination' might favor choosing players who haven't been eliminated recently, while 'relay' needs balanced teams.
   * 
   * The context parameter carries crucial information that shapes every decision. It knows the current round number, total rounds, target difficulty, player list, and match progress. This rich context allows the selector to make intelligent choices - ramping up difficulty in later rounds, avoiding recently-used plays, ensuring fair player rotation, and respecting accessibility settings. The assembled play object contains everything needed for downstream systems to create scripts and perform the activity, from player assignments to performance hints that shape how Simon delivers the content.
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
   * 
   * Round type selection sets the foundation for everything that follows. Each type creates fundamentally different dynamics: duels create intense one-on-one competition, team activities build collaboration, free-for-alls generate chaotic fun, and asymmetric games create unique role-based experiences. The method starts with base weights from configuration, then applies multiple adjustments. Player count is crucial - you can't have a meaningful duel with 30 players or a good free-for-all with 3. The player count adjustment multipliers ensure activities match the group size.
   * 
   * The variety enforcer integration is particularly clever here. If players have been doing lots of duels recently, their weight gets reduced, encouraging the system to try something different. This happens transparently - the base configuration might heavily favor duels, but the variety enforcer ensures players experience the full range of activities over time. The weighted random selection at the end means common activities appear more often while still maintaining unpredictability. Players might notice patterns ("we tend to do more free-for-alls") but can't predict what's next.
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
   * 
   * Duel player selection showcases the sophistication of fair rotation. It starts by getting selection weights from the player registry - players who haven't been picked recently get higher weights, implementing a "fairness boost" that prevents anyone from being left out. The first player is selected using these weights, then the second player selection gets even more nuanced. Recent partners get their weights reduced (preventing the same pairs from always competing), while players from different teams get a slight boost (encouraging cross-team competition). These subtle adjustments create natural variety without feeling forced.
   * 
   * The method handles edge cases gracefully - if there aren't enough players for a duel, it throws a clear error rather than proceeding with broken state. The returned player objects include names and team information, not just IDs, because downstream systems need this for script generation ("Alice from the Red Team versus Bob from the Blue Team!"). This careful data structuring prevents repeated lookups and ensures all necessary information flows smoothly through the system.
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
   * 
   * Asymmetric games are where Simon Says gets really creative. Unlike balanced activities where everyone has the same role, asymmetric games create unique dynamics through role differentiation. In 'infection', one player starts as infected trying to tag others. In 'protector', one player defends a small group from hunters. The distributions object defines these role blueprints - some roles need exact counts while others take "the rest" of the players. This flexibility allows asymmetric games to work with varying player counts while maintaining their core dynamic.
   * 
   * The selection process is careful about role assignment. Special roles (like the infected or protector) are chosen first using selection weights to ensure fair rotation - everyone gets a chance to be the special role over time. The method then removes selected players from the remaining pool before assigning the next role, preventing double-assignment. The 'rest' keyword elegantly handles variable player counts - if you have 15 players and need 1 hunter, the other 14 automatically become prey without complex calculations. This design makes asymmetric games scalable from small to large groups while preserving gameplay balance.
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
   * 
   * Difficulty calculation is more art than science, combining multiple factors into a single 1-5 score that downstream systems use for various adjustments. The method starts with a base difficulty of 1, then adds contributions from each component. Variants contribute 0-2 points based on their complexity - 'tag' is simple (0 points) while 'capture the flag' requires more coordination (2 points). Sub-variants like crab-walking or hopping add their own difficulty. Modifiers layer on additional challenge. The final sum is capped at 5 to prevent overwhelming combinations.
   * 
   * This calculated difficulty serves multiple purposes throughout the system. The performance system uses it to adjust Simon's speaking pace - higher difficulty gets slightly faster delivery to add pressure. The script system might add more encouragement for difficult activities. The UI could display difficulty stars. Most importantly, this standardized difficulty score helps ensure the game follows its intended difficulty curve - if the match is configured for "gentle" difficulty, the system avoids selecting combinations that would sum to 4 or 5, keeping the experience accessible while still providing variety.
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
   * 
   * This utility method implements the randomness that makes Simon Says unpredictable while respecting the careful weighting systems throughout the game. The algorithm is elegantly simple: sum all weights to get a total, generate a random number within that range, then iterate through options subtracting each weight until the random number goes negative. This creates probability distributions where options with higher weights are more likely to be selected, but nothing is guaranteed. An option with 90% weight will usually be picked, but that 10% chance of something else keeps players guessing.
   * 
   * The method includes important edge case handling. If all weights are zero (which might happen if the variety enforcer has suppressed everything), it falls back to equal random selection. Single-option arrays return immediately without randomization. The method works with any objects that have a 'weight' property, making it reusable throughout the codebase. This standardized approach to weighted selection ensures consistent probability behavior whether selecting round types, players, or modifiers, creating a cohesive experience where randomness feels fair rather than arbitrary.
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