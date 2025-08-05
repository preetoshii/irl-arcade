import { motion } from 'framer-motion';
import styles from './SettingsButton.module.css';

/**
 * Reusable settings button component with hover effects and animations
 * 
 * @param {Object} props
 * @param {Function} props.onClick - Click handler
 * @param {Function} props.onHover - Hover handler (e.g., play sound)
 * @param {string} props.color - RGB color string (e.g., "255, 255, 255")
 * @param {Object} props.position - CSS position object (e.g., { top: '20px', right: '20px' })
 * @param {ReactNode} props.children - Button content (icon or custom content)
 * @param {string} props.className - Additional CSS classes
 * @param {boolean} props.isActive - Whether the button is in active state
 * @param {number} props.beatScale - Scale factor for beat animation (1 = no effect)
 */
function SettingsButton({ 
  onClick, 
  onHover,
  color = '255, 255, 255',
  position = {},
  children,
  className = '',
  isActive = false,
  beatScale = 1
}) {
  return (
    <motion.button
      className={`${styles.settingsButton} ${className}`}
      onClick={onClick}
      onMouseEnter={onHover}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ 
        opacity: 1, 
        scale: beatScale
      }}
      style={{ 
        ...position,
        color: `rgb(${color})`,
        borderColor: 'transparent',
        backgroundColor: 'rgba(0, 0, 0, 0)'
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

export default SettingsButton;