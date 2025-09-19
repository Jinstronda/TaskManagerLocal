import React, { useEffect, useState } from 'react';
import { Brain, TrendingUp, Award, Info } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface FocusScoreDisplayProps {
  className?: string;
  showTrend?: boolean;
  showDetails?: boolean;
}

interface FocusScoreData {
  currentScore: number;
  previousScore: number;
  trend: Array<{
    date: string;
    score: number;
    totalTime: number;
  }>;
  breakdown: {
    timeScore: number;
    qualityScore: number;
    consistencyScore: number;
  };
  insights: string[];
}

/**
 * FocusScoreDisplay Component
 * 
 * Displays the user's focus score with detailed breakdown and trends.
 * Shows current score, historical trends, and actionable insights.
 * Integrates with the FocusScoreService for real-time calculations.
 */
export const FocusScoreDisplay: React.FC<FocusScoreDisplayProps> = ({
  className = '',
  showTrend = true,
  showDetails = true
}) => {
  const [focusData, setFocusData] = useState<FocusScoreData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchFocusScore();
  }, []);

  const fetchFocusScore = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/focus-score/current');
      if (!response.ok) {
        throw new Error('Failed to fetch focus score');
      }
      
      const data = await response.json();
      setFocusData(data);
    } catch (error) {
      console.error('Error fetching focus score:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 60) return 'text-blue-600 dark:text-blue-400';
    if (score >= 40) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 dark:bg-green-900/30';
    if (score >= 60) return 'bg-blue-100 dark:bg-blue-900/30';
    if (score >= 40) return 'bg-yellow-100 dark:bg-yellow-900/30';
    return 'bg-red-100 dark:bg-red-900/30';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Needs Improvement';
  };

  const formatTrendChange = (current: number, previous: number) => {
    const change = current - previous;
    const isPositive = change > 0;
    const isNeutral = change === 0;
    
    if (isNeutral) return { text: 'No change', color: 'text-gray-500', icon: '→' };
    
    return {
      text: `${isPositive ? '+' : ''}${change.toFixed(1)} points`,
      color: isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400',
      icon: isPositive ? '↗' : '↘'
    };
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg p-3">
          <p className="font-medium text-gray-900 dark:text-white mb-2">
            {new Date(label).toLocaleDateString()}
          </p>
          <div className="space-y-1 text-sm">
            <div className="flex items-center justify-between gap-4">
              <span className="text-gray-600 dark:text-gray-400">Focus Score:</span>
              <span className={`font-medium ${getScoreColor(data.score)}`}>
                {data.score}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-gray-600 dark:text-gray-400">Focus Time:</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {Math.round(data.totalTime / 60)}h {data.totalTime % 60}m
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className={`animate-pulse bg-gray-100 dark:bg-gray-800 rounded-lg p-6 ${className}`}>
        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/2 mb-4"></div>
        <div className="h-16 bg-gray-300 dark:bg-gray-600 rounded mb-4"></div>
        {showTrend && <div className="h-32 bg-gray-300 dark:bg-gray-600 rounded"></div>}
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 ${className}`}>
        <div className="flex items-center gap-2 text-red-600 dark:text-red-400 mb-2">
          <Brain className="w-5 h-5" />
          <span className="font-medium">Error Loading Focus Score</span>
        </div>
        <p className="text-red-600 dark:text-red-400 text-sm mb-3">{error}</p>
        <button
          onClick={fetchFocusScore}
          className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-sm font-medium"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!focusData) {
    return (
      <div className={`bg-gray-50 dark:bg-gray-800 rounded-lg p-6 ${className}`}>
        <div className="text-center">
          <Brain className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No Focus Data
          </h4>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Complete some focus sessions to see your score.
          </p>
        </div>
      </div>
    );
  }

  const trendChange = formatTrendChange(focusData.currentScore, focusData.previousScore);

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <Brain className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Focus Score
        </h3>
      </div>

      {/* Current Score */}
      <div className="mb-6">
        <div className={`p-6 rounded-lg ${getScoreBgColor(focusData.currentScore)}`}>
          <div className="flex items-center justify-between mb-2">
            <div>
              <div className={`text-4xl font-bold ${getScoreColor(focusData.currentScore)}`}>
                {focusData.currentScore}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {getScoreLabel(focusData.currentScore)}
              </div>
            </div>
            <div className="text-right">
              <div className={`flex items-center gap-1 text-sm ${trendChange.color}`}>
                <span>{trendChange.icon}</span>
                <span>{trendChange.text}</span>
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                vs. previous period
              </div>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 mt-4">
            <div
              className={`h-2 rounded-full transition-all duration-500 ${
                focusData.currentScore >= 80 ? 'bg-green-500' :
                focusData.currentScore >= 60 ? 'bg-blue-500' :
                focusData.currentScore >= 40 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${focusData.currentScore}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Score Breakdown */}
      {showDetails && focusData.breakdown && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Score Breakdown
          </h4>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                {focusData.breakdown.timeScore}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                Time Score
              </div>
            </div>
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                {focusData.breakdown.qualityScore}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                Quality Score
              </div>
            </div>
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                {focusData.breakdown.consistencyScore}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                Consistency
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Trend Chart */}
      {showTrend && focusData.trend.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              7-Day Trend
            </h4>
          </div>
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={focusData.trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                <XAxis 
                  dataKey="date" 
                  stroke="#6b7280"
                  fontSize={10}
                  tick={{ fill: '#6b7280' }}
                  tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                />
                <YAxis 
                  stroke="#6b7280"
                  fontSize={10}
                  tick={{ fill: '#6b7280' }}
                  domain={[0, 100]}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line 
                  type="monotone" 
                  dataKey="score" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6', strokeWidth: 2, r: 3 }}
                  activeDot={{ r: 5, stroke: '#3b82f6', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Insights */}
      {showDetails && focusData.insights.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Info className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Insights & Recommendations
            </h4>
          </div>
          <div className="space-y-2">
            {focusData.insights.map((insight, index) => (
              <div
                key={index}
                className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg"
              >
                <p className="text-blue-700 dark:text-blue-300 text-sm">
                  💡 {insight}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FocusScoreDisplay;