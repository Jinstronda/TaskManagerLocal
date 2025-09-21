import React from 'react';
import { Task } from '../../../../shared/types';
import TaskItem from './TaskItem';
import { useCategoryStore } from '../../stores/categoryStore';

interface TaskListProps {
  tasks: Task[];
  onEditTask: (task: Task) => void;
  onDeleteTask: (task: Task) => void;
  onCompleteTask: (task: Task) => void;
  onStartSession?: (task: Task) => void;
  groupByCategory?: boolean;
  showEmptyState?: boolean;
}

const TaskList: React.FC<TaskListProps> = ({
  tasks,
  onEditTask,
  onDeleteTask,
  onCompleteTask,
  onStartSession,
  groupByCategory = false,
  showEmptyState = true
}) => {
  const { categories } = useCategoryStore();

  if (tasks.length === 0 && showEmptyState) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 mb-4">
          <svg
            className="mx-auto h-12 w-12"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks found</h3>
        <p className="text-gray-500">
          Create your first task to get started with time tracking.
        </p>
      </div>
    );
  }

  if (!groupByCategory) {
    // Separate active and completed tasks
    const activeTasks = tasks.filter(task => task.status === 'active');
    const completedTasks = tasks.filter(task => task.status === 'completed');
    const archivedTasks = tasks.filter(task => task.status === 'archived');

    return (
      <div className="space-y-6">
        {/* Active Tasks Section */}
        {activeTasks.length > 0 && (
          <div className="space-y-3">
            {activeTasks.map(task => (
              <TaskItem
                key={task.id}
                task={task}
                onEdit={onEditTask}
                onDelete={onDeleteTask}
                onComplete={onCompleteTask}
                onStartSession={onStartSession}
              />
            ))}
          </div>
        )}

        {/* Completed Tasks Section */}
        {completedTasks.length > 0 && (
          <div className="space-y-3">
            {/* Completed Tasks Header */}
            <div className="flex items-center space-x-3 pt-6 border-t border-gray-200">
              <div className="w-4 h-4 rounded-full bg-green-500" />
              <h3 className="text-lg font-semibold text-gray-700">
                Completed Tasks
              </h3>
              <span className="text-sm text-gray-500">
                ({completedTasks.length} task{completedTasks.length !== 1 ? 's' : ''})
              </span>
            </div>

            {/* Completed Tasks List */}
            <div className="space-y-3 opacity-75">
              {completedTasks.map(task => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onEdit={onEditTask}
                  onDelete={onDeleteTask}
                  onComplete={onCompleteTask}
                  onStartSession={onStartSession}
                />
              ))}
            </div>
          </div>
        )}

        {/* Archived Tasks Section */}
        {archivedTasks.length > 0 && (
          <div className="space-y-3">
            {/* Archived Tasks Header */}
            <div className="flex items-center space-x-3 pt-6 border-t border-gray-200">
              <div className="w-4 h-4 rounded-full bg-gray-400" />
              <h3 className="text-lg font-semibold text-gray-600">
                Archived Tasks
              </h3>
              <span className="text-sm text-gray-500">
                ({archivedTasks.length} task{archivedTasks.length !== 1 ? 's' : ''})
              </span>
            </div>

            {/* Archived Tasks List */}
            <div className="space-y-3 opacity-50">
              {archivedTasks.map(task => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onEdit={onEditTask}
                  onDelete={onDeleteTask}
                  onComplete={onCompleteTask}
                  onStartSession={onStartSession}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Separate tasks by status first
  const activeTasks = tasks.filter(task => task.status === 'active');
  const completedTasks = tasks.filter(task => task.status === 'completed');
  const archivedTasks = tasks.filter(task => task.status === 'archived');

  // Group tasks by category for each status
  const groupTasksByCategory = (taskList: Task[]) => {
    return taskList.reduce((acc, task) => {
      const categoryId = task.categoryId;
      if (!acc[categoryId]) {
        acc[categoryId] = [];
      }
      acc[categoryId].push(task);
      return acc;
    }, {} as Record<number, Task[]>);
  };

  const renderCategorySection = (tasksByCategory: Record<number, Task[]>, sectionOpacity = "opacity-100") => {
    // Sort categories by name
    const sortedCategoryIds = Object.keys(tasksByCategory)
      .map(id => parseInt(id))
      .sort((a, b) => {
        const categoryA = categories.find(c => c.id === a);
        const categoryB = categories.find(c => c.id === b);
        return (categoryA?.name || '').localeCompare(categoryB?.name || '');
      });

    return sortedCategoryIds.map(categoryId => {
      const category = categories.find(c => c.id === categoryId);
      const categoryTasks = tasksByCategory[categoryId];

      if (!category || categoryTasks.length === 0) return null;

      return (
        <div key={categoryId} className={`space-y-3 ${sectionOpacity}`}>
          {/* Category Header */}
          <div className="flex items-center space-x-3">
            <div
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: category.color }}
            />
            <h3 className="text-lg font-semibold text-gray-900">
              {category.name}
            </h3>
            <span className="text-sm text-gray-500">
              ({categoryTasks.length} task{categoryTasks.length !== 1 ? 's' : ''})
            </span>
          </div>

          {/* Category Tasks */}
          <div className="space-y-3 ml-7">
            {categoryTasks.map(task => (
              <TaskItem
                key={task.id}
                task={task}
                onEdit={onEditTask}
                onDelete={onDeleteTask}
                onComplete={onCompleteTask}
                onStartSession={onStartSession}
              />
            ))}
          </div>
        </div>
      );
    });
  };

  return (
    <div className="space-y-6">
      {/* Active Tasks by Category */}
      {activeTasks.length > 0 && (
        <div className="space-y-6">
          {renderCategorySection(groupTasksByCategory(activeTasks))}
        </div>
      )}

      {/* Completed Tasks by Category */}
      {completedTasks.length > 0 && (
        <div className="space-y-6">
          {/* Completed Tasks Section Header */}
          <div className="flex items-center space-x-3 pt-6 border-t border-gray-200">
            <div className="w-4 h-4 rounded-full bg-green-500" />
            <h3 className="text-lg font-semibold text-gray-700">
              Completed Tasks
            </h3>
            <span className="text-sm text-gray-500">
              ({completedTasks.length} task{completedTasks.length !== 1 ? 's' : ''})
            </span>
          </div>
          {renderCategorySection(groupTasksByCategory(completedTasks), "opacity-75")}
        </div>
      )}

      {/* Archived Tasks by Category */}
      {archivedTasks.length > 0 && (
        <div className="space-y-6">
          {/* Archived Tasks Section Header */}
          <div className="flex items-center space-x-3 pt-6 border-t border-gray-200">
            <div className="w-4 h-4 rounded-full bg-gray-400" />
            <h3 className="text-lg font-semibold text-gray-600">
              Archived Tasks
            </h3>
            <span className="text-sm text-gray-500">
              ({archivedTasks.length} task{archivedTasks.length !== 1 ? 's' : ''})
            </span>
          </div>
          {renderCategorySection(groupTasksByCategory(archivedTasks), "opacity-50")}
        </div>
      )}
    </div>
  );
};

export default TaskList;