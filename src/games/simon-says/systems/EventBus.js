/**
 * Event Bus for Simon Says
 * Provides pub/sub communication between systems
 */

// ============================================
// EVENT BUS IMPLEMENTATION
// ============================================

class EventBus {
  constructor() {
    this.events = new Map(); // event -> Set of listeners
    this.eventHistory = [];  // For debugging
    this.maxHistorySize = 100;
    this.debugMode = false;
  }

  /**
   * Subscribe to an event
   * @param {string} event - Event name
   * @param {Function} handler - Event handler function
   * @returns {Function} Unsubscribe function
   */
  on(event, handler) {
    if (typeof handler !== 'function') {
      throw new Error('Handler must be a function');
    }

    if (!this.events.has(event)) {
      this.events.set(event, new Set());
    }

    this.events.get(event).add(handler);

    // Return unsubscribe function
    return () => this.off(event, handler);
  }

  /**
   * Subscribe to an event (only triggers once)
   * @param {string} event - Event name
   * @param {Function} handler - Event handler function
   * @returns {Function} Unsubscribe function
   */
  once(event, handler) {
    const wrappedHandler = (data) => {
      handler(data);
      this.off(event, wrappedHandler);
    };

    return this.on(event, wrappedHandler);
  }

  /**
   * Unsubscribe from an event
   * @param {string} event - Event name
   * @param {Function} handler - Event handler to remove
   */
  off(event, handler) {
    const handlers = this.events.get(event);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.events.delete(event);
      }
    }
  }

  /**
   * Emit an event
   * @param {string} event - Event name
   * @param {any} data - Event data
   */
  emit(event, data = null) {
    // Record in history
    this.recordEvent(event, data);

    // Debug logging
    if (this.debugMode) {
      console.log(`[EventBus] ${event}`, data);
    }

    // Get handlers
    const handlers = this.events.get(event);
    if (!handlers || handlers.size === 0) {
      if (this.debugMode) {
        console.warn(`[EventBus] No handlers for event: ${event}`);
      }
      return;
    }

    // Call all handlers
    handlers.forEach(handler => {
      try {
        handler(data);
      } catch (error) {
        console.error(`[EventBus] Error in handler for ${event}:`, error);
      }
    });
  }

  /**
   * Emit an event asynchronously
   * @param {string} event - Event name
   * @param {any} data - Event data
   * @returns {Promise} Resolves when all handlers complete
   */
  async emitAsync(event, data = null) {
    // Record in history
    this.recordEvent(event, data);

    // Debug logging
    if (this.debugMode) {
      console.log(`[EventBus] ${event} (async)`, data);
    }

    // Get handlers
    const handlers = this.events.get(event);
    if (!handlers || handlers.size === 0) {
      return;
    }

    // Call all handlers asynchronously
    const promises = Array.from(handlers).map(async handler => {
      try {
        await handler(data);
      } catch (error) {
        console.error(`[EventBus] Error in async handler for ${event}:`, error);
      }
    });

    await Promise.all(promises);
  }

  /**
   * Remove all listeners for an event
   * @param {string} event - Event name
   */
  removeAllListeners(event = null) {
    if (event) {
      this.events.delete(event);
    } else {
      this.events.clear();
    }
  }

  /**
   * Get listener count for an event
   * @param {string} event - Event name
   * @returns {number} Number of listeners
   */
  listenerCount(event) {
    const handlers = this.events.get(event);
    return handlers ? handlers.size : 0;
  }

  /**
   * Get all event names
   * @returns {string[]} Array of event names
   */
  eventNames() {
    return Array.from(this.events.keys());
  }

  /**
   * Record event in history
   */
  recordEvent(event, data) {
    this.eventHistory.push({
      event,
      data,
      timestamp: Date.now()
    });

    // Trim history if too large
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.shift();
    }
  }

  /**
   * Get event history
   * @param {string} event - Optional event filter
   * @returns {Array} Event history
   */
  getHistory(event = null) {
    if (event) {
      return this.eventHistory.filter(item => item.event === event);
    }
    return [...this.eventHistory];
  }

  /**
   * Clear event history
   */
  clearHistory() {
    this.eventHistory = [];
  }

  /**
   * Enable/disable debug mode
   */
  setDebugMode(enabled) {
    this.debugMode = enabled;
  }
}

// ============================================
// SIMON SAYS SPECIFIC EVENTS
// ============================================

/**
 * Standard events used in Simon Says
 */
export const Events = {
  // Match lifecycle
  MATCH_INITIALIZED: 'match:initialized',
  MATCH_STARTED: 'match:started',
  MATCH_COMPLETED: 'match:completed',
  MATCH_ABANDONED: 'match:abandoned',
  MATCH_PAUSED: 'match:paused',
  MATCH_RESUMED: 'match:resumed',

  // Block lifecycle
  BLOCK_STARTED: 'block:started',
  BLOCK_COMPLETED: 'block:completed',
  BLOCK_SELECTION_STARTED: 'block:selection:started',
  BLOCK_SELECTION_COMPLETED: 'block:selection:completed',

  // Pattern events
  PATTERN_SELECTED: 'pattern:selected',
  PATTERN_COMPLETE: 'pattern:complete',

  // Play events
  PLAY_SELECTED: 'play:selected',
  PLAY_STARTED: 'play:started',
  PLAY_COMPLETED: 'play:completed',

  // Performance events
  PERFORMANCE_STARTED: 'performance:started',
  PERFORMANCE_COMPLETED: 'performance:completed',
  SCRIPT_STARTED: 'script:started',
  SCRIPT_COMPLETED: 'script:completed',

  // Player events
  PLAYER_ADDED: 'player:added',
  PLAYER_REMOVED: 'player:removed',
  PLAYER_STATUS_CHANGED: 'player:status:changed',
  PLAYER_SELECTED: 'player:selected',
  PLAYERS_UPDATED: 'players:updated',

  // Team events
  TEAM_CREATED: 'team:created',
  TEAM_UPDATED: 'team:updated',
  TEAMS_REBALANCED: 'teams:rebalanced',

  // State events
  STATE_CHECKPOINT_CREATED: 'state:checkpoint:created',
  STATE_RESTORED: 'state:restored',
  STATE_ERROR: 'state:error',

  // System events
  CONFIG_LOADED: 'config:loaded',
  CONFIG_UPDATED: 'config:updated',
  SYSTEM_ERROR: 'system:error',
  SYSTEM_READY: 'system:ready'
};

// ============================================
// TYPED EVENT EMITTER
// ============================================

/**
 * Typed event emitter for better developer experience
 */
class TypedEventBus extends EventBus {
  /**
   * Emit a typed event
   * @param {string} event - Event from Events enum
   * @param {any} data - Event data
   */
  emitTyped(event, data) {
    // Validate event is from Events enum
    const validEvents = Object.values(Events);
    if (!validEvents.includes(event)) {
      console.warn(`[EventBus] Unknown event type: ${event}`);
    }
    
    this.emit(event, data);
  }

  /**
   * Subscribe to a typed event
   * @param {string} event - Event from Events enum
   * @param {Function} handler - Event handler
   * @returns {Function} Unsubscribe function
   */
  onTyped(event, handler) {
    // Validate event is from Events enum
    const validEvents = Object.values(Events);
    if (!validEvents.includes(event)) {
      console.warn(`[EventBus] Unknown event type: ${event}`);
    }
    
    return this.on(event, handler);
  }
}

// Create singleton instance
const eventBus = new TypedEventBus();

// Export both instance and class
export default eventBus;
export { EventBus, TypedEventBus, Events };