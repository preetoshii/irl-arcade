/**
 * gameFlowData.js - Complete game flow definition matching our Mermaid chart
 * 
 * This data structure drives the entire game experience.
 * Each node contains weights, scripts, and execution logic.
 */

export const gameFlowData = {
  roundTypes: {
    duelBattle: {
      id: "duel_battle",
      weight: 30,
      name: "Duel Battle",
      description: "Two players face off",
      
      // Audio script templates
      scripts: {
        intro: "Alright everyone, time for a Duel Battle!",
        outro: "Great job in that duel!"
      },
      
      // Nested variants
      variants: {
        tag: {
          id: "tag",
          weight: 40,
          name: "Tag Duel",
          minPlayers: 2,
          maxPlayers: 2,
          
          scripts: {
            intro: "This is going to be a tag duel!",
            selectPlayers: "I need one player from each team.",
            callPlayer1: "From {team1}, let's have {player1} step forward.",
            callPlayer2: "And from {team2}, let's have {player2} step forward.",
            positions: "Alright, {player1} and {player2}, take your positions.",
          },
          
          // Sub-variants (movement styles)
          subVariants: {
            normal: {
              id: "normal_tag",
              weight: 25,
              name: "Normal Tag",
              duration: 30,
              
              scripts: {
                setup: "{player1}, you're IT! {player2}, get ready to run!",
                rules: "Regular tag rules - {player1} needs to catch {player2}.",
                countdown: "Ready? 3... 2... 1... GO!",
                during: [
                  "Keep going!",
                  "{player1} is getting close!",
                  "Nice dodge, {player2}!",
                  "Come on {player1}, you can catch them!"
                ],
                almostDone: "10 seconds left!",
                timeUp: "TIME'S UP! Stop where you are!",
                tagged: "Got 'em! {player1} tagged {player2}!",
                escaped: "Nice escape! {player2} avoided being tagged!"
              }
            },
            
            crabWalk: {
              id: "crab_walk_tag",
              weight: 25,
              name: "Crab Walk Tag",
              duration: 45, // Longer because it's harder
              
              scripts: {
                setup: "{player1}, you're IT! But here's the twist...",
                rules: "You both have to move like crabs! Hands and feet on the ground, belly up!",
                demo: "Everyone, get in crab position to show them how it's done!",
                countdown: "Crabs ready? 3... 2... 1... SCUTTLE!",
                during: [
                  "Look at those crabs go!",
                  "This is hilarious!",
                  "{player1} is crab-walking fast!",
                  "Don't fall over, {player2}!"
                ],
                almostDone: "15 seconds left, keep crabbing!",
                timeUp: "TIME! You can stop being crabs now!",
                tagged: "The crab caught its prey! {player1} got {player2}!",
                escaped: "The speedy crab escapes! {player2} survived!"
              }
            },
            
            hopTag: {
              id: "hop_tag",
              weight: 25,
              name: "One-Foot Hop Tag",
              duration: 25, // Shorter because it's exhausting
              
              scripts: {
                setup: "This is hop tag! {player1}, you're IT!",
                rules: "Both players must hop on one foot only! If you put both feet down, you freeze for 3 seconds!",
                chooseFoot: "Pick your hopping foot... and lift the other one!",
                countdown: "Ready to hop? 3... 2... 1... HOP!",
                during: [
                  "Hop hop hop!",
                  "Don't put that foot down!",
                  "{player1} is hopping after {player2}!",
                  "This is exhausting!"
                ],
                violation: "Ooh! {player} put both feet down! Freeze for 3 seconds!",
                almostDone: "10 more seconds of hopping!",
                timeUp: "STOP! You can put both feet down now!",
                tagged: "Tagged while hopping! {player1} got {player2}!",
                escaped: "{player2} hopped to safety!"
              }
            },
            
            backwardsTag: {
              id: "backwards_tag",
              weight: 15,
              name: "Backwards Tag",
              duration: 35,
              
              scripts: {
                setup: "Backwards tag time! {player1}, you're IT!",
                rules: "You can only move backwards! No turning around! Use your friends to guide you!",
                safety: "Teams, help your player avoid obstacles!",
                countdown: "Ready to run backwards? 3... 2... 1... REVERSE!",
                during: [
                  "This is chaos!",
                  "Watch out for that wall!",
                  "Teams, guide your players!",
                  "{team1}, tell {player1} where {player2} is!"
                ],
                almostDone: "10 seconds left in reverse!",
                timeUp: "STOP! You can turn around now!",
                tagged: "Backwards tag success! {player1} caught {player2}!",
                escaped: "{player2} escaped backwards!"
              }
            },
            
            slowMotion: {
              id: "slow_motion_tag",
              weight: 10,
              name: "Slow Motion Tag",
              duration: 40,
              
              scripts: {
                setup: "This is slow motion tag! {player1}, you're IT!",
                rules: "Everything must be in slow motion! Like you're underwater! If you move too fast, you freeze!",
                demo: "Everyone, show me your slow motion run!",
                countdown: "Ready for slow-mo? 3... 2... 1... SLOOOOOW!",
                during: [
                  "Slooooow mooootiooon!",
                  "This is like a movie!",
                  "Beautiful slow motion chase!",
                  "Don't speed up!"
                ],
                violation: "{player} moved too fast! Freeze for 5 seconds!",
                almostDone: "10... more... seconds... in... slow... motion!",
                timeUp: "NORMAL SPEED! Round over!",
                tagged: "Slow motion tag! {player1} caught {player2} in slow-mo!",
                escaped: "{player2} escaped in slow motion!"
              }
            }
          },
          
          // Optional modifiers that can apply to any sub-variant
          modifiers: {
            none: {
              id: "no_modifier",
              weight: 70,
              name: "No Modifier"
            },
            
            blindfold: {
              id: "blindfold_it",
              weight: 15,
              name: "Blindfolded IT",
              
              scripts: {
                announce: "Wait! Let's make this interesting...",
                setup: "{player1}, you're going to be blindfolded!",
                safety: "{team1}, you need to guide {player1}! Keep them safe!",
                rules: "{player2}, you can make noise to confuse {player1}!",
                during: [
                  "{team1}, tell {player1} where to go!",
                  "Listen for {player2}'s footsteps!",
                  "This is intense!"
                ]
              }
            },
            
            multiIT: {
              id: "multi_it",
              weight: 10,
              name: "Multiple ITs",
              requiresExtra: 1, // Needs one more player
              
              scripts: {
                announce: "Plot twist!",
                setup: "We need another IT! {team1}, send out {player3}!",
                rules: "Now {player1} AND {player3} are both IT! Work together to catch {player2}!",
                during: [
                  "Teamwork, {team1}!",
                  "They're closing in!",
                  "{player2} is surrounded!"
                ]
              }
            },
            
            freeze: {
              id: "freeze_whistle",
              weight: 5,
              name: "Freeze on Whistle",
              
              scripts: {
                announce: "Special rule!",
                rules: "When you hear the whistle, everyone must FREEZE for 3 seconds!",
                during: [
                  "Get ready for the whistle!",
                  "Keep playing!",
                  "Any moment now..."
                ],
                whistle: "WHISTLE! FREEZE!",
                unfreeze: "GO!"
              }
            }
          }
        },
        
        // Other duel variants (abbreviated for space)
        mirror: {
          id: "mirror",
          weight: 30,
          name: "Mirror Duel",
          scripts: {
            intro: "Time for a mirror duel!",
            // ... more scripts
          }
        },
        
        balance: {
          id: "balance",
          weight: 20,
          name: "Balance Duel",
          scripts: {
            intro: "Let's see who has better balance!",
            // ... more scripts
          }
        }
      }
    },
    
    // Other round types (abbreviated)
    teamBattle: {
      id: "team_battle",
      weight: 25,
      name: "Team Battle"
      // ... variants and scripts
    },
    
    reliefRound: {
      id: "relief_round",
      weight: 15,
      name: "Relief Round"
      // ... variants and scripts
    }
  }
};

// Helper function to get random weighted selection
export function selectWeighted(options) {
  const totalWeight = Object.values(options).reduce((sum, opt) => sum + opt.weight, 0);
  let random = Math.random() * totalWeight;
  
  for (const [key, option] of Object.entries(options)) {
    random -= option.weight;
    if (random <= 0) {
      return option;
    }
  }
  
  return Object.values(options)[0]; // Fallback
}