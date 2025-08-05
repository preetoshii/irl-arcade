import { useState } from 'react';
import GameTitleScreen from '../../common/components/GameTitleScreen';
import config from './config';

function SexyMama({ mode = 'title', isActive, onExit, analyser }) {
  const [gameState, setGameState] = useState('title');

  if (gameState === 'title') {
    return (
      <GameTitleScreen
        title={config.name}
        blobColor="255, 20, 147"  // Deep pink
        analyser={analyser}
        isActive={isActive}
      />
    );
  }

  // Game content will go here
  return (
    <div style={{ 
 
      color: '#fff',
      height: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column'
    }}>
      <h1>Sexy Mama Game</h1>
      <p>Game coming soon...</p>
      <button onClick={onExit}>Exit Game</button>
    </div>
  );
}

export default SexyMama;