import React, { useEffect, useState } from 'react';
import { Target, Plus, Edit2, Trash2, Save, X } from 'lucide-react';
import { useWeeklyGoalsStore } from '../../stores/weeklyGoalsStore';
import { useCategoryStore } from '../../stores/categoryStore';

interface WeeklyGoalsManagerProps {
  className?: string;
}

/**
 * WeeklyGoalsManager Component
 * 
 * Manages weekly goals for different categories.
 * Allows users to set, edit, and delete weekly time targets.
 * Shows current progress and goal management interface.
 */
export const WeeklyGoalsManager: React.FC<WeeklyGoalsManagerProps> = ({
  className = ''
}) => {
  const {
    currentWeekProgress,
    loading,
    error,
    fetchCurrentWeekProgress,
    updateCategoryGoal,
    clearError
  } = useWeeklyGoalsStore();

  const { categories, fetchCategories } = useCategoryStore();

  const [editingGoal, setEditingGoal] = useState<number | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [newGoalValue, setNewGoalValue] = useState<string>('');

  useEffect(() => {
    fetchCurrentWeekProgress();
    fetchCategories();
  }, [fetchCurrentWeekProgress, fetchCategories]);

  const handleEditGoal = (categoryId: number, currentTarget: number) => {
    setEditingGoal(categoryId);
    setEditValue(currentTarget.toString());
  };

  const handleSaveGoal = async (categoryId: number) => {
    const targetMinutes = parseInt(editValue);
    if (isNaN(targetMinutes) || targetMinutes < 0) {
      return;
    }

    try {
      await updateCategoryGoal(categoryId, targetMinutes);
      setEditingGoal(null);
      setEditValue('');
    } catch (error) {
      console.error('Failed to update goal:', error);
    }
  };

  const handleCancelEdit = () => {
    setEditingGoal(null);
    setEditValue('');
  };

  const handleAddGoal = async () => {
    if (!selectedCategory) return;
    
    const targetMinutes = parseInt(newGoalValue);
    if (isNaN(targetMinutes) || targetMinutes < 0) {
      return;
    }

    try {
      await updateCategoryGoal(selectedCategory, targetMinutes);
      setShowAddGoal(false);
      setSelectedCategory(null);
      setNewGoalValue('');
    } catch (error) {
      console.error('Failed to add goal:', error);
    }
  };

  const handleDeleteGoal = async (categoryId: number) => {
    try {
      await updateCategoryGoal(categoryId, 0);
    } catch (error) {
      console.error('Failed to delete goal:', error);
    }
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return 'bg-green-500';
    if (percentage >= 75) return 'bg-blue-500';
    if (percentage >= 50) return 'bg-yellow-500';
    return 'bg-gray-400';
  };

  const getAvailableCategories = () => {
    const existingGoalCategoryIds = currentWeekProgress?.goals.map(g => g.categoryId) || [];
    return categories.filter(cat => !existingGoalCategoryIds.includes(cat.id));
  };

  if (loading.currentWeek) {
    return (
      <div className={`animate-pulse bg-gray-100 dark:bg-gray-800 rounded-lg p-6 ${className}`}>
        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/2 mb-4"></div>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-4 h-4 bg-gray-300 dark:bg-gray-600 rounded"></div>
              <div className="flex-1 h-3 bg-gray-300 dark:bg-gray-600 rounded"></div>
              <div className="w-16 h-3 bg-gray-300 dark:bg-gray-600 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 ${className}`}>
        <div className="flex items-center gap-2 text-red-600 dark:text-red-400 mb-2">
          <Target className="w-5 h-5" />
          <span className="font-medium">Error Loading Goals</span>
        </div>
        <p className="text-red-600 dark:text-red-400 text-sm mb-3">{error}</p>
        <button
          onClick={() => {
            clearError();
            fetchCurrentWeekProgress();
          }}
          className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-sm font-medium"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Weekly Goals
          </h3>
        </div>
        
        {getAvailableCategories().length > 0 && (
          <button
            onClick={() => setShowAddGoal(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-3 rounded-md transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Goal
          </button>
        )}
      </div>

      {/* Week Info */}
      {currentWeekProgress && (
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Week of {new Date(currentWeekProgress.weekStart).toLocaleDateString()}
            </span>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {currentWeekProgress.completedGoals} of {currentWeekProgress.totalGoals} goals completed
            </span>
          </div>
          
          {/* Overall Progress */}
          <div className="mb-2">
            <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
              <span>Overall Progress</span>
              <span>{Math.round(currentWeekProgress.overallProgressPercentage)}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-500 ${getProgressColor(currentWeekProgress.overallProgressPercentage)}`}
                style={{ width: `${Math.min(100, currentWeekProgress.overallProgressPercentage)}%` }}
              ></div>
            </div>
          </div>
          
          <div className="text-xs text-gray-600 dark:text-gray-400">
            {formatTime(currentWeekProgress.totalCurrentMinutes)} of {formatTime(currentWeekProgress.totalTargetMinutes)}
          </div>
        </div>
      )}

      {/* Goals List */}
      {currentWeekProgress?.goals && currentWeekProgress.goals.length > 0 ? (
        <div className="space-y-4">
          {currentWeekProgress.goals.map((goal) => (
            <div
              key={goal.categoryId}
              className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: goal.categoryColor }}
                  ></div>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {goal.categoryName}
                  </span>
                  {goal.isCompleted && (
                    <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs font-medium px-2 py-1 rounded-full">
                      Completed
                    </span>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  {editingGoal === goal.categoryId ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="w-20 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        min="0"
                        placeholder="Minutes"
                      />
                      <button
                        onClick={() => handleSaveGoal(goal.categoryId)}
                        disabled={loading.updateGoal}
                        className="p-1 text-green-600 hover:text-green-700 disabled:opacity-50"
                      >
                        <Save className="w-4 h-4" />
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="p-1 text-gray-600 hover:text-gray-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEditGoal(goal.categoryId, goal.targetMinutes)}
                        className="p-1 text-gray-600 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteGoal(goal.categoryId)}
                        className="p-1 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="mb-2">
                <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                  <span>{formatTime(goal.currentMinutes)} / {formatTime(goal.targetMinutes)}</span>
                  <span>{Math.round(goal.progressPercentage)}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${getProgressColor(goal.progressPercentage)}`}
                    style={{ width: `${Math.min(100, goal.progressPercentage)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No Weekly Goals Set
          </h4>
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
            Set weekly time goals for your categories to track your progress.
          </p>
          {getAvailableCategories().length > 0 && (
            <button
              onClick={() => setShowAddGoal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
            >
              Set Your First Goal
            </button>
          )}
        </div>
      )}

      {/* Add Goal Modal */}
      {showAddGoal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Add Weekly Goal
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Category
                </label>
                <select
                  value={selectedCategory || ''}
                  onChange={(e) => setSelectedCategory(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">Select a category</option>
                  {getAvailableCategories().map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Target Minutes per Week
                </label>
                <input
                  type="number"
                  value={newGoalValue}
                  onChange={(e) => setNewGoalValue(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  min="0"
                  placeholder="e.g., 120 (2 hours)"
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowAddGoal(false);
                  setSelectedCategory(null);
                  setNewGoalValue('');
                }}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleAddGoal}
                disabled={!selectedCategory || !newGoalValue || loading.updateGoal}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-md transition-colors"
              >
                {loading.updateGoal ? 'Adding...' : 'Add Goal'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WeeklyGoalsManager;