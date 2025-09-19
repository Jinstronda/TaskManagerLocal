import React, { useState } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Target, Award, TrendingUp, Calendar, Clock, Star, CheckCircle, AlertTriangle } from 'lucide-react';

interface GoalProgressData {
  categoryGoals: Array<{
    categoryId: number;
    categoryName: string;
    categoryColor: string;
    weeklyGoal: number;
    currentProgress: number;
    percentage: number;
    isCompleted: boolean;
    streak: number;
    bestWeek: number;
    averageWeekly: number;
    trend: 'up' | 'down' | 'stable';
  }>;
  milestones: Array<{
    id: number;
    title: string;
    description: string;
    targetValue: number;
    currentValue: number;
    unit: string;
    category: string;
    isCompleted: boolean;
    completedDate?: string;
    daysRemaining?: number;
    icon: string;
  }>;
  weeklyProgress: Array<{
    week: string;
    totalGoals: number;
    completedGoals: number;
    completionRate: number;
    totalTime: number;
  }>;
  achievements: Array<{
    id: number;
    title: string;
    description: string;
    earnedDate: string;
    category: string;
    icon: string;
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
  }>;
}

interface GoalProgressVisualizationProps {
  data: GoalProgressData | null;
  isLoading: boolean;
  error: string | null;
}

const GoalProgressVisualization: React.FC<GoalProgressVisualizationProps> = ({
  data,
  isLoading,
  error
}) => {
  const [activeTab, setActiveTab] = useState<'goals' | 'milestones' | 'achievements'>('goals');

  const formatTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'down':
        return <TrendingUp className="w-4 h-4 text-red-500 rotate-180" />;
      default:
        return <TrendingUp className="w-4 h-4 text-gray-500" />;
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary':
        return 'from-yellow-400 to-orange-500';
      case 'epic':
        return 'from-purple-400 to-pink-500';
      case 'rare':
        return 'from-blue-400 to-indigo-500';
      default:
        return 'from-gray-400 to-gray-500';
    }
  };

  const getRarityBorder = (rarity: string) => {
    switch (rarity) {
      case 'legendary':
        return 'border-yellow-400';
      case 'epic':
        return 'border-purple-400';
      case 'rare':
        return 'border-blue-400';
      default:
        return 'border-gray-400';
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <div className="flex items-center space-x-3 mb-4">
          <Target className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Goal Progress & Milestones
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
          <Target className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Goal Progress & Milestones
          </h3>
        </div>
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 mb-2">Error loading goal progress</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <div className="flex items-center space-x-3 mb-4">
          <Target className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Goal Progress & Milestones
          </h3>
        </div>
        <div className="text-center">
          <p className="text-gray-500 dark:text-gray-400 mb-2">No goal data available</p>
          <p className="text-sm text-gray-400 dark:text-gray-500">
            Set up weekly goals for your categories to track progress
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Target className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Goal Progress & Milestones
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Track your progress toward weekly goals and long-term milestones
              </p>
            </div>
          </div>

          <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('goals')}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'goals'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              Goals
            </button>
            <button
              onClick={() => setActiveTab('milestones')}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'milestones'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              Milestones
            </button>
            <button
              onClick={() => setActiveTab('achievements')}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'achievements'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              Achievements
            </button>
          </div>
        </div>

        {/* Weekly Progress Chart */}
        {activeTab === 'goals' && (
          <div className="h-64 mb-6">
            <h4 className="text-md font-semibold text-gray-900 dark:text-gray-100 mb-3">
              Weekly Goal Completion Rate
            </h4>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.weeklyProgress}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="week"
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  domain={[0, 100]}
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip 
                  formatter={(value: number, name: string) => {
                    if (name === 'completionRate') return [`${value.toFixed(1)}%`, 'Completion Rate'];
                    if (name === 'totalTime') return [formatTime(value), 'Total Time'];
                    return [value, name];
                  }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="completionRate" 
                  stroke="#10B981" 
                  strokeWidth={3}
                  dot={{ r: 6 }}
                  name="Completion Rate"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Goals Tab */}
      {activeTab === 'goals' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.categoryGoals.map((goal, index) => (
            <div key={index} className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: goal.categoryColor }}
                  />
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {goal.categoryName}
                  </h4>
                </div>
                <div className="flex items-center space-x-2">
                  {getTrendIcon(goal.trend)}
                  {goal.isCompleted && (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  )}
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Progress
                  </span>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {formatTime(goal.currentProgress)} / {formatTime(goal.weeklyGoal)}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all duration-300 ${
                      goal.isCompleted 
                        ? 'bg-green-500' 
                        : goal.percentage > 75 
                          ? 'bg-yellow-500' 
                          : 'bg-blue-500'
                    }`}
                    style={{ width: `${Math.min(goal.percentage, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {goal.percentage.toFixed(1)}% complete
                  </span>
                  {goal.isCompleted && (
                    <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                      ✓ Goal achieved!
                    </span>
                  )}
                </div>
              </div>

              {/* Goal Stats */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Streak:</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {goal.streak} weeks
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Best Week:</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {formatTime(goal.bestWeek)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Average:</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {formatTime(goal.averageWeekly)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Milestones Tab */}
      {activeTab === 'milestones' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {data.milestones.map((milestone, index) => (
            <div key={index} className={`bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border-l-4 ${
              milestone.isCompleted ? 'border-green-500' : 'border-blue-500'
            }`}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start space-x-3">
                  <div className={`p-2 rounded-lg ${
                    milestone.isCompleted 
                      ? 'bg-green-100 dark:bg-green-900/20' 
                      : 'bg-blue-100 dark:bg-blue-900/20'
                  }`}>
                    {milestone.isCompleted ? (
                      <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                    ) : (
                      <Target className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {milestone.title}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {milestone.description}
                    </p>
                  </div>
                </div>
                
                {!milestone.isCompleted && milestone.daysRemaining && (
                  <div className="text-right">
                    <span className="text-sm font-medium text-orange-600 dark:text-orange-400">
                      {milestone.daysRemaining} days left
                    </span>
                  </div>
                )}
              </div>

              {/* Progress */}
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Progress
                  </span>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {milestone.currentValue} / {milestone.targetValue} {milestone.unit}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      milestone.isCompleted ? 'bg-green-500' : 'bg-blue-500'
                    }`}
                    style={{ 
                      width: `${Math.min((milestone.currentValue / milestone.targetValue) * 100, 100)}%` 
                    }}
                  />
                </div>
              </div>

              {milestone.isCompleted && milestone.completedDate && (
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
                  <p className="text-sm text-green-800 dark:text-green-200">
                    🎉 Completed on {new Date(milestone.completedDate).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Achievements Tab */}
      {activeTab === 'achievements' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.achievements.map((achievement, index) => (
            <div key={index} className={`bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border-2 ${getRarityBorder(achievement.rarity)}`}>
              <div className="flex items-center space-x-3 mb-4">
                <div className={`p-3 rounded-lg bg-gradient-to-r ${getRarityColor(achievement.rarity)}`}>
                  <Award className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {achievement.title}
                  </h4>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${
                    achievement.rarity === 'legendary' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300' :
                    achievement.rarity === 'epic' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300' :
                    achievement.rarity === 'rare' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300' :
                    'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                  }`}>
                    {achievement.rarity}
                  </span>
                </div>
              </div>

              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                {achievement.description}
              </p>

              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">
                  {achievement.category}
                </span>
                <span className="text-gray-500 dark:text-gray-400">
                  {new Date(achievement.earnedDate).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GoalProgressVisualization;