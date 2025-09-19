import React, { useState } from 'react';
import { Brain, Zap, Coffee, Settings } from 'lucide-react';
import { Session } from '../../../../shared/types';
import { cn } from '../../utils/cn';
import { useTimer } from '../../hooks/useTimer';

interface SessionTypeSelectorProps {
  currentType: Session['sessionType'];
  onTypeChange: (type: Session['sessionType']) => void;
}

interface SessionTypeOption {
  type: Session['sessionType'];
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  defaultDuration: number;
}

const sessionTypes: SessionTypeOption[] = [
  {
    type: 'deep_work',
    name: 'Deep Work',
    description: 'Focused, uninterrupted work sessions',
    icon: <Brain className="w-6 h-6" />,
    color: '#3B82F6',
    defaultDuration: 50,
  },
  {
    type: 'quick_task',
    name: 'Quick Task',
    description: 'Short, focused tasks and activities',
    icon: <Zap className="w-6 h-6" />,
    color: '#10B981',
    defaultDuration: 15,
  },
  {
    type: 'break',
    name: 'Break Time',
    description: 'Rest and recharge between sessions',
    icon: <Coffee className="w-6 h-6" />,
    color: '#F59E0B',
    defaultDuration: 10,
  },
  {
    type: 'custom',
    name: 'Custom',
    description: 'Customizable session with your duration',
    icon: <Settings className="w-6 h-6" />,
    color: '#8B5CF6',
    defaultDuration: 25,
  },
];

export const SessionTypeSelector: React.FC<SessionTypeSelectorProps> = ({
  currentType,
  onTypeChange,
}) => {
  const [showDurationSelector, setShowDurationSelector] = useState(false);
  const [selectedType, setSelectedType] = useState<Session['sessionType']>(currentType);
  const { getDurationOptions, updatePlannedDuration, plannedDuration } = useTimer();

  const handleTypeSelect = (type: Session['sessionType']) => {
    setSelectedType(type);
    onTypeChange(type);
    
    // Show duration selector for custom type or if user wants to change duration
    if (type === 'custom') {
      setShowDurationSelector(true);
    }
  };

  const handleDurationSelect = (duration: number) => {
    updatePlannedDuration(duration);
    setShowDurationSelector(false);
  };

  const currentTypeOption = sessionTypes.find(t => t.type === currentType);

  return (
    <div className="space-y-6">
      {/* Session Type Grid */}
      <div className="grid grid-cols-2 gap-4">
        {sessionTypes.map((option) => {
          const isSelected = option.type === currentType;
          
          return (
            <button
              key={option.type}
              onClick={() => handleTypeSelect(option.type)}
              className={cn(
                'p-4 rounded-xl border-2 transition-all duration-200',
                'hover:shadow-lg transform hover:scale-105',
                'focus:outline-none focus:ring-4 focus:ring-opacity-50',
                {
                  'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800': !isSelected,
                  'shadow-lg': isSelected,
                }
              )}
              style={{
                borderColor: isSelected ? option.color : undefined,
                backgroundColor: isSelected ? `${option.color}10` : undefined,
                focusRingColor: `${option.color}50`,
              }}
            >
              <div className="flex items-center space-x-3 mb-2">
                <div
                  className="p-2 rounded-lg"
                  style={{ backgroundColor: `${option.color}20`, color: option.color }}
                >
                  {option.icon}
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                    {option.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {option.defaultDuration} min
                  </p>
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 text-left">
                {option.description}
              </p>
            </button>
          );
        })}
      </div>

      {/* Duration Selector */}
      {(showDurationSelector || currentType === 'custom') && (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
          <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
            Select Duration
          </h4>
          <div className="grid grid-cols-4 gap-2">
            {getDurationOptions(selectedType).map((duration) => (
              <button
                key={duration}
                onClick={() => handleDurationSelect(duration)}
                className={cn(
                  'px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                  'hover:shadow-md transform hover:scale-105',
                  'focus:outline-none focus:ring-2 focus:ring-opacity-50',
                  {
                    'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300': duration !== plannedDuration,
                    'text-white shadow-md': duration === plannedDuration,
                  }
                )}
                style={{
                  backgroundColor: duration === plannedDuration ? currentTypeOption?.color : undefined,
                  focusRingColor: `${currentTypeOption?.color}50`,
                }}
              >
                {duration}m
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Current Selection Summary */}
      <div className="text-center">
        <div className="inline-flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-full">
          <div
            className="p-1 rounded-full"
            style={{ backgroundColor: currentTypeOption?.color }}
          >
            {currentTypeOption?.icon && (
              <div className="text-white scale-75">
                {currentTypeOption.icon}
              </div>
            )}
          </div>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {currentTypeOption?.name} • {plannedDuration} minutes
          </span>
        </div>
      </div>
    </div>
  );
};