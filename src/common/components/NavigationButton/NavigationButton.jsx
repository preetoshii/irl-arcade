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
 */
function NavigationButton({ 
  onClick, 
  onHover,
  color = '255, 255, 255',
  position = {},
  children,
  className = '',
  initialAnimation = {}
}) {
  return (
    <motion.button
      className={`${styles.navButton} ${className}`}
      onClick={onClick}
      onMouseEnter={onHover}
      initial={{ opacity: 0, ...initialAnimation }}
      animate={{ opacity: 1, x: 0 }}
      style={{ 
        ...position,
        color: `rgb(${color})`,
        borderColor: `rgb(${color})`,
        backgroundColor: 'transparent'
      }}
      whileHover={{ 
        scale: 1.1,
        backgroundColor: '#fff',
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