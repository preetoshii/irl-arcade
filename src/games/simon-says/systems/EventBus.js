/**
 * Event Bus for Simon Says
 * 
 * The EventBus is the nervous system of Simon Says, allowing different parts of the game to communicate without directly knowing about each other. Imagine a bustling restaurant where the kitchen doesn't need to know every waiter by name - they just call out "Order ready for table 5!" and the right waiter responds. Similarly, when the PlaySelector chooses an activity, it doesn't need to know about the PerformanceSystem - it just emits a PLAY_SELECTED event, and interested systems respond accordingly. This decoupling is crucial for maintainability; we can add new systems or modify existing ones without untangling a web of direct dependencies.
 * 
 * The event-driven architecture solves a fundamental challenge in complex systems: how do you coordinate multiple components without creating spaghetti code? By using events, each system can focus on its own responsibilities while staying informed about relevant changes elsewhere. When a player joins mid-game, the PlayerRegistry emits PLAYER_ADDED, which might trigger the MatchOrchestrator to queue a welcome announcement, the StateStore to update its records, and the UI to refresh the player list - all without these systems directly calling each other. It's like a well-choreographed dance where everyone knows their cues.
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
   * 
   * This method is how systems express interest in things happening elsewhere in the game. When a system calls on('match:started', myHandler), it's like saying "Hey, let me know when a match starts - I have some setup to do." The beauty of returning an unsubscribe function is that systems can easily clean up after themselves. If a component is being destroyed or no longer needs updates, it just calls the returned function to stop receiving events. This prevents memory leaks and ensures systems only process events they actually care about.
   * 
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
   * 
   * When something noteworthy happens in the game, emit() broadcasts that information to all interested parties. It's like making an announcement over the PA system - you don't need to know who's listening, you just share the information. The method includes error handling so that if one listener crashes, it doesn't bring down the whole system. This robustness is crucial in a real-world application where various edge cases might cause individual handlers to fail. The optional debug mode logs all events, which is invaluable for understanding the flow of a complex match or diagnosing issues.
   * 
   * @param {string} event - Event name
   * @param {any} data - Event data
   */
  emit(event, data = null) {
    // Record in history
    this.recordEvent(event, data);

    // Debug logging
    if (this.debugMode || event === 'block:completed') {
      console.log(`[EventBus] Emitting ${event}`, data);
      console.log(`[EventBus] Handlers for ${event}:`, this.events.get(event)?.size || 0);
    }

    // Get handlers
    const handlers = this.events.get(event);
    if (!handlers || handlers.size === 0) {
      if (this.debugMode || event === 'block:completed') {
        console.warn(`[EventBus] No handlers for event: ${event}`);
      }
      return;
    }

    // Call all handlers
    let handlerCount = 0;
    handlers.forEach(handler => {
      try {
        if (event === 'block:completed') {
          console.log(`[EventBus] Calling handler ${++handlerCount} for ${event}`);
        }
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
 * 
 * This Events object is like a contract between all systems, defining the vocabulary they use to communicate. By centralizing event names here, we avoid typos and make it easy to see all possible events at a glance. The naming convention (NOUN:VERB or NOUN:VERB:DETAIL) creates a natural hierarchy - you can listen to all player events with a pattern, or specific ones like PLAYER_ADDED. Each event represents a meaningful state change or action in the game, from the high-level (MATCH_STARTED) to the specific (SCRIPT_COMPLETED). New developers can quickly understand the game's flow by reading through these events.
 */
const Events = {
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