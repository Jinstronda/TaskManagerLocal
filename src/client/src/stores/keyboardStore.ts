import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface KeyboardShortcut {
  id: string;
  name: string;
  description: string;
  defaultKeys: string[];
  keys: string[];
  category: 'timer' | 'navigation' | 'tasks' | 'general';
  action: () => void;
}

export interface KeyboardState {
  shortcuts: KeyboardShortcut[];
  isRecording: string | null; // ID of shortcut being recorded
  
  // Actions
  updateShortcut: (id: string, keys: string[]) => void;
  resetShortcut: (id: string) => void;
  resetAllShortcuts: () => void;
  startRecording: (id: string) => void;
  stopRecording: () => void;
  registerShortcuts: () => void;
  unregisterShortcuts: () => void;
}

// Default shortcuts configuration
const defaultShortcuts: Omit<KeyboardShortcut, 'action'>[] = [
  // Timer shortcuts
  {
    id: 'timer-start-pause',
    name: 'Start/Pause Timer',
    description: 'Start or pause the current timer session',
    defaultKeys: ['Space'],
    keys: ['Space'],
    category: 'timer'
  },
  {
    id: 'timer-stop',
    name: 'Stop Timer',
    description: 'Stop the current timer session',
    defaultKeys: ['Escape'],
    keys: ['Escape'],
    category: 'timer'
  },
  {
    id: 'timer-quick-start-25',
    name: 'Quick Start 25min',
    description: 'Start a 25-minute focus session',
    defaultKeys: ['Ctrl', '1'],
    keys: ['Ctrl', '1'],
    category: 'timer'
  },
  {
    id: 'timer-quick-start-45',
    name: 'Quick Start 45min',
    description: 'Start a 45-minute focus session',
    defaultKeys: ['Ctrl', '2'],
    keys: ['Ctrl', '2'],
    category: 'timer'
  },
  
  // Navigation shortcuts
  {
    id: 'nav-dashboard',
    name: 'Go to Dashboard',
    description: 'Navigate to the dashboard page',
    defaultKeys: ['Ctrl', 'D'],
    keys: ['Ctrl', 'D'],
    category: 'navigation'
  },
  {
    id: 'nav-timer',
    name: 'Go to Timer',
    description: 'Navigate to the timer page',
    defaultKeys: ['Ctrl', 'T'],
    keys: ['Ctrl', 'T'],
    category: 'navigation'
  },
  {
    id: 'nav-tasks',
    name: 'Go to Tasks',
    description: 'Navigate to the tasks page',
    defaultKeys: ['Ctrl', 'K'],
    keys: ['Ctrl', 'K'],
    category: 'navigation'
  },
  {
    id: 'nav-analytics',
    name: 'Go to Analytics',
    description: 'Navigate to the analytics page',
    defaultKeys: ['Ctrl', 'A'],
    keys: ['Ctrl', 'A'],
    category: 'navigation'
  },
  {
    id: 'nav-settings',
    name: 'Go to Settings',
    description: 'Navigate to the settings page',
    defaultKeys: ['Ctrl', ','],
    keys: ['Ctrl', ','],
    category: 'navigation'
  },
  
  // Task shortcuts
  {
    id: 'task-new',
    name: 'New Task',
    description: 'Create a new task',
    defaultKeys: ['Ctrl', 'N'],
    keys: ['Ctrl', 'N'],
    category: 'tasks'
  },
  {
    id: 'task-search',
    name: 'Search Tasks',
    description: 'Focus on task search input',
    defaultKeys: ['Ctrl', 'F'],
    keys: ['Ctrl', 'F'],
    category: 'tasks'
  },
  
  // General shortcuts
  {
    id: 'general-help',
    name: 'Show Help',
    description: 'Show keyboard shortcuts help',
    defaultKeys: ['Ctrl', '?'],
    keys: ['Ctrl', '?'],
    category: 'general'
  },
  {
    id: 'general-command-palette',
    name: 'Command Palette',
    description: 'Open command palette',
    defaultKeys: ['Ctrl', 'Shift', 'P'],
    keys: ['Ctrl', 'Shift', 'P'],
    category: 'general'
  }
];

// Helper function to format key combination
export const formatKeys = (keys: string[]): string => {
  return keys.map(key => {
    switch (key) {
      case 'Ctrl': return 'Ctrl';
      case 'Alt': return 'Alt';
      case 'Shift': return 'Shift';
      case 'Meta': return 'Cmd';
      case ' ': return 'Space';
      case 'Escape': return 'Esc';
      case 'ArrowUp': return '↑';
      case 'ArrowDown': return '↓';
      case 'ArrowLeft': return '←';
      case 'ArrowRight': return '→';
      default: return key.toUpperCase();
    }
  }).join(' + ');
};

// Helper function to check if key combination matches
const keysMatch = (keys1: string[], keys2: string[]): boolean => {
  if (keys1.length !== keys2.length) return false;
  return keys1.every((key, index) => key === keys2[index]);
};

export const useKeyboardStore = create<KeyboardState>()(
  persist(
    (set, get) => ({
      shortcuts: defaultShortcuts.map(shortcut => ({
        ...shortcut,
        action: () => {} // Will be set when registering shortcuts
      })),
      isRecording: null,
      
      updateShortcut: (id: string, keys: string[]) => {
        set((state) => ({
          shortcuts: state.shortcuts.map(shortcut =>
            shortcut.id === id ? { ...shortcut, keys } : shortcut
          )
        }));
      },
      
      resetShortcut: (id: string) => {
        set((state) => ({
          shortcuts: state.shortcuts.map(shortcut =>
            shortcut.id === id ? { ...shortcut, keys: [...shortcut.defaultKeys] } : shortcut
          )
        }));
      },
      
      resetAllShortcuts: () => {
        set((state) => ({
          shortcuts: state.shortcuts.map(shortcut => ({
            ...shortcut,
            keys: [...shortcut.defaultKeys]
          }))
        }));
      },
      
      startRecording: (id: string) => {
        set({ isRecording: id });
      },
      
      stopRecording: () => {
        set({ isRecording: null });
      },
      
      registerShortcuts: () => {
        const handleKeyDown = (event: KeyboardEvent) => {
          const { shortcuts } = get();
          
          // Build current key combination
          const currentKeys: string[] = [];
          if (event.ctrlKey) currentKeys.push('Ctrl');
          if (event.altKey) currentKeys.push('Alt');
          if (event.shiftKey) currentKeys.push('Shift');
          if (event.metaKey) currentKeys.push('Meta');
          
          // Add the main key
          if (event.key !== 'Control' && event.key !== 'Alt' && event.key !== 'Shift' && event.key !== 'Meta') {
            currentKeys.push(event.key);
          }
          
          // Find matching shortcut
          const matchingShortcut = shortcuts.find(shortcut =>
            keysMatch(shortcut.keys, currentKeys)
          );
          
          if (matchingShortcut) {
            event.preventDefault();
            event.stopPropagation();
            matchingShortcut.action();
          }
        };
        
        document.addEventListener('keydown', handleKeyDown);
        
        // Store cleanup function
        (window as any).__keyboardCleanup = () => {
          document.removeEventListener('keydown', handleKeyDown);
        };
      },
      
      unregisterShortcuts: () => {
        if ((window as any).__keyboardCleanup) {
          (window as any).__keyboardCleanup();
          delete (window as any).__keyboardCleanup;
        }
      }
    }),
    {
      name: 'keyboard-shortcuts',
      version: 1,
      // Only persist the key mappings, not the action functions
      partialize: (state) => ({
        shortcuts: state.shortcuts.map(({ action, ...shortcut }) => shortcut)
      }),
    }
  )
);