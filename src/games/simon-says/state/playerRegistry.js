/**
 * Player registry for Simon Says
 * 
 * The PlayerRegistry is the game's social coordinator, keeping track of who's playing, who's on which team, and ensuring everyone gets their time in the spotlight. Imagine a thoughtful party host with a perfect memory - they remember who's been dancing all night and who's been sitting on the sidelines, and they make sure to invite the wallflowers onto the dance floor. That's exactly what PlayerRegistry does for Simon Says, maintaining fairness and inclusion through careful tracking of player participation.
 * 
 * The registry solves several critical problems that arise in real-world group play. Players might join late ("Sorry, parking was terrible!"), take breaks ("I need water!"), or leave early ("My ride is here!"). Through it all, the registry maintains an accurate picture of who's available to play. More importantly, it tracks selection history to ensure fair rotation. If Taylor has been selected for three activities while Jordan hasn't played once, the system will boost Jordan's selection weight, creating natural fairness without Simon having to explicitly manage it.
 */

import { PlayerStatus, createPlayer } from './types';
import { SELECTION_FAIRNESS, HISTORY_LIMITS } from './constants';

// ============================================
// PLAYER REGISTRY CLASS
// ============================================

class PlayerRegistry {
  constructor() {
    this.reset();
  }

  /**
   * Reset registry to empty state
   */
  reset() {
    this.players = new Map(); // playerId -> player object
    this.teams = new Map();   // teamId -> Set of playerIds
    this.listeners = [];
  }

  // ============================================
  // PLAYER MANAGEMENT
  // ============================================

  /**
   * Add a new player
   * 
   * When someone new joins the game, this method welcomes them into the system. It creates a complete player profile with a unique ID, assigns them to their chosen team, and initializes their stats at zero. The method also prevents duplicate names - if there's already an Alice playing, the new player needs to be Alice2 or use a nickname. This isn't just about data management; it's about creating clear identity in a game where Simon needs to call out specific players by name. Once added, the player immediately becomes eligible for selection in the next round.
   */
  addPlayer(name, teamId) {
    // Check if player with same name exists
    const existingPlayer = this.findPlayerByName(name);
    if (existingPlayer) {
      throw new Error(`Player "${name}" already exists`);
    }

    // Create new player
    const player = createPlayer(name, teamId);
    
    // Add to registry
    this.players.set(player.id, player);
    
    // Add to team
    if (!this.teams.has(teamId)) {
      this.teams.set(teamId, new Set());
    }
    this.teams.get(teamId).add(player.id);
    
    this.notifyListeners('player_added', player);
    return player;
  }

  /**
   * Remove a player
   */
  removePlayer(playerId) {
    const player = this.players.get(playerId);
    if (!player) return false;
    
    // Mark as departed (don't delete, keep for history)
    player.status = PlayerStatus.DEPARTED;
    player.departedAt = Date.now();
    
    // Remove from active team roster
    if (this.teams.has(player.team)) {
      this.teams.get(player.team).delete(playerId);
    }
    
    this.notifyListeners('player_removed', player);
    return true;
  }

  /**
   * Update player status
   */
  updatePlayerStatus(playerId, status) {
    const player = this.players.get(playerId);
    if (!player) return false;
    
    const oldStatus = player.status;
    player.status = status;
    
    // Track status change time
    if (status === PlayerStatus.BREAK) {
      player.breakStartTime = Date.now();
    } else if (oldStatus === PlayerStatus.BREAK) {
      player.lastBreakDuration = Date.now() - (player.breakStartTime || Date.now());
    }
    
    this.notifyListeners('player_status_changed', { player, oldStatus, newStatus: status });
    return true;
  }

  // ============================================
  // SELECTION TRACKING
  // ============================================

  /**
   * Record that a player was selected for an activity
   * 
   * This method is called every time Simon announces a player for an activity, creating a detailed history of participation. It's important to understand that this tracks SELECTION, not actual participation - if Simon says "Alice and Bob, time for a duel!" but Alice is tying her shoe and sits out, the system still records her as selected. This limitation exists because Simon can only speak, not observe. The method updates multiple statistics: how many times selected, which round they last played, what activities they've done recently, and who they've partnered with. This rich history enables the variety system to make intelligent decisions like avoiding the same partnerships repeatedly or ensuring someone who hasn't been selected recently gets priority.
   */
  recordSelection(playerId, roundNumber, activity, partners = []) {
    const player = this.players.get(playerId);
    if (!player) return false;
    
    // Update selection stats
    player.stats.timesSelected++;
    player.stats.lastSelectedRound = roundNumber;
    player.stats.roundsSinceSelected = 0;
    
    // Update activity history
    player.stats.recentActivities.unshift(activity);
    if (player.stats.recentActivities.length > HISTORY_LIMITS.RECENT_SELECTIONS) {
      player.stats.recentActivities.pop();
    }
    
    // Update partner history
    partners.forEach(partnerId => {
      if (partnerId !== playerId && !player.stats.recentPartners.includes(partnerId)) {
        player.stats.recentPartners.unshift(partnerId);
      }
    });
    if (player.stats.recentPartners.length > HISTORY_LIMITS.PARTNER_HISTORY) {
      player.stats.recentPartners = player.stats.recentPartners.slice(0, HISTORY_LIMITS.PARTNER_HISTORY);
    }
    
    this.notifyListeners('player_selected', { player, roundNumber, activity });
    return true;
  }

  /**
   * Update rounds since selected for all players
   */
  incrementRoundsSinceSelected() {
    this.players.forEach(player => {
      if (player.status === PlayerStatus.ACTIVE) {
        player.stats.roundsSinceSelected++;
      }
    });
  }

  // ============================================
  // QUERIES
  // ============================================

  /**
   * Get all active players
   */
  getActivePlayers() {
    return Array.from(this.players.values())
      .filter(p => p.status === PlayerStatus.ACTIVE);
  }

  /**
   * Get players by team
   */
  getTeamPlayers(teamId, activeOnly = true) {
    const playerIds = this.teams.get(teamId);
    if (!playerIds) return [];
    
    return Array.from(playerIds)
      .map(id => this.players.get(id))
      .filter(p => p && (!activeOnly || p.status === PlayerStatus.ACTIVE));
  }

  /**
   * Get all teams with active players
   */
  getActiveTeams() {
    const activeTeams = [];
    this.teams.forEach((playerIds, teamId) => {
      const activePlayers = Array.from(playerIds)
        .map(id => this.players.get(id))
        .filter(p => p && p.status === PlayerStatus.ACTIVE);
      
      if (activePlayers.length > 0) {
        activeTeams.push({
          id: teamId,
          playerCount: activePlayers.length,
          players: activePlayers
        });
      }
    });
    return activeTeams;
  }

  /**
   * Find player by name
   */
  findPlayerByName(name) {
    return Array.from(this.players.values())
      .find(p => p.name.toLowerCase() === name.toLowerCase());
  }

  /**
   * Get player by ID
   */
  getPlayer(playerId) {
    return this.players.get(playerId);
  }

  /**
   * Get selection weights for fair player selection
   * 
   * This is where the magic of fair selection happens. The method calculates a weight (probability modifier) for each player based on how long they've been waiting. It's like a virtual queue where waiting longer steadily increases your chances of being picked. A player who hasn't been selected in 5 rounds might have their weight doubled, while someone who just played has normal weight. The algorithm creates organic fairness - over the course of a match, everyone gets roughly equal opportunities without Simon having to explicitly take turns. It's particularly elegant because it works with any number of players and adapts naturally as people join or leave.
   */
  getSelectionWeights(eligiblePlayerIds = null) {
    const weights = new Map();
    const players = eligiblePlayerIds 
      ? eligiblePlayerIds.map(id => this.players.get(id)).filter(Boolean)
      : this.getActivePlayers();
    
    players.forEach(player => {
      let weight = 1.0;
      
      // Boost if waiting too long
      if (player.stats.roundsSinceSelected >= SELECTION_FAIRNESS.MAX_ROUNDS_WITHOUT_SELECTION) {
        weight *= SELECTION_FAIRNESS.SELECTION_BOOST_FACTOR;
      }
      
      // Gradual increase based on wait time
      weight *= (1 + player.stats.roundsSinceSelected * 0.1);
      
      weights.set(player.id, weight);
    });
    
    return weights;
  }

  /**
   * Check if two players were recent partners
   */
  wereRecentPartners(playerId1, playerId2) {
    const player1 = this.players.get(playerId1);
    const player2 = this.players.get(playerId2);
    
    if (!player1 || !player2) return false;
    
    return player1.stats.recentPartners.includes(playerId2) ||
           player2.stats.recentPartners.includes(playerId1);
  }

  // ============================================
  // TEAM MANAGEMENT
  // ============================================

  /**
   * Create a new team
   */
  createTeam(teamId, teamName = null) {
    if (this.teams.has(teamId)) {
      return false;
    }
    
    this.teams.set(teamId, new Set());
    
    // Store team metadata separately if needed
    if (teamName) {
      // Could store in a teamMetadata map
    }
    
    this.notifyListeners('team_created', { teamId, teamName });
    return true;
  }

  /**
   * Balance teams by moving players
   * 
   * Sometimes teams end up lopsided - maybe several players from one team had to leave early, or latecomers all joined the same team. This method analyzes team sizes and suggests rebalancing moves. If Red team has 8 players while Blue team has only 3, it might suggest moving 2-3 players to Blue team. The suggestions are just that - suggestions. Since Simon can't enforce team changes or even know if players actually switch, this simply provides the information for human players to self-organize. It's a gentle nudge toward fairness that respects player autonomy while promoting balanced gameplay.
   */
  suggestTeamBalance() {
    const teams = this.getActiveTeams();
    if (teams.length < 2) return null;
    
    // Sort by player count
    teams.sort((a, b) => b.playerCount - a.playerCount);
    
    const largest = teams[0];
    const smallest = teams[teams.length - 1];
    
    const difference = largest.playerCount - smallest.playerCount;
    if (difference <= 1) return null; // Already balanced
    
    // Suggest moving players
    const playersToMove = Math.floor(difference / 2);
    const suggestions = {
      from: largest.id,
      to: smallest.id,
      count: playersToMove,
      currentCounts: {
        [largest.id]: largest.playerCount,
        [smallest.id]: smallest.playerCount
      }
    };
    
    return suggestions;
  }

  // ============================================
  // STATISTICS
  // ============================================

  /**
   * Get registry statistics
   */
  getStatistics() {
    const allPlayers = Array.from(this.players.values());
    const activePlayers = allPlayers.filter(p => p.status === PlayerStatus.ACTIVE);
    
    return {
      totalPlayers: allPlayers.length,
      activePlayers: activePlayers.length,
      onBreak: allPlayers.filter(p => p.status === PlayerStatus.BREAK).length,
      departed: allPlayers.filter(p => p.status === PlayerStatus.DEPARTED).length,
      
      teamCount: this.getActiveTeams().length,
      
      averageSelectionsPerPlayer: activePlayers.length > 0
        ? activePlayers.reduce((sum, p) => sum + p.stats.timesSelected, 0) / activePlayers.length
        : 0,
      
      playersWaitingLongest: activePlayers
        .sort((a, b) => b.stats.roundsSinceSelected - a.stats.roundsSinceSelected)
        .slice(0, 5)
        .map(p => ({ name: p.name, roundsWaiting: p.stats.roundsSinceSelected }))
    };
  }

  // ============================================
  // EVENT SYSTEM
  // ============================================

  /**
   * Subscribe to registry changes
   */
  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /**
   * Notify listeners of changes
   */
  notifyListeners(event, data) {
    this.listeners.forEach(listener => {
      try {
        listener(event, data);
      } catch (error) {
        console.error('Error in registry listener:', error);
      }
    });
  }

  /**
   * Export registry state
   */
  export() {
    return {
      players: Array.from(this.players.values()),
      teams: Array.from(this.teams.entries()).map(([id, playerIds]) => ({
        id,
        players: Array.from(playerIds)
      }))
    };
  }

  /**
   * Import registry state
   */
  import(data) {
    this.reset();
    
    // Import teams first
    data.teams.forEach(team => {
      this.teams.set(team.id, new Set(team.players));
    });
    
    // Import players
    data.players.forEach(player => {
      this.players.set(player.id, player);
    });
  }
}

// Create singleton instance
const playerRegistry = new PlayerRegistry();

// Export both instance and class
export default playerRegistry;
export { PlayerRegistry };