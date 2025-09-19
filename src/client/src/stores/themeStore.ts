import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemeMode = 'light' | 'dark' | 'system';
export type FontSize = 'small' | 'medium' | 'large';
export type DashboardLayout = 'default' | 'compact' | 'detailed';

export interface ThemeState {
  // Theme settings
  mode: ThemeMode;
  fontSize: FontSize;
  compactMode: boolean;
  showSecondsInTimer: boolean;
  dashboardLayout: DashboardLayout;
  
  // Computed theme
  isDark: boolean;
  
  // Actions
  setMode: (mode: ThemeMode) => void;
  setFontSize: (size: FontSize) => void;
  setCompactMode: (compact: boolean) => void;
  setShowSecondsInTimer: (show: boolean) => void;
  setDashboardLayout: (layout: DashboardLayout) => void;
  toggleTheme: () => void;
  initializeTheme: () => void;
}

// Helper function to detect system theme preference
const getSystemTheme = (): 'light' | 'dark' => {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'light';
};

// Helper function to apply theme to document
const applyTheme = (isDark: boolean) => {
  if (typeof document !== 'undefined') {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }
};

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      // Initial state
      mode: 'system',
      fontSize: 'medium',
      compactMode: false,
      showSecondsInTimer: false,
      dashboardLayout: 'default',
      isDark: false,
      
      // Actions
      setMode: (mode: ThemeMode) => {
        const isDark = mode === 'dark' || (mode === 'system' && getSystemTheme() === 'dark');
        applyTheme(isDark);
        set({ mode, isDark });
      },
      
      setFontSize: (fontSize: FontSize) => {
        set({ fontSize });
        
        // Apply font size to document root
        if (typeof document !== 'undefined') {
          const root = document.documentElement;
          root.classList.remove('text-sm', 'text-base', 'text-lg');
          
          switch (fontSize) {
            case 'small':
              root.classList.add('text-sm');
              break;
            case 'medium':
              root.classList.add('text-base');
              break;
            case 'large':
              root.classList.add('text-lg');
              break;
          }
        }
      },
      
      setCompactMode: (compactMode: boolean) => {
        set({ compactMode });
        
        // Apply compact mode to document root
        if (typeof document !== 'undefined') {
          if (compactMode) {
            document.documentElement.classList.add('compact-mode');
          } else {
            document.documentElement.classList.remove('compact-mode');
          }
        }
      },
      
      setShowSecondsInTimer: (showSecondsInTimer: boolean) => {
        set({ showSecondsInTimer });
      },
      
      setDashboardLayout: (dashboardLayout: DashboardLayout) => {
        set({ dashboardLayout });
      },
      
      toggleTheme: () => {
        const { mode } = get();
        const newMode: ThemeMode = mode === 'light' ? 'dark' : mode === 'dark' ? 'system' : 'light';
        get().setMode(newMode);
      },
      
      initializeTheme: () => {
        const { mode } = get();
        const isDark = mode === 'dark' || (mode === 'system' && getSystemTheme() === 'dark');
        applyTheme(isDark);
        set({ isDark });
        
        // Listen for system theme changes
        if (typeof window !== 'undefined' && window.matchMedia) {
          const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
          const handleChange = () => {
            const { mode } = get();
            if (mode === 'system') {
              const isDark = mediaQuery.matches;
              applyTheme(isDark);
              set({ isDark });
            }
          };
          
          mediaQuery.addEventListener('change', handleChange);
          
          // Return cleanup function
          return () => mediaQuery.removeEventListener('change', handleChange);
        }
      },
    }),
    {
      name: 'theme-storage',
      version: 1,
      // Only persist user preferences, not computed values
      partialize: (state) => ({
        mode: state.mode,
        fontSize: state.fontSize,
        compactMode: state.compactMode,
        showSecondsInTimer: state.showSecondsInTimer,
        dashboardLayout: state.dashboardLayout,
      }),
    }
  )
);