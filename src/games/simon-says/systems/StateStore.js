/**
 * State Store for Simon Says
 * 
 * The StateStore acts as the single source of truth for all mutable data in Simon Says. Rather than having state scattered across dozens of components, everything lives here in one organized, observable location. Think of it as the game's filing cabinet where every piece of information has a proper place and can be retrieved instantly. But unlike a static filing cabinet, this one notifies interested parties whenever something changes. When the current round updates, any system that cares about round numbers immediately knows about it without having to constantly check.
 * 
 * What makes StateStore particularly powerful is its transaction system. In a complex game, multiple related values often need to change together - for example, when a round completes, we might need to update the current round number, add to the history, update player stats, and change the match status. Transactions ensure these changes happen atomically - either all succeed or all fail, preventing the game from ever being in an inconsistent state. It's like making sure all the dominoes fall in the right order, or none fall at all.
 */

import eventBus, { Events } from './EventBus';

// ============================================
// STATE STORE IMPLEMENTATION
// ============================================

class StateStore {
  constructor() {
    this.state = new Map();
    this.subscribers = new Map(); // key -> Set of callbacks
    this.transactionQueue = [];
    this.isInTransaction = false;
    this.debugMode = false;
    this.history = [];
    this.maxHistorySize = 50;
  }

  /**
   * Get a value from the store
   * 
   * Retrieving values from the store is straightforward but includes thoughtful defaults. When you ask for a value that doesn't exist, instead of returning undefined (which often causes errors), it returns the defaultValue you specify. This defensive programming prevents many common bugs. For example, getting the 'currentRound' before a match starts returns 0 instead of undefined, allowing mathematical operations to work correctly without extra null checks throughout the codebase.
   * 
   * @param {string} key - State key
   * @param {any} defaultValue - Default value if key doesn't exist
   * @returns {any} The state value
   */
  get(key, defaultValue = null) {
    if (this.state.has(key)) {
      return this.state.get(key);
    }
    return defaultValue;
  }

  /**
   * Get multiple values from the store
   * @param {string[]} keys - Array of state keys
   * @returns {Object} Object with requested values
   */
  getMultiple(keys) {
    const result = {};
    keys.forEach(key => {
      result[key] = this.get(key);
    });
    return result;
  }

  /**
   * Get a nested value using dot notation
   * @param {string} path - Dot-separated path (e.g., 'match.config.difficulty')
   * @param {any} defaultValue - Default value if path doesn't exist
   * @returns {any} The nested value
   */
  getPath(path, defaultValue = null) {
    const keys = path.split('.');
    let current = this.state;
    
    for (const key of keys) {
      if (current instanceof Map) {
        current = current.get(key);
      } else if (current && typeof current === 'object') {
        current = current[key];
      } else {
        return defaultValue;
      }
      
      if (current === undefined) {
        return defaultValue;
      }
    }
    
    return current;
  }

  /**
   * Set a value in the store
   * @param {string} key - State key
   * @param {any} value - State value
   * @param {boolean} notify - Whether to notify subscribers
   */
  set(key, value, notify = true) {
    const oldValue = this.state.get(key);
    const hasChanged = oldValue !== value;
    
    this.state.set(key, value);
    
    if (hasChanged) {
      // Record history
      this.recordChange(key, oldValue, value);
      
      // Debug logging
      if (this.debugMode) {
        console.log(`[StateStore] ${key} changed:`, { oldValue, newValue: value });
      }
      
      // Notify subscribers
      if (notify && !this.isInTransaction) {
        this.notifySubscribers(key, value, oldValue);
      }
    }
  }

  /**
   * Set multiple values at once
   * @param {Object} updates - Object with key-value pairs
   * @param {boolean} notify - Whether to notify subscribers
   */
  setMultiple(updates, notify = true) {
    if (notify) {
      this.transaction(() => {
        Object.entries(updates).forEach(([key, value]) => {
          this.set(key, value, false);
        });
      });
    } else {
      Object.entries(updates).forEach(([key, value]) => {
        this.set(key, value, false);
      });
    }
  }

  /**
   * Delete a value from the store
   * @param {string} key - State key
   */
  delete(key) {
    if (this.state.has(key)) {
      const oldValue = this.state.get(key);
      this.state.delete(key);
      
      // Record history
      this.recordChange(key, oldValue, undefined);
      
      // Notify subscribers
      if (!this.isInTransaction) {
        this.notifySubscribers(key, undefined, oldValue);
      }
    }
  }

  /**
   * Clear all state
   */
  clear() {
    const oldState = new Map(this.state);
    this.state.clear();
    
    // Notify all subscribers
    oldState.forEach((value, key) => {
      this.notifySubscribers(key, undefined, value);
    });
  }

  /**
   * Execute a transaction (batch updates)
   * 
   * Transactions are one of StateStore's most elegant features. When you need to make multiple related changes, wrapping them in a transaction ensures consistency and performance. During a transaction, individual set() calls don't trigger notifications - instead, all changes are batched and notifications are sent once at the end. This prevents systems from seeing partial updates and reacting to incomplete state. If any error occurs during the transaction, all changes are rolled back, ensuring the game never gets stuck in a broken state. It's like having an undo button that automatically triggers if something goes wrong.
   * 
   * @param {Function} callback - Transaction callback
   */
  transaction(callback) {
    if (this.isInTransaction) {
      // Nested transaction - just execute
      callback();
      return;
    }
    
    this.isInTransaction = true;
    const changes = new Map(); // Track all changes
    
    // Override set to collect changes
    const originalSet = this.set.bind(this);
    this.set = (key, value) => {
      const oldValue = this.state.get(key);
      originalSet(key, value, false); // Don't notify yet
      changes.set(key, { oldValue, newValue: value });
    };
    
    try {
      // Execute transaction
      callback();
      
      // Restore original set
      this.set = originalSet;
      this.isInTransaction = false;
      
      // Notify all changes at once
      changes.forEach(({ oldValue, newValue }, key) => {
        if (oldValue !== newValue) {
          this.notifySubscribers(key, newValue, oldValue);
        }
      });
      
      // Emit transaction complete event
      eventBus.emit('state:transaction:complete', { changes: Array.from(changes.entries()) });
      
    } catch (error) {
      // Restore original set
      this.set = originalSet;
      this.isInTransaction = false;
      
      // Rollback changes
      changes.forEach(({ oldValue }, key) => {
        this.state.set(key, oldValue);
      });
      
      eventBus.emit(Events.STATE_ERROR, { error, transaction: true });
      throw error;
    }
  }

  /**
   * Subscribe to state changes
   * 
   * The subscription system turns StateStore from a passive data holder into an active participant in the game's flow. Systems can watch specific keys they care about, receiving notifications only when those values change. This targeted approach is much more efficient than having every system check every change. A system watching 'currentRound' doesn't care when player names update, and vice versa. The ability to watch multiple keys with one subscription is particularly useful for related data - a UI component might watch both 'match.status' and 'match.currentRound' to update its display appropriately.
   * 
   * @param {string|string[]} keys - Key or array of keys to watch
   * @param {Function} callback - Callback function
   * @returns {Function} Unsubscribe function
   */
  subscribe(keys, callback) {
    const keyArray = Array.isArray(keys) ? keys : [keys];
    
    keyArray.forEach(key => {
      if (!this.subscribers.has(key)) {
        this.subscribers.set(key, new Set());
      }
      this.subscribers.get(key).add(callback);
    });
    
    // Return unsubscribe function
    return () => {
      keyArray.forEach(key => {
        const callbacks = this.subscribers.get(key);
        if (callbacks) {
          callbacks.delete(callback);
          if (callbacks.size === 0) {
            this.subscribers.delete(key);
          }
        }
      });
    };
  }

  /**
   * Subscribe to all state changes
   * @param {Function} callback - Callback function
   * @returns {Function} Unsubscribe function
   */
  subscribeAll(callback) {
    const key = '*'; // Special key for all changes
    
    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, new Set());
    }
    this.subscribers.get(key).add(callback);
    
    return () => {
      const callbacks = this.subscribers.get(key);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.subscribers.delete(key);
        }
      }
    };
  }

  /**
   * Notify subscribers of a change
   */
  notifySubscribers(key, newValue, oldValue) {
    // Notify specific key subscribers
    const callbacks = this.subscribers.get(key);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback({ key, newValue, oldValue });
        } catch (error) {
          console.error(`[StateStore] Error in subscriber for ${key}:`, error);
        }
      });
    }
    
    // Notify wildcard subscribers
    const wildcardCallbacks = this.subscribers.get('*');
    if (wildcardCallbacks) {
      wildcardCallbacks.forEach(callback => {
        try {
          callback({ key, newValue, oldValue });
        } catch (error) {
          console.error('[StateStore] Error in wildcard subscriber:', error);
        }
      });
    }
  }

  /**
   * Create a snapshot of current state
   * @returns {Object} State snapshot
   */
  snapshot() {
    const snapshot = {};
    this.state.forEach((value, key) => {
      snapshot[key] = value;
    });
    return snapshot;
  }

  /**
   * Restore state from a snapshot
   * @param {Object} snapshot - State snapshot
   */
  restore(snapshot) {
    this.transaction(() => {
      // Clear existing state
      this.state.clear();
      
      // Restore from snapshot
      Object.entries(snapshot).forEach(([key, value]) => {
        this.set(key, value);
      });
    });
    
    eventBus.emit(Events.STATE_RESTORED, { snapshot });
  }

  /**
   * Record a state change in history
   */
  recordChange(key, oldValue, newValue) {
    this.history.push({
      key,
      oldValue,
      newValue,
      timestamp: Date.now()
    });
    
    // Trim history if too large
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
    }
  }

  /**
   * Get state change history
   * @param {string} key - Optional key filter
   * @returns {Array} Change history
   */
  getHistory(key = null) {
    if (key) {
      return this.history.filter(item => item.key === key);
    }
    return [...this.history];
  }

  /**
   * Clear history
   */
  clearHistory() {
    this.history = [];
  }

  /**
   * Enable/disable debug mode
   */
  setDebugMode(enabled) {
    this.debugMode = enabled;
  }

  /**
   * Get store statistics
   */
  getStats() {
    return {
      stateKeys: this.state.size,
      subscribers: this.subscribers.size,
      historySize: this.history.length,
      isInTransaction: this.isInTransaction
    };
  }
}

// ============================================
// SIMON SAYS STATE KEYS
// ============================================

/**
 * Standard state keys used in Simon Says
 */
export const StateKeys = {
  // Match state
  MATCH_ID: 'match.id',
  MATCH_STATUS: 'match.status',
  MATCH_CONFIG: 'match.config',
  CURRENT_BLOCK: 'match.currentBlock',
  BLOCK_HISTORY: 'match.blockHistory',
  
  // Pattern state
  SELECTED_PATTERN: 'pattern.selected',
  PATTERN_SEQUENCE: 'pattern.sequence',
  PATTERN_INDEX: 'pattern.index',
  
  // Player state
  ACTIVE_PLAYERS: 'players.active',
  PLAYER_REGISTRY: 'players.registry',
  TEAM_ROSTERS: 'players.teams',
  
  // Selection state
  RECENT_PLAYS: 'selection.recentPlays',
  RECENT_SELECTIONS: 'selection.recentSelections',
  
  // Performance state
  CURRENT_PERFORMANCE: 'performance.current',
  PERFORMANCE_QUEUE: 'performance.queue',
  
  // System state
  SYSTEM_READY: 'system.ready',
  SYSTEM_CONFIG: 'system.config',
  DEBUG_MODE: 'system.debug'
};

// Create singleton instance
const stateStore = new StateStore();

// Export both instance and class
export default stateStore;
export { StateStore, StateKeys };