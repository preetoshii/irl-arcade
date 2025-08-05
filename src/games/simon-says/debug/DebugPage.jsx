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
    
    eventBus.on(Events.PAUSE_COMPLETED, (data) => {
      addLog(`Pause [${data.type.toUpperCase()}] completed`, 'info');
    });
    
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
    const testPlayers = [
      { name: 'Alice', team: 'Red Team' },
      { name: 'Bob', team: 'Blue Team' },
      { name: 'Charlie', team: 'Red Team' },
      { name: 'Diana', team: 'Blue Team' },
      { name: 'Eve', team: 'Red Team' },
      { name: 'Frank', team: 'Blue Team' }
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

  const skipToNextBlock = () => {
    addLog('Simulating block completion...', 'info');
    eventBus.emit(Events.BLOCK_COMPLETED);
  };

  const testTTS = async () => {
    addLog('Testing text-to-speech...', 'info');
    
    // First test basic TTS
    console.log('Testing basic window.Game.speak...');
    if (window.Game?.speak) {
      window.Game.speak("Basic test from global speak");
    }
    
    // Also try a direct utterance
    setTimeout(() => {
      console.log('Testing direct utterance...');
      const utterance = new SpeechSynthesisUtterance("Direct utterance test");
      utterance.onstart = () => {
        console.log('Direct utterance started!');
        addLog('Direct TTS working!', 'success');
      };
      utterance.onerror = (e) => {
        console.error('Direct utterance error:', e);
        addLog(`Direct TTS error: ${e.error}`, 'error');
      };
      window.speechSynthesis.speak(utterance);
    }, 1000);
    
    // Then test PerformanceSystem
    setTimeout(async () => {
      try {
        console.log('[Test] Calling performanceSystem.testVoice()');
        await performanceSystem.testVoice("Hello! I'm Simon, and this is a test of the speech system!");
        addLog('PerformanceSystem test completed', 'success');
      } catch (error) {
        addLog(`PerformanceSystem test failed: ${error.message}`, 'error');
        console.error('PerformanceSystem TTS Error:', error);
      }
    }, 2000);
  };

  const updatePatternViz = () => {
    const viz = matchOrchestrator.getVisualization();
    setPatternViz(viz || 'No pattern loaded');
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

        {/* Testing Tools */}
        <div className={styles.section}>
          <h2>Testing Tools</h2>
          <div className={styles.controls}>
            <button onClick={skipToNextBlock} disabled={matchStatus !== 'running'}>
              Skip to Next Block
            </button>
            <button onClick={testTTS}>
              Test Speech
            </button>
            <button onClick={() => performanceSystem.setMockMode(true)}>
              Enable Mock TTS
            </button>
            <button onClick={updateSystemStatuses}>
              Refresh Status
            </button>
          </div>
        </div>

        <div className={styles.grid}>
          {/* Pattern Visualization */}
          <div className={styles.section}>
            <h2>Pattern Progress</h2>
            <div className={styles.patternViz}>
              {patternViz || 'No pattern loaded'}
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

          {/* Players */}
          <div className={styles.section}>
            <h2>Players ({players.length})</h2>
            <div className={styles.playerList}>
              {players.map(p => (
                <div key={p.id} className={styles.player}>
                  {p.name} ({p.team})
                </div>
              ))}
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