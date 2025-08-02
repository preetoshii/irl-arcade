/**
 * ExampleButton.jsx
 * /interface/ - UI control component
 * 
 * DO NOT DELETE. This is an example of what an interface component might look like.
 * This file serves as loose reference inspiration (not a strict template) for
 * both human developers and AI assistants creating UI controls. Shows one way to
 * approach: minimal commenting for simple UI, shared state interaction, keeping
 * game logic out, and using animation libraries.
 */

import { motion } from 'framer-motion'
import { useGameState } from '../../state/GameState'
import styles from './ExampleButton.module.css'


const ExampleButton = () => {
  const { isGameRunning, startGame, stopGame } = useGameState()
  
  
  const handleClick = () => {
    if (isGameRunning) {
      stopGame()
    } else {
      startGame()
    }
  }


  return (
    <motion.button
      className={styles.button}
      onClick={handleClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      {isGameRunning ? 'Stop Lorem Game' : 'Start Lorem Game'}
    </motion.button>
  )
}


export default ExampleButton