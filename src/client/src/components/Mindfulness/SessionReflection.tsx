import React, { useState } from 'react';
import { Star, Heart, MessageSquare, TrendingUp, Clock, Target, X, CheckCircle } from 'lucide-react';
import { Session, Task } from '../../../../shared/types';

interface SessionReflectionProps {
  isVisible: boolean;
  onClose: () => void;
  onSubmit: (reflection: SessionReflectionData) => void;
  session: Session;
  task?: Task;
  sessionDuration: number; // minutes
}

interface SessionReflectionData {
  qualityRating: number; // 1-5
  focusRating: number; // 1-5
  energyLevel: number; // 1-5
  accomplishments: string;
  challenges: string;
  improvements: string;
  gratitude: string;
  nextSessionGoal: string;
  mood: 'energized' | 'calm' | 'tired' | 'frustrated' | 'satisfied' | 'motivated';
  tags: string[];
}

/**
 * Session reflection component for mindful session endings
 * Helps users reflect on their productivity and set intentions
 */
const SessionReflection: React.FC<SessionReflectionProps> = ({
  isVisible,
  onClose,
  onSubmit,
  session,
  task,
  sessionDuration,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [reflection, setReflection] = useState<SessionReflectionData>({
    qualityRating: 0,
    focusRating: 0,
    energyLevel: 0,
    accomplishments: '',
    challenges: '',
    improvements: '',
    gratitude: '',
    nextSessionGoal: '',
    mood: 'satisfied',
    tags: [],
  });

  const moods = [
    { id: 'energized', name: 'Energized', icon: '⚡', color: 'bg-yellow-100 text-yellow-800' },
    { id: 'calm', name: 'Calm', icon: '🧘', color: 'bg-blue-100 text-blue-800' },
    { id: 'satisfied', name: 'Satisfied', icon: '😊', color: 'bg-green-100 text-green-800' },
    { id: 'motivated', name: 'Motivated', icon: '🚀', color: 'bg-purple-100 text-purple-800' },
    { id: 'tired', name: 'Tired', icon: '😴', color: 'bg-gray-100 text-gray-800' },
    { id: 'frustrated', name: 'Frustrated', icon: '😤', color: 'bg-red-100 text-red-800' },
  ];

  const commonTags = [
    'Deep Work', 'Flow State', 'Distracted', 'Productive', 'Creative',
    'Problem Solving', 'Learning', 'Planning', 'Research', 'Writing',
    'Coding', 'Design', 'Meeting', 'Email', 'Admin'
  ];

  const reflectionSteps = [
    {
      title: 'Rate Your Session',
      description: 'How did this session go overall?',
      component: 'ratings',
    },
    {
      title: 'Reflect on Progress',
      description: 'What did you accomplish and learn?',
      component: 'accomplishments',
    },
    {
      title: 'Identify Challenges',
      description: 'What obstacles did you face?',
      component: 'challenges',
    },
    {
      title: 'Express Gratitude',
      description: 'What are you grateful for right now?',
      component: 'gratitude',
    },
    {
      title: 'Set Next Intention',
      description: 'What will you focus on next?',
      component: 'intention',
    },
  ];

  // Update reflection data
  const updateReflection = (key: keyof SessionReflectionData, value: any) => {
    setReflection(prev => ({ ...prev, [key]: value }));
  };

  // Handle tag toggle
  const toggleTag = (tag: string) => {
    setReflection(prev => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag],
    }));
  };

  // Navigate steps
  const nextStep = () => {
    if (currentStep < reflectionSteps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleSubmit();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  // Submit reflection
  const handleSubmit = () => {
    onSubmit(reflection);
  };

  // Render rating component
  const renderRating = (
    label: string,
    value: number,
    onChange: (rating: number) => void,
    icon: React.ReactNode,
    color: string
  ) => (
    <div className="mb-6">
      <div className="flex items-center space-x-2 mb-3">
        <div className={`p-2 rounded-lg ${color}`}>
          {icon}
        </div>
        <label className="font-medium text-gray-900">{label}</label>
      </div>
      <div className="flex items-center space-x-2">
        {[1, 2, 3, 4, 5].map((rating) => (
          <button
            key={rating}
            onClick={() => onChange(rating)}
            className={`w-10 h-10 rounded-full border-2 transition-all ${
              value >= rating
                ? 'border-blue-600 bg-blue-600 text-white'
                : 'border-gray-300 text-gray-600 hover:border-blue-400'
            }`}
          >
            {rating}
          </button>
        ))}
      </div>
      <div className="flex justify-between text-xs text-gray-500 mt-1">
        <span>Poor</span>
        <span>Excellent</span>
      </div>
    </div>
  );

  // Render current step
  const renderCurrentStep = () => {
    const step = reflectionSteps[currentStep];
    
    switch (step.component) {
      case 'ratings':
        return (
          <div className="space-y-6">
            {renderRating(
              'Session Quality',
              reflection.qualityRating,
              (rating) => updateReflection('qualityRating', rating),
              <Star className="w-4 h-4" />,
              'bg-yellow-100 text-yellow-600'
            )}
            
            {renderRating(
              'Focus Level',
              reflection.focusRating,
              (rating) => updateReflection('focusRating', rating),
              <Target className="w-4 h-4" />,
              'bg-blue-100 text-blue-600'
            )}
            
            {renderRating(
              'Energy Level',
              reflection.energyLevel,
              (rating) => updateReflection('energyLevel', rating),
              <TrendingUp className="w-4 h-4" />,
              'bg-green-100 text-green-600'
            )}
            
            {/* Mood selection */}
            <div className="mb-6">
              <label className="block font-medium text-gray-900 mb-3">How are you feeling?</label>
              <div className="grid grid-cols-3 gap-2">
                {moods.map((mood) => (
                  <button
                    key={mood.id}
                    onClick={() => updateReflection('mood', mood.id)}
                    className={`p-3 rounded-lg border-2 transition-all text-center ${
                      reflection.mood === mood.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-2xl mb-1">{mood.icon}</div>
                    <div className="text-xs font-medium">{mood.name}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        );
        
      case 'accomplishments':
        return (
          <div className="space-y-4">
            <div>
              <label className="block font-medium text-gray-900 mb-2">
                What did you accomplish in this session?
              </label>
              <textarea
                value={reflection.accomplishments}
                onChange={(e) => updateReflection('accomplishments', e.target.value)}
                placeholder="Describe what you completed, learned, or made progress on..."
                className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={4}
              />
            </div>
            
            {/* Session tags */}
            <div>
              <label className="block font-medium text-gray-900 mb-2">
                Tag this session (optional)
              </label>
              <div className="flex flex-wrap gap-2">
                {commonTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`px-3 py-1 rounded-full text-sm transition-all ${
                      reflection.tags.includes(tag)
                        ? 'bg-blue-100 text-blue-800 border border-blue-300'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );
        
      case 'challenges':
        return (
          <div className="space-y-4">
            <div>
              <label className="block font-medium text-gray-900 mb-2">
                What challenges did you face?
              </label>
              <textarea
                value={reflection.challenges}
                onChange={(e) => updateReflection('challenges', e.target.value)}
                placeholder="Describe any obstacles, distractions, or difficulties..."
                className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
              />
            </div>
            
            <div>
              <label className="block font-medium text-gray-900 mb-2">
                How could you improve next time?
              </label>
              <textarea
                value={reflection.improvements}
                onChange={(e) => updateReflection('improvements', e.target.value)}
                placeholder="What strategies or changes might help you be more effective?"
                className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
              />
            </div>
          </div>
        );
        
      case 'gratitude':
        return (
          <div>
            <label className="block font-medium text-gray-900 mb-2">
              What are you grateful for right now?
            </label>
            <textarea
              value={reflection.gratitude}
              onChange={(e) => updateReflection('gratitude', e.target.value)}
              placeholder="Take a moment to appreciate something positive from this session or your day..."
              className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={4}
            />
            <p className="text-sm text-gray-500 mt-2">
              Gratitude helps reinforce positive experiences and build resilience.
            </p>
          </div>
        );
        
      case 'intention':
        return (
          <div>
            <label className="block font-medium text-gray-900 mb-2">
              What will you focus on in your next session?
            </label>
            <textarea
              value={reflection.nextSessionGoal}
              onChange={(e) => updateReflection('nextSessionGoal', e.target.value)}
              placeholder="Set a clear intention for your next work session..."
              className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
            />
            <p className="text-sm text-gray-500 mt-2">
              Setting intentions helps maintain momentum and clarity.
            </p>
          </div>
        );
        
      default:
        return null;
    }
  };

  if (!isVisible) return null;

  const currentStepData = reflectionSteps[currentStep];
  const isLastStep = currentStep === reflectionSteps.length - 1;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Session Reflection</h2>
              <p className="text-indigo-100 text-sm mt-1">
                {task ? `Task: ${task.title}` : `${session.sessionType} session`} • {sessionDuration} min
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors"
              aria-label="Close reflection"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Progress indicator */}
        <div className="px-6 py-3 bg-gray-50 border-b">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
            <span>{currentStepData.title}</span>
            <span>Step {currentStep + 1} of {reflectionSteps.length}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / reflectionSteps.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Content */}
        <div className="p-6 flex-1 overflow-y-auto">
          <div className="mb-4">
            <p className="text-gray-600 text-sm">{currentStepData.description}</p>
          </div>
          
          {renderCurrentStep()}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t">
          <div className="flex items-center justify-between">
            <button
              onClick={prevStep}
              disabled={currentStep === 0}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            
            <button
              onClick={nextStep}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center space-x-2"
            >
              {isLastStep ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>Complete Reflection</span>
                </>
              ) : (
                <span>Next</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SessionReflection;