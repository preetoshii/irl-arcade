import { motion } from 'framer-motion';
import styles from './NavigationButton.module.css';

/**
 * Reusable navigation button component with hover effects and animations
 * 
 * @param {Object} props
 * @param {Function} props.onClick - Click handler
 * @param {Function} props.onHover - Hover handler (e.g., play sound)
 * @param {string} props.color - RGB color string (e.g., "255, 255, 255")
 * @param {string} props.position - CSS position object (e.g., { left: '2rem' } or { right: '2rem' })
 * @param {ReactNode} props.children - Button content (arrow or custom content)
 * @param {string} props.className - Additional CSS classes
 * @param {Object} props.initialAnimation - Initial animation state
 * @param {boolean} props.isPressed - Whether the button is pressed (for keyboard navigation)
 * @param {number} props.beatScale - Scale factor for beat animation (1 = no effect)
 */
function NavigationButton({ 
  onClick, 
  onHover,
  color = '255, 255, 255',
  position = {},
  children,
  className = '',
  initialAnimation = {},
  isPressed = false,
  beatScale = 1
}) {
  return (
    <motion.button
      className={`${styles.navButton} ${className}`}
      onClick={onClick}
      onMouseEnter={onHover}
      initial={{ opacity: 0, ...initialAnimation }}
      animate={{ 
        opacity: 1, 
        x: 0,
        scale: isPressed ? 0.95 : beatScale
      }}
      style={{ 
        ...position,
        color: isPressed ? '#000' : `rgb(${color})`,
        borderColor: isPressed ? '#fff' : `rgb(${color})`,
        backgroundColor: isPressed ? 'rgba(255, 255, 255, 1)' : 'rgba(0, 0, 0, 0)'
      }}
      whileHover={{ 
        scale: 1.1,
        backgroundColor: 'rgba(255, 255, 255, 1)',
        color: '#000',
        borderColor: '#fff'
      }}
      whileTap={{ scale: 0.95 }}
      transition={{ 
        type: "spring",
        stiffness: 400,
        damping: 17
      }}
    >
      {children}
    </motion.button>
  );
}

export default NavigationButton;