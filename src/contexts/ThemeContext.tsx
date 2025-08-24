import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useThemeContext = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeContext must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  // Initialize theme from localStorage or system preference
  const [theme, setTheme] = useState<Theme>(() => {
    const savedTheme = localStorage.getItem('kw8-theme') as Theme;
    if (savedTheme) {
      return savedTheme;
    }
    // Check system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  });

  // Update favicon and app icon based on theme
  const updateAppIcons = (currentTheme: Theme) => {
    const selectedLogo = localStorage.getItem('kw8-selected-logo') || 'default';
    
    let logoPath;
    if (selectedLogo === 'alternative') {
      logoPath = currentTheme === 'dark' ? '/images/logopaginadark.PNG' : '/images/logopagina.PNG';
    } else {
      logoPath = currentTheme === 'dark' ? '/images/logopaginadark.PNG' : '/images/logo.png';
    }
    
    // Update favicon
    const favicon16 = document.querySelector('link[rel="icon"][sizes="16x16"]') as HTMLLinkElement;
    const favicon32 = document.querySelector('link[rel="icon"][sizes="32x32"]') as HTMLLinkElement;
    const appleTouchIcon = document.querySelector('link[rel="apple-touch-icon"]') as HTMLLinkElement;
    
    if (favicon16) favicon16.href = `${logoPath}?v=4`;
    if (favicon32) favicon32.href = `${logoPath}?v=4`;
    if (appleTouchIcon) appleTouchIcon.href = `${logoPath}?v=4`;
    
    // Update header logos
    const headerLogo = document.querySelector('header img[alt="KW8 Logo"]') as HTMLImageElement;
    const mobileMenuLogo = document.querySelector('.fixed.inset-0 img[alt="KW8 Logo"]') as HTMLImageElement;
    
    if (headerLogo) headerLogo.src = logoPath;
    if (mobileMenuLogo) mobileMenuLogo.src = logoPath;
    
    // Update theme-color meta tag
    const themeColorMeta = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement;
    if (themeColorMeta) {
      themeColorMeta.content = currentTheme === 'dark' ? '#1a1a1a' : '#1e3a8a';
    }
  };

  const handleThemeChange = (newTheme: Theme) => {
    localStorage.setItem('kw8-theme', newTheme);
    setTheme(newTheme);
    updateAppIcons(newTheme);
    
    // Apply theme class to document
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    handleThemeChange(newTheme);
  };

  // Initialize theme on mount
  useEffect(() => {
    updateAppIcons(theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem('kw8-theme')) {
        const newTheme = e.matches ? 'dark' : 'light';
        handleThemeChange(newTheme);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme: handleThemeChange, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};