import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { ThemeProvider, useThemeColor } from './common/contexts/ThemeContext'
import GameSelector from './common/game-management/GameSelector'
import GameLoader from './common/game-management/GameLoader'
import SimonSaysDebugPage from './games/simon-says/debug/DebugPage'
import SettingsButton from './common/components/SettingsButton'
import useSound from './common/hooks/useSound'
import { IoMusicalNotes } from 'react-icons/io5'
import { TbMusicOff } from 'react-icons/tb'
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

function AppContent() {
  const [selectedGame, setSelectedGame] = useState(null);
  const [showDebug, setShowDebug] = useState(false);
  const [musicEnabled, setMusicEnabled] = useState(false);
  const [analyser, setAnalyser] = useState(null);
  const audioRef = useRef(null);
  const audioContextRef = useRef(null);
  const sourceRef = useRef(null);
  
  // Get theme color from context
  const themeColor = useThemeColor();
  
  // Sound hooks
  const { playClick, playHover } = useSound();

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
    playClick();
    
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
      } else {
        // Audio context exists but analyser was cleared - recreate analyser
        const existingAnalyser = audioContextRef.current.createAnalyser();
        existingAnalyser.fftSize = 512;
        existingAnalyser.smoothingTimeConstant = 0.6;
        
        // Reconnect the source through the new analyser
        sourceRef.current.disconnect();
        sourceRef.current.connect(existingAnalyser);
        existingAnalyser.connect(audioContextRef.current.destination);
        
        setAnalyser(existingAnalyser);
        
        // Resume context if suspended
        if (audioContextRef.current.state === 'suspended') {
          audioContextRef.current.resume();
        }
      }
    } else {
      // Clear analyser when disabling music
      setAnalyser(null);
    }
    setMusicEnabled(!musicEnabled);
  };

  const handleGameSelect = (gameId) => {
    console.log(`Selected game: ${gameId}`);
    
    // For Simon Says, go directly to debug page
    if (gameId === 'simon-says') {
      setShowDebug(true);
    } else {
      setSelectedGame(gameId);
    }
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
      {/* Dynamic cursor styles */}
      <style>
        {`
          body, * {
            cursor: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M 4 2 L 20 12 L 4 22 Z" fill="none" stroke="rgb(${themeColor})" stroke-width="2" stroke-linejoin="round"/></svg>') 2 12, auto;
          }
          
          button:not(.no-hand-cursor), a, [role="button"], .clickable {
            cursor: none;
          }
        `}
      </style>
      
      {!selectedGame ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <GameSelector 
            onGameSelect={handleGameSelect} 
            analyser={analyser}
          />
          
          {/* Music toggle button - top right */}
          <SettingsButton
            onClick={toggleMusic}
            onHover={playHover}
            color={themeColor}
            position={{ top: '20px', right: '20px' }}
            isActive={musicEnabled}
          >
            {musicEnabled ? (
              <IoMusicalNotes size={24} color={`rgb(${themeColor})`} />
            ) : (
              <TbMusicOff size={24} color={`rgb(${themeColor})`} />
            )}
          </SettingsButton>
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

// Main App component wrapped with ThemeProvider
function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App