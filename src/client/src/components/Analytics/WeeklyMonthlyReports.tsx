import React, { useState } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Calendar, TrendingUp, Clock, Target, Award, ChevronDown, FileText } from 'lucide-react';

interface ReportData {
  weeklyReports: Array<{
    weekStart: string;
    weekEnd: string;
    totalFocusTime: number;
    sessionsCompleted: number;
    averageSessionLength: number;
    focusScore: number;
    topCategory: string;
    goalsAchieved: number;
    totalGoals: number;
  }>;
  monthlyReports: Array<{
    month: string;
    year: number;
    totalFocusTime: number;
    sessionsCompleted: number;
    averageSessionLength: number;
    focusScore: number;
    topCategory: string;
    goalsAchieved: number;
    totalGoals: number;
    weeklyBreakdown: Array<{
      week: number;
      focusTime: number;
      sessions: number;
    }>;
  }>;
  trendAnalysis: {
    focusTimeTrend: 'increasing' | 'decreasing' | 'stable';
    sessionQualityTrend: 'improving' | 'declining' | 'stable';
    consistencyScore: number;
    recommendations: string[];
  };
}

interface WeeklyMonthlyReportsProps {
  data: ReportData | null;
  isLoading: boolean;
  error: string | null;
  startDate: string;
  endDate: string;
}

const WeeklyMonthlyReports: React.FC<WeeklyMonthlyReportsProps> = ({
  data,
  isLoading,
  error,
  startDate,
  endDate
}) => {
  const [reportType, setReportType] = useState<'weekly' | 'monthly'>('weekly');
  const [showTrends, setShowTrends] = useState(true);

  const formatTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const formatDate = (dateStr: string): string => {
    return new Date(dateStr).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing':
      case 'improving':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'decreasing':
      case 'declining':
        return <TrendingUp className="w-4 h-4 text-red-500 rotate-180" />;
      default:
        return <TrendingUp className="w-4 h-4 text-gray-500" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'increasing':
      case 'improving':
        return 'text-green-600 dark:text-green-400';
      case 'decreasing':
      case 'declining':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <div className="flex items-center space-x-3 mb-4">
          <FileText className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Weekly & Monthly Reports
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
          <FileText className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Weekly & Monthly Reports
          </h3>
        </div>
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 mb-2">Error loading reports</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  if (!data || (data.weeklyReports.length === 0 && data.monthlyReports.length === 0)) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <div className="flex items-center space-x-3 mb-4">
          <FileText className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Weekly & Monthly Reports
          </h3>
        </div>
        <div className="text-center">
          <p className="text-gray-500 dark:text-gray-400 mb-2">No report data available</p>
          <p className="text-sm text-gray-400 dark:text-gray-500">
            Complete more sessions to generate comprehensive reports
          </p>
        </div>
      </div>
    );
  }

  const currentReports = reportType === 'weekly' ? data.weeklyReports : data.monthlyReports;

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <FileText className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Productivity Reports
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Comprehensive analysis of your focus patterns and progress
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => setReportType('weekly')}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                  reportType === 'weekly'
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                }`}
              >
                Weekly
              </button>
              <button
                onClick={() => setReportType('monthly')}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                  reportType === 'monthly'
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                }`}
              >
                Monthly
              </button>
            </div>

            <button
              onClick={() => setShowTrends(!showTrends)}
              className="flex items-center space-x-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors"
            >
              <TrendingUp className="w-4 h-4" />
              <span>Trends</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${showTrends ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>

        {/* Trend Analysis */}
        {showTrends && data.trendAnalysis && (
          <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <h4 className="text-md font-semibold text-blue-900 dark:text-blue-100 mb-3">
              Trend Analysis
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="flex items-center space-x-3">
                {getTrendIcon(data.trendAnalysis.focusTimeTrend)}
                <div>
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    Focus Time
                  </p>
                  <p className={`text-sm capitalize ${getTrendColor(data.trendAnalysis.focusTimeTrend)}`}>
                    {data.trendAnalysis.focusTimeTrend}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                {getTrendIcon(data.trendAnalysis.sessionQualityTrend)}
                <div>
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    Session Quality
                  </p>
                  <p className={`text-sm capitalize ${getTrendColor(data.trendAnalysis.sessionQualityTrend)}`}>
                    {data.trendAnalysis.sessionQualityTrend}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Award className="w-4 h-4 text-purple-500" />
                <div>
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    Consistency Score
                  </p>
                  <p className="text-sm text-purple-600 dark:text-purple-400">
                    {data.trendAnalysis.consistencyScore.toFixed(1)}/100
                  </p>
                </div>
              </div>
            </div>

            {data.trendAnalysis.recommendations.length > 0 && (
              <div>
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                  Recommendations:
                </p>
                <ul className="space-y-1">
                  {data.trendAnalysis.recommendations.map((rec, index) => (
                    <li key={index} className="text-sm text-blue-800 dark:text-blue-200 flex items-start space-x-2">
                      <span className="text-blue-600 dark:text-blue-400 mt-1">•</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Reports Chart */}
        <div className="h-64 mb-6">
          <ResponsiveContainer width="100%" height="100%">
            {reportType === 'weekly' ? (
              <BarChart data={data.weeklyReports}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="weekStart"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => formatDate(value)}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => formatTime(value)}
                />
                <Tooltip 
                  labelFormatter={(value) => `Week of ${formatDate(value)}`}
                  formatter={(value: number, name: string) => {
                    if (name === 'totalFocusTime') return [formatTime(value), 'Focus Time'];
                    if (name === 'focusScore') return [`${value.toFixed(1)}/100`, 'Focus Score'];
                    return [value, name];
                  }}
                />
                <Legend />
                <Bar dataKey="totalFocusTime" fill="#3B82F6" name="Focus Time" radius={[4, 4, 0, 0]} />
                <Bar dataKey="focusScore" fill="#10B981" name="Focus Score" radius={[4, 4, 0, 0]} />
              </BarChart>
            ) : (
              <LineChart data={data.monthlyReports}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="month"
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => formatTime(value)}
                />
                <Tooltip 
                  formatter={(value: number, name: string) => {
                    if (name === 'totalFocusTime') return [formatTime(value), 'Focus Time'];
                    if (name === 'focusScore') return [`${value.toFixed(1)}/100`, 'Focus Score'];
                    return [value, name];
                  }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="totalFocusTime" 
                  stroke="#3B82F6" 
                  strokeWidth={3}
                  dot={{ r: 6 }}
                  name="Focus Time"
                />
                <Line 
                  type="monotone" 
                  dataKey="focusScore" 
                  stroke="#10B981" 
                  strokeWidth={3}
                  dot={{ r: 6 }}
                  name="Focus Score"
                />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* Report Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {currentReports.map((report, index) => (
          <div key={index} className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {reportType === 'weekly' 
                    ? `Week ${formatDate(report.weekStart)}`
                    : `${report.month} ${report.year}`
                  }
                </h4>
                {reportType === 'weekly' && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {formatDate(report.weekStart)} - {formatDate(report.weekEnd)}
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {formatTime(report.totalFocusTime)}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Total Focus Time
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Sessions</span>
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {report.sessionsCompleted}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Avg Length</span>
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {formatTime(report.averageSessionLength)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Award className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Focus Score</span>
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {report.focusScore.toFixed(1)}/100
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Target className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Goals</span>
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {report.goalsAchieved}/{report.totalGoals}
                </span>
              </div>

              <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Top Category: <span className="font-medium text-gray-900 dark:text-gray-100">{report.topCategory}</span>
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WeeklyMonthlyReports;