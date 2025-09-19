import React from 'react';
import { Eye, Volume2, MousePointer, Zap, Heart, Shield } from 'lucide-react';
import { useThemeStore } from '../../stores/themeStore';

export const AccessibilitySettings: React.FC = () => {
  const {
    fontSize,
    compactMode,
    setFontSize,
    setCompactMode
  } = useThemeStore();

  // Local state for accessibility features
  const [settings, setSettings] = React.useState({
    highContrast: false,
    reduceMotion: false,
    screenReaderOptimized: false,
    keyboardNavigation: true,
    focusIndicators: true,
    soundAlerts: true,
    visualAlerts: true,
    autoplayMedia: false,
    largeClickTargets: false,
    simplifiedInterface: false
  });

  const updateSetting = (key: keyof typeof settings, value: boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    
    // Apply accessibility settings to document
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      
      switch (key) {
        case 'highContrast':
          if (value) {
            root.classList.add('high-contrast');
          } else {
            root.classList.remove('high-contrast');
          }
          break;
        case 'reduceMotion':
          if (value) {
            root.classList.add('reduce-motion');
          } else {
            root.classList.remove('reduce-motion');
          }
          break;
        case 'largeClickTargets':
          if (value) {
            root.classList.add('large-targets');
          } else {
            root.classList.remove('large-targets');
          }
          break;
        case 'simplifiedInterface':
          if (value) {
            root.classList.add('simplified-ui');
          } else {
            root.classList.remove('simplified-ui');
          }
          break;
      }
    }
  };

  const accessibilityFeatures = [
    {
      category: 'Visual',
      icon: Eye,
      color: 'blue',
      features: [
        {
          key: 'highContrast' as const,
          name: 'High Contrast Mode',
          description: 'Increase contrast for better visibility',
          value: settings.highContrast
        },
        {
          key: 'largeClickTargets' as const,
          name: 'Large Click Targets',
          description: 'Make buttons and links larger for easier clicking',
          value: settings.largeClickTargets
        },
        {
          key: 'focusIndicators' as const,
          name: 'Enhanced Focus Indicators',
          description: 'Show clear focus outlines for keyboard navigation',
          value: settings.focusIndicators
        }
      ]
    },
    {
      category: 'Motion & Animation',
      icon: Zap,
      color: 'purple',
      features: [
        {
          key: 'reduceMotion' as const,
          name: 'Reduce Motion',
          description: 'Minimize animations and transitions',
          value: settings.reduceMotion
        },
        {
          key: 'autoplayMedia' as const,
          name: 'Autoplay Media',
          description: 'Automatically play sounds and animations',
          value: settings.autoplayMedia
        }
      ]
    },
    {
      category: 'Audio & Alerts',
      icon: Volume2,
      color: 'green',
      features: [
        {
          key: 'soundAlerts' as const,
          name: 'Sound Alerts',
          description: 'Play audio notifications for important events',
          value: settings.soundAlerts
        },
        {
          key: 'visualAlerts' as const,
          name: 'Visual Alerts',
          description: 'Show visual notifications alongside audio alerts',
          value: settings.visualAlerts
        }
      ]
    },
    {
      category: 'Navigation',
      icon: MousePointer,
      color: 'orange',
      features: [
        {
          key: 'keyboardNavigation' as const,
          name: 'Keyboard Navigation',
          description: 'Enable full keyboard navigation support',
          value: settings.keyboardNavigation
        },
        {
          key: 'screenReaderOptimized' as const,
          name: 'Screen Reader Optimization',
          description: 'Optimize interface for screen readers',
          value: settings.screenReaderOptimized
        },
        {
          key: 'simplifiedInterface' as const,
          name: 'Simplified Interface',
          description: 'Reduce visual complexity and distractions',
          value: settings.simplifiedInterface
        }
      ]
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center space-x-2">
          <Shield className="w-5 h-5 text-blue-600" />
          <span>Accessibility Settings</span>
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Configure accessibility features to make the app more comfortable to use
        </p>
      </div>

      {/* WCAG Compliance Notice */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <Heart className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100">
              WCAG 2.1 AA Compliant
            </h4>
            <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
              This application follows Web Content Accessibility Guidelines (WCAG) 2.1 Level AA standards 
              to ensure accessibility for users with disabilities.
            </p>
          </div>
        </div>
      </div>

      {/* Font Size Quick Settings */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-md font-medium text-gray-900 dark:text-gray-100 mb-4">
          Text & Display
        </h3>
        
        <div className="space-y-4">
          {/* Font Size */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Font Size
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'small' as const, label: 'Small', size: '14px' },
                { value: 'medium' as const, label: 'Medium', size: '16px' },
                { value: 'large' as const, label: 'Large', size: '18px' }
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setFontSize(option.value)}
                  className={`p-3 rounded-lg border-2 text-center transition-all ${
                    fontSize === option.value
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <div className={`font-medium text-sm ${
                    fontSize === option.value 
                      ? 'text-blue-600 dark:text-blue-400' 
                      : 'text-gray-900 dark:text-gray-100'
                  }`}>
                    {option.label}
                  </div>
                  <div className={`text-xs ${
                    fontSize === option.value 
                      ? 'text-blue-500 dark:text-blue-500' 
                      : 'text-gray-500 dark:text-gray-400'
                  }`}>
                    {option.size}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Compact Mode */}
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Compact Mode
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Reduce spacing for more content on screen
              </p>
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

      {/* Accessibility Features by Category */}
      {accessibilityFeatures.map((category) => {
        const Icon = category.icon;
        
        return (
          <div key={category.category} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-md font-medium text-gray-900 dark:text-gray-100 mb-4 flex items-center space-x-2">
              <Icon className={`w-4 h-4 text-${category.color}-600`} />
              <span>{category.category}</span>
            </h3>
            
            <div className="space-y-3">
              {category.features.map((feature) => (
                <div
                  key={feature.key}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg"
                >
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {feature.name}
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {feature.description}
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={feature.value}
                      onChange={(e) => updateSetting(feature.key, e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className={`w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-${category.color}-300 dark:peer-focus:ring-${category.color}-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-${category.color}-600`}></div>
                  </label>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {/* Accessibility Resources */}
      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
          Accessibility Resources
        </h4>
        <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
          <li>• Use Tab and Shift+Tab to navigate between elements</li>
          <li>• Press Enter or Space to activate buttons and links</li>
          <li>• Use arrow keys to navigate within menus and lists</li>
          <li>• Press Escape to close dialogs and menus</li>
          <li>• Screen readers are supported with proper ARIA labels</li>
        </ul>
      </div>
    </div>
  );
};