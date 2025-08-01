



------------------------------------------------------------------
## OVERVIEW
------------------------------------------------------------------


### What We're Building
-------------------------
A physical game that uses **audio as the prop** instead of traditional equipment like balls or nets. The app connects to a Bluetooth speaker, and players interact with each other based on what they hear. Think of audio itself as the game equipment - the thing that shapes how people move, react, and play together.



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
- Could become multiple game types or an entire platform
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
Maximum iteration speed, no type gymnastics in the park, easier for collaborators to jump in and contribute immediately. Not TypeScript, as that creates a few more hurdles.










------------------------------------------------------------------
## DEVELOPMENT TOOLS
------------------------------------------------------------------


### **Claude Code / Cursor / Your Editor of Choice**
-------------------------
Claude Code is more ideal due to our Claude agents and subagents that create code in a more consistent way according to our rules, though you can also get Cursor to read through our codebase to understand how we want to do it as well. AI-powered coding is great for quick exploration of new APIs and ideas. Claude Code specifically allows CLAUDE.md files to give the AI context about your project philosophy and can use subagents for complex features later.



### **Git + GitHub**
-------------------------
Checkpoint working states when you find something fun, enable branching for wild experiments without breaking the main game, natural collaboration point for multiple developers.



### **Vercel** (Deployment)
-------------------------
Auto-deploy on push means every git commit gives you a playable URL. When laptop battery dies, instantly switch to phone. Share progress with friends not at the park. Also connected to GitHub, with zero-config deployments, preview URLs for every branch in case we just wanna jump into a previous build.










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
**How Our Stack Handles It**: With React's component model, this wild idea doesn't require touching any existing code. You create a GhostMode component that listens for eliminated players and gives them their own audio channel. Drop it into your main game component, and suddenly ghosts exist. Don't like it? Remove one line. The core game never knew ghosts existed. Compare this to vanilla, where you'd be threading ghost logic through your entire game loop, touching files you haven't looked at in weeks.




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
**The Situation**: Started with simple audio cues, now want scoreboards, team modes, tournaments, seasonal events.
**How Our Stack Handles It**: Each new system is just another component added to the tree. Want tournaments? That's a component wrapping your existing game. Want seasonal themes? That's a context provider that your audio system can read from. The architecture grows by addition, not modification. Features can be toggled on or off by including or excluding components.










------------------------------------------------------------------
## HOW OUR CODEBASE IS ORGANIZED
------------------------------------------------------------------

We've structured our code to match how game developers think, and free them up to just do that thinking. When you say "Hmmm I want a mechanic where players get shields that last 5 seconds," we can BREAK THAT request down into our architecture which knows exactly where everything goes.

**The Five-Folder System:**

**`/mechanics/`** - Self-contained game features (like "Shield Mode" or "Player Callouts")
Each file is one complete game mechanic that can be turned on/off independently. These are your LEGO blocks.

**`/state/`** - Shared data all mechanics can read/write (who's playing, who's "it", scores)
This is the game's memory that persists across different mechanics and UI components.

**`/systems/`** - Core infrastructure that makes mechanics work (audio engine, game timer)
These are the foundational services that mechanics build on top of. You can't turn these off.

**`/interface/`** - UI controls for humans (player lists, start button, settings)
How players interact with and configure the game. No game logic here, just controls.

**`/helpers/`** - Pure utility functions (pick random player, calculate time, format text)
Simple functions that transform input to output. No React, no state, just math and logic.


**Why This Structure Works:**

When you have a game idea, it naturally breaks down:
- "Players can activate shields" → New mechanic in `/mechanics/ShieldMode.jsx`
- "Track who has shields" → Add to game state in `/state/GameState.js`
- "Show shield status in UI" → Update interface in `/interface/PlayerList.jsx`
- "Play shield sound" → Use the audio system in `/systems/AudioEngine.js`
- "Pick random shield duration" → Helper function in `/helpers/random.js`\

Every idea fits a clear structure—no file hunting, no confusion. It mirrors how we think about games, freeing us to focus on fun, with everything in its place (and AI able to automate it without us feeling scared of the kind of mess it might be making beneath the scenes).


**The Magic:**
- Delete any mechanic → game still runs
- Add new mechanic → nothing else breaks
- Share state → all components stay in sync
- Pure helpers → reliable and testable
- Clear ownership → each folder has one job

This lets us go from "what if..." to testable feature in minutes, not hours.










------------------------------------------------------------------
## CAPTURING IDEAS ON THE FLY
------------------------------------------------------------------

Sometimes the best ideas hit you mid-coding session. Maybe you're working on player callouts and suddenly think "what if eliminated players could haunt the living?" Don't lose that spark!

**Quick Capture Method:**
Just tell Claude or Cursor: "Add this idea to the idea scratchpad: [your messy idea]"

That's it! In Claude, we have a subagent that will automatically:
- Create a neat file in the `/idea scratchpad/` folder
- Give it a descriptive filename
- Transform your messy thought into eloquent natural language
- Capture all the nuances that make the idea special

**Example:**
You: "Add to idea scratchpad: ok so like what if when youre tagged you become a ghost but you can only whisper to one person at a time and they dont know if youre helping or tricking them"
Claude creates `ghost-whisper-mechanic.md` with a beautifully written description that captures the paranoia and social dynamics of your idea.

Of course, you can always just create a file directly in `/idea scratchpad/` and write your idea yourself.









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