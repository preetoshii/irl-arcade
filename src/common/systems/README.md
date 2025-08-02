## Core Systems

These are the engines that make the game actually work. While mechanics define what happens (the rules), systems define how things happen (the infrastructure).

Think of systems as the utilities in a building - the plumbing, electricity, and HVAC that every room depends on. Our AudioEngine is like the plumbing that delivers sound to any mechanic that needs it. The GameLoop is like the electrical system providing timing to everything. The EventBus is like an intercom system letting different parts communicate.

The key difference between systems and mechanics: you can't really turn systems off. If you disable the AudioEngine, no sounds play at all. If you stop the GameLoop, nothing happens on schedule. These are foundational pieces that mechanics build on top of.

Systems expose methods and functionality rather than rendering UI. They're often classes or contexts that provide services like speak(), startRound(), or emit(). Mechanics consume these services to create gameplay.

When building something new, ask: "Is this a feature of the game, or infrastructure that features need?" Features are mechanics, infrastructure goes here as a system.