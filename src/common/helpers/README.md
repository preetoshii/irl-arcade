## Helper Functions

Pure utility functions that do one thing well. These are your Swiss Army knife tools - no React, no state, no side effects, just input → output transformations.

Helpers are functions you find yourself needing in multiple places. Need to pick a random player? There's a helper for that. Need to shuffle an array? Calculate time remaining? Format a player's name for speech? Generate a random pitch for audio? All helpers.

The key rule for helpers: they must be "pure" functions. Given the same input, they always return the same output. They don't modify global state, don't use React hooks, don't make API calls. They just do math, transformations, and calculations.

This makes helpers incredibly reliable and testable. You can call pickRandomPlayer() a thousand times and know it will always behave the same way. You can use these helpers anywhere - in mechanics, in interface components, even in other helpers.

Common categories of helpers: randomization (picking, shuffling), audio (voice parameters, sound generation), timing (intervals, delays, formatting), game logic (scoring, team assignment), and storage (save/load formats).

When writing new code, if you find yourself thinking "I need to calculate/transform/generate something", that's probably a helper function.