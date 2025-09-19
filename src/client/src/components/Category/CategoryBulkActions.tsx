import React, { useState } from 'react';
import { Trash2, Archive, X, AlertTriangle } from 'lucide-react';
import { useCategoryActions, useCategoriesData } from '../../stores/categoryStore';

interface CategoryBulkActionsProps {
  selectedCategoryIds: number[];
  onClearSelection: () => void;
  onActionComplete: () => void;
  className?: string;
}

interface BulkDeleteConfirmationProps {
  selectedCategoryIds: number[];
  onConfirm: (reassignToCategoryId?: number) => void;
  onCancel: () => void;
}

const BulkDeleteConfirmation: React.FC<BulkDeleteConfirmationProps> = ({
  selectedCategoryIds,
  onConfirm,
  onCancel,
}) => {
  const [reassignToCategoryId, setReassignToCategoryId] = useState<number | undefined>();
  const { categoriesWithCounts } = useCategoriesData();

  // Calculate total tasks that will be affected
  const totalTasks = selectedCategoryIds.reduce((sum, categoryId) => {
    const category = categoriesWithCounts.find(c => c.id === categoryId);
    return sum + (category?.taskCount || 0);
  }, 0);

  // Get available categories for reassignment (excluding selected ones)
  const availableCategories = categoriesWithCounts.filter(
    cat => !selectedCategoryIds.includes(cat.id)
  );

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
              Delete Multiple Categories
            </h3>
          </div>

          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Are you sure you want to delete {selectedCategoryIds.length} categor{selectedCategoryIds.length === 1 ? 'y' : 'ies'}?
          </p>

          {totalTasks > 0 && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-4 mb-4">
              <p className="text-yellow-800 dark:text-yellow-200 text-sm mb-3">
                These categories contain {totalTasks} task{totalTasks !== 1 ? 's' : ''} total.
                You must reassign them to another category before deletion.
              </p>

              <label className="block text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                Reassign all tasks to:
              </label>
              <select
                value={reassignToCategoryId || ''}
                onChange={(e) => setReassignToCategoryId(e.target.value ? parseInt(e.target.value) : undefined)}
                className="w-full px-3 py-2 border border-yellow-300 dark:border-yellow-700 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              >
                <option value="">Select a category...</option>
                {availableCategories.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name} {cat.taskCount > 0 && `(${cat.taskCount} tasks)`}
                  </option>
                ))}
              </select>
            </div>
          )}

          {availableCategories.length === 0 && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4 mb-4">
              <p className="text-red-800 dark:text-red-200 text-sm">
                Cannot delete all categories. At least one category must remain.
              </p>
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
              disabled={(totalTasks > 0 && !reassignToCategoryId) || availableCategories.length === 0}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-md transition-colors disabled:cursor-not-allowed"
            >
              Delete Categories
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const CategoryBulkActions: React.FC<CategoryBulkActionsProps> = ({
  selectedCategoryIds,
  onClearSelection,
  onActionComplete,
  className = '',
}) => {
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { deleteCategory } = useCategoryActions();

  const handleBulkDelete = () => {
    setShowDeleteConfirmation(true);
  };

  const handleConfirmBulkDelete = async (reassignToCategoryId?: number) => {
    setIsLoading(true);
    try {
      // Delete categories one by one
      // In a real implementation, you'd want a proper bulk delete API endpoint
      for (const categoryId of selectedCategoryIds) {
        await deleteCategory(categoryId, reassignToCategoryId);
      }

      setShowDeleteConfirmation(false);
      onActionComplete();
    } catch (error) {
      console.error('Failed to delete categories:', error);
      // Handle error - show toast notification
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className={`bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="text-blue-600 dark:text-blue-400">
              <Archive className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                {selectedCategoryIds.length} categor{selectedCategoryIds.length === 1 ? 'y' : 'ies'} selected
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-300">
                Choose an action to apply to all selected categories
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Bulk Actions */}
            <button
              onClick={handleBulkDelete}
              disabled={isLoading}
              className="flex items-center space-x-1 px-3 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-md text-sm transition-colors disabled:cursor-not-allowed"
              title="Delete selected categories"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete</span>
            </button>

            {/* Clear Selection */}
            <button
              onClick={onClearSelection}
              className="flex items-center space-x-1 px-3 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md text-sm transition-colors"
              title="Clear selection"
            >
              <X className="w-4 h-4" />
              <span>Clear</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bulk Delete Confirmation Modal */}
      {showDeleteConfirmation && (
        <BulkDeleteConfirmation
          selectedCategoryIds={selectedCategoryIds}
          onConfirm={handleConfirmBulkDelete}
          onCancel={() => setShowDeleteConfirmation(false)}
        />
      )}
    </>
  );
};