import React, { useEffect, useState } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Calendar, Clock, Target, Activity } from 'lucide-react';

interface HabitStatisticsProps {
  className?: string;
  timeRange?: 'week' | 'month' | 'quarter' | 'year';
}

interface StatisticsData {
  overview: {
    totalSessions: number;
    totalFocusTime: number;
    averageSessionLength: number;
    longestStreak: number;
    currentStreak: number;
    focusScore: number;
  };
  trends: {
    daily: Array<{
      date: string;
      sessions: number;
      focusTime: number;
      score: number;
    }>;
    weekly: Array<{
      week: string;
      sessions: number;
      focusTime: number;
      score: number;
    }>;
  };
  patterns: {
    hourly: Array<{
      hour: number;
      sessions: number;
      avgScore: number;
    }>;
    weekday: Array<{
      day: string;
      sessions: number;
      avgScore: number;
    }>;
  };
  categories: Array<{
    name: string;
    focusTime: number;
    sessions: number;
    color: string;
  }>;
}

/**
 * HabitStatistics Component
 * 
 * Comprehensive dashboard showing habit statistics and trend analysis.
 * Displays focus patterns, productivity insights, and performance metrics.
 * Provides multiple chart types for different data perspectives.
 */
export const HabitStatistics: React.FC<HabitStatisticsProps> = ({
  className = '',
  timeRange = 'month'
}) => {
  const [statistics, setStatistics] = useState<StatisticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'trends' | 'patterns'>('overview');

  useEffect(() => {
    fetchStatistics();
  }, [timeRange]);

  const fetchStatistics = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/focus-score/statistics?range=${timeRange}`);
      if (!response.ok) {
        throw new Error('Failed to fetch statistics');
      }
      
      const data = await response.json();
      setStatistics(data);
    } catch (error) {
      console.error('Error fetching statistics:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
      
      // Fallback to mock data for demonstration
      setStatistics(getMockStatistics());
    } finally {
      setLoading(false);
    }
  };

  const getMockStatistics = (): StatisticsData => ({
    overview: {
      totalSessions: 23,
      totalFocusTime: 1380, // 23 hours in minutes
      averageSessionLength: 60,
      longestStreak: 5,
      currentStreak: 0,
      focusScore: 72
    },
    trends: {
      daily: [
        { date: '2025-09-12', sessions: 3, focusTime: 180, score: 75 },
        { date: '2025-09-13', sessions: 2, focusTime: 120, score: 68 },
        { date: '2025-09-14', sessions: 4, focusTime: 240, score: 82 },
        { date: '2025-09-15', sessions: 1, focusTime: 60, score: 65 },
        { date: '2025-09-16', sessions: 3, focusTime: 180, score: 78 },
        { date: '2025-09-17', sessions: 2, focusTime: 120, score: 70 },
        { date: '2025-09-18', sessions: 0, focusTime: 0, score: 0 }
      ],
      weekly: [
        { week: 'Week 1', sessions: 15, focusTime: 900, score: 74 },
        { week: 'Week 2', sessions: 18, focusTime: 1080, score: 78 },
        { week: 'Week 3', sessions: 12, focusTime: 720, score: 69 },
        { week: 'Week 4', sessions: 8, focusTime: 480, score: 65 }
      ]
    },
    patterns: {
      hourly: [
        { hour: 6, sessions: 2, avgScore: 85 },
        { hour: 7, sessions: 4, avgScore: 82 },
        { hour: 8, sessions: 6, avgScore: 78 },
        { hour: 9, sessions: 8, avgScore: 75 },
        { hour: 10, sessions: 5, avgScore: 73 },
        { hour: 14, sessions: 3, avgScore: 70 },
        { hour: 15, sessions: 4, avgScore: 68 },
        { hour: 16, sessions: 2, avgScore: 65 },
        { hour: 20, sessions: 3, avgScore: 72 },
        { hour: 21, sessions: 2, avgScore: 70 }
      ],
      weekday: [
        { day: 'Mon', sessions: 8, avgScore: 76 },
        { day: 'Tue', sessions: 6, avgScore: 74 },
        { day: 'Wed', sessions: 7, avgScore: 78 },
        { day: 'Thu', sessions: 5, avgScore: 72 },
        { day: 'Fri', sessions: 4, avgScore: 69 },
        { day: 'Sat', sessions: 2, avgScore: 65 },
        { day: 'Sun', sessions: 3, avgScore: 68 }
      ]
    },
    categories: [
      { name: 'Work & Business', focusTime: 600, sessions: 10, color: '#3b82f6' },
      { name: 'Learning', focusTime: 360, sessions: 6, color: '#10b981' },
      { name: 'Creative', focusTime: 240, sessions: 4, color: '#f59e0b' },
      { name: 'Personal', focusTime: 180, sessions: 3, color: '#ef4444' }
    ]
  });

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const formatHour = (hour: number) => {
    if (hour === 0) return '12 AM';
    if (hour < 12) return `${hour} AM`;
    if (hour === 12) return '12 PM';
    return `${hour - 12} PM`;
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg p-3">
          <p className="font-medium text-gray-900 dark:text-white mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="text-sm">
              <span style={{ color: entry.color }}>{entry.name}: </span>
              <span className="font-medium">
                {entry.dataKey === 'focusTime' ? formatTime(entry.value) : entry.value}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className={`animate-pulse bg-gray-100 dark:bg-gray-800 rounded-lg p-6 ${className}`}>
        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/2 mb-6"></div>
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-16 bg-gray-300 dark:bg-gray-600 rounded"></div>
          ))}
        </div>
        <div className="h-64 bg-gray-300 dark:bg-gray-600 rounded"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 ${className}`}>
        <div className="flex items-center gap-2 text-red-600 dark:text-red-400 mb-2">
          <Activity className="w-5 h-5" />
          <span className="font-medium">Error Loading Statistics</span>
        </div>
        <p className="text-red-600 dark:text-red-400 text-sm mb-3">{error}</p>
        <button
          onClick={fetchStatistics}
          className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-sm font-medium"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!statistics) {
    return (
      <div className={`bg-gray-50 dark:bg-gray-800 rounded-lg p-6 ${className}`}>
        <div className="text-center">
          <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No Statistics Available
          </h4>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Complete some focus sessions to see your statistics.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Habit Statistics
          </h3>
        </div>
        
        {/* Tab Navigation */}
        <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
          {(['overview', 'trends', 'patterns'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                activeTab === tab
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && statistics && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {statistics.overview?.totalSessions || 0}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Total Sessions
              </div>
            </div>
            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {formatTime(statistics.overview?.totalFocusTime || 0)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Focus Time
              </div>
            </div>
            <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {statistics.overview?.longestStreak || 0}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Longest Streak
              </div>
            </div>
            <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {statistics.overview?.focusScore || 0}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Focus Score
              </div>
            </div>
          </div>

          {/* Category Distribution */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
              Focus Time by Category
            </h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statistics.categories || []}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="focusTime"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {(statistics.categories || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatTime(value as number)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Trends Tab */}
      {activeTab === 'trends' && statistics && (
        <div className="space-y-6">
          {/* Daily Trend */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
              Daily Focus Time (Last 7 Days)
            </h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={statistics.trends?.daily || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                  <XAxis 
                    dataKey="date" 
                    stroke="#6b7280"
                    fontSize={12}
                    tick={{ fill: '#6b7280' }}
                    tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  />
                  <YAxis 
                    stroke="#6b7280"
                    fontSize={12}
                    tick={{ fill: '#6b7280' }}
                    tickFormatter={(value) => `${Math.round(value / 60)}h`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Line 
                    type="monotone" 
                    dataKey="focusTime" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    name="Focus Time"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Weekly Sessions */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
              Weekly Sessions
            </h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statistics.trends?.weekly || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                  <XAxis 
                    dataKey="week" 
                    stroke="#6b7280"
                    fontSize={12}
                    tick={{ fill: '#6b7280' }}
                  />
                  <YAxis 
                    stroke="#6b7280"
                    fontSize={12}
                    tick={{ fill: '#6b7280' }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="sessions" fill="#10b981" name="Sessions" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Patterns Tab */}
      {activeTab === 'patterns' && statistics && (
        <div className="space-y-6">
          {/* Hourly Pattern */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
              Focus Sessions by Hour
            </h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statistics.patterns?.hourly || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                  <XAxis 
                    dataKey="hour" 
                    stroke="#6b7280"
                    fontSize={12}
                    tick={{ fill: '#6b7280' }}
                    tickFormatter={formatHour}
                  />
                  <YAxis 
                    stroke="#6b7280"
                    fontSize={12}
                    tick={{ fill: '#6b7280' }}
                  />
                  <Tooltip 
                    labelFormatter={formatHour}
                    content={<CustomTooltip />}
                  />
                  <Bar dataKey="sessions" fill="#f59e0b" name="Sessions" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Weekday Pattern */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
              Focus Sessions by Day of Week
            </h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statistics.patterns?.weekday || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                  <XAxis 
                    dataKey="day" 
                    stroke="#6b7280"
                    fontSize={12}
                    tick={{ fill: '#6b7280' }}
                  />
                  <YAxis 
                    stroke="#6b7280"
                    fontSize={12}
                    tick={{ fill: '#6b7280' }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="sessions" fill="#8b5cf6" name="Sessions" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HabitStatistics;