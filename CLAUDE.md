# Audio Game Project Context

## Project Philosophy
We're building a physical game where audio IS the game equipment. We're optimizing for **discovery through play** and **sustainable experimentation**. The scope is intentionally undefined - we want to find what's fun first, then polish what works.

## Key Principles
- Features should be LEGO blocks - easy to add, easy to remove
- The game should keep running while we code (hot reload is crucial)
- Go from idea to testable feature in under 5 minutes
- Architecture should never be the reason we can't try something

## Current Setup
- React + Vite for hot module replacement
- Global `Game` object for console experimentation
- Speech synthesis ready to use: `Game.speak("Hello")`
- All libraries pre-installed to avoid setup friction during park sessions

## Common Patterns
- Use components for features so they can be added/removed with one line
- Keep game state accessible globally for console experiments
- Audio is the core - everything else supports it

## When Coding
- Remember we're in a park, possibly with dying laptop batteries
- If someone suggests a wild idea, we should be able to test it immediately
- Use the --host flag (`npm run dev`) so phones can connect too

## Available Subagents
- @code-architect: Breaks down code requests into our 5-folder architecture with detailed explanations
- @comment-styler: Applies the Clarity Commenting System to your code
- @idea-scribe: Documents game ideas in the Idea Scratchpad

These subagents will be used automatically when appropriate, or you can call them explicitly by name.