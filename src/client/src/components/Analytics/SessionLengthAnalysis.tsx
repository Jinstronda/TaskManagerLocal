import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Clock, Target, Lightbulb, TrendingUp } from 'lucide-react';

interface SessionLengthData {
  averageSessionLength: number;
  optimalSessionLength: number;
  sessionLengthDistribution: Array<{
    durationRange: string;
    count: number;
    averageQuality: number;
  }>;
  recommendations: string[];
}

interface SessionLengthAnalysisProps {
  data: SessionLengthData | null;
  isLoading: boolean;
  error: string | null;
}

const SessionLengthAnalysis: React.FC<SessionLengthAnalysisProps> = ({
  data,
  isLoading,
  error
}) => {
  const formatTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const getQualityColor = (quality: number): string => {
    if (quality >= 4) return '#10B981'; // Green
    if (quality >= 3.5) return '#F59E0B'; // Yellow
    if (quality >= 3) return '#EF4444'; // Red
    return '#6B7280'; // Gray
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900 dark:text-gray-100">{label}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Sessions: {data.count}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Avg Quality: {data.averageQuality.toFixed(1)}/5
          </p>
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <div className="flex items-center space-x-3 mb-4">
          <Clock className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Session Length Analysis
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
          <Clock className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Session Length Analysis
          </h3>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-red-600 dark:text-red-400 mb-2">Error loading analysis</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!data || data.sessionLengthDistribution.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <div className="flex items-center space-x-3 mb-4">
          <Clock className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Session Length Analysis
          </h3>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-gray-500 dark:text-gray-400 mb-2">No session data available</p>
            <p className="text-sm text-gray-400 dark:text-gray-500">
              Complete more focus sessions to see length analysis
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
      <div className="flex items-center space-x-3 mb-6">
        <Clock className="w-5 h-5 text-gray-500 dark:text-gray-400" />
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Session Length Analysis
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Optimize your session duration for better focus
          </p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
              Average Length
            </span>
          </div>
          <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
            {formatTime(data.averageSessionLength)}
          </p>
        </div>

        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Target className="w-4 h-4 text-green-600 dark:text-green-400" />
            <span className="text-sm font-medium text-green-900 dark:text-green-100">
              Optimal Length
            </span>
          </div>
          <p className="text-2xl font-bold text-green-900 dark:text-green-100">
            {formatTime(data.optimalSessionLength)}
          </p>
        </div>
      </div>

      {/* Distribution Chart */}
      <div className="mb-6">
        <h4 className="text-md font-medium text-gray-900 dark:text-gray-100 mb-3">
          Session Length Distribution
        </h4>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.sessionLengthDistribution}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="durationRange" 
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                label={{ value: 'Sessions', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {data.sessionLengthDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getQualityColor(entry.averageQuality)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        {/* Quality Legend */}
        <div className="flex items-center justify-center space-x-4 mt-3 text-xs">
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 rounded bg-red-500"></div>
            <span className="text-gray-600 dark:text-gray-400">Low Quality (&lt;3)</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 rounded bg-yellow-500"></div>
            <span className="text-gray-600 dark:text-gray-400">Good Quality (3-4)</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 rounded bg-green-500"></div>
            <span className="text-gray-600 dark:text-gray-400">High Quality (4+)</span>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      {data.recommendations.length > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-3">
            <Lightbulb className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
            <h4 className="text-sm font-medium text-yellow-900 dark:text-yellow-100">
              Recommendations
            </h4>
          </div>
          <ul className="space-y-2">
            {data.recommendations.map((recommendation, index) => (
              <li key={index} className="text-sm text-yellow-800 dark:text-yellow-200 flex items-start space-x-2">
                <span className="text-yellow-600 dark:text-yellow-400 mt-1">•</span>
                <span>{recommendation}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default SessionLengthAnalysis;