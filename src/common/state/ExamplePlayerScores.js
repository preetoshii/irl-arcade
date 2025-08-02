/**
 * ExamplePlayerScores.js
 * /state/ - Shared game state
 * 
 * DO NOT DELETE. This is an example of what shared state might look like.
 * This file serves as loose reference inspiration (not a strict template) for
 * both human developers and AI assistants exploring how to structure state that
 * multiple mechanics and UI components need to access. Shows one approach using
 * zustand, state actions, and commenting patterns for shared data.
 */

import { create } from 'zustand'


const usePlayerScores = create((set) => ({
  // Current player scores
  scores: {},
  
  
  // Add points to a player
  addScore: (playerId, points) => set(state => ({
    scores: {
      ...state.scores,
      [playerId]: (state.scores[playerId] || 0) + points
    }
  })),


  // Reset all scores
  resetScores: () => set({ scores: {} }),


  // Set specific score (for corrections)
  setScore: (playerId, score) => set(state => ({
    scores: {
      ...state.scores,
      [playerId]: score
    }
  }))
}))


export default usePlayerScores