## 🎯 What is the CLARITY COMMENTING SYSTEM?
----------------------------------------------

**Goal: Cognitive Luxury, code so clearly organized that getting lost is impossible.**
The fundamental elements of creating this cognitive luxury is the following:
1. Visual Hierarchy
2. Generous Spacing (2-3-10 Rule)
3. Feature Grouping
4. Component Structure

Together, you'll never wonder where you are or what you're looking at.






## 1. VISUAL HIERARCHY
-------------------------------------------

**Core Rule: Every subsection lives within a parent section**
No floating imports, no orphaned code. Everything has a clear home.


File Header (Natural language context at the beginning of components):
```tsx
/**
 * ComponentName.tsx
 * 
 * This component handles the core audio playback for our park game sessions.
 * It's designed to work seamlessly with Bluetooth speakers and allows for
 * quick experimentation with different voice effects and timing patterns.
 * 
 * The global Game object is exposed here so you can test new audio ideas
 * directly from the console while players are actively running around.
 * Everything is hot-reloadable so changes appear instantly without
 * disrupting the current game.
 */
```

Major Section Formatting:
```tsx
// ========================================================================================================
//
//
//     FEATURE: PLAYER CALLOUTS
//     Audio system that randomly calls out player names during gameplay
//
//
// ========================================================================================================
```

Feature Overview Formatting:
```tsx
/* FEATURE OVERVIEW: Player Callouts
 * 
 * Every 10 seconds, the system picks a random player and announces
 * them through the speaker. This creates the core game dynamic where
 * players need to react based on hearing their name.
 */
```

Subsection Formatting:
```tsx
// ========================================
// Feature State
// All state variables for this feature
// ========================================
```

Microsection Formatting:
```tsx
// --- Audio Controls ---
```


Logic Block Formatting:
```tsx
/**
 * What this does and why
 * Reference constants, not hardcoded values
 */
const myFunction = () => {
  // implementation
}
```






## 2. GENEROUS SPACING (2-3-10 Rule)
----------------------------------------------------

The 2-3-10 Spacing Rule:
**Remember: 2-3-10** - This creates the visual breathing room that makes code feel luxurious.

- **2 blank lines** after major section header (after the long ===== line)
- **3 blank lines** between each subsection within that section
- **10 blank lines** after the entire section ends (before next major section)

Additional rules:
- **1 blank line** after logic blocks and comments within subsections
- **No extra wrappers** - FEATURE OVERVIEW comes right after the major header

The 2-3-10 Visual Guide:
```tsx
[MAJOR SECTION HEADER]
↓ 2 blank lines
[FEATURE OVERVIEW or first subsection]
↓ 3 blank lines  
[Next subsection]
↓ 3 blank lines
[Another subsection]
↓ 10 blank lines between to end this major section before beginnning the next
[NEXT MAJOR SECTION HEADER]
```








## 3. FEATURE GROUPING
----------------------------------------------------
**The core philosophy: Organize code by WHAT IT DOES, not technical categories.**

This system is built around **features** - distinct game mechanics players interact with. When you want to modify "how player callouts work" or "add a new power-up sound", you should find ALL related code grouped together in that specific feature's section:

**Things that are likely to live in a FEATURE section:**
- **Feature State**: `useState` variables this feature manages
- **Feature Constants**: Timing, audio settings, configuration values
- **Feature Effects**: `useEffect` hooks that power this feature
- **Feature Handlers**: onClick, onChange functions for this feature
- **Feature Functions**: Helper functions, audio processing, utilities
- **Feature Components**: Any sub-components specific to this feature
and anything else related to that feature

**Everything about that feature is defined right there** - not some variables at the top and handlers at the bottom. If it's part of "player callouts", it ALL lives in the FEATURE: Player Callouts section.


### When to Use FEATURE OVERVIEW:
- **YES**: Multi-step game mechanics, audio timing sequences, complex interactions
- **NO**: Simple state updates or basic UI elements






## 4. COMPONENT STRUCTURE
----------------------------------------------------------

**The simple rule: Components have a beginning, middle, and end.**

**Beginning:** File header (natural language context) + imports/setup
**Middle:** The actual logic (organized by features)
**End:** The render/return

### Organizing by component type:

**Interface Components** (/interface/ folder - UI controls)
- Group by technical category (all state together, all handlers together)
- These are your control panels and displays

**Mechanic Components** (/mechanics/ folder - game features)
- Each mechanic is self-contained in its own file
- Internal organization follows feature sections if complex

**System Classes** (/systems/ folder - infrastructure)
- Typically class-based or context providers
- Expose methods and services for mechanics to use

**State Contexts** (/state/ folder - shared data)
- React Context providers
- Organized by data domain (GameState, AudioState, etc.)

**Helper Functions** (/helpers/ folder - utilities)
- Pure functions grouped by purpose in each file
- No React, just input → output



EXAMPLE PATTERNS
----------------------------------------------------------

### Interface Component Structure:
```
[FILE HEADER - Natural language context]
↓ few blank lines
[COMPONENT SETUP section]
    [Imports subsection]
        [--- React & Libraries ---]
        [--- State & Systems ---]
        [--- Helpers ---]
    ↓ 3 blank lines
    [Types & Interfaces subsection]
↓ few blank lines
[STATE & HANDLERS section]
    [Component State subsection]
        [--- UI State ---]
        [--- Display State ---]
    ↓ 3 blank lines
    [Event Handlers subsection]
        [--- User Interactions ---]
        [--- Form Controls ---]
↓ few blank lines
[COMPONENT RENDER section]
```


### Mechanic Component Structure:
```
[FILE HEADER - Natural language context about this game mechanic]
↓ few blank lines
[COMPONENT SETUP section]
    [Imports subsection]
↓ few blank lines
[MECHANIC CONFIGURATION section]
    [Constants subsection]
    [Default Settings subsection]
↓ few blank lines
[MECHANIC LOGIC section]
    [Local State subsection]
    [Effects & Timers subsection]
    [Handler Functions subsection]
↓ few blank lines
[COMPONENT RENDER section]
```



----------------------------------------------------------


## 📋 Quick Checklist

- [ ] **Visual Hierarchy** - Natural language file header present? All subsections within parent sections?
- [ ] **Spacing** - Following the 2-3-10 rule?
- [ ] **Features** - Each game feature grouped in its own section?
- [ ] **Park-Ready** - Code organized for quick modifications during play sessions?