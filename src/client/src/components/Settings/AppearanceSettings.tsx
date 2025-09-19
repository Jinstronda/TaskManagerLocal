import React from 'react';
import { Palette, Monitor, Sun, Moon, Type, Layout, Eye } from 'lucide-react';
import { useThemeStore, ThemeMode, FontSize, DashboardLayout } from '../../stores/themeStore';

export const AppearanceSettings: React.FC = () => {
  const {
    mode,
    fontSize,
    compactMode,
    showSecondsInTimer,
    dashboardLayout,
    isDark,
    setMode,
    setFontSize,
    setCompactMode,
    setShowSecondsInTimer,
    setDashboardLayout,
  } = useThemeStore();

  const themeOptions = [
    { value: 'light' as ThemeMode, label: 'Light', icon: Sun, description: 'Always use light theme' },
    { value: 'dark' as ThemeMode, label: 'Dark', icon: Moon, description: 'Always use dark theme' },
    { value: 'system' as ThemeMode, label: 'System', icon: Monitor, description: 'Follow system preference' },
  ];

  const fontSizeOptions = [
    { value: 'small' as FontSize, label: 'Small', description: '14px base size' },
    { value: 'medium' as FontSize, label: 'Medium', description: '16px base size' },
    { value: 'large' as FontSize, label: 'Large', description: '18px base size' },
  ];

  const layoutOptions = [
    { value: 'default' as DashboardLayout, label: 'Default', description: 'Standard layout with all widgets' },
    { value: 'compact' as DashboardLayout, label: 'Compact', description: 'Condensed view with essential info' },
    { value: 'detailed' as DashboardLayout, label: 'Detailed', description: 'Expanded view with extra metrics' },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Theme Settings */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center space-x-2">
          <Palette className="w-5 h-5 text-purple-600" />
          <span>Theme</span>
        </h2>
        
        <div className="space-y-4">
          {/* Color Scheme */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Color scheme
            </label>
            <div className="grid grid-cols-1 gap-2">
              {themeOptions.map((option) => {
                const Icon = option.icon;
                const isSelected = mode === option.value;
                
                return (
                  <button
                    key={option.value}
                    onClick={() => setMode(option.value)}
                    className={`p-3 rounded-lg border-2 text-left transition-all ${
                      isSelected
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        isSelected 
                          ? 'bg-purple-100 dark:bg-purple-800' 
                          : 'bg-gray-100 dark:bg-gray-800'
                      }`}>
                        <Icon className={`w-4 h-4 ${
                          isSelected 
                            ? 'text-purple-600 dark:text-purple-400' 
                            : 'text-gray-600 dark:text-gray-400'
                        }`} />
                      </div>
                      <div>
                        <div className={`font-medium text-sm ${
                          isSelected 
                            ? 'text-gray-900 dark:text-gray-100' 
                            : 'text-gray-700 dark:text-gray-300'
                        }`}>
                          {option.label}
                        </div>
                        <div className={`text-xs ${
                          isSelected 
                            ? 'text-gray-600 dark:text-gray-400' 
                            : 'text-gray-500 dark:text-gray-500'
                        }`}>
                          {option.description}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Current Theme Preview */}
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
            <div className="flex items-center space-x-2 text-sm">
              <div className={`w-3 h-3 rounded-full ${isDark ? 'bg-gray-700' : 'bg-white'} border-2 border-gray-300 dark:border-gray-600`}></div>
              <span className="text-gray-600 dark:text-gray-400">
                Currently using {isDark ? 'dark' : 'light'} theme
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Typography Settings */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center space-x-2">
          <Type className="w-5 h-5 text-blue-600" />
          <span>Typography</span>
        </h2>
        
        <div className="space-y-4">
          {/* Font Size */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Font size
            </label>
            <div className="grid grid-cols-1 gap-2">
              {fontSizeOptions.map((option) => {
                const isSelected = fontSize === option.value;
                
                return (
                  <button
                    key={option.value}
                    onClick={() => setFontSize(option.value)}
                    className={`p-3 rounded-lg border-2 text-left transition-all ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className={`font-medium text-sm ${
                          isSelected 
                            ? 'text-gray-900 dark:text-gray-100' 
                            : 'text-gray-700 dark:text-gray-300'
                        }`}>
                          {option.label}
                        </div>
                        <div className={`text-xs ${
                          isSelected 
                            ? 'text-gray-600 dark:text-gray-400' 
                            : 'text-gray-500 dark:text-gray-500'
                        }`}>
                          {option.description}
                        </div>
                      </div>
                      <div className={`text-lg font-medium ${
                        isSelected 
                          ? 'text-blue-600 dark:text-blue-400' 
                          : 'text-gray-400 dark:text-gray-500'
                      }`}>
                        Aa
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Compact Mode */}
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Compact mode</label>
              <p className="text-xs text-gray-500 dark:text-gray-400">Use smaller spacing and components</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={compactMode}
                onChange={(e) => setCompactMode(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Display Settings */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center space-x-2">
          <Eye className="w-5 h-5 text-green-600" />
          <span>Display</span>
        </h2>
        
        <div className="space-y-4">
          {/* Show Seconds in Timer */}
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Show seconds in timer</label>
              <p className="text-xs text-gray-500 dark:text-gray-400">Display seconds in the countdown timer</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={showSecondsInTimer}
                onChange={(e) => setShowSecondsInTimer(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 dark:peer-focus:ring-green-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-green-600"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Layout Settings */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center space-x-2">
          <Layout className="w-5 h-5 text-orange-600" />
          <span>Layout</span>
        </h2>
        
        <div className="space-y-4">
          {/* Dashboard Layout */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Dashboard layout
            </label>
            <div className="grid grid-cols-1 gap-2">
              {layoutOptions.map((option) => {
                const isSelected = dashboardLayout === option.value;
                
                return (
                  <button
                    key={option.value}
                    onClick={() => setDashboardLayout(option.value)}
                    className={`p-3 rounded-lg border-2 text-left transition-all ${
                      isSelected
                        ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <div>
                      <div className={`font-medium text-sm ${
                        isSelected 
                          ? 'text-gray-900 dark:text-gray-100' 
                          : 'text-gray-700 dark:text-gray-300'
                      }`}>
                        {option.label}
                      </div>
                      <div className={`text-xs ${
                        isSelected 
                          ? 'text-gray-600 dark:text-gray-400' 
                          : 'text-gray-500 dark:text-gray-500'
                      }`}>
                        {option.description}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};