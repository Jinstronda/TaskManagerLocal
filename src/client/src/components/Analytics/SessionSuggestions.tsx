import React from 'react';
import { Lightbulb, Clock, Calendar, Star, ArrowRight } from 'lucide-react';

interface SessionSuggestionsData {
  suggestedDuration: number;
  confidence: number;
  reason: string;
  alternativeTimes: Array<{
    hour: number;
    dayOfWeek: number;
    score: number;
  }>;
}

interface SessionSuggestionsProps {
  data: SessionSuggestionsData | null;
  isLoading: boolean;
  error: string | null;
  onApplySuggestion?: (duration: number) => void;
}

const SessionSuggestions: React.FC<SessionSuggestionsProps> = ({
  data,
  isLoading,
  error,
  onApplySuggestion
}) => {
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  const formatTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const formatHour = (hour: number): string => {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:00 ${period}`;
  };

  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 0.8) return 'text-green-600 dark:text-green-400';
    if (confidence >= 0.6) return 'text-yellow-600 dark:text-yellow-400';
    if (confidence >= 0.4) return 'text-orange-600 dark:text-orange-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getConfidenceLabel = (confidence: number): string => {
    if (confidence >= 0.8) return 'High';
    if (confidence >= 0.6) return 'Medium';
    if (confidence >= 0.4) return 'Low';
    return 'Very Low';
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <div className="flex items-center space-x-3 mb-4">
          <Lightbulb className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Session Suggestions
          </h3>
        </div>
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <div className="flex items-center space-x-3 mb-4">
          <Lightbulb className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Session Suggestions
          </h3>
        </div>
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 mb-2">Error loading suggestions</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <div className="flex items-center space-x-3 mb-4">
          <Lightbulb className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Session Suggestions
          </h3>
        </div>
        <div className="text-center">
          <p className="text-gray-500 dark:text-gray-400 mb-2">No suggestions available</p>
          <p className="text-sm text-gray-400 dark:text-gray-500">
            Complete more sessions to get personalized recommendations
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
      <div className="flex items-center space-x-3 mb-6">
        <Lightbulb className="w-5 h-5 text-yellow-500" />
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Session Suggestions
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            AI-powered recommendations based on your patterns
          </p>
        </div>
      </div>

      {/* Main Suggestion */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-4 mb-6 border border-blue-200 dark:border-blue-800">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span className="font-medium text-blue-900 dark:text-blue-100">
              Recommended Duration
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <Star className={`w-4 h-4 ${getConfidenceColor(data.confidence)}`} />
            <span className={`text-sm font-medium ${getConfidenceColor(data.confidence)}`}>
              {getConfidenceLabel(data.confidence)} Confidence
            </span>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <p className="text-3xl font-bold text-blue-900 dark:text-blue-100 mb-1">
              {formatTime(data.suggestedDuration)}
            </p>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              {data.reason}
            </p>
          </div>
          
          {onApplySuggestion && (
            <button
              onClick={() => onApplySuggestion(data.suggestedDuration)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center space-x-2"
            >
              <span>Apply</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Alternative Times */}
      {data.alternativeTimes.length > 0 && (
        <div>
          <div className="flex items-center space-x-2 mb-3">
            <Calendar className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            <h4 className="text-md font-medium text-gray-900 dark:text-gray-100">
              Better Times to Focus
            </h4>
          </div>
          
          <div className="space-y-2">
            {data.alternativeTimes.map((time, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {dayNames[time.dayOfWeek]} at {formatHour(time.hour)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Productivity score: {time.score.toFixed(1)}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-1">
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star
                      key={i}
                      className={`w-3 h-3 ${
                        i < Math.round(time.score / 20) 
                          ? 'text-yellow-400 fill-current' 
                          : 'text-gray-300 dark:text-gray-600'
                      }`}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <p className="text-xs text-yellow-800 dark:text-yellow-200">
              💡 These times show higher productivity based on your historical data. 
              Consider scheduling important work during these periods.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SessionSuggestions;