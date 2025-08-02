## Interface Components

This is the control panel for your game - all the buttons, lists, and displays that let players interact with and configure the experience. These components are about user interaction, not game logic.

While mechanics contain the rules of the game, interface components let you start/stop the game, add/remove players, toggle mechanics on/off, and see what's happening. Think of it like the difference between a car's engine (mechanics) and its dashboard (interface).

Examples of interface components: the player list that shows who's playing, the "Start Game" button, toggles for enabling different mechanics, score displays, settings panels, and debug tools for testing in the park.

These components are typically more traditional React components - they manage UI state (like whether a modal is open), handle user input, and display information from the game state. They don't contain game rules or timing logic - they just provide ways for humans to control and observe the game.

When adding a new component, ask: "Is this about how users control or view the game?" If yes, it belongs here. If it's about game rules or what happens during play, it's probably a mechanic instead.