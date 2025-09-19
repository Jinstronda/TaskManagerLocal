import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX, Settings } from 'lucide-react';

interface BreathingPattern {
  id: string;
  name: string;
  description: string;
  inhale: number; // seconds
  hold: number; // seconds
  exhale: number; // seconds
  pause: number; // seconds
  cycles: number;
  color: string;
}

interface BreathingExerciseProps {
  isVisible: boolean;
  onClose: () => void;
  onComplete: (duration: number) => void;
  autoStart?: boolean;
}

/**
 * Breathing exercise component with visual guidance and timer
 * Provides various breathing patterns for relaxation and focus
 */
const BreathingExercise: React.FC<BreathingExerciseProps> = ({
  isVisible,
  onClose,
  onComplete,
  autoStart = false,
}) => {
  const [selectedPattern, setSelectedPattern] = useState<BreathingPattern | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [currentPhase, setCurrentPhase] = useState<'inhale' | 'hold' | 'exhale' | 'pause'>('inhale');
  const [phaseTime, setPhaseTime] = useState(0);
  const [currentCycle, setCurrentCycle] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);

  // Available breathing patterns
  const breathingPatterns: BreathingPattern[] = [
    {
      id: 'box_breathing',
      name: 'Box Breathing',
      description: 'Equal timing for calm focus (4-4-4-4)',
      inhale: 4,
      hold: 4,
      exhale: 4,
      pause: 4,
      cycles: 4,
      color: 'from-blue-400 to-blue-600',
    },
    {
      id: '478_breathing',
      name: '4-7-8 Breathing',
      description: 'Relaxing pattern for stress relief',
      inhale: 4,
      hold: 7,
      exhale: 8,
      pause: 0,
      cycles: 4,
      color: 'from-green-400 to-green-600',
    },
    {
      id: 'coherent_breathing',
      name: 'Coherent Breathing',
      description: 'Balanced breathing for heart coherence (5-5)',
      inhale: 5,
      hold: 0,
      exhale: 5,
      pause: 0,
      cycles: 6,
      color: 'from-purple-400 to-purple-600',
    },
    {
      id: 'energizing_breath',
      name: 'Energizing Breath',
      description: 'Quick inhale, slow exhale for energy (3-1-6-1)',
      inhale: 3,
      hold: 1,
      exhale: 6,
      pause: 1,
      cycles: 5,
      color: 'from-orange-400 to-orange-600',
    },
    {
      id: 'calming_breath',
      name: 'Calming Breath',
      description: 'Extended exhale for relaxation (4-2-8-2)',
      inhale: 4,
      hold: 2,
      exhale: 8,
      pause: 2,
      cycles: 4,
      color: 'from-indigo-400 to-indigo-600',
    },
  ];

  // Auto-start with default pattern
  useEffect(() => {
    if (autoStart && !selectedPattern) {
      const defaultPattern = breathingPatterns[0]; // Box breathing
      setSelectedPattern(defaultPattern);
      setIsActive(true);
    }
  }, [autoStart, selectedPattern]);

  // Main breathing timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isActive && selectedPattern) {
      interval = setInterval(() => {
        setPhaseTime(prev => prev + 1);
        setTotalTime(prev => prev + 1);
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, selectedPattern]);

  // Phase progression logic
  useEffect(() => {
    if (!isActive || !selectedPattern) return;

    const { inhale, hold, exhale, pause } = selectedPattern;
    
    switch (currentPhase) {
      case 'inhale':
        if (phaseTime >= inhale) {
          if (hold > 0) {
            setCurrentPhase('hold');
          } else {
            setCurrentPhase('exhale');
          }
          setPhaseTime(0);
          playPhaseSound('transition');
        }
        break;
        
      case 'hold':
        if (phaseTime >= hold) {
          setCurrentPhase('exhale');
          setPhaseTime(0);
          playPhaseSound('transition');
        }
        break;
        
      case 'exhale':
        if (phaseTime >= exhale) {
          if (pause > 0) {
            setCurrentPhase('pause');
          } else {
            // Complete cycle
            completeCycle();
          }
          setPhaseTime(0);
          playPhaseSound('transition');
        }
        break;
        
      case 'pause':
        if (phaseTime >= pause) {
          completeCycle();
          setPhaseTime(0);
        }
        break;
    }
  }, [phaseTime, currentPhase, selectedPattern, isActive]);

  // Complete a breathing cycle
  const completeCycle = () => {
    if (!selectedPattern) return;
    
    const nextCycle = currentCycle + 1;
    
    if (nextCycle >= selectedPattern.cycles) {
      // Exercise complete
      setIsActive(false);
      playPhaseSound('complete');
      onComplete(totalTime);
    } else {
      // Next cycle
      setCurrentCycle(nextCycle);
      setCurrentPhase('inhale');
      playPhaseSound('cycle');
    }
  };

  // Play phase transition sounds
  const playPhaseSound = (type: 'transition' | 'cycle' | 'complete') => {
    if (!soundEnabled || !audioContextRef.current) return;

    try {
      const ctx = audioContextRef.current;
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      // Different frequencies for different sounds
      switch (type) {
        case 'transition':
          oscillator.frequency.setValueAtTime(440, ctx.currentTime); // A4
          break;
        case 'cycle':
          oscillator.frequency.setValueAtTime(523, ctx.currentTime); // C5
          break;
        case 'complete':
          oscillator.frequency.setValueAtTime(659, ctx.currentTime); // E5
          break;
      }
      
      oscillator.type = 'sine';
      gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.3);
    } catch (error) {
      console.warn('Could not play breathing sound:', error);
    }
  };

  // Initialize audio context
  useEffect(() => {
    if (soundEnabled && !audioContextRef.current) {
      try {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      } catch (error) {
        console.warn('Could not create audio context:', error);
      }
    }
  }, [soundEnabled]);

  // Start exercise
  const startExercise = (pattern: BreathingPattern) => {
    setSelectedPattern(pattern);
    setIsActive(true);
    setCurrentPhase('inhale');
    setPhaseTime(0);
    setCurrentCycle(0);
    setTotalTime(0);
  };

  // Toggle exercise
  const toggleExercise = () => {
    setIsActive(!isActive);
  };

  // Reset exercise
  const resetExercise = () => {
    setIsActive(false);
    setCurrentPhase('inhale');
    setPhaseTime(0);
    setCurrentCycle(0);
    setTotalTime(0);
  };

  // Get current phase duration
  const getCurrentPhaseDuration = () => {
    if (!selectedPattern) return 0;
    
    switch (currentPhase) {
      case 'inhale': return selectedPattern.inhale;
      case 'hold': return selectedPattern.hold;
      case 'exhale': return selectedPattern.exhale;
      case 'pause': return selectedPattern.pause;
      default: return 0;
    }
  };

  // Get phase progress (0-1)
  const getPhaseProgress = () => {
    const duration = getCurrentPhaseDuration();
    return duration > 0 ? Math.min(phaseTime / duration, 1) : 0;
  };

  // Get breathing circle scale
  const getCircleScale = () => {
    const progress = getPhaseProgress();
    
    switch (currentPhase) {
      case 'inhale':
        return 0.5 + (progress * 0.5); // Scale from 0.5 to 1.0
      case 'hold':
        return 1.0; // Stay at full size
      case 'exhale':
        return 1.0 - (progress * 0.5); // Scale from 1.0 to 0.5
      case 'pause':
        return 0.5; // Stay at small size
      default:
        return 0.5;
    }
  };

  // Format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Get phase instruction
  const getPhaseInstruction = () => {
    switch (currentPhase) {
      case 'inhale': return 'Breathe In';
      case 'hold': return 'Hold';
      case 'exhale': return 'Breathe Out';
      case 'pause': return 'Pause';
      default: return '';
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden">
        {!selectedPattern ? (
          // Pattern selection screen
          <>
            <div className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold">Breathing Exercise</h2>
                  <p className="text-cyan-100 text-sm mt-1">
                    Choose a breathing pattern to begin
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="text-white hover:text-gray-200 transition-colors"
                >
                  <RotateCcw className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="space-y-3">
                {breathingPatterns.map((pattern) => (
                  <button
                    key={pattern.id}
                    onClick={() => startExercise(pattern)}
                    className="w-full p-4 rounded-lg border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all text-left"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900 mb-1">
                          {pattern.name}
                        </h3>
                        <p className="text-sm text-gray-600 mb-2">
                          {pattern.description}
                        </p>
                        <div className="text-xs text-gray-500">
                          {pattern.cycles} cycles • {pattern.inhale}-{pattern.hold}-{pattern.exhale}-{pattern.pause}
                        </div>
                      </div>
                      <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${pattern.color} opacity-80`} />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </>
        ) : (
          // Exercise screen
          <>
            <div className={`bg-gradient-to-r ${selectedPattern.color} text-white p-6`}>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold">{selectedPattern.name}</h2>
                  <p className="text-white text-opacity-80 text-sm">
                    Cycle {currentCycle + 1} of {selectedPattern.cycles} • {formatTime(totalTime)}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setShowSettings(!showSettings)}
                    className="p-2 text-white hover:text-gray-200 transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setSelectedPattern(null)}
                    className="text-white hover:text-gray-200 transition-colors"
                  >
                    <RotateCcw className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Settings panel */}
            {showSettings && (
              <div className="p-4 bg-gray-50 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Sound guidance</span>
                  <button
                    onClick={() => setSoundEnabled(!soundEnabled)}
                    className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-800"
                  >
                    {soundEnabled ? (
                      <Volume2 className="w-4 h-4" />
                    ) : (
                      <VolumeX className="w-4 h-4" />
                    )}
                    <span>{soundEnabled ? 'On' : 'Off'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Breathing visualization */}
            <div className="p-8 flex flex-col items-center justify-center min-h-[400px]">
              {/* Breathing circle */}
              <div className="relative mb-8">
                <div
                  className={`w-48 h-48 rounded-full bg-gradient-to-br ${selectedPattern.color} opacity-20 transition-transform duration-1000 ease-in-out`}
                  style={{ transform: `scale(${getCircleScale()})` }}
                />
                <div
                  className={`absolute inset-0 w-48 h-48 rounded-full border-4 border-gradient-to-br ${selectedPattern.color.replace('from-', 'border-').replace('to-', '')} transition-transform duration-1000 ease-in-out`}
                  style={{ transform: `scale(${getCircleScale()})` }}
                />
                
                {/* Center content */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="text-2xl font-bold text-gray-800 mb-2">
                    {getPhaseInstruction()}
                  </div>
                  <div className="text-lg text-gray-600">
                    {getCurrentPhaseDuration() - phaseTime}
                  </div>
                </div>
              </div>

              {/* Phase progress */}
              <div className="w-full max-w-xs mb-6">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>{currentPhase.charAt(0).toUpperCase() + currentPhase.slice(1)}</span>
                  <span>{phaseTime}s / {getCurrentPhaseDuration()}s</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full bg-gradient-to-r ${selectedPattern.color} transition-all duration-1000`}
                    style={{ width: `${getPhaseProgress() * 100}%` }}
                  />
                </div>
              </div>

              {/* Breathing pattern display */}
              <div className="grid grid-cols-4 gap-2 text-center text-sm text-gray-600 mb-6">
                <div className={`p-2 rounded ${currentPhase === 'inhale' ? 'bg-blue-100 text-blue-800' : ''}`}>
                  <div className="font-medium">Inhale</div>
                  <div>{selectedPattern.inhale}s</div>
                </div>
                <div className={`p-2 rounded ${currentPhase === 'hold' ? 'bg-yellow-100 text-yellow-800' : ''}`}>
                  <div className="font-medium">Hold</div>
                  <div>{selectedPattern.hold}s</div>
                </div>
                <div className={`p-2 rounded ${currentPhase === 'exhale' ? 'bg-green-100 text-green-800' : ''}`}>
                  <div className="font-medium">Exhale</div>
                  <div>{selectedPattern.exhale}s</div>
                </div>
                <div className={`p-2 rounded ${currentPhase === 'pause' ? 'bg-gray-100 text-gray-800' : ''}`}>
                  <div className="font-medium">Pause</div>
                  <div>{selectedPattern.pause}s</div>
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center justify-center space-x-4">
                <button
                  onClick={resetExercise}
                  className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-lg transition-colors"
                  title="Reset exercise"
                >
                  <RotateCcw className="w-5 h-5" />
                </button>
                
                <button
                  onClick={toggleExercise}
                  className={`px-6 py-3 rounded-lg font-medium transition-all flex items-center space-x-2 ${
                    isActive
                      ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                      : 'bg-green-500 text-white hover:bg-green-600'
                  }`}
                >
                  {isActive ? (
                    <>
                      <Pause className="w-4 h-4" />
                      <span>Pause</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      <span>Continue</span>
                    </>
                  )}
                </button>
                
                <button
                  onClick={() => onComplete(totalTime)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Complete
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default BreathingExercise;