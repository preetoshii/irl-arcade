## Shared State

This folder contains all the data that multiple parts of the game need to access or modify. Think of it as the game's memory - who's playing, what's the current score, who's "it", what teams exist, and so on.

We use React Context here because it lets any component anywhere in the app read or update this shared information without passing props down through multiple levels. The game state is like a bulletin board that all mechanics can look at and write on.

For example, the PlayerCallouts mechanic needs to know who's playing so it can call out names. The EscalatingTempo mechanic needs to know how long the game has been running. The UI needs to show who's currently "it". Instead of each component maintaining its own copy of this information (which would get out of sync), they all read from and write to the same shared state.

Common things you'll find in state files: player lists, game status (active/paused), current game mode, scores, timers, who has what power-ups, audio settings, and any other data that needs to be shared across the app.

When adding new state, ask yourself: "Will more than one component need to know about this?" If yes, it belongs here.