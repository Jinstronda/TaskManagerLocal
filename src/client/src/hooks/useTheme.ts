import { useEffect } from 'react';
import { useThemeStore } from '../stores/themeStore';

export const useTheme = () => {
  const themeStore = useThemeStore();
  
  useEffect(() => {
    // Initialize theme on mount
    const cleanup = themeStore.initializeTheme();
    
    // Apply font size and compact mode
    themeStore.setFontSize(themeStore.fontSize);
    themeStore.setCompactMode(themeStore.compactMode);
    
    return cleanup;
  }, []);
  
  return themeStore;
};