import React, { useState } from 'react';
import { ArrowRightLeft, Clock, Target, ChevronDown } from 'lucide-react';
import { Task } from '../../../../shared/types';
import { useTaskStore } from '../../stores/taskStore';
import { useCategoryStore } from '../../stores/categoryStore';
import { cn } from '../../utils/cn';

interface TaskSwitcherProps {
  currentTaskId?: number;
  onTaskSwitch: (task: Task | null) => void;
  sessionDuration: number; // minutes elapsed in current session
  className?: string;
}

export const TaskSwitcher: React.FC<TaskSwitcherProps> = ({
  currentTaskId,
  onTaskSwitch,
  sessionDuration,
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const { tasks, getTasksByStatus } = useTaskStore();
  const { categories } = useCategoryStore();

  // Get active tasks excluding current task
  const activeTasks = getTasksByStatus('active').filter(t => t.id !== currentTaskId);
  const currentTask = currentTaskId ? tasks.find(t => t.id === currentTaskId) : null;

  // Get category for task
  const getCategoryForTask = (task: Task) => {
    return categories.find(c => c.id === task.categoryId);
  };

  // Format duration
  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  // Handle task switch with confirmation
  const handleTaskSwitch = (task: Task | null) => {
    if (sessionDuration > 5) { // Only show confirmation if significant time has passed
      const confirmMessage = task 
        ? `Switch to "${task.title}"? Current progress (${formatDuration(sessionDuration)}) will be saved.`
        : `Switch to general focus? Current progress (${formatDuration(sessionDuration)}) will be saved.`;
      
      if (window.confirm(confirmMessage)) {
        onTaskSwitch(task);
        setIsOpen(false);
      }
    } else {
      onTaskSwitch(task);
      setIsOpen(false);
    }
  };

  return (
    <div className={cn('relative', className)}>
      {/* Current Task Display with Switch Button */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <Target className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Current Task:
              </span>
            </div>
            
            {currentTask ? (
              <div className="flex items-center space-x-2">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: getCategoryForTask(currentTask)?.color || '#6B7280' }}
                />
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {currentTask.title}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  ({getCategoryForTask(currentTask)?.name})
                </span>
              </div>
            ) : (
              <span className="text-gray-500 dark:text-gray-400 italic">
                General focus session
              </span>
            )}
          </div>

          {/* Switch Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={cn(
              'flex items-center space-x-2 px-3 py-2 rounded-md transition-colors',
              'hover:bg-gray-100 dark:hover:bg-gray-700',
              'focus:outline-none focus:ring-2 focus:ring-blue-500',
              isOpen && 'bg-gray-100 dark:bg-gray-700'
            )}
            title="Switch task"
          >
            <ArrowRightLeft className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            <span className="text-sm text-gray-600 dark:text-gray-400">Switch</span>
            <ChevronDown className={cn(
              'w-4 h-4 text-gray-600 dark:text-gray-400 transition-transform',
              isOpen && 'rotate-180'
            )} />
          </button>
        </div>

        {/* Session Progress Info */}
        <div className="mt-3 flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
          <div className="flex items-center space-x-1">
            <Clock className="w-3 h-3" />
            <span>Session time: {formatDuration(sessionDuration)}</span>
          </div>
          {currentTask?.estimatedDuration && (
            <div className="flex items-center space-x-1">
              <Target className="w-3 h-3" />
              <span>
                Estimated: {formatDuration(currentTask.estimatedDuration)}
                {sessionDuration > 0 && (
                  <span className={cn(
                    'ml-1',
                    sessionDuration > currentTask.estimatedDuration 
                      ? 'text-orange-500' 
                      : 'text-green-500'
                  )}>
                    ({sessionDuration > currentTask.estimatedDuration ? '+' : ''}
                    {sessionDuration - currentTask.estimatedDuration}m)
                  </span>
                )}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Task Switch Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 max-h-64 overflow-hidden">
          <div className="p-3 border-b border-gray-200 dark:border-gray-700">
            <h3 className="font-medium text-gray-900 dark:text-gray-100">
              Switch to different task
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Current progress will be saved automatically
            </p>
          </div>

          <div className="max-h-48 overflow-y-auto">
            {/* No Task Option */}
            {currentTaskId && (
              <button
                onClick={() => handleTaskSwitch(null)}
                className="w-full p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 rounded-full bg-gray-400" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      General focus session
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      No specific task
                    </p>
                  </div>
                </div>
              </button>
            )}

            {/* Available Tasks */}
            {activeTasks.map((task) => {
              const category = getCategoryForTask(task);
              
              return (
                <button
                  key={task.id}
                  onClick={() => handleTaskSwitch(task)}
                  className="w-full p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
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
                          {category?.name}
                          {task.estimatedDuration && ` • ${formatDuration(task.estimatedDuration)}`}
                        </p>
                      </div>
                    </div>
                    <ArrowRightLeft className="w-4 h-4 text-gray-400" />
                  </div>
                </button>
              );
            })}

            {/* No Tasks Available */}
            {activeTasks.length === 0 && !currentTaskId && (
              <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                <Target className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="font-medium">No other tasks available</p>
                <p className="text-sm mt-1">
                  Create more tasks to switch between them
                </p>
              </div>
            )}
          </div>
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