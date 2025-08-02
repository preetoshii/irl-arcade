



------------------------------------------------------------------
## OVERVIEW
------------------------------------------------------------------


### What We're Building
-------------------------
A platform for **audio-based games** that can be played outdoors. Instead of traditional equipment like balls or nets, audio itself becomes the game prop or conductor. The app connects to a Bluetooth speaker and offers a menu of different games - from Simon Says to Tag to games we haven't invented yet. Each game is a self-contained experience where players interact based on what they hear.



### What We Know
-------------------------
- **Audio-based**: The game exists primarily through sound
- **Multiplayer**: 3-10+ people playing in physical space (could work with fewer or more)
- **Dynamic and Personalized**: System can call out player names, create personalized experiences
- **Physical space**: Meant to be played outdoors or in open areas



### What We Don't Know
-------------------------
- Could stay simple audio-only
- Could add AI-generated voices and dynamic narratives
- If we get really passionate, who knows what weird features we'd want - like a director mode where someone controls the chaos, or visual effects, or scoring systems
- Which games will be the most fun - that's why we built a platform to experiment
- The scope is intentionally undefined

**Core Philosophy**: We want to discover what's fun through experimentation, not plan everything upfront. Our architecture should support our experimentation and accommodate future scope, even if we never reach it.










------------------------------------------------------------------
## TECH STACK
------------------------------------------------------------------


### **React** (via Vite)
-------------------------
 React treats features like LEGO blocks - each new idea becomes a self-contained component you can snap in without rebuilding the whole structure. When someone suggests "what if players could vote on events?", that's just a new component dropped into the existing game, not a rewrite of your core logic. The game keeps running, existing features stay untouched, and the new feature either stays or gets removed with one line. **Why not Vanilla?** Well, with vanilla JavaScript, adding features means hunting through your code to find every place that needs updating. Want to show which player is "it" in three different places? You're manually updating three DOM elements and hoping you didn't miss one. React's state management means you change it once, and everywhere using that state updates automatically.



### **Vite** (Dev Server + Build Tool)
-----------------------------------------
The magic of Hot Module Replacement means your game literally never stops running while you code. Players stay in the list, audio keeps playing, and your changes appear instantly. Imagine testing a 10-minute game mode but having to restart and re-enter all players every time you tweak the timing - that's the vanilla experience. With Vite, you change the timing and the next audio cue uses your new value. The difference between momentum-killing stops and fluid experimentation.



### **JavaScript/JSX** 
-----------------------------------------
Maximum iteration speed, no type gymnastics in the park, easier for collaborators to jump in and contribute immediately. We chose JavaScript over TypeScript to keep the barrier low and the experimentation fast.










------------------------------------------------------------------
## DEVELOPMENT TOOLS
------------------------------------------------------------------


### **Claude Code / Cursor / Your Editor of Choice**
-------------------------
Claude Code is more ideal due to our Claude agents and subagents that create code in a more consistent way according to our rules, though you can also get Cursor to read through our codebase to understand how we want to do it as well. AI-powered coding is great for quick exploration of new APIs and ideas. Claude Code specifically allows CLAUDE.md files to give the AI context about your project philosophy and can use subagents for complex features later.



### **Git + GitHub**
-------------------------
Checkpoint working states when you find something fun, enable branching for wild experiments without breaking the main game, natural collaboration point for multiple developers.

**Our Repository**: https://github.com/preetoshii/irl-arcade

Clone it to start contributing:
```bash
git clone https://github.com/preetoshii/irl-arcade.git
cd irl-arcade
npm install
npm run dev
```



### **Vercel** (Deployment)
-------------------------
Auto-deploy on push means every git commit gives you a playable URL. When laptop battery dies, instantly switch to phone. Share progress with friends not at the park. Also connected to GitHub, with zero-config deployments, preview URLs for every branch in case we just wanna jump into a previous build.









------------------------------------------------------------------
## WTF IS VERCEL?
------------------------------------------------------------------

Think of Vercel as a magical host that turns your GitHub code into a live website anyone can access. No servers to manage, no deployment scripts to write - just push your code and boom, it's live on the internet.

**Here's our Live URL!**: https://irl-arcade.vercel.app

**How It Works:**
1. You push code to GitHub
2. Vercel sees the push and automatically builds your app
3. ~30 seconds later, your changes are live at the URL
4. Anyone with the link can play - no installation needed

**The Magic Part:**
- **Main branch** → Updates the production URL (irl-arcade.vercel.app)
- **Any other branch** → Gets its own preview URL (like `irl-arcade-feature-name.vercel.app`)
- **Laptop dies mid-session?** → Pull out your phone, go to the URL, keep playing
- **Friend wants to try?** → Send them the link, they're playing in seconds
- **Testing two ideas?** → Each branch has its own URL, test them back-to-back

**API Keys Are Handled:**
Vercel stores our API keys (OpenAI, ElevenLabs) server-side, which means:
- The live version has all features working
- Players don't need their own API keys
- No setup required - just visit and play
- Keys stay secure, not exposed in code

**Real Park Scenario:**
You're testing a new mechanic, laptop at 5% battery. You wanna play the latest version with someone. You quickly do a push on git hub. Laptop dies. You grab your phone, navigate to irl-arcade.vercel.app, and your new mechanic is part of the game. We can continue playing it while laptop stays home to charge if need be.

**For Devs:**
You don't need to know anything about deployment. Just push your code to GitHub, and Vercel handles the rest. Focus on making fun games, not DevOps. So basically ... don't even think about Vercel. Just know that there's a link at the ready to access the game at any time (https://irl-arcade.vercel.app)










------------------------------------------------------------------
## OUR TOYBOX (AKA LIBRARIES)
------------------------------------------------------------------

*Note: We may not use all of these, but having them pre-installed means we can grab and experiment immediately without setup friction. Especially for AI integrations - the manual process of installing packages, getting API keys, and configuring can kill creative momentum. Better to have toys ready to play with.*


**Framer Motion** (Animations)
Makes visual experiments instant - "what if this pulsed with the voice?" becomes a reality in minutes.


**Web Speech API** (Built-in)
No API keys, works offline, perfect for starting simple. Can do fun effects.


**OpenAI SDK** (AI Commands)
If we ever feel like experimenting with dynamic AI-generated content. (I know we don't want things to get all token-y and internet dependent, but just in case)


**ElevenLabs SDK** (AI Voices)
If we ever feel like using more natural voices instead of robotic ones (without making architectural changes).


**Tone.js** (Dynamic music generation)
Just in case we want to add more musical and dynamic elements, like a changing drum beat or different soundscape or each person.










------------------------------------------------------------------
## SCENARIOS AND HOW ARE STACK SUPPORTS THEM
------------------------------------------------------------------


### Scenario: "Playtesting in the Park"
-------------------------------------
**The Situation**: We're actively playing the game while coding new features.
**How Our Stack Handles It**: The game runs continuously through your laptop connected to the Bluetooth speaker. As players run around responding to audio cues, you're tweaking timing, adjusting voice parameters, or adding new sound patterns. With Vite's hot reload, every save instantly updates the running game - no stopping to re-enter player names, no breaking the flow, no "hold on, let me restart it." The audio keeps playing, the energy stays high, and ideas get tested the moment they're conceived.




### Scenario: "What If We Tried..."
-------------------------------------
**The Situation**: Mid-game, someone suggests "What if eliminated players became ghosts who could whisper distractions?"
**How Our Stack Handles It**: This could be a new mechanic for your current game or even a whole new game! Create `/src/games/ghost-tag/mechanics/GhostMode.jsx` that handles eliminated players. The component gives them their own audio channel. Your other games don't even know ghosts exist. Or if multiple games could use ghosts, put it in `/src/common/mechanics/GhostMode.jsx`. Either way, it's isolated and reusable.




### Scenario: "Laptop Battery at 5%"
-------------------------------------
**The Situation**: Deep into a great session, laptop dying.
**How Our Stack Handles It**: Because every git push triggers a Vercel deployment, you always have a recent version live on the web. Quick commit, push, and within 30 seconds your game is accessible at your-game.vercel.app. Open it on your phone, reconnect the Bluetooth speaker, and keep playing. You lose hot reload, but you don't lose momentum or the current game state you've been crafting all afternoon.




### Scenario: "Adding Visual Flair"
-------------------------------------
**The Situation**: Week 3, we decide the host character should pulse when speaking.
**How Our Stack Handles It**: Framer Motion is already installed and waiting. You tell Claude Code "make the host avatar pulse when speaking" and it adds the animation to your existing component. No new dependencies to install while your friends wait, no configuration needed. The visual enhancement layers on top of your audio game without disrupting it.




### Scenario: "Feature Branches"
-------------------------------------
**The Situation**: Two developers want to try conflicting ideas.
**How Our Stack Handles It**: Developer A creates a "powerup-system" branch while Developer B explores "elimination-mode." Both push their branches and get unique Vercel URLs. Now you can physically playtest both versions in the park, with different groups or back-to-back. The better idea wins through actual play, not theoretical debate. Merge the fun one, or cherry-pick the best parts of both.




### Scenario: "AI Integration"
-------------------------------------
**The Situation**: Month 2, we want AI-generated contextual audio based on how the game is progressing.
**How Our Stack Handles It**: Because OpenAI and ElevenLabs SDKs are pre-installed, you can start experimenting immediately. Create a hook that generates dynamic audio content based on game state. Your existing audio system doesn't know or care whether the text came from a hardcoded array or GPT-4 - it just speaks what it's given. The abstraction React provides means AI becomes an enhancement, not a rewrite.




### Scenario: "The Code Evolves"
-------------------------------------
**The Situation**: Our experiment becomes a real product.
**How Our Stack Handles It**: The beautiful thing about React is that messy code can be cleaned without being rewritten. That massive component full of experiments? Split it into smaller components as patterns emerge. That global Game object for console debugging? Gradually move its parts into proper React contexts. The game never stops working during this evolution. You're paving the cowpaths, not bulldozing and starting over.




### Scenario: "Collaborative Chaos"
-------------------------------------
**The Situation**: Three people coding different features simultaneously.
**How Our Stack Handles It**: React components create natural boundaries. One person works on the audio engine, another on player management, a third on visual effects. Git branches keep everyone's experiments separate until they're ready to merge. Each branch gets its own Vercel preview URL for testing. Components compose together without stepping on each other's toes.




### Scenario: "Scope Explosion"
-------------------------------------
**The Situation**: Started with Simon Says, now want Tag, Capture the Flag, Murder Mystery, and seasonal variants.
**How Our Stack Handles It**: Each new game is just another folder in `/src/games/`. Want tournament mode? Add it to `/src/common/systems/TournamentMode.js` and any game can use it. Want seasonal themes? That's `/src/common/components/SeasonalTheme.jsx`. The platform grows by addition - add new games without touching existing ones. Each game declares what it needs in its config.










------------------------------------------------------------------
## HOW OUR CODEBASE IS ORGANIZED
------------------------------------------------------------------

We've built a two-layer architecture that supports multiple games while keeping code organized. When you say "I want to add a shield mechanic to my game," we know exactly where it goes - and whether it should be shared or game-specific.

**Layer 1: Common vs Game-Specific**

**`/src/common/`** - Shared across all games
Infrastructure that multiple games use: audio systems, timers, player management, reusable UI components.

**`/src/games/[name]/`** - Individual game folders
Each game is a mini-application with its own rules, mechanics, and UI. Games can be added/removed without affecting others.

**Layer 2: The Folder System (applies within both common and games)**

**`mechanics/`** - Game features and rules (like "Shield Mode" or "Tag Logic")
Self-contained features that can be turned on/off. These are your LEGO blocks.

**`state/`** - Data that persists across components (players, scores, game status)
The memory that components share. Common state is app-wide, game state is game-specific.

**`systems/`** - Core infrastructure (audio engine, timers)
Foundational services that mechanics build on. Usually only in `/common/`.

**`components/`** - UI elements (player lists, buttons, displays)
How players interact with games. No game logic here, just UI controls.

**`helpers/`** - Pure utility functions (randomization, calculations, formatting)
Simple functions with no side effects. Input → Output.


**Why This Structure Works:**

When you have a game idea, it naturally breaks down. First ask: "Is this specific to my game or could other games use it?"

**Example: Adding shields to a specific game**
- "Shield mechanic for my game" → `/src/games/shield-tag/mechanics/ShieldMode.jsx`
- "Track who has shields" → `/src/games/shield-tag/state/gameState.js`
- "Show shield button" → `/src/games/shield-tag/components/ShieldButton.jsx`
- "Play shield sound" → Use `/src/common/systems/AudioSystem.js`
- "Calculate shield duration" → `/src/games/shield-tag/helpers/shieldCalculations.js`

**Example: Adding a feature all games could use**
- "Countdown timer system" → `/src/common/systems/GameTimer.js`
- "Player name display" → `/src/common/components/PlayerList.jsx`
- "Random player picker" → `/src/common/helpers/randomPlayer.js`

Every idea has a clear home—no confusion about where things go or why.


**The Magic:**
- Delete any mechanic → game still runs
- Add new mechanic → nothing else breaks
- Share state → all components stay in sync
- Pure helpers → reliable and testable
- Clear ownership → each folder has one job

This lets us go from "what if..." to testable feature in minutes, not hours.




------------------------------------------------------------------
## CREATING A NEW GAME
------------------------------------------------------------------

**1. Create your game folder**
```
/src/games/your-game-name/
```

**2. Add a config.js file**
```javascript
export default {
  id: 'your-game-name',
  name: 'Your Game Display Name',
  description: 'A fun game where players...',
  minPlayers: 2,
  maxPlayers: 20,
  requires: ['audio', 'timer'], // What common systems you need
  component: () => import('./index.jsx')
}
```

**3. Create your main game component (index.jsx)**
```javascript
function YourGame({ onExit }) {
  // Your game logic here
  return (
    <div className="your-game">
      <h1>Your Game</h1>
      {/* Game UI */}
      <button onClick={onExit}>Back to Menu</button>
    </div>
  );
}
export default YourGame;
```

**4. Add folders as needed**
- Need game rules? Create `mechanics/`
- Need UI elements? Create `components/`
- Need to track state? Create `state/`
- Most games only need 2-3 folders

**5. Register in /src/games/index.js**
```javascript
import yourGameConfig from './your-game-name/config';
gameRegistry.register(yourGameConfig);
```

That's it! Your game now appears in the menu and can be played immediately.




------------------------------------------------------------------
## CAPTURING IDEAS ON THE FLY
------------------------------------------------------------------

Sometimes the best ideas hit you mid-coding session. Maybe you're working on player callouts and suddenly think "what if eliminated players could haunt the living?" Don't lose that spark!

**Quick Capture Method:**
Just tell Claude or Cursor: "Add this idea to the idea scratchpad: [your messy idea]"

That's it! The @idea-scribe subagent will automatically add your idea to `/GAME_IDEAS.md` with a timestamp and clean formatting.

**Example:**
You: "Add to idea scratchpad: ok so like what if when youre tagged you become a ghost but you can only whisper to one person at a time and they dont know if youre helping or tricking them"

The idea gets added to GAME_IDEAS.md, beautifully formatted with all the paranoia and social dynamics captured.

Of course, you can always just edit `/GAME_IDEAS.md` directly to add your ideas.









------------------------------------------------------------------
## CONTRIBUTING & COLLABORATION
------------------------------------------------------------------

**Repository**: https://github.com/preetoshii/irl-arcade

**Quick Start for New Contributors:**
```bash
git clone https://github.com/preetoshii/irl-arcade.git
cd irl-arcade
npm install
cp .env.example .env  # Add your API keys if using AI features
npm run dev
```

**Remember**: Every branch automatically gets its own Vercel preview URL, so it's really easy to test different versions one after the other while we're outdoors.








------------------------------------------------------------------
## WHAT IS A SUCCESSFUL WORKFLOW + ARCHITECTURE?
------------------------------------------------------------------

This architecture and workflow succeeds if:

- We can go from idea to testable feature in minutes
- The game keeps running while we make changes (hot reload magic)
- Adding features doesn't break existing ones
- No anxiety about messy code - everything automatically gets broken down into our clean architecture with clear explanations of where it goes and why
- Experiments can evolve into real features through refactoring, not rewrites
- Anyone can jump in and contribute without deep technical knowledge
- We never feel boxed in by our technical decisions
- Ideas flow freely from brain to scratchpad to working code