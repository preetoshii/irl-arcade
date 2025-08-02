# Audio Game Lab Project Context

## Development Philosophy
Build a collection of audio-based games that can be played anywhere - in parks, backyards, or indoors. Each game is a self-contained experience that can be selected from a central menu. We prioritize **modular, hot-reloadable, experiment-friendly code** where developers can add new games without touching existing ones.

## Multi-Game Architecture

### Your Core Mission
For ANY code request, analyze which game it belongs to and whether it uses shared resources. Your goals:
- **Maintain Game Independence**: Each game should be completely self-contained
- **Maximize Code Reuse**: Shared systems and components live in `/common/`
- **Enable Rapid Development**: New games can be added in under 10 minutes
- **Preserve Hot Reload**: The menu and other games keep running while you develop

### The Multi-Game Structure

**`/src/games/`** - Individual game folders
Each game gets its own folder with all game-specific code. Games are mini-applications.

**`/src/common/`** - Shared resources across all games
Code that multiple games use: audio systems, timers, UI components, utilities.

**`/src/games/[game-name]/`** - Structure for each game:
- `config.js` - Game metadata (name, description, player count)
- `index.jsx` - Main game component
- `mechanics/` - Game-specific features
- `components/` - Game-specific UI
- `state/` - Game-specific state (if needed)

**`/src/common/`** - Shared structure:
- `systems/` - Core infrastructure (audio, timers)
- `components/` - Reusable UI elements
- `state/` - Shared app state
- `helpers/` - Utility functions
- `game-management/` - Game registry and loader

### Architecture Rules
- Games can be added/removed without affecting others
- Shared code in `/common/` must work for all games
- Each game declares its requirements in `config.js`
- Game selection happens through the central GameSelector
- Games are lazy-loaded for performance

### Creating a New Game

1. **Create game folder**: `/src/games/your-game/`

2. **Add config.js**:
```javascript
export default {
  id: 'your-game',
  name: 'Your Game Name',
  description: 'What makes this game fun',
  minPlayers: 2,
  maxPlayers: 20,
  requiresTeams: false,
  requires: ['audio', 'timer'], // Systems needed
  component: () => import('./index.jsx')
}
```

3. **Create index.jsx**:
```javascript
function YourGame({ onExit }) {
  return (
    <div className="your-game">
      {/* Game implementation */}
      <button onClick={onExit}>Back to Menu</button>
    </div>
  );
}
export default YourGame;
```

4. **Register in `/src/games/index.js`**:
```javascript
import yourGameConfig from './your-game/config';
gameRegistry.register(yourGameConfig);
```

### Game Development Patterns

**For Game-Specific Features:**
- Put in `/src/games/[game-name]/mechanics/`
- Import shared systems from `/src/common/systems/`
- Keep all game logic self-contained

**For Shared Features:**
- Audio playback → `/src/common/systems/AudioSystem.js`
- Game timers → `/src/common/systems/GameTimer.js`
- Player management → `/src/common/state/PlayerState.js`
- UI elements → `/src/common/components/`

**For New Games:**
- Start with the minimal structure above
- Copy from existing games as templates
- Focus on unique gameplay, reuse common systems


## Key Development Principles
- Games are independent apps within the main app
- Hot reload should work while switching between games
- New games should be testable within 5 minutes of creation
- Shared systems should be game-agnostic
- Audio remains the core focus across all games

## Current Setup
- React + Vite for hot module replacement
- Game registry for dynamic game discovery
- Lazy loading for optimal performance
- Global `Game` object for console experimentation
- Speech synthesis ready: `Game.speak("Hello")`


## Available Systems in /common/

### AudioSystem
- Text-to-speech with adjustable pitch/rate
- Sound effect playback
- Background music management

### GameTimer
- Configurable countdown timers
- Round-based timing
- Pause/resume functionality

### PlayerState
- Player name management
- Team assignment
- Score tracking

## Adding Game-Specific Mechanics

Within each game's folder:
```
/src/games/simon-says/
  ├── config.js           # Game metadata
  ├── index.jsx          # Main component
  ├── mechanics/         # Game rules
  │   ├── SimonCommands.js
  │   └── TeamManager.js
  ├── components/        # Game UI
  │   ├── TeamDisplay.jsx
  │   └── CommandDisplay.jsx
  └── state/            # Game state
      └── SimonState.js
```

## Testing New Games

1. Create minimal game structure
2. Register in game index
3. Select from menu
4. Hot reload while developing
5. No restart needed!

## Game Ideas Scratchpad
Use @idea-scribe to add new game concepts to `/GAME_IDEAS.md`


## Remember
The goal is **rapid game development** through modular architecture. Each game is a playground for experimentation. Shared systems handle the common needs. Hot reload keeps the development cycle fast. When in doubt, keep games independent and leverage shared systems!