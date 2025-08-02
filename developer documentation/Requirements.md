# Simon Says Audio Game Requirements

## Overview
A team-based Simon Says game where an AI Simon gives commands to teams of human players through audio output (TTS). Players complete physical challenges with increasing difficulty and speed.

## Game Flow

### Phase 1: Player Setup
- **Player Registration Interface**
  - Single page UI for all players to input their names
  - Each player name on a separate row
  - Players can slide their name left and right to choose whether they are on the (Left/Right) team
  - You can edit the team names (team name customization) (default: "Red" and "Blue")
  - You need at least 2 players
  - Teams can be unbalanced and that's okay

### Phase 2: Game Configuration
- **Configurable Settings**
  - Number of rounds (default: 10, no min/max limits except 0)
  - Initial command time limit (default: 20 seconds, developer-configurable)
  - Time decrease rate (linear progression but a variable that allows us to change it)
- **Play button** to start the game

### Phase 3: Gameplay
- **Simon Agent Behavior**
  - Announces round number "Alright get ready for Round 3"
  - "Alright, [Name] and [Name]... [command]!"
  - ^ This is just an example. There could be so many ways the Round actually goes depending on the variant of Round, and variant within that.
  - No automated success detection (human self-policing "counting score when a team succeeds")

- **Progression**
  - TBD
  (Commands increase in difficulty?)
  (Time limits decrease?)


## Technical Requirements

### Frontend
- React-based single page application
- Slide for team assignment

### Audio System
- Web Audio API for Text-to-Speech (already part of the project)
- Optional sound effects for timer/transitions and fun elements

### Data Structure
- Player names and team assignments
- Game state (current round, active team, time remaining)
- Configuration settings
- Idk for sure, just an example

## Non-Functional Requirements

### Scalability
- Support 1-100+ players
- Excellent choice in Round types and game flow appropriate for player count and team count

## Future Considerations
- Scoring system (currently human-managed)
- Failure penalties (currently human-determined)
- Win conditions (currently human-determined)
- Command history tracking
- Game replay functionality
