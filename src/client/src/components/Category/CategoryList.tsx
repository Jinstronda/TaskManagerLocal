import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, AlertTriangle, Folder, FolderOpen } from 'lucide-react';
import { Category } from '../../../../shared/types';
import { useCategoriesData, useCategoryActions } from '../../stores/categoryStore';
import { CategoryForm } from './CategoryForm';

interface CategoryListProps {
  showTaskCounts?: boolean;
  showWeeklyProgress?: boolean;
  onCategorySelect?: (category: Category) => void;
  selectedCategoryId?: number;
  className?: string;
}

interface DeleteConfirmationProps {
  category: Category;
  taskCount: number;
  availableCategories: Category[];
  onConfirm: (reassignToCategoryId?: number) => void;
  onCancel: () => void;
}

const DeleteConfirmation: React.FC<DeleteConfirmationProps> = ({
  category,
  taskCount,
  availableCategories,
  onConfirm,
  onCancel,
}) => {
  const [reassignToCategoryId, setReassignToCategoryId] = useState<number | undefined>();

  const handleConfirm = () => {
    onConfirm(reassignToCategoryId);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
        <div className="p-6">
          <div className="flex items-center space-x-3 mb-4">
            <AlertTriangle className="w-6 h-6 text-red-500" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Delete Category
            </h3>
          </div>

          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Are you sure you want to delete the category "{category.name}"?
          </p>

          {taskCount > 0 && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-4 mb-4">
              <p className="text-yellow-800 dark:text-yellow-200 text-sm mb-3">
                This category has {taskCount} task{taskCount !== 1 ? 's' : ''}. 
                You must reassign them to another category before deletion.
              </p>
              
              <label className="block text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                Reassign tasks to:
              </label>
              <select
                value={reassignToCategoryId || ''}
                onChange={(e) => setReassignToCategoryId(e.target.value ? parseInt(e.target.value) : undefined)}
                className="w-full px-3 py-2 border border-yellow-300 dark:border-yellow-700 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              >
                <option value="">Select a category...</option>
                {availableCategories
                  .filter(cat => cat.id !== category.id)
                  .map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
              </select>
            </div>
          )}

          <div className="flex items-center justify-end space-x-3">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={taskCount > 0 && !reassignToCategoryId}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-md transition-colors disabled:cursor-not-allowed"
            >
              Delete Category
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const CategoryList: React.FC<CategoryListProps> = ({
  showTaskCounts = false,
  showWeeklyProgress = false,
  onCategorySelect,
  selectedCategoryId,
  className = '',
}) => {
  const { 
    categories, 
    categoriesWithCounts, 
    categoriesWithProgress, 
    isLoading, 
    error 
  } = useCategoriesData();
  
  const { 
    fetchCategories, 
    fetchCategoriesWithCounts, 
    fetchCategoriesWithProgress, 
    deleteCategory 
  } = useCategoryActions();

  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | undefined>();
  const [deletingCategory, setDeletingCategory] = useState<Category | undefined>();

  // Determine which data to use based on props
  const displayCategories = showWeeklyProgress 
    ? categoriesWithProgress 
    : showTaskCounts 
    ? categoriesWithCounts 
    : categories;

  // Load data on mount
  useEffect(() => {
    if (showWeeklyProgress) {
      fetchCategoriesWithProgress();
    } else if (showTaskCounts) {
      fetchCategoriesWithCounts();
    } else {
      fetchCategories();
    }
  }, [showWeeklyProgress, showTaskCounts, fetchCategories, fetchCategoriesWithCounts, fetchCategoriesWithProgress]);

  const handleCreateCategory = () => {
    setEditingCategory(undefined);
    setShowForm(true);
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setShowForm(true);
  };

  const handleDeleteCategory = (category: Category) => {
    setDeletingCategory(category);
  };

  const handleConfirmDelete = async (reassignToCategoryId?: number) => {
    if (!deletingCategory) return;

    const success = await deleteCategory(deletingCategory.id, reassignToCategoryId);
    if (success) {
      setDeletingCategory(undefined);
      // Refresh data
      if (showWeeklyProgress) {
        fetchCategoriesWithProgress();
      } else if (showTaskCounts) {
        fetchCategoriesWithCounts();
      } else {
        fetchCategories();
      }
    }
  };

  const handleFormSuccess = () => {
    // Refresh data after successful create/update
    if (showWeeklyProgress) {
      fetchCategoriesWithProgress();
    } else if (showTaskCounts) {
      fetchCategoriesWithCounts();
    } else {
      fetchCategories();
    }
  };

  const getIconComponent = (iconName?: string) => {
    // This is a simplified version - in a real app you'd have a proper icon mapping
    return iconName ? FolderOpen : Folder;
  };

  const formatMinutesToHours = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  };

  const getProgressPercentage = (progress: number, goal: number): number => {
    if (goal === 0) return 0;
    return Math.min((progress / goal) * 100, 100);
  };

  if (error) {
    return (
      <div className={`p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md ${className}`}>
        <p className="text-red-800 dark:text-red-200">Error loading categories: {error}</p>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          Categories
        </h2>
        <button
          onClick={handleCreateCategory}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Category</span>
        </button>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
            </div>
          ))}
        </div>
      )}

      {/* Category List */}
      {!isLoading && (
        <div className="space-y-3">
          {displayCategories.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <Folder className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg mb-2">No categories yet</p>
              <p className="text-sm">Create your first category to start organizing your tasks</p>
            </div>
          ) : (
            displayCategories.map((category) => {
              const IconComponent = getIconComponent(category.icon);
              const isSelected = selectedCategoryId === category.id;
              const taskCount = 'taskCount' in category ? category.taskCount : 0;
              const weeklyProgress = 'weeklyProgress' in category ? category.weeklyProgress : 0;

              return (
                <div
                  key={category.id}
                  className={`
                    p-4 border rounded-lg transition-all duration-200 cursor-pointer
                    ${isSelected
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800'
                    }
                  `}
                  onClick={() => onCategorySelect?.(category)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 flex-1">
                      {/* Color indicator and icon */}
                      <div className="flex items-center space-x-2">
                        <div
                          className="w-4 h-4 rounded-full border border-gray-300 dark:border-gray-600"
                          style={{ backgroundColor: category.color }}
                        />
                        <IconComponent 
                          className="w-5 h-5 text-gray-600 dark:text-gray-400" 
                        />
                      </div>

                      {/* Category info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate">
                            {category.name}
                          </h3>
                          {showTaskCounts && (
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              ({String(taskCount)} task{taskCount !== 1 ? 's' : ''})
                            </span>
                          )}
                        </div>
                        
                        {category.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                            {category.description}
                          </p>
                        )}

                        {/* Weekly progress */}
                        {showWeeklyProgress && category.weeklyGoal > 0 && (
                          <div className="mt-2">
                            <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                              <span>Weekly Progress</span>
                              <span>
                                {formatMinutesToHours(weeklyProgress as number)} / {formatMinutesToHours(category.weeklyGoal)}
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                              <div
                                className="h-2 rounded-full transition-all duration-300"
                                style={{
                                  backgroundColor: category.color,
                                  width: `${getProgressPercentage(weeklyProgress as number, category.weeklyGoal)}%`,
                                }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditCategory(category);
                        }}
                        className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                        title="Edit category"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteCategory(category);
                        }}
                        className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                        title="Delete category"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Category Form Modal */}
      <CategoryForm
        category={editingCategory}
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        onSuccess={handleFormSuccess}
      />

      {/* Delete Confirmation Modal */}
      {deletingCategory && (
        <DeleteConfirmation
          category={deletingCategory}
          taskCount={showTaskCounts ? 
            (categoriesWithCounts.find(c => c.id === deletingCategory.id)?.taskCount || 0) : 
            0
          }
          availableCategories={categories}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeletingCategory(undefined)}
        />
      )}
    </div>
  );
};