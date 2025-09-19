import React, { useState, useEffect } from 'react';
import { Heart, Flower, Sparkles, X, Play, Pause, RotateCcw } from 'lucide-react';

interface MindfulnessExercise {
  id: string;
  name: string;
  description: string;
  duration: number; // seconds
  type: 'breathing' | 'reflection' | 'gratitude' | 'body_scan';
  icon: React.ReactNode;
  color: string;
  instructions: string[];
}

interface MindfulnessPromptProps {
  isVisible: boolean;
  onClose: () => void;
  onComplete: (exerciseId: string, duration: number) => void;
  triggerType: 'session_end' | 'session_start' | 'break_start' | 'manual';
}

/**
 * Mindfulness prompt component for mindful transitions between sessions
 * Provides guided exercises to help users transition mindfully
 */
const MindfulnessPrompt: React.FC<MindfulnessPromptProps> = ({
  isVisible,
  onClose,
  onComplete,
  triggerType,
}) => {
  const [selectedExercise, setSelectedExercise] = useState<MindfulnessExercise | null>(null);
  const [isExerciseActive, setIsExerciseActive] = useState(false);
  const [exerciseTime, setExerciseTime] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);

  // Available mindfulness exercises
  const exercises: MindfulnessExercise[] = [
    {
      id: 'box_breathing',
      name: '4-7-8 Breathing',
      description: 'Calming breath work to center yourself',
      duration: 120, // 2 minutes
      type: 'breathing',
      icon: <Heart className="w-5 h-5" />,
      color: 'bg-blue-500',
      instructions: [
        'Sit comfortably with your back straight',
        'Inhale quietly through your nose for 4 counts',
        'Hold your breath for 7 counts',
        'Exhale completely through your mouth for 8 counts',
        'Repeat this cycle 4 times',
      ],
    },
    {
      id: 'gratitude_moment',
      name: 'Gratitude Reflection',
      description: 'Take a moment to appreciate what went well',
      duration: 90, // 1.5 minutes
      type: 'gratitude',
      icon: <Sparkles className="w-5 h-5" />,
      color: 'bg-yellow-500',
      instructions: [
        'Close your eyes and take three deep breaths',
        'Think of one thing that went well in your last session',
        'Feel genuine appreciation for this accomplishment',
        'Think of one person you\'re grateful for today',
        'Hold this feeling of gratitude for a moment',
      ],
    },
    {
      id: 'body_scan',
      name: 'Quick Body Scan',
      description: 'Release tension and reset your body',
      duration: 180, // 3 minutes
      type: 'body_scan',
      icon: <Flower className="w-5 h-5" />,
      color: 'bg-green-500',
      instructions: [
        'Sit or stand comfortably',
        'Start by noticing your feet and legs',
        'Move your attention to your torso and arms',
        'Notice any tension in your shoulders and neck',
        'Relax your face and jaw',
        'Take three deep breaths to finish',
      ],
    },
    {
      id: 'intention_setting',
      name: 'Set Your Intention',
      description: 'Clarify your focus for the next session',
      duration: 60, // 1 minute
      type: 'reflection',
      icon: <Heart className="w-5 h-5" />,
      color: 'bg-purple-500',
      instructions: [
        'Take a moment to center yourself',
        'Think about what you want to accomplish next',
        'Set a clear, positive intention',
        'Visualize yourself succeeding',
        'Carry this intention into your next session',
      ],
    },
  ];

  // Filter exercises based on trigger type
  const getRelevantExercises = () => {
    switch (triggerType) {
      case 'session_end':
        return exercises.filter(e => e.type === 'gratitude' || e.type === 'body_scan');
      case 'session_start':
        return exercises.filter(e => e.type === 'breathing' || e.type === 'reflection');
      case 'break_start':
        return exercises.filter(e => e.type === 'body_scan' || e.type === 'breathing');
      default:
        return exercises;
    }
  };

  // Exercise timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isExerciseActive && selectedExercise) {
      interval = setInterval(() => {
        setExerciseTime(prev => {
          if (prev >= selectedExercise.duration) {
            setIsExerciseActive(false);
            onComplete(selectedExercise.id, selectedExercise.duration);
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isExerciseActive, selectedExercise, onComplete]);

  // Auto-advance steps for guided exercises
  useEffect(() => {
    if (!isExerciseActive || !selectedExercise) return;
    
    const stepDuration = selectedExercise.duration / selectedExercise.instructions.length;
    const targetStep = Math.floor(exerciseTime / stepDuration);
    
    if (targetStep !== currentStep && targetStep < selectedExercise.instructions.length) {
      setCurrentStep(targetStep);
    }
  }, [exerciseTime, selectedExercise, currentStep, isExerciseActive]);

  // Start exercise
  const startExercise = (exercise: MindfulnessExercise) => {
    setSelectedExercise(exercise);
    setIsExerciseActive(true);
    setExerciseTime(0);
    setCurrentStep(0);
  };

  // Pause/resume exercise
  const toggleExercise = () => {
    setIsExerciseActive(!isExerciseActive);
  };

  // Reset exercise
  const resetExercise = () => {
    setIsExerciseActive(false);
    setExerciseTime(0);
    setCurrentStep(0);
  };

  // Complete exercise early
  const completeExercise = () => {
    if (selectedExercise) {
      setIsExerciseActive(false);
      onComplete(selectedExercise.id, exerciseTime);
    }
  };

  // Format time display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Get prompt title based on trigger
  const getPromptTitle = () => {
    switch (triggerType) {
      case 'session_end':
        return 'Session Complete - Take a Mindful Moment';
      case 'session_start':
        return 'Prepare Mindfully for Your Session';
      case 'break_start':
        return 'Mindful Break Time';
      default:
        return 'Mindfulness Moment';
    }
  };

  if (!isVisible) return null;

  const relevantExercises = getRelevantExercises();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden">
        {!selectedExercise ? (
          // Exercise selection screen
          <>
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold">{getPromptTitle()}</h2>
                  <p className="text-purple-100 text-sm mt-1">
                    Choose a mindful transition exercise
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="text-white hover:text-gray-200 transition-colors"
                  aria-label="Close mindfulness prompt"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="space-y-3">
                {relevantExercises.map((exercise) => (
                  <button
                    key={exercise.id}
                    onClick={() => startExercise(exercise)}
                    className="w-full p-4 rounded-lg border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all text-left group"
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`p-2 rounded-lg ${exercise.color} text-white group-hover:scale-110 transition-transform`}>
                        {exercise.icon}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 mb-1">
                          {exercise.name}
                        </h3>
                        <p className="text-sm text-gray-600 mb-2">
                          {exercise.description}
                        </p>
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <span>{formatTime(exercise.duration)}</span>
                          <span className="capitalize">{exercise.type.replace('_', ' ')}</span>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              <div className="mt-6 pt-4 border-t border-gray-200">
                <button
                  onClick={onClose}
                  className="w-full py-2 text-gray-600 hover:text-gray-800 transition-colors text-sm"
                >
                  Skip mindfulness moment
                </button>
              </div>
            </div>
          </>
        ) : (
          // Exercise execution screen
          <>
            <div className={`${selectedExercise.color} text-white p-6`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                    {selectedExercise.icon}
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">{selectedExercise.name}</h2>
                    <p className="text-white text-opacity-80 text-sm">
                      {formatTime(exerciseTime)} / {formatTime(selectedExercise.duration)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedExercise(null)}
                  className="text-white hover:text-gray-200 transition-colors"
                  aria-label="Back to exercise selection"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Progress bar */}
              <div className="mt-4">
                <div className="w-full bg-white bg-opacity-20 rounded-full h-2">
                  <div
                    className="bg-white h-2 rounded-full transition-all duration-1000"
                    style={{ width: `${(exerciseTime / selectedExercise.duration) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="p-6 flex-1 overflow-y-auto">
              {/* Current instruction */}
              <div className="text-center mb-6">
                <div className="text-sm text-gray-500 mb-2">
                  Step {currentStep + 1} of {selectedExercise.instructions.length}
                </div>
                <p className="text-lg text-gray-900 leading-relaxed">
                  {selectedExercise.instructions[currentStep]}
                </p>
              </div>

              {/* All instructions list */}
              <div className="space-y-2 mb-6">
                {selectedExercise.instructions.map((instruction, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg text-sm transition-all ${
                      index === currentStep
                        ? `${selectedExercise.color} bg-opacity-10 border border-current border-opacity-20`
                        : index < currentStep
                        ? 'bg-green-50 text-green-700 border border-green-200'
                        : 'bg-gray-50 text-gray-600'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${
                        index === currentStep
                          ? 'bg-current animate-pulse'
                          : index < currentStep
                          ? 'bg-green-500'
                          : 'bg-gray-300'
                      }`} />
                      <span>{instruction}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Exercise controls */}
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
                    isExerciseActive
                      ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                      : 'bg-green-500 text-white hover:bg-green-600'
                  }`}
                >
                  {isExerciseActive ? (
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
                  onClick={completeExercise}
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

export default MindfulnessPrompt;