import React, { useState, useEffect } from 'react';
import { Bell, Settings as SettingsIcon, Palette, Timer, Heart, Keyboard, Shield, Database, BarChart3 } from 'lucide-react';
import { NotificationPreferences } from '../components/Notifications';
import { AppearanceSettings, KeyboardShortcuts, AccessibilitySettings, DataExportSettings, PerformanceSettings } from '../components/Settings';
import { useNotificationStore } from '../stores/notificationStore';
import { useTimerStore } from '../stores/timerStore';
import { useMindfulnessStore } from '../stores/mindfulnessStore';

const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'session' | 'notifications' | 'mindfulness' | 'appearance' | 'keyboard' | 'accessibility' | 'data' | 'performance'>('session');
  
  // Timer store for session preferences
  const { sessionPreferences, updateSessionPreferences } = useTimerStore();
  
  // Notification store
  const { preferences: notificationPreferences, updatePreferences: updateNotificationPreferences } = useNotificationStore();
  
  // Mindfulness store
  const { 
    mindfulnessEnabled,
    transitionAnimationsEnabled,
    breathingExerciseEnabled,
    sessionReflectionEnabled,
    updateMindfulnessSettings 
  } = useMindfulnessStore();
  
  // Local state for session preferences
  const [sessionPrefs, setSessionPrefs] = useState(sessionPreferences);
  
  // Update local session preferences when store changes
  useEffect(() => {
    setSessionPrefs(sessionPreferences);
  }, [sessionPreferences]);
  
  // Handle session preference changes
  const handleSessionPrefChange = (key: keyof typeof sessionPrefs, value: any) => {
    const updated = { ...sessionPrefs, [key]: value };
    setSessionPrefs(updated);
    updateSessionPreferences(updated);
  };

  const tabs = [
    { id: 'session' as const, label: 'Session', icon: Timer },
    { id: 'notifications' as const, label: 'Notifications', icon: Bell },
    { id: 'mindfulness' as const, label: 'Mindfulness', icon: Heart },
    { id: 'appearance' as const, label: 'Appearance', icon: Palette },
    { id: 'keyboard' as const, label: 'Shortcuts', icon: Keyboard },
    { id: 'accessibility' as const, label: 'Accessibility', icon: Shield },
    { id: 'performance' as const, label: 'Performance', icon: BarChart3 },
    { id: 'data' as const, label: 'Data', icon: Database },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Settings</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Customize your productivity experience</p>
      </div>
      
      {/* Tab navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab content */}
      <div className="mt-6">
        {activeTab === 'session' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center space-x-2">
                <Timer className="w-5 h-5 text-blue-600" />
                <span>Session Durations</span>
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Deep Work Duration (minutes)</label>
                  <input 
                    type="number" 
                    className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" 
                    value={sessionPrefs.deepWorkDuration}
                    onChange={(e) => handleSessionPrefChange('deepWorkDuration', parseInt(e.target.value))}
                    min="5"
                    max="180"
                  />
                </div>
                <div>
                  <label className="label">Quick Task Duration (minutes)</label>
                  <input 
                    type="number" 
                    className="input" 
                    value={sessionPrefs.quickTaskDuration}
                    onChange={(e) => handleSessionPrefChange('quickTaskDuration', parseInt(e.target.value))}
                    min="5"
                    max="60"
                  />
                </div>
                <div>
                  <label className="label">Break Duration (minutes)</label>
                  <input 
                    type="number" 
                    className="input" 
                    value={sessionPrefs.breakDuration}
                    onChange={(e) => handleSessionPrefChange('breakDuration', parseInt(e.target.value))}
                    min="5"
                    max="30"
                  />
                </div>
                <div>
                  <label className="label">Custom Duration (minutes)</label>
                  <input 
                    type="number" 
                    className="input" 
                    value={sessionPrefs.customDuration}
                    onChange={(e) => handleSessionPrefChange('customDuration', parseInt(e.target.value))}
                    min="5"
                    max="180"
                  />
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center space-x-2">
                <SettingsIcon className="w-5 h-5 text-green-600" />
                <span>Session Behavior</span>
              </h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Auto-start breaks</label>
                    <p className="text-xs text-gray-500">Automatically start break sessions after work sessions</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sessionPrefs.autoStartBreaks}
                      onChange={(e) => handleSessionPrefChange('autoStartBreaks', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Sound enabled</label>
                    <p className="text-xs text-gray-500">Play sounds for session transitions</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sessionPrefs.soundEnabled}
                      onChange={(e) => handleSessionPrefChange('soundEnabled', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Notifications enabled</label>
                    <p className="text-xs text-gray-500">Show session completion notifications</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sessionPrefs.notificationsEnabled}
                      onChange={(e) => handleSessionPrefChange('notificationsEnabled', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'notifications' && (
          <NotificationPreferences
            preferences={notificationPreferences}
            onUpdate={updateNotificationPreferences}
          />
        )}

        {activeTab === 'mindfulness' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center space-x-2">
                <Heart className="w-5 h-5 text-pink-600" />
                <span>Mindful Transitions</span>
              </h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Enable mindful transitions</label>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Show mindfulness exercises between sessions</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={mindfulnessEnabled}
                      onChange={(e) => updateMindfulnessSettings({ mindfulnessEnabled: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-pink-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-600"></div>
                  </label>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Transition animations</label>
                  <label className="relative inline-flex items-center cursor-pointer mt-2">
                    <input
                      type="checkbox"
                      checked={transitionAnimationsEnabled}
                      onChange={(e) => updateMindfulnessSettings({ transitionAnimationsEnabled: e.target.checked })}
                      className="sr-only peer"
                      disabled={!mindfulnessEnabled}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-pink-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-600 peer-disabled:opacity-50"></div>
                  </label>
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Mindfulness Exercises</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Breathing exercises</label>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Guided breathing between sessions</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={breathingExerciseEnabled}
                      onChange={(e) => updateMindfulnessSettings({ breathingExerciseEnabled: e.target.checked })}
                      className="sr-only peer"
                      disabled={!mindfulnessEnabled}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-pink-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-600 peer-disabled:opacity-50"></div>
                  </label>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Auto-show on session end</label>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Show mindfulness prompts after sessions</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={mindfulnessEnabled}
                      onChange={(e) => updateMindfulnessSettings({ autoShowOnSessionEnd: e.target.checked })}
                      className="sr-only peer"
                      disabled={!mindfulnessEnabled}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-pink-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-600 peer-disabled:opacity-50"></div>
                  </label>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Session reflection</label>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Reflect on completed sessions</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sessionReflectionEnabled}
                      onChange={(e) => updateMindfulnessSettings({ sessionReflectionEnabled: e.target.checked })}
                      className="sr-only peer"
                      disabled={!mindfulnessEnabled}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-pink-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-600 peer-disabled:opacity-50"></div>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'appearance' && (
          <AppearanceSettings />
        )}

        {activeTab === 'keyboard' && (
          <KeyboardShortcuts />
        )}

        {activeTab === 'accessibility' && (
          <AccessibilitySettings />
        )}

        {activeTab === 'performance' && (
          <PerformanceSettings />
        )}

        {activeTab === 'data' && (
          <DataExportSettings />
        )}
      </div>
    </div>
  );
};

export default Settings