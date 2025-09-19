import React, { useState, useEffect } from 'react';
import { Keyboard, RotateCcw, Search, Zap } from 'lucide-react';
import { useKeyboardStore, formatKeys } from '../../stores/keyboardStore';

export const KeyboardShortcuts: React.FC = () => {
  const {
    shortcuts,
    isRecording,
    updateShortcut,
    resetShortcut,
    resetAllShortcuts,
    startRecording,
    stopRecording
  } = useKeyboardStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [recordingKeys, setRecordingKeys] = useState<string[]>([]);

  // Filter shortcuts based on search term
  const filteredShortcuts = shortcuts.filter(shortcut =>
    shortcut.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    shortcut.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    formatKeys(shortcut.keys).toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group shortcuts by category
  const groupedShortcuts = filteredShortcuts.reduce((groups, shortcut) => {
    const category = shortcut.category;
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(shortcut);
    return groups;
  }, {} as Record<string, typeof shortcuts>);

  const categoryLabels = {
    timer: 'Timer Controls',
    navigation: 'Navigation',
    tasks: 'Task Management',
    general: 'General'
  };

  const categoryIcons = {
    timer: Zap,
    navigation: Search,
    tasks: Keyboard,
    general: RotateCcw
  };

  // Handle key recording
  useEffect(() => {
    if (!isRecording) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      event.preventDefault();
      event.stopPropagation();

      const keys: string[] = [];
      if (event.ctrlKey) keys.push('Ctrl');
      if (event.altKey) keys.push('Alt');
      if (event.shiftKey) keys.push('Shift');
      if (event.metaKey) keys.push('Meta');

      // Add the main key (ignore modifier keys)
      if (!['Control', 'Alt', 'Shift', 'Meta'].includes(event.key)) {
        keys.push(event.key);
        
        // Update the shortcut and stop recording
        updateShortcut(isRecording, keys);
        stopRecording();
        setRecordingKeys([]);
      } else {
        // Just show the modifiers while recording
        setRecordingKeys(keys);
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      // If only modifiers were pressed and released, cancel recording
      if (['Control', 'Alt', 'Shift', 'Meta'].includes(event.key) && recordingKeys.length > 0) {
        setRecordingKeys([]);
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);
    document.addEventListener('keyup', handleKeyUp, true);

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
      document.removeEventListener('keyup', handleKeyUp, true);
    };
  }, [isRecording, recordingKeys, updateShortcut, stopRecording]);

  const handleStartRecording = (shortcutId: string) => {
    startRecording(shortcutId);
    setRecordingKeys([]);
  };

  const handleCancelRecording = () => {
    stopRecording();
    setRecordingKeys([]);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Keyboard Shortcuts
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Customize keyboard shortcuts for faster navigation and control
          </p>
        </div>
        <button
          onClick={resetAllShortcuts}
          className="px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 
                   rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors
                   flex items-center space-x-2"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Reset All</span>
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search shortcuts..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 
                   rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                   focus:ring-2 focus:ring-primary-500 focus:border-primary-500
                   placeholder-gray-400 dark:placeholder-gray-500"
        />
      </div>

      {/* Recording Indicator */}
      {isRecording && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              <div>
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  Recording shortcut...
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  Press the key combination you want to use
                  {recordingKeys.length > 0 && ` (${formatKeys(recordingKeys)}...)`}
                </p>
              </div>
            </div>
            <button
              onClick={handleCancelRecording}
              className="px-3 py-1 text-xs bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 
                       rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Shortcuts by Category */}
      <div className="space-y-6">
        {Object.entries(groupedShortcuts).map(([category, categoryShortcuts]) => {
          const Icon = categoryIcons[category as keyof typeof categoryIcons];
          
          return (
            <div key={category} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-md font-medium text-gray-900 dark:text-gray-100 mb-4 flex items-center space-x-2">
                <Icon className="w-4 h-4 text-primary-600" />
                <span>{categoryLabels[category as keyof typeof categoryLabels]}</span>
              </h3>
              
              <div className="space-y-3">
                {categoryShortcuts.map((shortcut) => (
                  <div
                    key={shortcut.id}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="font-medium text-sm text-gray-900 dark:text-gray-100">
                        {shortcut.name}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        {shortcut.description}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {/* Current Shortcut Display */}
                      <div className="flex items-center space-x-1">
                        {isRecording === shortcut.id ? (
                          <div className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 
                                        rounded border-2 border-blue-300 dark:border-blue-700 text-xs font-mono">
                            Recording...
                          </div>
                        ) : (
                          <div className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 
                                        rounded border text-xs font-mono">
                            {formatKeys(shortcut.keys)}
                          </div>
                        )}
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => handleStartRecording(shortcut.id)}
                          disabled={isRecording !== null}
                          className="px-2 py-1 text-xs bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 
                                   rounded hover:bg-primary-200 dark:hover:bg-primary-800 transition-colors
                                   disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Edit
                        </button>
                        
                        <button
                          onClick={() => resetShortcut(shortcut.id)}
                          disabled={isRecording !== null}
                          className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 
                                   rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors
                                   disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Reset
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Help Text */}
      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
          Tips for customizing shortcuts:
        </h4>
        <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
          <li>• Use Ctrl/Cmd + letter combinations for best compatibility</li>
          <li>• Avoid system shortcuts like Ctrl+C, Ctrl+V, etc.</li>
          <li>• Function keys (F1-F12) work well for global actions</li>
          <li>• Single keys work only when not typing in input fields</li>
        </ul>
      </div>
    </div>
  );
};