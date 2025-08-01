import React, { useState } from 'react';
import { useGameStore } from '../state/GameState';

const PlayerSetup = () => {
  const [playerNames, setPlayerNames] = useState(['', '']);
  const { setPlayers, startGame, gameStarted } = useGameStore();

  const handleNameChange = (index, value) => {
    const newNames = [...playerNames];
    newNames[index] = value;
    setPlayerNames(newNames);
  };

  const addPlayer = () => {
    setPlayerNames([...playerNames, '']);
  };

  const removePlayer = (index) => {
    if (playerNames.length > 2) {
      const newNames = playerNames.filter((_, i) => i !== index);
      setPlayerNames(newNames);
    }
  };

  const handleStartGame = () => {
    const validNames = playerNames
      .filter(name => name.trim().length > 0)
      .map(name => name.trim());
    
    if (validNames.length >= 2) {
      setPlayers(validNames);
      startGame();
    }
  };

  const canStart = playerNames.filter(name => name.trim().length > 0).length >= 2;

  if (gameStarted) return null;

  return (
    <div className="player-setup">
      <h1>Welcome to the Audio Game!</h1>
      <p>Enter player names to begin:</p>
      
      <div className="player-inputs">
        {playerNames.map((name, index) => (
          <div key={index} className="player-input-row">
            <input
              type="text"
              placeholder={`Player ${index + 1} name`}
              value={name}
              onChange={(e) => handleNameChange(index, e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && canStart && handleStartGame()}
            />
            {playerNames.length > 2 && (
              <button 
                onClick={() => removePlayer(index)} 
                className="remove-player"
                aria-label="Remove player"
              >
                ×
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="setup-actions">
        <button onClick={addPlayer} className="add-player">
          Add Another Player
        </button>
        
        <button 
          onClick={handleStartGame} 
          disabled={!canStart}
          className="start-game"
        >
          Start Game
        </button>
      </div>
    </div>
  );
};

export default PlayerSetup;