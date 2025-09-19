import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, RotateCcw, Settings } from 'lucide-react';

interface AmbientSound {
  id: string;
  name: string;
  icon: string;
  description: string;
  category: 'nature' | 'urban' | 'noise' | 'instrumental';
  color: string;
  // In a real implementation, these would be actual audio file URLs
  audioUrl?: string;
}

interface AmbientSoundPlayerProps {
  isEnabled: boolean;
  onToggle: (enabled: boolean) => void;
  currentSound: string | null;
  onSoundChange: (soundId: string | null) => void;
}

/**
 * Ambient sound player component for focus enhancement
 * Provides various background sounds to improve concentration
 */
const AmbientSoundPlayer: React.FC<AmbientSoundPlayerProps> = ({
  isEnabled,
  onToggle,
  currentSound,
  onSoundChange,
}) => {
  const [volume, setVolume] = useState(0.5);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Available ambient sounds
  const ambientSounds: AmbientSound[] = [
    {
      id: 'rain',
      name: 'Gentle Rain',
      icon: '🌧️',
      description: 'Soft rainfall with distant thunder',
      category: 'nature',
      color: 'bg-blue-500',
    },
    {
      id: 'forest',
      name: 'Forest Ambience',
      icon: '🌲',
      description: 'Birds chirping in a peaceful forest',
      category: 'nature',
      color: 'bg-green-500',
    },
    {
      id: 'ocean',
      name: 'Ocean Waves',
      icon: '🌊',
      description: 'Rhythmic waves on a sandy beach',
      category: 'nature',
      color: 'bg-cyan-500',
    },
    {
      id: 'cafe',
      name: 'Coffee Shop',
      icon: '☕',
      description: 'Bustling cafe with gentle chatter',
      category: 'urban',
      color: 'bg-amber-500',
    },
    {
      id: 'fireplace',
      name: 'Fireplace',
      icon: '🔥',
      description: 'Crackling fire with warm ambience',
      category: 'nature',
      color: 'bg-orange-500',
    },
    {
      id: 'white_noise',
      name: 'White Noise',
      icon: '📻',
      description: 'Consistent white noise for focus',
      category: 'noise',
      color: 'bg-gray-500',
    },
    {
      id: 'brown_noise',
      name: 'Brown Noise',
      icon: '🎵',
      description: 'Deep, rich brown noise',
      category: 'noise',
      color: 'bg-amber-700',
    },
    {
      id: 'piano',
      name: 'Ambient Piano',
      icon: '🎹',
      description: 'Soft instrumental piano melodies',
      category: 'instrumental',
      color: 'bg-purple-500',
    },
  ];

  // Group sounds by category
  const soundsByCategory = ambientSounds.reduce((acc, sound) => {
    if (!acc[sound.category]) {
      acc[sound.category] = [];
    }
    acc[sound.category].push(sound);
    return acc;
  }, {} as Record<string, AmbientSound[]>);

  // Handle sound selection
  const handleSoundSelect = (soundId: string) => {
    if (currentSound === soundId) {
      // Stop current sound
      onSoundChange(null);
      setIsPlaying(false);
    } else {
      // Start new sound
      onSoundChange(soundId);
      setIsPlaying(true);
      if (!isEnabled) {
        onToggle(true);
      }
    }
  };

  // Handle play/pause
  const handlePlayPause = () => {
    if (!currentSound) return;
    
    const newPlaying = !isPlaying;
    setIsPlaying(newPlaying);
    
    if (!newPlaying) {
      // Pause
      if (audioRef.current) {
        audioRef.current.pause();
      }
    } else {
      // Play
      if (audioRef.current) {
        audioRef.current.play();
      }
    }
  };

  // Handle volume change
  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  // Get current sound info
  const getCurrentSound = () => {
    return ambientSounds.find(sound => sound.id === currentSound);
  };

  // Format category name
  const formatCategoryName = (category: string) => {
    return category.charAt(0).toUpperCase() + category.slice(1);
  };

  // Effect to handle audio element
  useEffect(() => {
    if (currentSound && isPlaying) {
      // In a real implementation, this would load and play actual audio files
      console.log(`Playing ambient sound: ${currentSound} at volume ${volume}`);
      
      // Mock audio element behavior
      if (audioRef.current) {
        audioRef.current.volume = volume;
        audioRef.current.loop = true;
      }
    }
  }, [currentSound, isPlaying, volume]);

  const currentSoundInfo = getCurrentSound();

  return (
    <div className="space-y-4">
      {/* Header with current sound info */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Volume2 className="w-5 h-5 text-green-600" />
          <div>
            <h3 className="font-medium text-gray-900">Ambient Sounds</h3>
            {currentSoundInfo ? (
              <p className="text-sm text-gray-600">
                Playing: {currentSoundInfo.name}
              </p>
            ) : (
              <p className="text-sm text-gray-600">No sound selected</p>
            )}
          </div>
        </div>
        
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          title="Sound settings"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>

      {/* Current sound controls */}
      {currentSoundInfo && (
        <div className={`p-4 rounded-lg ${currentSoundInfo.color} bg-opacity-10 border border-opacity-20`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className="text-2xl">{currentSoundInfo.icon}</div>
              <div>
                <h4 className="font-medium text-gray-900">{currentSoundInfo.name}</h4>
                <p className="text-sm text-gray-600">{currentSoundInfo.description}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={handlePlayPause}
                className="p-2 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full transition-all shadow-sm"
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? (
                  <Pause className="w-4 h-4 text-gray-700" />
                ) : (
                  <Play className="w-4 h-4 text-gray-700" />
                )}
              </button>
              
              <button
                onClick={() => handleSoundSelect(currentSoundInfo.id)}
                className="p-2 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full transition-all shadow-sm"
                title="Stop sound"
              >
                <VolumeX className="w-4 h-4 text-gray-700" />
              </button>
            </div>
          </div>
          
          {/* Volume control */}
          <div className="flex items-center space-x-3">
            <VolumeX className="w-4 h-4 text-gray-600" />
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={volume}
              onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
              className="flex-1 h-2 bg-white bg-opacity-50 rounded-lg appearance-none cursor-pointer slider"
            />
            <Volume2 className="w-4 h-4 text-gray-600" />
            <span className="text-sm text-gray-600 min-w-[3rem]">
              {Math.round(volume * 100)}%
            </span>
          </div>
        </div>
      )}

      {/* Sound selection grid */}
      <div className="space-y-4">
        {Object.entries(soundsByCategory).map(([category, sounds]) => (
          <div key={category}>
            <h4 className="font-medium text-gray-900 mb-2 flex items-center space-x-2">
              <span>{formatCategoryName(category)}</span>
              <span className="text-xs text-gray-500">({sounds.length})</span>
            </h4>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {sounds.map((sound) => (
                <button
                  key={sound.id}
                  onClick={() => handleSoundSelect(sound.id)}
                  className={`p-3 rounded-lg border-2 transition-all text-left ${
                    currentSound === sound.id
                      ? `${sound.color} bg-opacity-20 border-opacity-50 border-current`
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-lg">{sound.icon}</span>
                    <span className="font-medium text-sm text-gray-900 truncate">
                      {sound.name}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 line-clamp-2">
                    {sound.description}
                  </p>
                  
                  {currentSound === sound.id && (
                    <div className="mt-2 flex items-center space-x-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      <span className="text-xs text-green-600 font-medium">
                        {isPlaying ? 'Playing' : 'Paused'}
                      </span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Settings panel */}
      {showSettings && (
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
          <h4 className="font-medium text-gray-900 mb-3">Sound Settings</h4>
          
          <div className="space-y-3">
            <div>
              <label className="block text-sm text-gray-700 mb-1">Master Volume</label>
              <div className="flex items-center space-x-3">
                <VolumeX className="w-4 h-4 text-gray-500" />
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={volume}
                  onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                  className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                />
                <Volume2 className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600 min-w-[3rem]">
                  {Math.round(volume * 100)}%
                </span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">Auto-start with focus mode</label>
                <p className="text-xs text-gray-500">Automatically play last sound when entering focus mode</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-600"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">Fade in/out</label>
                <p className="text-xs text-gray-500">Gradually adjust volume when starting/stopping</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  defaultChecked
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-600"></div>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Hidden audio element for actual playback */}
      <audio
        ref={audioRef}
        loop
        preload="none"
        style={{ display: 'none' }}
      />

      {/* Help text */}
      <div className="text-xs text-gray-500 bg-blue-50 p-3 rounded-lg">
        <p>
          <strong>Tip:</strong> Ambient sounds can help mask distracting noises and improve focus. 
          Choose sounds that are calming and non-intrusive to your work style.
        </p>
      </div>
    </div>
  );
};

export default AmbientSoundPlayer;