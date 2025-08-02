/**
 * GameLoader.jsx - Dynamic game loading component
 * 
 * Loads and runs the selected game component.
 * Handles loading states and error boundaries.
 */

import { useState, useEffect, Suspense } from 'react';
import gameRegistry from './GameRegistry';

function GameLoader({ gameId, onExit }) {
  const [GameComponent, setGameComponent] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadGame = async () => {
      setLoading(true);
      setError(null);
      
      const game = gameRegistry.getGame(gameId);
      if (!game) {
        setError(`Game "${gameId}" not found`);
        setLoading(false);
        return;
      }

      try {
        // Dynamic import of the game component
        const module = await game.loadComponent();
        setGameComponent(() => module.default || module);
      } catch (err) {
        console.error('Failed to load game:', err);
        setError(`Failed to load ${game.name || gameId}`);
      } finally {
        setLoading(false);
      }
    };

    loadGame();
  }, [gameId]);

  if (loading) {
    return (
      <div className="game-loading">
        <h2>Loading game...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div className="game-error">
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={onExit}>Back to Menu</button>
      </div>
    );
  }

  if (!GameComponent) {
    return null;
  }

  // Render the loaded game component
  return (
    <Suspense fallback={<div>Loading game assets...</div>}>
      <GameComponent onExit={onExit} />
    </Suspense>
  );
}

export default GameLoader;