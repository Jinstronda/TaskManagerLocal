import React, { useState } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { TrendingUp, TrendingDown, Minus, Calendar, ArrowUp, ArrowDown, RotateCcw } from 'lucide-react';

interface ComparisonData {
  weekOverWeek: Array<{
    metric: string;
    currentWeek: number;
    previousWeek: number;
    change: number;
    changePercentage: number;
    trend: 'up' | 'down' | 'stable';
  }>;
  monthOverMonth: Array<{
    metric: string;
    currentMonth: number;
    previousMonth: number;
    change: number;
    changePercentage: number;
    trend: 'up' | 'down' | 'stable';
  }>;
  periodComparison: Array<{
    period: string;
    focusTime: number;
    sessions: number;
    averageQuality: number;
    goalsAchieved: number;
    focusScore: number;
  }>;
  trendAnalysis: {
    overallTrend: 'improving' | 'declining' | 'stable';
    strongestImprovement: string;
    biggestDecline: string;
    consistencyRating: number;
    recommendations: string[];
  };
}

interface ComparativeAnalysisProps {
  data: ComparisonData | null;
  isLoading: boolean;
  error: string | null;
  comparisonType: 'week' | 'month';
  onComparisonTypeChange: (type: 'week' | 'month') => void;
}

const ComparativeAnalysis: React.FC<ComparativeAnalysisProps> = ({
  data,
  isLoading,
  error,
  comparisonType,
  onComparisonTypeChange
}) => {
  const [selectedMetric, setSelectedMetric] = useState<string>('focusTime');

  const formatTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const formatChange = (change: number, isTime: boolean = false): string => {
    const absChange = Math.abs(change);
    const formatted = isTime ? formatTime(absChange) : absChange.toFixed(1);
    return change >= 0 ? `+${formatted}` : `-${formatted}`;
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable', size: string = 'w-4 h-4') => {
    switch (trend) {
      case 'up':
        return <ArrowUp className={`${size} text-green-500`} />;
      case 'down':
        return <ArrowDown className={`${size} text-red-500`} />;
      default:
        return <Minus className={`${size} text-gray-500`} />;
    }
  };

  const getTrendColor = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return 'text-green-600 dark:text-green-400';
      case 'down':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-green-600 dark:text-green-400';
    if (change < 0) return 'text-red-600 dark:text-red-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900 dark:text-gray-100">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {
                entry.dataKey.includes('Time') || entry.dataKey.includes('focusTime') 
                  ? formatTime(entry.value)
                  : entry.value
              }
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <div className="flex items-center space-x-3 mb-4">
          <TrendingUp className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Comparative Analysis
          </h3>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <div className="flex items-center space-x-3 mb-4">
          <TrendingUp className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Comparative Analysis
          </h3>
        </div>
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 mb-2">Error loading comparison</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <div className="flex items-center space-x-3 mb-4">
          <TrendingUp className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Comparative Analysis
          </h3>
        </div>
        <div className="text-center">
          <p className="text-gray-500 dark:text-gray-400 mb-2">No comparison data available</p>
          <p className="text-sm text-gray-400 dark:text-gray-500">
            Need at least 2 weeks of data to show comparisons
          </p>
        </div>
      </div>
    );
  }

  const currentComparison = comparisonType === 'week' ? data.weekOverWeek : data.monthOverMonth;

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <TrendingUp className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Comparative Analysis
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Track your progress with period-over-period comparisons
              </p>
            </div>
          </div>

          <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => onComparisonTypeChange('week')}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                comparisonType === 'week'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              Week over Week
            </button>
            <button
              onClick={() => onComparisonTypeChange('month')}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                comparisonType === 'month'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              Month over Month
            </button>
          </div>
        </div>

        {/* Overall Trend Summary */}
        {data.trendAnalysis && (
          <div className="mb-6 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-md font-semibold text-indigo-900 dark:text-indigo-100">
                Overall Trend: {data.trendAnalysis.overallTrend.charAt(0).toUpperCase() + data.trendAnalysis.overallTrend.slice(1)}
              </h4>
              <div className="flex items-center space-x-2">
                {getTrendIcon(
                  data.trendAnalysis.overallTrend === 'improving' ? 'up' : 
                  data.trendAnalysis.overallTrend === 'declining' ? 'down' : 'stable',
                  'w-5 h-5'
                )}
                <span className="text-sm font-medium text-indigo-700 dark:text-indigo-300">
                  Consistency: {data.trendAnalysis.consistencyRating.toFixed(0)}/100
                </span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
              <div>
                <p className="text-sm text-indigo-800 dark:text-indigo-200">
                  <span className="font-medium">Strongest Improvement:</span> {data.trendAnalysis.strongestImprovement}
                </p>
              </div>
              <div>
                <p className="text-sm text-indigo-800 dark:text-indigo-200">
                  <span className="font-medium">Biggest Decline:</span> {data.trendAnalysis.biggestDecline}
                </p>
              </div>
            </div>

            {data.trendAnalysis.recommendations.length > 0 && (
              <div>
                <p className="text-sm font-medium text-indigo-900 dark:text-indigo-100 mb-2">
                  Recommendations:
                </p>
                <ul className="space-y-1">
                  {data.trendAnalysis.recommendations.map((rec, index) => (
                    <li key={index} className="text-sm text-indigo-800 dark:text-indigo-200 flex items-start space-x-2">
                      <span className="text-indigo-600 dark:text-indigo-400 mt-1">•</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Comparison Chart */}
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.periodComparison}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="period"
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => 
                  selectedMetric === 'focusTime' ? formatTime(value) : value
                }
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar 
                dataKey={selectedMetric} 
                fill="#3B82F6" 
                radius={[4, 4, 0, 0]}
                name={selectedMetric === 'focusTime' ? 'Focus Time' : 
                      selectedMetric === 'sessions' ? 'Sessions' :
                      selectedMetric === 'averageQuality' ? 'Avg Quality' :
                      selectedMetric === 'goalsAchieved' ? 'Goals Achieved' :
                      'Focus Score'}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Metric Selector */}
        <div className="mt-4 flex flex-wrap gap-2">
          {[
            { key: 'focusTime', label: 'Focus Time' },
            { key: 'sessions', label: 'Sessions' },
            { key: 'averageQuality', label: 'Quality' },
            { key: 'goalsAchieved', label: 'Goals' },
            { key: 'focusScore', label: 'Score' }
          ].map((metric) => (
            <button
              key={metric.key}
              onClick={() => setSelectedMetric(metric.key)}
              className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                selectedMetric === metric.key
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {metric.label}
            </button>
          ))}
        </div>
      </div>

      {/* Detailed Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {currentComparison.map((item, index) => (
          <div key={index} className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 capitalize">
                {item.metric.replace(/([A-Z])/g, ' $1').trim()}
              </h4>
              {getTrendIcon(item.trend)}
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Current {comparisonType}:
                </span>
                <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  {item.metric.toLowerCase().includes('time') 
                    ? formatTime(item.currentWeek || item.currentMonth)
                    : (item.currentWeek || item.currentMonth).toFixed(1)
                  }
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Previous {comparisonType}:
                </span>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {item.metric.toLowerCase().includes('time') 
                    ? formatTime(item.previousWeek || item.previousMonth)
                    : (item.previousWeek || item.previousMonth).toFixed(1)
                  }
                </span>
              </div>

              <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Change:
                  </span>
                  <div className="text-right">
                    <span className={`text-sm font-bold ${getChangeColor(item.change)}`}>
                      {formatChange(item.change, item.metric.toLowerCase().includes('time'))}
                    </span>
                    <span className={`text-xs ml-2 ${getChangeColor(item.changePercentage)}`}>
                      ({item.changePercentage >= 0 ? '+' : ''}{item.changePercentage.toFixed(1)}%)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Period Comparison Timeline */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          {comparisonType === 'week' ? 'Weekly' : 'Monthly'} Progress Timeline
        </h4>
        
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.periodComparison}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="period"
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => formatTime(value)}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="focusTime"
                stackId="1"
                stroke="#3B82F6"
                fill="#3B82F6"
                fillOpacity={0.6}
                name="Focus Time"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default ComparativeAnalysis;