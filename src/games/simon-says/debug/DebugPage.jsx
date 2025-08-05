/**
 * Debug Page for Simon Says Architecture Testing
 * 
 * This page provides a comprehensive testing interface for the Simon Says
 * architecture, allowing developers to verify all systems are working correctly
 * before building the full UI. It exposes internal state and provides controls
 * to trigger various game scenarios.
 */

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import styles from './DebugPage.module.css';

// Import all our systems
import { 
  eventBus, 
  Events, 
  configLoader, 
  stateStore, 
  StateKeys,
  performanceSystem 
} from '../systems';

import { PAUSE_DURATIONS } from '../state/constants';

import { 
  matchState, 
  playerRegistry,
  MatchStatus
} from '../state';

import matchOrchestrator from '../mechanics/MatchOrchestrator';

function SimonSaysDebugPage({ onBack }) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [matchStatus, setMatchStatus] = useState('idle');
  const [currentBlock, setCurrentBlock] = useState(null);
  const [patternViz, setPatternViz] = useState('');
  const [logs, setLogs] = useState([]);
  const [players, setPlayers] = useState([]);
  const [lastPlay, setLastPlay] = useState(null);
  const [systemStatuses, setSystemStatuses] = useState({});
  const [currentActivity, setCurrentActivity] = useState('Idle');
  const [timeInBlock, setTimeInBlock] = useState(0);
  const [activeCountdowns, setActiveCountdowns] = useState([]); // Track active countdowns
  const [lastPlayExpanded, setLastPlayExpanded] = useState(false); // Collapsible state
  const [pauseTimings, setPauseTimings] = useState({
    micro: 500,
    small: 1000,
    medium: 2000,
    large: 3000,
    xlarge: 4000
  });
  const [editingPlayer, setEditingPlayer] = useState(null); // Track which player is being edited
  const [editingTeam, setEditingTeam] = useState(null); // Track which team is being edited
  
  const maxLogs = 50;
  const initRef = useRef(false);
  const unsubscribers = useRef([]);
  const countdownIntervals = useRef(new Map()); // Store countdown intervals

  // Initialize systems on mount
  useEffect(() => {
    if (!initRef.current) {
      initRef.current = true;
      initializeSystems();
    }
    
    return () => {
      // Cleanup - Don't remove ALL listeners, just the ones we added
      // The orchestrator needs its listeners to remain active
      console.log('[DebugPage] Cleaning up debug page event listeners');
      unsubscribers.current.forEach(unsub => unsub());
      unsubscribers.current = [];
      
      // Clean up countdown intervals
      countdownIntervals.current.forEach(interval => clearInterval(interval));
      countdownIntervals.current.clear();
    };
  }, []);

  // Removed auto-scroll - it was annoying when trying to read other sections

  // Update timer
  useEffect(() => {
    const interval = setInterval(() => {
      if (matchStatus === 'running' && currentBlock) {
        setTimeInBlock(prev => prev + 1);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [matchStatus, currentBlock]);

  const initializeSystems = async () => {
    addLog('Initializing Simon Says systems...', 'info');
    
    try {
      // Initialize orchestrator (which initializes all other systems)
      await matchOrchestrator.initialize();
      
      // Subscribe to events for debugging
      subscribeToDebugEvents();
      
      // Set up initial test players
      setupTestPlayers();
      
      setIsInitialized(true);
      addLog('All systems initialized successfully!', 'success');
      
      updateSystemStatuses();
    } catch (error) {
      addLog(`Initialization failed: ${error.message}`, 'error');
      console.error(error);
    }
  };

  const subscribeToDebugEvents = () => {
    // System events
    unsubscribers.current.push(
      eventBus.on(Events.SYSTEM_READY, (data) => {
        addLog(`System ready: ${data.system}`, 'system');
      })
    );
    
    unsubscribers.current.push(
      eventBus.on(Events.SYSTEM_ERROR, (data) => {
        addLog(`System error in ${data.system}: ${data.error?.message}`, 'error');
      })
    );
    
    // Match events
    eventBus.on(Events.MATCH_INITIALIZED, (data) => {
      addLog(`Match initialized: ${data.id}`, 'info');
    });
    
    eventBus.on(Events.MATCH_STARTED, (data) => {
      addLog('Match started!', 'success');
      setMatchStatus('running');
      updatePatternViz();
    });
    
    eventBus.on(Events.MATCH_COMPLETED, () => {
      addLog('Match completed!', 'success');
      setMatchStatus('completed');
    });
    
    eventBus.on(Events.MATCH_ABANDONED, (data) => {
      addLog(`Match abandoned: ${data.reason}`, 'warning');
      setMatchStatus('abandoned');
    });
    
    // Block events
    eventBus.on(Events.BLOCK_STARTED, (data) => {
      // Add detailed logging for ceremony blocks
      if (data.blockType === 'ceremony') {
        addLog(`Block started: ${data.blockType} (${data.context?.ceremonyType || 'unknown type'})`, 'warning');
      } else {
        addLog(`Block started: ${data.blockType}`, 'info');
      }
      setCurrentBlock(data);
      setCurrentActivity(`Performing ${data.blockType} block`);
      setTimeInBlock(0);
      updatePatternViz();
    });
    
    eventBus.on(Events.BLOCK_COMPLETED, () => {
      addLog('Block completed - triggering next block', 'info');
      setCurrentActivity('Transitioning to next block...');
      setCurrentBlock(null);
      updatePatternViz();
    });
    
    // Play events
    eventBus.on(Events.PLAY_SELECTED, (data) => {
      const play = data.play;
      addLog(`Play selected: ${play.roundType} - ${play.variant}`, 'play');
      setLastPlay(play);
    });
    
    // Performance events
    eventBus.on(Events.SCRIPT_STARTED, (data) => {
      addLog(`Speaking: "${data.text}"`, 'speech');
    });
    
    eventBus.on(Events.PERFORMANCE_COMPLETED, () => {
      addLog('Performance completed', 'info');
    });
    
    // Pause events
    eventBus.on(Events.PAUSE_STARTED, (data) => {
      const { type, milliseconds } = data;
      addLog(`Pause [${type.toUpperCase()}]: ${milliseconds}ms`, 'info');
      
      // Start countdown timer
      const countdownId = Date.now();
      const startTime = Date.now();
      const endTime = startTime + milliseconds;
      
      // Add to active countdowns
      setActiveCountdowns(prev => [...prev, {
        id: countdownId,
        type: type,
        startTime: startTime,
        endTime: endTime,
        duration: milliseconds,
        remaining: milliseconds
      }]);
      
      // Create countdown interval
      const interval = setInterval(() => {
        const now = Date.now();
        const remaining = Math.max(0, endTime - now);
        
        setActiveCountdowns(prev => prev.map(countdown => 
          countdown.id === countdownId 
            ? { ...countdown, remaining: remaining }
            : countdown
        ));
        
        if (remaining === 0) {
          clearInterval(interval);
          countdownIntervals.current.delete(countdownId);
          setActiveCountdowns(prev => prev.filter(c => c.id !== countdownId));
        }
      }, 50); // Update every 50ms for smooth progress
      
      countdownIntervals.current.set(countdownId, interval);
    });
    
    // Removed PAUSE_COMPLETED logging - we only need to see when pauses start
    
    // Pattern events
    eventBus.on(Events.PATTERN_SELECTED, (data) => {
      addLog(`Pattern selected: ${data.id} (${data.sequence.length} blocks)`, 'info');
      // Log the full sequence to debug ceremony duplication
      const ceremonyCount = data.sequence.filter(block => block.type === 'ceremony').length;
      if (ceremonyCount > 2) {
        addLog(`WARNING: Pattern has ${ceremonyCount} ceremony blocks!`, 'error');
      }
      addLog(`Pattern sequence: ${data.sequence.map(b => b.type).join(' → ')}`, 'system');
    });
    
    eventBus.on(Events.PATTERN_COMPLETE, () => {
      addLog('Pattern complete - match should end', 'warning');
    });
  };

  const setupTestPlayers = () => {
    // Get team names from config
    const teamNames = configLoader.get('teams.teamNames') || configLoader.get('teamConfig.teamNames') || ['Red Team', 'Blue Team'];
    
    const testPlayers = [
      { name: 'Alice', team: teamNames[0] },
      { name: 'Bob', team: teamNames[1] },
      { name: 'Charlie', team: teamNames[0] },
      { name: 'Diana', team: teamNames[1] },
      { name: 'Eve', team: teamNames[0] },
      { name: 'Frank', team: teamNames[1] }
    ];
    
    // Add players and collect their full objects
    const addedPlayers = [];
    testPlayers.forEach(player => {
      try {
        playerRegistry.addPlayer(player.name, player.team);
        const addedPlayer = playerRegistry.findPlayerByName(player.name);
        if (addedPlayer) {
          addedPlayers.push(addedPlayer);
        }
      } catch (error) {
        addLog(`Failed to add player ${player.name}: ${error.message}`, 'error');
      }
    });
    
    setPlayers(addedPlayers);
    addLog(`Added ${addedPlayers.length} test players`, 'info');
  };

  const startTestMatch = async () => {
    if (!isInitialized) {
      addLog('Systems not initialized yet!', 'error');
      return;
    }
    
    addLog('Starting test match...', 'info');
    
    const config = {
      roundCount: 5,
      difficultyLevel: 'moderate',
      difficultyCurve: 'gentle',
      gameFocus: ['competitive', 'silly'],
      teamConfig: {
        teamCount: 2,
        teamNames: ['Red Team', 'Blue Team']
      }
    };
    
    try {
      await matchOrchestrator.startMatch(config);
    } catch (error) {
      addLog(`Failed to start match: ${error.message}`, 'error');
    }
  };

  const pauseMatch = () => {
    matchOrchestrator.pauseMatch();
    setMatchStatus('paused');
    addLog('Match paused', 'warning');
  };

  const resumeMatch = () => {
    matchOrchestrator.resumeMatch();
    setMatchStatus('running');
    addLog('Match resumed', 'info');
  };

  const endMatch = () => {
    matchOrchestrator.endMatch('user_ended');
    setMatchStatus('ended');
    addLog('Match ended by user', 'warning');
  };


  const updatePatternViz = () => {
    const viz = matchOrchestrator.getVisualization();
    setPatternViz(viz || 'No pattern loaded');
  };

  // Parse pattern visualization to show detailed info
  const parsePatternViz = (viz) => {
    if (!viz || viz === 'No pattern loaded') return null;
    
    const blocks = viz.split(' ');
    const details = [];
    let roundCount = 0;
    let relaxCount = 0;
    
    blocks.forEach((block, index) => {
      const isCompleted = block.startsWith('✓');
      const isCurrent = block.includes('[');
      const symbol = block.replace('✓', '').replace('[', '').replace(']', '');
      
      let type = '';
      let description = '';
      
      switch (symbol) {
        case '🎭':
          type = 'Opening';
          description = 'Welcome players and explain rules';
          break;
        case '🎬':
          type = 'Closing';
          description = 'Celebrate and wrap up';
          break;
        case '🎮':
          roundCount++;
          type = `Round ${roundCount}`;
          description = 'Active gameplay';
          break;
        case '😌':
          relaxCount++;
          type = `Break ${relaxCount}`;
          description = 'Rest and recover';
          break;
      }
      
      details.push({
        index,
        symbol,
        type,
        description,
        isCompleted,
        isCurrent
      });
    });
    
    return details;
  };

  const updateSystemStatuses = () => {
    const status = matchOrchestrator.getStatus();
    setSystemStatuses(status.systemStatus || {});
  };

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => {
      const newLogs = [...prev, { message, type, timestamp }];
      return newLogs.slice(-maxLogs); // Keep last N logs
    });
  };

  const getLogColor = (type) => {
    switch (type) {
      case 'error': return '#ff4444';
      case 'warning': return '#ffaa00';
      case 'success': return '#00ff88';
      case 'system': return '#8888ff';
      case 'play': return '#ff88ff';
      case 'speech': return '#88ffff';
      default: return '#ffffff';
    }
  };

  const updatePauseTiming = (pauseType, newValue) => {
    const numValue = parseInt(newValue);
    if (!isNaN(numValue) && numValue >= 0) {
      setPauseTimings(prev => ({
        ...prev,
        [pauseType]: numValue
      }));
      
      // Update the actual PAUSE_DURATIONS constant
      PAUSE_DURATIONS[pauseType.toUpperCase()] = numValue;
      
      addLog(`Updated ${pauseType.toUpperCase()} pause to ${numValue}ms`, 'system');
    }
  };

  const handlePlayerNameChange = (playerId, newName) => {
    setEditingPlayer(null);
    if (!newName || newName.trim() === '') return;
    
    const player = players.find(p => p.id === playerId);
    if (!player || player.name === newName.trim()) return;
    
    try {
      // Update player name in registry
      const oldName = player.name;
      player.name = newName.trim();
      
      // Update local state
      setPlayers(prev => prev.map(p => 
        p.id === playerId ? { ...p, name: newName.trim() } : p
      ));
      
      addLog(`Renamed player "${oldName}" to "${newName.trim()}"`, 'info');
    } catch (error) {
      addLog(`Failed to rename player: ${error.message}`, 'error');
    }
  };

  const handleTeamNameChange = (oldTeamName, newTeamName) => {
    setEditingTeam(null);
    if (!newTeamName || newTeamName.trim() === '' || oldTeamName === newTeamName.trim()) return;
    
    try {
      // Update all players with this team name
      const updatedPlayers = players.map(p => {
        if (p.team === oldTeamName) {
          return { ...p, team: newTeamName.trim() };
        }
        return p;
      });
      
      setPlayers(updatedPlayers);
      
      // Update in player registry
      updatedPlayers.forEach(player => {
        const registryPlayer = playerRegistry.getPlayer(player.id);
        if (registryPlayer && registryPlayer.team === oldTeamName) {
          registryPlayer.team = newTeamName.trim();
        }
      });
      
      // Update config with new team names
      const currentTeamNames = configLoader.get('teams.teamNames') || configLoader.get('teamConfig.teamNames') || ['Red Team', 'Blue Team'];
      const newTeamNames = currentTeamNames.map(name => 
        name === oldTeamName ? newTeamName.trim() : name
      );
      
      // Update both possible config paths
      configLoader.update('teams.teamNames', newTeamNames);
      configLoader.update('teamConfig.teamNames', newTeamNames);
      
      // Also update in match state if match is active
      const matchStateData = matchState.getState();
      if (matchStateData && matchStateData.config) {
        if (matchStateData.config.teamConfig) {
          matchStateData.config.teamConfig.teamNames = newTeamNames;
        }
        if (matchStateData.config.teams) {
          matchStateData.config.teams.teamNames = newTeamNames;
        }
      }
      
      addLog(`Renamed team "${oldTeamName}" to "${newTeamName.trim()}"`, 'info');
    } catch (error) {
      addLog(`Failed to rename team: ${error.message}`, 'error');
    }
  };

  const addTestPlayer = () => {
    const names = ['Alex', 'Blake', 'Casey', 'Drew', 'Ellis', 'Finley', 'Gray', 'Harper', 'Indigo', 'Jordan'];
    const teams = Array.from(new Set(players.map(p => p.team)));
    if (teams.length === 0) {
      // Get team names from config
      const configTeams = configLoader.get('teams.teamNames') || configLoader.get('teamConfig.teamNames') || ['Red Team', 'Blue Team'];
      teams.push(...configTeams);
    }
    
    const randomName = names[Math.floor(Math.random() * names.length)] + Math.floor(Math.random() * 100);
    const randomTeam = teams[Math.floor(Math.random() * teams.length)];
    
    try {
      playerRegistry.addPlayer(randomName, randomTeam);
      const newPlayer = playerRegistry.findPlayerByName(randomName);
      if (newPlayer) {
        setPlayers(prev => [...prev, newPlayer]);
        addLog(`Added player ${randomName} to ${randomTeam}`, 'success');
      }
    } catch (error) {
      addLog(`Failed to add player: ${error.message}`, 'error');
    }
  };

  const removeRandomPlayer = () => {
    if (players.length === 0) return;
    
    const randomPlayer = players[Math.floor(Math.random() * players.length)];
    try {
      // Since playerRegistry doesn't have removePlayer, we'll just update our local state
      setPlayers(prev => prev.filter(p => p.id !== randomPlayer.id));
      
      // Mark player as inactive in registry
      const player = playerRegistry.getPlayer(randomPlayer.id);
      if (player) {
        player.status = 'inactive';
      }
      
      addLog(`Removed player ${randomPlayer.name}`, 'warning');
    } catch (error) {
      addLog(`Failed to remove player: ${error.message}`, 'error');
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button onClick={onBack} className={styles.backButton}>
          ← Back
        </button>
        <h1>Simon Says Debug Console</h1>
        <div className={styles.status}>
          Status: <span className={matchStatus === 'running' ? styles.running : ''}>{matchStatus}</span>
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.leftColumn}>
          {/* Controls Section */}
          <div className={styles.section}>
            <h2>Match Controls</h2>
          <div className={styles.controls}>
            <button 
              onClick={startTestMatch} 
              disabled={!isInitialized || matchStatus === 'running'}
              className={styles.primaryButton}
            >
              Start Test Match (5 rounds)
            </button>
            <button 
              onClick={pauseMatch} 
              disabled={matchStatus !== 'running'}
            >
              Pause
            </button>
            <button 
              onClick={resumeMatch} 
              disabled={matchStatus !== 'paused'}
            >
              Resume
            </button>
            <button 
              onClick={endMatch} 
              disabled={!['running', 'paused'].includes(matchStatus)}
              className={styles.dangerButton}
            >
              End Match
            </button>
          </div>
        </div>


        {/* Pause Timing Controls */}
        <div className={styles.section}>
          <h2>Pause Timing Controls</h2>
          <div className={styles.pauseControls}>
            {Object.entries(pauseTimings).map(([pauseType, duration]) => (
              <div key={pauseType} className={styles.pauseControl}>
                <label className={styles.pauseLabel}>
                  {pauseType.toUpperCase()}:
                </label>
                <input
                  type="number"
                  value={duration}
                  onChange={(e) => updatePauseTiming(pauseType, e.target.value)}
                  className={styles.pauseInput}
                  min="0"
                  max="10000"
                  step="100"
                />
                <span className={styles.pauseUnit}>ms</span>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.grid}>
          {/* Pattern Visualization */}
          <div className={styles.section}>
            <h2>Pattern Progress</h2>
            <div className={styles.patternContainer}>
              {/* Detailed breakdown */}
              {patternViz && patternViz !== 'No pattern loaded' ? (
                <>
                  <div className={styles.patternDetails}>
                    {parsePatternViz(patternViz)?.map((block, idx) => (
                      <div 
                        key={idx} 
                        className={`${styles.patternBlock} ${
                          block.isCurrent ? styles.currentBlock : 
                          block.isCompleted ? styles.completedBlock : ''
                        }`}
                      >
                        <span className={styles.blockSymbol}>{block.symbol}</span>
                        <div className={styles.blockInfo}>
                          <div className={styles.blockType}>{block.type}</div>
                          <div className={styles.blockDesc}>{block.description}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className={styles.noPattern}>
                  No pattern loaded
                </div>
              )}
            </div>
          </div>

          {/* Current State */}
          <div className={styles.section}>
            <h2>Current State</h2>
            <div className={styles.stateInfo}>
              <div>Match ID: {matchState.getState().id || 'None'}</div>
              <div>Round: {matchState.getCurrentRoundNumber()} / {matchState.getTotalRounds()}</div>
              <div>Current Block: {currentBlock?.blockType || 'None'}</div>
              <div>Progress: {matchState.getProgress()}%</div>
              <div style={{ borderLeft: '3px solid #ffaa00' }}>
                Activity: {currentActivity}
              </div>
              <div style={{ borderLeft: '3px solid #00ff88' }}>
                Time in block: {timeInBlock}s
              </div>
            </div>
          </div>

          {/* Active Countdowns */}
          <div className={styles.section}>
            <h2>Active Timers</h2>
            <div className={styles.countdownList}>
              {activeCountdowns.length > 0 ? (
                activeCountdowns.map(countdown => {
                  const progress = (countdown.duration - countdown.remaining) / countdown.duration;
                  const percentage = Math.round(progress * 100);
                  
                  return (
                    <div key={countdown.id} className={styles.countdown}>
                      <div className={styles.countdownHeader}>
                        <span className={styles.countdownType}>
                          {countdown.type.toUpperCase()} PAUSE
                        </span>
                        <span className={styles.countdownTime}>
                          {(countdown.remaining / 1000).toFixed(1)}s
                        </span>
                      </div>
                      <div className={styles.progressBar}>
                        <div 
                          className={styles.progressFill}
                          style={{ 
                            width: `${percentage}%`,
                            backgroundColor: countdown.type === 'micro' ? '#ff6b6b' :
                                           countdown.type === 'small' ? '#feca57' :
                                           countdown.type === 'medium' ? '#48dbfb' :
                                           countdown.type === 'large' ? '#ff9ff3' :
                                           '#54a0ff'
                          }}
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className={styles.noTimers}>
                  No active timers
                </div>
              )}
            </div>
          </div>

          {/* Teams and Players */}
          <div className={styles.section}>
            <h2>Teams & Players ({players.length})</h2>
            <div className={styles.playerControls}>
              <button 
                onClick={addTestPlayer}
                className={styles.addButton}
              >
                + Add Player
              </button>
              <button 
                onClick={removeRandomPlayer}
                disabled={players.length === 0}
                className={styles.removeButton}
              >
                - Remove Random
              </button>
            </div>
            <div className={styles.teamsContainer}>
              {/* Get unique teams */}
              {players.length === 0 ? (
                <div className={styles.noPlayers}>
                  No players yet. Click "+ Add Player" to add some!
                </div>
              ) : (
                Array.from(new Set(players.map(p => p.team))).map(teamName => {
                const teamPlayers = players.filter(p => p.team === teamName);
                return (
                  <div key={teamName} className={styles.teamSection}>
                    <div className={styles.teamHeader}>
                      {editingTeam === teamName ? (
                        <input
                          type="text"
                          defaultValue={teamName}
                          className={styles.editInput}
                          autoFocus
                          onBlur={(e) => handleTeamNameChange(teamName, e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleTeamNameChange(teamName, e.target.value);
                            } else if (e.key === 'Escape') {
                              setEditingTeam(null);
                            }
                          }}
                        />
                      ) : (
                        <h3 
                          className={styles.teamName} 
                          onClick={() => setEditingTeam(teamName)}
                          title="Click to edit"
                        >
                          {teamName}
                        </h3>
                      )}
                      <span className={styles.teamCount}>({teamPlayers.length})</span>
                    </div>
                    <div className={styles.teamPlayers}>
                      {teamPlayers.map(player => (
                        <div key={player.id} className={styles.player}>
                          {editingPlayer === player.id ? (
                            <input
                              type="text"
                              defaultValue={player.name}
                              className={styles.editInput}
                              autoFocus
                              onBlur={(e) => handlePlayerNameChange(player.id, e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  handlePlayerNameChange(player.id, e.target.value);
                                } else if (e.key === 'Escape') {
                                  setEditingPlayer(null);
                                }
                              }}
                            />
                          ) : (
                            <span 
                              className={styles.playerName}
                              onClick={() => setEditingPlayer(player.id)}
                              title="Click to edit"
                            >
                              {player.name}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })
              )}
            </div>
          </div>

          {/* System Status */}
          <div className={styles.section}>
            <h2>System Status</h2>
            <div className={styles.systemList}>
              {Object.entries(systemStatuses).map(([system, ready]) => (
                <div key={system} className={styles.system}>
                  <span className={ready ? styles.ready : styles.notReady}>●</span>
                  {system}
                </div>
              ))}
            </div>
          </div>
        </div>
        </div>

        <div className={styles.rightColumn}>
          {/* Event Log */}
          <div className={styles.section}>
            <h2>Event Log</h2>
            <div className={styles.logContainer}>
              {logs.map((log, index) => (
                <div 
                  key={index} 
                  className={styles.logEntry}
                  style={{ color: getLogColor(log.type) }}
                >
                  <span className={styles.timestamp}>{log.timestamp}</span>
                  <span>{log.message}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Last Play Details - Collapsible */}
        {lastPlay && (
          <div className={styles.lastPlaySection}>
            <div 
              className={styles.lastPlayHeader}
              onClick={() => setLastPlayExpanded(!lastPlayExpanded)}
            >
              <h3>
                Last Play: {lastPlay.roundType} - {lastPlay.variant}
                <span className={styles.expandIcon}>
                  {lastPlayExpanded ? ' ▼' : ' ▶'}
                </span>
              </h3>
              {!lastPlayExpanded && (
                <span className={styles.playPreview}>
                  {lastPlay.blockType} | {lastPlay.difficulty ? `Difficulty ${lastPlay.difficulty}` : ''} | {lastPlay.duration}s
                </span>
              )}
            </div>
            {lastPlayExpanded && (
              <div className={styles.playDetails}>
                <pre>{JSON.stringify(lastPlay, null, 2)}</pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default SimonSaysDebugPage;