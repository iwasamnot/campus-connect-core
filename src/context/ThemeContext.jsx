import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

// CRITICAL: Declare useTheme as a top-level const before exporting
const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Export the declared function
export { useTheme };

// CRITICAL: Declare ThemeProvider as a top-level const (no export keyword here)
const ThemeProvider = ({ children }) => {
  const [darkMode, setDarkMode] = useState(() => {
    // Check localStorage first, then system preference
    if (typeof window === 'undefined') return false;
    
    const saved = localStorage.getItem('darkMode');
    if (saved !== null) {
      return saved === 'true';
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const [themeStyle, setThemeStyle] = useState(() => {
    // Check localStorage for theme style preference
    if (typeof window === 'undefined') return 'fun';
    
    const saved = localStorage.getItem('themeStyle');
    return saved || 'fun';
  });

  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    
    // Apply dark mode class to both html and body
    if (darkMode) {
      root.classList.add('dark');
      body.classList.add('dark');
    } else {
      root.classList.remove('dark');
      body.classList.remove('dark');
    }
    
    // Apply theme style class
    root.classList.remove('theme-fun', 'theme-minimal');
    root.classList.add(`theme-${themeStyle}`);
    body.classList.remove('theme-fun', 'theme-minimal');
    body.classList.add(`theme-${themeStyle}`);
    
    // Save to localStorage
    localStorage.setItem('darkMode', darkMode.toString());
    localStorage.setItem('themeStyle', themeStyle);
  }, [darkMode, themeStyle]);

  const toggleDarkMode = () => {
    setDarkMode(prev => !prev);
  };

  const changeThemeStyle = (style) => {
    setThemeStyle(style);
  };

  const value = {
    darkMode,
    themeStyle,
    toggleDarkMode,
    changeThemeStyle
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

// Export the declared component
export { ThemeProvider };

