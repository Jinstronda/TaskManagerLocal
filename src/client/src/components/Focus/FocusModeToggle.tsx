import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Maximize, Minimize, Volume2, VolumeX, Shield } from 'lucide-react';
import { useTimerStore } from '../../stores/timerStore';

interface FocusModeState {
  isEnabled: boolean;
  isFullscreen: boolean;
  notificationsSuppressed: boolean;
  ambientSoundEnabled: boolean;
  websiteBlockingEnabled: boolean;
  currentAmbientSound: string | null;
}

/**
 * Focus mode toggle component that provides distraction-free environment
 * Includes fullscreen mode, notification suppression, and ambient sounds
 */
const FocusModeToggle: React.FC = () => {
  const { isRunning, currentSession } = useTimerStore();
  const [focusMode, setFocusMode] = useState<FocusModeState>({
    isEnabled: false,
    isFullscreen: false,
    notificationsSuppressed: false,
    ambientSoundEnabled: false,
    websiteBlockingEnabled: false,
    currentAmbientSound: null,
  });
  
  const [isExpanded, setIsExpanded] = useState(false);

  // Available ambient sounds
  const ambientSounds = [
    { id: 'rain', name: 'Rain', icon: '🌧️' },
    { id: 'forest', name: 'Forest', icon: '🌲' },
    { id: 'ocean', name: 'Ocean Waves', icon: '🌊' },
    { id: 'cafe', name: 'Coffee Shop', icon: '☕' },
    { id: 'white_noise', name: 'White Noise', icon: '📻' },
    { id: 'brown_noise', name: 'Brown Noise', icon: '🎵' },
  ];

  // Auto-enable focus mode when session starts
  useEffect(() => {
    if (isRunning && currentSession && !focusMode.isEnabled) {
      handleToggleFocusMode();
    }
  }, [isRunning, currentSession]);

  // Handle fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFullscreen = !!document.fullscreenElement;
      setFocusMode(prev => ({ ...prev, isFullscreen }));
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Toggle focus mode
  const handleToggleFocusMode = () => {
    const newEnabled = !focusMode.isEnabled;
    
    setFocusMode(prev => ({
      ...prev,
      isEnabled: newEnabled,
      notificationsSuppressed: newEnabled,
    }));

    // Apply focus mode styles to body
    if (newEnabled) {
      document.body.classList.add('focus-mode');
      // Request notification permission if not granted
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
      }
    } else {
      document.body.classList.remove('focus-mode');
      // Exit fullscreen if active
      if (document.fullscreenElement) {
        document.exitFullscreen();
      }
      // Stop ambient sound
      if (focusMode.currentAmbientSound) {
        stopAmbientSound();
      }
    }
  };

  // Toggle fullscreen mode
  const handleToggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.error('Failed to toggle fullscreen:', error);
    }
  };

  // Toggle notification suppression
  const handleToggleNotifications = () => {
    setFocusMode(prev => ({
      ...prev,
      notificationsSuppressed: !prev.notificationsSuppressed,
    }));
  };

  // Toggle ambient sound
  const handleToggleAmbientSound = (soundId?: string) => {
    if (focusMode.ambientSoundEnabled && focusMode.currentAmbientSound === soundId) {
      // Stop current sound
      stopAmbientSound();
    } else {
      // Start new sound
      startAmbientSound(soundId || 'rain');
    }
  };

  // Start ambient sound
  const startAmbientSound = (soundId: string) => {
    // In a real implementation, this would play actual audio files
    console.log(`Starting ambient sound: ${soundId}`);
    
    setFocusMode(prev => ({
      ...prev,
      ambientSoundEnabled: true,
      currentAmbientSound: soundId,
    }));

    // Show notification that ambient sound started
    if ('Notification' in window && Notification.permission === 'granted') {
      const sound = ambientSounds.find(s => s.id === soundId);
      new Notification('Focus Mode', {
        body: `${sound?.name} ambient sound started`,
        icon: '/favicon.ico',
        silent: true,
      });
    }
  };

  // Stop ambient sound
  const stopAmbientSound = () => {
    console.log('Stopping ambient sound');
    
    setFocusMode(prev => ({
      ...prev,
      ambientSoundEnabled: false,
      currentAmbientSound: null,
    }));
  };

  // Toggle website blocking
  const handleToggleWebsiteBlocking = () => {
    const newBlocking = !focusMode.websiteBlockingEnabled;
    
    setFocusMode(prev => ({
      ...prev,
      websiteBlockingEnabled: newBlocking,
    }));

    // In a real implementation, this would integrate with browser extensions
    // or system-level blocking tools
    if (newBlocking) {
      console.log('Website blocking enabled');
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Focus Mode', {
          body: 'Distracting websites are now blocked',
          icon: '/favicon.ico',
          silent: true,
        });
      }
    } else {
      console.log('Website blocking disabled');
    }
  };

  return (
    <div className="relative">
      {/* Main focus mode toggle */}
      <div className="flex items-center space-x-2">
        <button
          onClick={handleToggleFocusMode}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all ${
            focusMode.isEnabled
              ? 'bg-purple-600 text-white shadow-lg'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
          title={focusMode.isEnabled ? 'Exit focus mode' : 'Enter focus mode'}
        >
          {focusMode.isEnabled ? (
            <EyeOff className="w-4 h-4" />
          ) : (
            <Eye className="w-4 h-4" />
          )}
          <span>Focus Mode</span>
        </button>

        {/* Expand options button */}
        {focusMode.isEnabled && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            title="Focus mode options"
          >
            <Shield className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Focus mode options panel */}
      {focusMode.isEnabled && isExpanded && (
        <div className="absolute top-full right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-4 min-w-[300px] z-50">
          <h3 className="font-semibold text-gray-900 mb-3">Focus Mode Options</h3>
          
          <div className="space-y-3">
            {/* Fullscreen toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {focusMode.isFullscreen ? (
                  <Minimize className="w-4 h-4 text-blue-600" />
                ) : (
                  <Maximize className="w-4 h-4 text-gray-600" />
                )}
                <span className="text-sm text-gray-700">Fullscreen</span>
              </div>
              <button
                onClick={handleToggleFullscreen}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                  focusMode.isFullscreen
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {focusMode.isFullscreen ? 'Exit' : 'Enable'}
              </button>
            </div>

            {/* Notification suppression */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <VolumeX className="w-4 h-4 text-red-600" />
                <span className="text-sm text-gray-700">Block notifications</span>
              </div>
              <button
                onClick={handleToggleNotifications}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                  focusMode.notificationsSuppressed
                    ? 'bg-red-100 text-red-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {focusMode.notificationsSuppressed ? 'Blocked' : 'Allow'}
              </button>
            </div>

            {/* Website blocking */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Shield className="w-4 h-4 text-orange-600" />
                <span className="text-sm text-gray-700">Block websites</span>
              </div>
              <button
                onClick={handleToggleWebsiteBlocking}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                  focusMode.websiteBlockingEnabled
                    ? 'bg-orange-100 text-orange-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {focusMode.websiteBlockingEnabled ? 'Blocked' : 'Allow'}
              </button>
            </div>

            {/* Ambient sounds */}
            <div className="border-t pt-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Volume2 className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-gray-700">Ambient sounds</span>
                </div>
                {focusMode.ambientSoundEnabled && (
                  <button
                    onClick={() => handleToggleAmbientSound()}
                    className="text-xs text-red-600 hover:text-red-700"
                  >
                    Stop
                  </button>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                {ambientSounds.map((sound) => (
                  <button
                    key={sound.id}
                    onClick={() => handleToggleAmbientSound(sound.id)}
                    className={`flex items-center space-x-2 p-2 rounded text-xs transition-colors ${
                      focusMode.currentAmbientSound === sound.id
                        ? 'bg-green-100 text-green-700 border border-green-300'
                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <span>{sound.icon}</span>
                    <span>{sound.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Focus mode status */}
            <div className="border-t pt-3">
              <div className="text-xs text-gray-500 space-y-1">
                <div className="flex justify-between">
                  <span>Session active:</span>
                  <span className={isRunning ? 'text-green-600' : 'text-gray-400'}>
                    {isRunning ? 'Yes' : 'No'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Distractions blocked:</span>
                  <span className="text-purple-600">
                    {[
                      focusMode.notificationsSuppressed && 'Notifications',
                      focusMode.websiteBlockingEnabled && 'Websites',
                    ].filter(Boolean).join(', ') || 'None'}
                  </span>
                </div>
                {focusMode.currentAmbientSound && (
                  <div className="flex justify-between">
                    <span>Ambient sound:</span>
                    <span className="text-green-600">
                      {ambientSounds.find(s => s.id === focusMode.currentAmbientSound)?.name}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Focus mode indicator overlay */}
      {focusMode.isEnabled && (
        <div className="fixed top-4 left-4 z-40 bg-purple-600 text-white px-3 py-1 rounded-full text-sm font-medium shadow-lg">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            <span>Focus Mode Active</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default FocusModeToggle;