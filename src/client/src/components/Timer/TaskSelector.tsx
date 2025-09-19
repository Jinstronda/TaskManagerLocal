import React, { useState, useEffect } from 'react';
import { Search, Clock, Target, Plus } from 'lucide-react';
import { Task } from '../../../../shared/types';
import { useTaskStore } from '../../stores/taskStore';
import { useCategoryStore } from '../../stores/categoryStore';
import { cn } from '../../utils/cn';

interface TaskSelectorProps {
  selectedTaskId?: number;
  onTaskSelect: (task: Task | null) => void;
  onCreateTask?: () => void;
  className?: string;
}

export const TaskSelector: React.FC<TaskSelectorProps> = ({
  selectedTaskId,
  onTaskSelect,
  onCreateTask,
  className,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  
  const { 
    tasks, 
    filteredTasks, 
    fetchTasks, 
    setFilters,
    getTasksByStatus 
  } = useTaskStore();
  
  const { categories, fetchCategories } = useCategoryStore();

  // Load tasks and categories on mount
  useEffect(() => {
    fetchTasks();
    fetchCategories();
  }, [fetchTasks, fetchCategories]);

  // Filter tasks based on search query
  useEffect(() => {
    setFilters({ searchQuery: searchQuery || undefined });
  }, [searchQuery, setFilters]);

  // Get active tasks only
  const activeTasks = getTasksByStatus('active');
  const displayTasks = searchQuery ? filteredTasks.filter(t => t.status === 'active') : activeTasks;

  // Get selected task details
  const selectedTask = selectedTaskId ? tasks.find(t => t.id === selectedTaskId) : null;

  // Get category for task
  const getCategoryForTask = (task: Task) => {
    return categories.find(c => c.id === task.categoryId);
  };

  // Format estimated duration
  const formatDuration = (minutes?: number) => {
    if (!minutes) return 'No estimate';
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  return (
    <div className={cn('relative', className)}>
      {/* Task Selection Button/Display */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-full p-4 rounded-lg border-2 border-dashed transition-all duration-200',
          'hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20',
          selectedTask 
            ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20' 
            : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800',
          'focus:outline-none focus:ring-2 focus:ring-blue-500'
        )}
      >
        {selectedTask ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: getCategoryForTask(selectedTask)?.color || '#6B7280' }}
              />
              <div className="text-left">
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  {selectedTask.title}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {getCategoryForTask(selectedTask)?.name} • {formatDuration(selectedTask.estimatedDuration)}
                </p>
              </div>
            </div>
            <Target className="w-5 h-5 text-blue-500" />
          </div>
        ) : (
          <div className="flex items-center justify-center space-x-2 text-gray-500 dark:text-gray-400">
            <Target className="w-5 h-5" />
            <span>Select a task (optional)</span>
          </div>
        )}
      </button>

      {/* Task Selection Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 max-h-96 overflow-hidden">
          {/* Search Input */}
          <div className="p-3 border-b border-gray-200 dark:border-gray-700">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
            </div>
          </div>

          {/* Task List */}
          <div className="max-h-64 overflow-y-auto">
            {/* No Task Option */}
            <button
              onClick={() => {
                onTaskSelect(null);
                setIsOpen(false);
              }}
              className={cn(
                'w-full p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors',
                !selectedTask && 'bg-blue-50 dark:bg-blue-900/20'
              )}
            >
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 rounded-full bg-gray-400" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    No specific task
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    General focus session
                  </p>
                </div>
              </div>
            </button>

            {/* Task Options */}
            {displayTasks.map((task) => {
              const category = getCategoryForTask(task);
              const isSelected = selectedTask?.id === task.id;
              
              return (
                <button
                  key={task.id}
                  onClick={() => {
                    onTaskSelect(task);
                    setIsOpen(false);
                  }}
                  className={cn(
                    'w-full p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors',
                    isSelected && 'bg-blue-50 dark:bg-blue-900/20'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: category?.color || '#6B7280' }}
                      />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {task.title}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {category?.name} • {formatDuration(task.estimatedDuration)}
                        </p>
                        {task.description && (
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 line-clamp-1">
                            {task.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                      {task.estimatedDuration && (
                        <div className="flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>{formatDuration(task.estimatedDuration)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}

            {/* No Tasks Found */}
            {displayTasks.length === 0 && (
              <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                <Target className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="font-medium">No active tasks found</p>
                <p className="text-sm mt-1">
                  {searchQuery ? 'Try a different search term' : 'Create a task to get started'}
                </p>
              </div>
            )}
          </div>

          {/* Create Task Button */}
          {onCreateTask && (
            <div className="p-3 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => {
                  onCreateTask();
                  setIsOpen(false);
                }}
                className="w-full flex items-center justify-center space-x-2 p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span className="font-medium">Create new task</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Backdrop to close dropdown */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};