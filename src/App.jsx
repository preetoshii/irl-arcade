import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import GameSelector from './common/game-management/GameSelector'
import GameLoader from './common/game-management/GameLoader'
import SimonSaysDebugPage from './games/simon-says/debug/DebugPage'
import './App.css'

// Import and register all games
import './games'

// Menu music path (in public folder)
const menuMusic = '/sounds/menu.mp3'

// Global Game object for console experimentation
window.Game = {
  speak: null,
  // Add whatever you need here for experiments
}

function App() {
  const [selectedGame, setSelectedGame] = useState(null);
  const [showDebug, setShowDebug] = useState(false);
  const [musicEnabled, setMusicEnabled] = useState(false);
  const [analyser, setAnalyser] = useState(null);
  const audioRef = useRef(null);
  const audioContextRef = useRef(null);
  const sourceRef = useRef(null);

  // Initialize speech synthesis and menu music
  useEffect(() => {
    // Simple speak function ready to use
    const speak = (text, pitch = 1, rate = 1) => {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.pitch = pitch
      utterance.rate = rate
      window.speechSynthesis.speak(utterance)
    }
    
    // Make it available globally for console experiments
    window.Game.speak = speak

    // Create audio element for menu music
    const audio = new Audio(menuMusic);
    audio.loop = true;
    audio.volume = 0.21; // Set to 21% volume (30% lower than 0.3)
    audioRef.current = audio;

    return () => {
      // Cleanup - stop music when component unmounts
      audio.pause();
      audio.src = '';
      
      // Clean up audio context
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  // Control music based on current state and user preference
  useEffect(() => {
    if (audioRef.current) {
      if (musicEnabled && !selectedGame && !showDebug) {
        // On main menu with music enabled - play music
        audioRef.current.play().catch(err => {
          console.log('Menu music play prevented:', err);
        });
      } else {
        // In game, debug, or music disabled - pause music
        audioRef.current.pause();
      }
    }
  }, [selectedGame, showDebug, musicEnabled]);

  const toggleMusic = () => {
    if (!musicEnabled && audioRef.current) {
      // Create audio context and analyzer when enabling music
      if (!audioContextRef.current) {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const newAnalyser = audioContext.createAnalyser();
        newAnalyser.fftSize = 512; // Higher resolution
        newAnalyser.smoothingTimeConstant = 0.6; // Less smoothing for more reactive
        
        const source = audioContext.createMediaElementSource(audioRef.current);
        source.connect(newAnalyser);
        newAnalyser.connect(audioContext.destination);
        
        audioContextRef.current = audioContext;
        sourceRef.current = source;
        setAnalyser(newAnalyser);
        
        // Resume context if suspended
        if (audioContext.state === 'suspended') {
          audioContext.resume();
        }
        
        console.log('Audio context created:', { audioContext, analyser: newAnalyser, state: audioContext.state });
      }
    } else {
      // Clear analyser when disabling music
      setAnalyser(null);
    }
    setMusicEnabled(!musicEnabled);
  };

  const handleGameSelect = (gameId) => {
    console.log(`Selected game: ${gameId}`);
    setSelectedGame(gameId);
  };

  const handleExitGame = () => {
    setSelectedGame(null);
  };

  // Show debug page if requested
  if (showDebug) {
    return <SimonSaysDebugPage onBack={() => setShowDebug(false)} />;
  }

  return (
    <div className="App">
      {!selectedGame ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <GameSelector onGameSelect={handleGameSelect} analyser={analyser} />
          
          {/* Music toggle button - top right */}
          <button 
            onClick={toggleMusic}
            style={{
              position: 'fixed',
              top: '20px',
              right: '20px',
              background: 'transparent',
              border: '2px solid #fff',
              width: '48px',
              height: '48px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              zIndex: 10000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#fff';
              const svg = e.currentTarget.querySelector('svg');
              if (svg) svg.style.stroke = '#000';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              const svg = e.currentTarget.querySelector('svg');
              if (svg) svg.style.stroke = '#fff';
            }}
          >
            <svg 
              width="24" 
              height="24" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="#fff" 
              strokeWidth="2"
              style={{ transition: 'stroke 0.2s' }}
            >
              {musicEnabled ? (
                // Speaker with sound waves
                <>
                  <path d="M11 5L6 9H2v6h4l5 4V5z" fill="#fff" />
                  <path d="M15.5 8.5a5 5 0 0 1 0 7" />
                  <path d="M19 5a9 9 0 0 1 0 14" />
                </>
              ) : (
                // Speaker with slash
                <>
                  <path d="M11 5L6 9H2v6h4l5 4V5z" fill="#fff" />
                  <line x1="22" y1="2" x2="2" y2="22" />
                </>
              )}
            </svg>
          </button>
          
          {/* Debug button - small and unobtrusive */}
          <button 
            onClick={() => setShowDebug(true)}
            style={{
              position: 'fixed',
              bottom: '20px',
              right: '20px',
              background: '#333',
              color: '#0f0',
              border: '1px solid #0f0',
              padding: '8px 16px',
              fontSize: '12px',
              fontFamily: 'JetBrains Mono, monospace',
              cursor: 'pointer',
              opacity: 0.7,
              transition: 'opacity 0.2s',
              zIndex: 10000
            }}
            onMouseEnter={(e) => e.target.style.opacity = '1'}
            onMouseLeave={(e) => e.target.style.opacity = '0.7'}
          >
            Debug Simon Says
          </button>
        </motion.div>
      ) : (
        <GameLoader 
          gameId={selectedGame} 
          onExit={handleExitGame}
        />
      )}
    </div>
  )
}

export default App