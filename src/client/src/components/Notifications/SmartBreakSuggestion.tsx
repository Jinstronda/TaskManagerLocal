import React, { useState } from 'react';
import { Coffee, Clock, TrendingUp, X, Play, SkipForward } from 'lucide-react';
import { BreakSuggestion } from '../../../../shared/types';

interface SmartBreakSuggestionProps {
  suggestion: BreakSuggestion;
  onAccept: (duration: number) => void;
  onDismiss: () => void;
  onSnooze: (minutes: number) => void;
  isVisible: boolean;
}

/**
 * Smart break suggestion component that appears based on productivity patterns
 * Provides intelligent recommendations for break timing and duration
 */
const SmartBreakSuggestion: React.FC<SmartBreakSuggestionProps> = ({
  suggestion,
  onAccept,
  onDismiss,
  onSnooze,
  isVisible,
}) => {
  const [customDuration, setCustomDuration] = useState(suggestion.suggestedDuration);
  const [isExpanded, setIsExpanded] = useState(false);

  if (!isVisible) return null;

  // Get icon based on suggestion type
  const getTypeIcon = () => {
    switch (suggestion.type) {
      case 'time_based':
        return <Clock className="w-5 h-5 text-orange-600" />;
      case 'pattern_based':
        return <TrendingUp className="w-5 h-5 text-blue-600" />;
      case 'productivity_based':
        return <Coffee className="w-5 h-5 text-green-600" />;
      default:
        return <Coffee className="w-5 h-5 text-gray-600" />;
    }
  };

  // Get confidence color
  const getConfidenceColor = () => {
    if (suggestion.confidence >= 0.8) return 'text-green-600 bg-green-100';
    if (suggestion.confidence >= 0.6) return 'text-yellow-600 bg-yellow-100';
    return 'text-orange-600 bg-orange-100';
  };

  // Format suggestion type for display
  const formatSuggestionType = () => {
    switch (suggestion.type) {
      case 'time_based':
        return 'Time-based';
      case 'pattern_based':
        return 'Pattern-based';
      case 'productivity_based':
        return 'Productivity-based';
      default:
        return 'Smart';
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm">
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 animate-slide-in-right">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-2">
            {getTypeIcon()}
            <div>
              <h3 className="font-semibold text-gray-900">Time for a Break!</h3>
              <div className="flex items-center space-x-2 mt-1">
                <span className="text-xs text-gray-500">{formatSuggestionType()}</span>
                <span className={`text-xs px-2 py-1 rounded-full ${getConfidenceColor()}`}>
                  {Math.round(suggestion.confidence * 100)}% confidence
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onDismiss}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Dismiss suggestion"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Reason */}
        <p className="text-sm text-gray-700 mb-3">{suggestion.reason}</p>

        {/* Stats */}
        <div className="bg-gray-50 rounded-lg p-3 mb-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-gray-500">Sessions completed:</span>
              <span className="font-medium text-gray-900 ml-1">
                {suggestion.sessionsSinceLastBreak}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Work time:</span>
              <span className="font-medium text-gray-900 ml-1">
                {Math.round(suggestion.totalWorkTime)} min
              </span>
            </div>
          </div>
        </div>

        {/* Duration selector */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Break duration
          </label>
          <div className="flex items-center space-x-2">
            <input
              type="range"
              min="5"
              max="30"
              step="5"
              value={customDuration}
              onChange={(e) => setCustomDuration(parseInt(e.target.value))}
              className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            />
            <span className="text-sm font-medium text-gray-900 min-w-[3rem]">
              {customDuration} min
            </span>
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>5 min</span>
            <span>Quick</span>
            <span>Standard</span>
            <span>Long</span>
            <span>30 min</span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onAccept(customDuration)}
            className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center justify-center space-x-1"
          >
            <Play className="w-4 h-4" />
            <span>Start Break</span>
          </button>
          
          <div className="relative">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="px-3 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              aria-label="More options"
            >
              <SkipForward className="w-4 h-4" />
            </button>
            
            {isExpanded && (
              <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[120px] z-10">
                <button
                  onClick={() => {
                    onSnooze(5);
                    setIsExpanded(false);
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Snooze 5 min
                </button>
                <button
                  onClick={() => {
                    onSnooze(10);
                    setIsExpanded(false);
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Snooze 10 min
                </button>
                <button
                  onClick={() => {
                    onSnooze(15);
                    setIsExpanded(false);
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Snooze 15 min
                </button>
                <hr className="my-1" />
                <button
                  onClick={() => {
                    onDismiss();
                    setIsExpanded(false);
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  Dismiss
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Additional info toggle */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full text-xs text-gray-500 hover:text-gray-700 mt-2 transition-colors"
        >
          {isExpanded ? 'Less info' : 'More info'}
        </button>

        {isExpanded && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="text-xs text-gray-600 space-y-1">
              <p>
                <strong>Suggestion type:</strong> {formatSuggestionType()}
              </p>
              <p>
                <strong>Confidence:</strong> {Math.round(suggestion.confidence * 100)}%
              </p>
              <p>
                <strong>Recommended duration:</strong> {suggestion.suggestedDuration} minutes
              </p>
              {suggestion.type === 'pattern_based' && (
                <p className="text-blue-600">
                  Based on your historical break patterns
                </p>
              )}
              {suggestion.type === 'productivity_based' && (
                <p className="text-green-600">
                  Your focus quality may be declining
                </p>
              )}
              {suggestion.type === 'time_based' && (
                <p className="text-orange-600">
                  You've been working for {Math.round(suggestion.totalWorkTime)} minutes
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SmartBreakSuggestion;