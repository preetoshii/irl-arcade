import { create } from 'zustand';

export const useGameStore = create((set) => ({
  players: [],
  gameStarted: false,
  currentPlayerIndex: 0,
  
  setPlayers: (playerNames) => set({ 
    players: playerNames.map(name => ({ name, isActive: true })) 
  }),
  
  startGame: () => set({ gameStarted: true }),
  
  stopGame: () => set({ 
    gameStarted: false, 
    currentPlayerIndex: 0 
  }),
  
  setCurrentPlayer: (index) => set({ currentPlayerIndex: index }),
  
  togglePlayerActive: (index) => set((state) => ({
    players: state.players.map((player, i) => 
      i === index ? { ...player, isActive: !player.isActive } : player
    )
  })),
  
  getActivePlayers: () => {
    const state = useGameStore.getState();
    return state.players.filter(player => player.isActive);
  },
  
  resetGame: () => set({ 
    players: [], 
    gameStarted: false, 
    currentPlayerIndex: 0 
  })
}));