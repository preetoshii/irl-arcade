import { createContext, useContext, useState } from 'react';

/**
 * Theme Context for managing the global color theme
 * 
 * This provides a single source of truth for the current theme color
 * that changes based on carousel scroll position.
 */

const ThemeContext = createContext({
  themeColor: '255, 255, 255',
  setThemeColor: () => {}
});

export function ThemeProvider({ children }) {
  const [themeColor, setThemeColor] = useState('255, 255, 255');

  return (
    <ThemeContext.Provider value={{ themeColor, setThemeColor }}>
      {children}
    </ThemeContext.Provider>
  );
}

// Hook to access theme color from any component
export function useThemeColor() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeColor must be used within ThemeProvider');
  }
  return context.themeColor;
}

// Hook to update theme color (typically only used by carousel)
export function useThemeController() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeController must be used within ThemeProvider');
  }
  return context.setThemeColor;
}