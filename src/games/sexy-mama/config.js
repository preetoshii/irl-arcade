export default {
  id: 'sexy-mama',
  name: 'Sexy Mama',
  description: 'a spicy game of secrets and surprises',
  minPlayers: 4,
  maxPlayers: 20,
  requires: ['audio'],
  
  // TTS voice for this game (will announce game name and be used in-game)
  voice: 'Karen', // Sultry, dramatic voice
  
  component: () => import('./index.jsx')
};