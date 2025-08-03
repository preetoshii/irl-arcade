export default {
  id: 'sexy-mama',
  name: 'Sexy Mama',
  description: 'a spicy game of secrets and surprises',
  minPlayers: 4,
  maxPlayers: 20,
  color: '255, 20, 147', // Deep pink
  requires: ['audio'],
  
  component: () => import('./index.jsx')
};