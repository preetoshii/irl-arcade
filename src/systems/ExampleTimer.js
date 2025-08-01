/**
 * ExampleTimer.js
 * /systems/ - Core infrastructure
 * 
 * DO NOT DELETE. This is an example of what a system might look like.
 * This file serves as loose reference inspiration (not a strict template) for
 * both human developers and AI assistants thinking about core infrastructure
 * that mechanics rely on. Shows one possible approach: singleton pattern,
 * public API separation, and console access for debugging.
 */


// ========================================
// Timer System
// ========================================


class GameTimer {
  constructor() {
    this.timers = new Map()
    this.nextId = 1
  }


  // Start a new timer
  start(duration, callback, label = 'unnamed') {
    const id = this.nextId++
    
    const timerId = setTimeout(() => {
      callback()
      this.timers.delete(id)
    }, duration)


    // Store timer info
    this.timers.set(id, {
      timerId,
      label,
      startTime: Date.now(),
      duration
    })


    return id
  }


  // Cancel a timer
  cancel(id) {
    const timer = this.timers.get(id)
    if (timer) {
      clearTimeout(timer.timerId)
      this.timers.delete(id)
      return true
    }
    return false
  }


  // Get all active timers
  getActive() {
    return Array.from(this.timers.entries()).map(([id, timer]) => ({
      id,
      label: timer.label,
      remaining: Math.max(0, timer.duration - (Date.now() - timer.startTime))
    }))
  }
}


// Create singleton instance
const gameTimer = new GameTimer()


// Console access for debugging
window.Game = window.Game || {}
window.Game.timer = gameTimer


export default gameTimer