import React, { useState, useEffect } from 'react';
import { Bell, Volume2, VolumeX, Clock, Target, Zap, Moon, AlertTriangle } from 'lucide-react';
import { NotificationPreferences } from '../../../../shared/types';

interface NotificationPreferencesProps {
  preferences: NotificationPreferences;
  onUpdate: (preferences: NotificationPreferences) => void;
}

/**
 * Comprehensive notification preferences UI component with granular controls
 * Allows users to customize all aspects of the notification system
 */
const NotificationPreferencesComponent: React.FC<NotificationPreferencesProps> = ({
  preferences,
  onUpdate,
}) => {
  const [localPreferences, setLocalPreferences] = useState<NotificationPreferences>(preferences);

  // Update local state when props change
  useEffect(() => {
    setLocalPreferences(preferences);
  }, [preferences]);

  // Handle preference updates with immediate save
  const updatePreference = (path: string, value: any) => {
    const keys = path.split('.');
    const updated = { ...localPreferences };
    
    let current: any = updated;
    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;
    
    setLocalPreferences(updated);
    onUpdate(updated);
  };

  // Toggle section enabled state
  const toggleSection = (section: keyof NotificationPreferences) => {
    if (typeof localPreferences[section] === 'object' && 'enabled' in localPreferences[section]) {
      updatePreference(`${section}.enabled`, !localPreferences[section].enabled);
    }
  };

  return (
    <div className="space-y-6">
      {/* Master notification toggle */}
      <div className="card p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Bell className="w-5 h-5 text-blue-600" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
              <p className="text-sm text-gray-600">Enable or disable all notifications</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={localPreferences.enabled}
              onChange={(e) => updatePreference('enabled', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>
      </div>

      {/* Session completion notifications */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Zap className="w-5 h-5 text-green-600" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Session Completion</h3>
              <p className="text-sm text-gray-600">Notifications when focus sessions end</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={localPreferences.sessionComplete.enabled}
              onChange={() => toggleSection('sessionComplete')}
              className="sr-only peer"
              disabled={!localPreferences.enabled}
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600 disabled:opacity-50"></div>
          </label>
        </div>
        
        {localPreferences.sessionComplete.enabled && localPreferences.enabled && (
          <div className="space-y-4 pl-8 border-l-2 border-green-100">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Play sound</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={localPreferences.sessionComplete.sound}
                  onChange={(e) => updatePreference('sessionComplete.sound', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-600"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Show task information</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={localPreferences.sessionComplete.showTaskInfo}
                  onChange={(e) => updatePreference('sessionComplete.showTaskInfo', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-600"></div>
              </label>
            </div>
            
            <div>
              <label className="block text-sm text-gray-700 mb-2">Display duration (seconds)</label>
              <input
                type="range"
                min="3"
                max="30"
                value={localPreferences.sessionComplete.duration}
                onChange={(e) => updatePreference('sessionComplete.duration', parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>3s</span>
                <span>{localPreferences.sessionComplete.duration}s</span>
                <span>30s</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Break reminder notifications */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Clock className="w-5 h-5 text-orange-600" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Break Reminders</h3>
              <p className="text-sm text-gray-600">Smart suggestions for taking breaks</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={localPreferences.breakReminders.enabled}
              onChange={() => toggleSection('breakReminders')}
              className="sr-only peer"
              disabled={!localPreferences.enabled}
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600 disabled:opacity-50"></div>
          </label>
        </div>
        
        {localPreferences.breakReminders.enabled && localPreferences.enabled && (
          <div className="space-y-4 pl-8 border-l-2 border-orange-100">
            <div>
              <label className="block text-sm text-gray-700 mb-2">Break reminder frequency</label>
              <select
                value={localPreferences.breakReminders.frequency}
                onChange={(e) => updatePreference('breakReminders.frequency', e.target.value)}
                className="input"
              >
                <option value="after_each">After each session</option>
                <option value="after_2">After 2 sessions</option>
                <option value="after_3">After 3 sessions</option>
                <option value="smart">Smart (based on patterns)</option>
              </select>
            </div>
            
            {localPreferences.breakReminders.frequency === 'smart' && (
              <div>
                <label className="block text-sm text-gray-700 mb-2">
                  Smart threshold (minutes of continuous work)
                </label>
                <input
                  type="number"
                  min="30"
                  max="180"
                  value={localPreferences.breakReminders.smartThreshold}
                  onChange={(e) => updatePreference('breakReminders.smartThreshold', parseInt(e.target.value))}
                  className="input"
                />
              </div>
            )}
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Play sound</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={localPreferences.breakReminders.sound}
                  onChange={(e) => updatePreference('breakReminders.sound', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-orange-600"></div>
              </label>
            </div>
          </div>
        )}
      </div>      {
/* Daily review notifications */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Moon className="w-5 h-5 text-purple-600" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Daily Review</h3>
              <p className="text-sm text-gray-600">End-of-day reflection prompts</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={localPreferences.dailyReview.enabled}
              onChange={() => toggleSection('dailyReview')}
              className="sr-only peer"
              disabled={!localPreferences.enabled}
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600 disabled:opacity-50"></div>
          </label>
        </div>
        
        {localPreferences.dailyReview.enabled && localPreferences.enabled && (
          <div className="space-y-4 pl-8 border-l-2 border-purple-100">
            <div>
              <label className="block text-sm text-gray-700 mb-2">Review time</label>
              <input
                type="time"
                value={localPreferences.dailyReview.time}
                onChange={(e) => updatePreference('dailyReview.time', e.target.value)}
                className="input"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Include weekends</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={localPreferences.dailyReview.weekendsIncluded}
                  onChange={(e) => updatePreference('dailyReview.weekendsIncluded', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Play sound</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={localPreferences.dailyReview.sound}
                  onChange={(e) => updatePreference('dailyReview.sound', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Weekly review notifications */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Target className="w-5 h-5 text-indigo-600" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Weekly Review</h3>
              <p className="text-sm text-gray-600">Weekly progress and planning prompts</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={localPreferences.weeklyReview.enabled}
              onChange={() => toggleSection('weeklyReview')}
              className="sr-only peer"
              disabled={!localPreferences.enabled}
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600 disabled:opacity-50"></div>
          </label>
        </div>
        
        {localPreferences.weeklyReview.enabled && localPreferences.enabled && (
          <div className="space-y-4 pl-8 border-l-2 border-indigo-100">
            <div>
              <label className="block text-sm text-gray-700 mb-2">Day of week</label>
              <select
                value={localPreferences.weeklyReview.dayOfWeek}
                onChange={(e) => updatePreference('weeklyReview.dayOfWeek', parseInt(e.target.value))}
                className="input"
              >
                <option value={0}>Sunday</option>
                <option value={1}>Monday</option>
                <option value={2}>Tuesday</option>
                <option value={3}>Wednesday</option>
                <option value={4}>Thursday</option>
                <option value={5}>Friday</option>
                <option value={6}>Saturday</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm text-gray-700 mb-2">Review time</label>
              <input
                type="time"
                value={localPreferences.weeklyReview.time}
                onChange={(e) => updatePreference('weeklyReview.time', e.target.value)}
                className="input"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Play sound</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={localPreferences.weeklyReview.sound}
                  onChange={(e) => updatePreference('weeklyReview.sound', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Goal achievement notifications */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Target className="w-5 h-5 text-emerald-600" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Goal Achievements</h3>
              <p className="text-sm text-gray-600">Celebrate when you reach your goals</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={localPreferences.goalAchievements.enabled}
              onChange={() => toggleSection('goalAchievements')}
              className="sr-only peer"
              disabled={!localPreferences.enabled}
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600 disabled:opacity-50"></div>
          </label>
        </div>
        
        {localPreferences.goalAchievements.enabled && localPreferences.enabled && (
          <div className="space-y-4 pl-8 border-l-2 border-emerald-100">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Play sound</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={localPreferences.goalAchievements.sound}
                  onChange={(e) => updatePreference('goalAchievements.sound', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Show progress details</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={localPreferences.goalAchievements.showProgress}
                  onChange={(e) => updatePreference('goalAchievements.showProgress', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Streak milestone notifications */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Zap className="w-5 h-5 text-yellow-600" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Streak Milestones</h3>
              <p className="text-sm text-gray-600">Celebrate consistency achievements</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={localPreferences.streakMilestones.enabled}
              onChange={() => toggleSection('streakMilestones')}
              className="sr-only peer"
              disabled={!localPreferences.enabled}
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-yellow-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-600 disabled:opacity-50"></div>
          </label>
        </div>
        
        {localPreferences.streakMilestones.enabled && localPreferences.enabled && (
          <div className="space-y-4 pl-8 border-l-2 border-yellow-100">
            <div>
              <label className="block text-sm text-gray-700 mb-2">Milestone days (comma-separated)</label>
              <input
                type="text"
                value={localPreferences.streakMilestones.milestones.join(', ')}
                onChange={(e) => {
                  const milestones = e.target.value
                    .split(',')
                    .map(s => parseInt(s.trim()))
                    .filter(n => !isNaN(n) && n > 0)
                    .sort((a, b) => a - b);
                  updatePreference('streakMilestones.milestones', milestones);
                }}
                placeholder="7, 14, 30, 60, 100"
                className="input"
              />
              <p className="text-xs text-gray-500 mt-1">
                Current: {localPreferences.streakMilestones.milestones.join(', ')} days
              </p>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Play sound</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={localPreferences.streakMilestones.sound}
                  onChange={(e) => updatePreference('streakMilestones.sound', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-yellow-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-yellow-600"></div>
              </label>
            </div>
          </div>
        )}
      </div>

      {/* System notifications */}
      <div className="card p-6">
        <div className="mb-4">
          <div className="flex items-center space-x-3 mb-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <h3 className="text-lg font-semibold text-gray-900">System Notifications</h3>
          </div>
          <p className="text-sm text-gray-600">Idle detection and system sleep alerts</p>
        </div>
        
        <div className="space-y-4">
          {/* Idle detection */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="font-medium text-gray-900">Idle Detection</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={localPreferences.idleDetection.enabled}
                  onChange={() => toggleSection('idleDetection')}
                  className="sr-only peer"
                  disabled={!localPreferences.enabled}
                />
                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-red-600 disabled:opacity-50"></div>
              </label>
            </div>
            
            {localPreferences.idleDetection.enabled && localPreferences.enabled && (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Idle threshold (minutes)</label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={localPreferences.idleDetection.threshold}
                    onChange={(e) => updatePreference('idleDetection.threshold', parseInt(e.target.value))}
                    className="input"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Play sound</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={localPreferences.idleDetection.sound}
                      onChange={(e) => updatePreference('idleDetection.sound', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-red-600"></div>
                  </label>
                </div>
              </div>
            )}
          </div>
          
          {/* System sleep detection */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="font-medium text-gray-900">System Sleep Detection</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={localPreferences.systemSleep.enabled}
                  onChange={() => toggleSection('systemSleep')}
                  className="sr-only peer"
                  disabled={!localPreferences.enabled}
                />
                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-red-600 disabled:opacity-50"></div>
              </label>
            </div>
            
            {localPreferences.systemSleep.enabled && localPreferences.enabled && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Play sound</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={localPreferences.systemSleep.sound}
                    onChange={(e) => updatePreference('systemSleep.sound', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-red-600"></div>
                </label>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Focus mode notification settings */}
      <div className="card p-6">
        <div className="mb-4">
          <div className="flex items-center space-x-3 mb-2">
            <Volume2 className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Focus Mode</h3>
          </div>
          <p className="text-sm text-gray-600">Control notifications during focus sessions</p>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-700">Suppress other notifications</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={localPreferences.focusMode.suppressOtherNotifications}
                onChange={(e) => updatePreference('focusMode.suppressOtherNotifications', e.target.checked)}
                className="sr-only peer"
                disabled={!localPreferences.enabled}
              />
              <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600 disabled:opacity-50"></div>
            </label>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-700">Allow break reminders</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={localPreferences.focusMode.allowBreakReminders}
                onChange={(e) => updatePreference('focusMode.allowBreakReminders', e.target.checked)}
                className="sr-only peer"
                disabled={!localPreferences.enabled}
              />
              <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600 disabled:opacity-50"></div>
            </label>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-700">Allow urgent notifications only</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={localPreferences.focusMode.allowUrgentOnly}
                onChange={(e) => updatePreference('focusMode.allowUrgentOnly', e.target.checked)}
                className="sr-only peer"
                disabled={!localPreferences.enabled}
              />
              <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600 disabled:opacity-50"></div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationPreferencesComponent;