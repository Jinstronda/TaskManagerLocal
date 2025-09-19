import React from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Brain, Clock, Target, TrendingUp, Award, AlertCircle } from 'lucide-react';

interface FocusQualityData {
  deepWorkPercentage: number;
  averageQualityRating: number;
  qualityDistribution: Array<{
    rating: number;
    count: number;
    percentage: number;
  }>;
  sessionTypeBreakdown: Array<{
    type: string;
    count: number;
    averageQuality: number;
    totalTime: number;
    color: string;
  }>;
  qualityTrends: Array<{
    date: string;
    averageQuality: number;
    deepWorkTime: number;
    totalTime: number;
  }>;
  interruptionAnalysis: {
    averageInterruptions: number;
    interruptionImpact: number; // percentage impact on quality
    commonInterruptionTimes: Array<{
      hour: number;
      count: number;
    }>;
  };
  focusMetrics: {
    consistencyScore: number;
    improvementRate: number;
    optimalSessionLength: number;
    qualityPredictors: string[];
  };
}

interface FocusQualityMetricsProps {
  data: FocusQualityData | null;
  isLoading: boolean;
  error: string | null;
}

const FocusQualityMetrics: React.FC<FocusQualityMetricsProps> = ({
  data,
  isLoading,
  error
}) => {
  const formatTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const getQualityColor = (rating: number): string => {
    if (rating >= 4.5) return '#10B981'; // Green
    if (rating >= 3.5) return '#F59E0B'; // Yellow
    if (rating >= 2.5) return '#EF4444'; // Red
    return '#6B7280'; // Gray
  };

  const getQualityLabel = (rating: number): string => {
    if (rating >= 4.5) return 'Excellent';
    if (rating >= 3.5) return 'Good';
    if (rating >= 2.5) return 'Fair';
    return 'Poor';
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900 dark:text-gray-100">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value}
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
          <Brain className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Focus Quality Metrics
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
          <Brain className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Focus Quality Metrics
          </h3>
        </div>
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 mb-2">Error loading metrics</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <div className="flex items-center space-x-3 mb-4">
          <Brain className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Focus Quality Metrics
          </h3>
        </div>
        <div className="text-center">
          <p className="text-gray-500 dark:text-gray-400 mb-2">No quality data available</p>
          <p className="text-sm text-gray-400 dark:text-gray-500">
            Complete more sessions with quality ratings to see metrics
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header and Key Metrics */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <div className="flex items-center space-x-3 mb-6">
          <Brain className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Focus Quality Metrics
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Deep analysis of your focus quality and session effectiveness
            </p>
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg p-4">
            <div className="flex items-center space-x-3 mb-2">
              <Target className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Deep Work %
              </span>
            </div>
            <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
              {data.deepWorkPercentage.toFixed(1)}%
            </p>
            <p className="text-xs text-blue-700 dark:text-blue-300">
              Sessions ≥45min
            </p>
          </div>

          <div className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg p-4">
            <div className="flex items-center space-x-3 mb-2">
              <Award className="w-5 h-5 text-green-600 dark:text-green-400" />
              <span className="text-sm font-medium text-green-900 dark:text-green-100">
                Avg Quality
              </span>
            </div>
            <p className="text-2xl font-bold text-green-900 dark:text-green-100">
              {data.averageQualityRating.toFixed(1)}/5
            </p>
            <p className="text-xs text-green-700 dark:text-green-300">
              {getQualityLabel(data.averageQualityRating)}
            </p>
          </div>

          <div className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg p-4">
            <div className="flex items-center space-x-3 mb-2">
              <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <span className="text-sm font-medium text-purple-900 dark:text-purple-100">
                Consistency
              </span>
            </div>
            <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
              {data.focusMetrics.consistencyScore.toFixed(0)}/100
            </p>
            <p className="text-xs text-purple-700 dark:text-purple-300">
              Score
            </p>
          </div>

          <div className="bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-lg p-4">
            <div className="flex items-center space-x-3 mb-2">
              <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              <span className="text-sm font-medium text-orange-900 dark:text-orange-100">
                Interruptions
              </span>
            </div>
            <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">
              {data.interruptionAnalysis.averageInterruptions.toFixed(1)}
            </p>
            <p className="text-xs text-orange-700 dark:text-orange-300">
              Per session
            </p>
          </div>
        </div>

        {/* Quality Trends Chart */}
        <div className="h-64">
          <h4 className="text-md font-semibold text-gray-900 dark:text-gray-100 mb-3">
            Quality Trends Over Time
          </h4>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.qualityTrends}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="date"
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                domain={[0, 5]}
              />
              <Tooltip 
                labelFormatter={(value) => new Date(value).toLocaleDateString()}
                formatter={(value: number, name: string) => {
                  if (name === 'averageQuality') return [`${value.toFixed(1)}/5`, 'Quality Rating'];
                  if (name === 'deepWorkTime') return [formatTime(value), 'Deep Work Time'];
                  return [value, name];
                }}
              />
              <Line 
                type="monotone" 
                dataKey="averageQuality" 
                stroke="#10B981" 
                strokeWidth={3}
                dot={{ r: 4 }}
                name="Quality Rating"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Quality Distribution and Session Types */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quality Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <h4 className="text-md font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Quality Rating Distribution
          </h4>
          
          <div className="h-48 mb-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.qualityDistribution}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="rating"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => `${value}★`}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {data.qualityDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getQualityColor(entry.rating)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-2">
            {data.qualityDistribution.map((item, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: getQualityColor(item.rating) }}
                  />
                  <span className="text-gray-600 dark:text-gray-400">
                    {item.rating}★ ({getQualityLabel(item.rating)})
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {item.count} sessions
                  </span>
                  <span className="text-gray-500 dark:text-gray-400 ml-2">
                    ({item.percentage.toFixed(1)}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Session Type Breakdown */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <h4 className="text-md font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Quality by Session Type
          </h4>
          
          <div className="h-48 mb-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.sessionTypeBreakdown}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ type, averageQuality }) => 
                    `${type} (${averageQuality.toFixed(1)}★)`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {data.sessionTypeBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number, name: string, props: any) => [
                    `${value} sessions (${formatTime(props.payload.totalTime)})`,
                    `${props.payload.type} - Avg Quality: ${props.payload.averageQuality.toFixed(1)}★`
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-2">
            {data.sessionTypeBreakdown.map((item, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-gray-600 dark:text-gray-400 capitalize">
                    {item.type.replace('_', ' ')}
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {item.averageQuality.toFixed(1)}★
                  </span>
                  <span className="text-gray-500 dark:text-gray-400 ml-2">
                    ({item.count} sessions)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Insights and Recommendations */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <h4 className="text-md font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Focus Quality Insights
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h5 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
              Quality Predictors
            </h5>
            <ul className="space-y-2">
              {data.focusMetrics.qualityPredictors.map((predictor, index) => (
                <li key={index} className="text-sm text-gray-600 dark:text-gray-400 flex items-start space-x-2">
                  <span className="text-green-500 mt-1">✓</span>
                  <span>{predictor}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h5 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
              Interruption Analysis
            </h5>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Quality Impact:</span>
                <span className="font-medium text-red-600 dark:text-red-400">
                  -{data.interruptionAnalysis.interruptionImpact.toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Peak Interruption Time:</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {data.interruptionAnalysis.commonInterruptionTimes.length > 0 
                    ? `${data.interruptionAnalysis.commonInterruptionTimes[0].hour}:00`
                    : 'N/A'
                  }
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Optimal Session Length:</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {formatTime(data.focusMetrics.optimalSessionLength)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FocusQualityMetrics;