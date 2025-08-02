/**
 * State exports for Simon Says
 * Central export point for all state-related modules
 */

// Core types and constants
export * from './types';
export * from './constants';

// State management
export { default as matchState } from './matchState';
export { default as playerRegistry } from './playerRegistry';

// Re-export classes for testing
export { MatchState } from './matchState';
export { PlayerRegistry } from './playerRegistry';