## Game Mechanics

This is where all the fun lives. Each file in this folder is a self-contained game mechanic - think of them as the different "rules" or "modes" that can be turned on or off during gameplay.

A mechanic might be something like "call out a random player every 10 seconds" or "make the game speed up over time" or "give players shields they can activate". Each mechanic is built as its own React component that manages its own state, timers, and logic.

The beautiful thing about organizing mechanics this way is that you can mix and match them like LEGO blocks. Want a chill game? Turn on just PlayerCallouts. Want chaos? Enable PlayerCallouts + EscalatingTempo + PowerUps all at once. Found out that ShieldMode isn't fun? Just don't import it, or set enabled={false}.

Each mechanic component receives props like `enabled` and has access to shared game state (like the player list) through our state system. But importantly, if you delete any mechanic file, the game still runs fine - nothing depends on any specific mechanic existing.

When you have a new game idea, ask yourself: "Is this a new rule/mode for how the game can be played?" If yes, it belongs here as a new mechanic file.