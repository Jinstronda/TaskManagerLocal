import React, { useState, useEffect } from 'react';
import { Plus, LayoutGrid, List } from 'lucide-react';
import { Task } from '../../../shared/types';
import { useTaskStore } from '../stores/taskStore';
import { useCategoryStore } from '../stores/categoryStore';
import TaskForm from '../components/Task/TaskForm';
import TaskList from '../components/Task/TaskList';
import TaskFilters from '../components/Task/TaskFilters';
import ConfirmDialog from '../components/Task/ConfirmDialog';
import toast from 'react-hot-toast';

const Tasks: React.FC = () => {
  const {
    filteredTasks,
    filters,
    isLoading,
    error,
    fetchTasks,
    createTask,
    updateTask,
    deleteTask,
    completeTask,
    setFilters,
    clearError
  } = useTaskStore();

  const { categories, fetchCategories } = useCategoryStore();

  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);
  const [groupByCategory, setGroupByCategory] = useState(false);

  // Load data on component mount
  useEffect(() => {
    fetchTasks();
    if (categories.length === 0) {
      fetchCategories();
    }
  }, [fetchTasks, fetchCategories, categories.length]);

  // Show error toast
  useEffect(() => {
    if (error) {
      toast.error(error);
      clearError();
    }
  }, [error, clearError]);

  // Calculate task counts
  const taskCounts = {
    total: filteredTasks.length,
    active: filteredTasks.filter(t => t.status === 'active').length,
    completed: filteredTasks.filter(t => t.status === 'completed').length,
    archived: filteredTasks.filter(t => t.status === 'archived').length
  };

  const handleCreateTask = async (taskData: any) => {
    try {
      await createTask(taskData);
      toast.success('Task created successfully!');
      setIsTaskFormOpen(false);
    } catch (error) {
      // Error is handled by the store and shown via toast
    }
  };

  const handleUpdateTask = async (taskData: any) => {
    if (!editingTask) return;
    
    try {
      await updateTask(editingTask.id, taskData);
      toast.success('Task updated successfully!');
      setEditingTask(null);
    } catch (error) {
      // Error is handled by the store and shown via toast
    }
  };

  const handleDeleteTask = async () => {
    if (!deletingTask) return;
    
    try {
      await deleteTask(deletingTask.id);
      toast.success('Task deleted successfully!');
      setDeletingTask(null);
    } catch (error) {
      // Error is handled by the store and shown via toast
    }
  };

  const handleCompleteTask = async (task: Task) => {
    try {
      if (task.status === 'completed') {
        // Reactivate task
        await updateTask(task.id, { status: 'active', completedAt: undefined });
        toast.success('Task reactivated!');
      } else {
        // Complete task
        await completeTask(task.id);
        toast.success('Task completed!');
      }
    } catch (error) {
      // Error is handled by the store and shown via toast
    }
  };

  const handleStartSession = (task: Task) => {
    // This would integrate with the timer functionality
    // For now, just show a toast
    toast.success(`Starting focus session for: ${task.title}`);
    // TODO: Integrate with timer store to start a session with this task
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
          <p className="text-gray-600 mt-1">Manage your tasks and track your progress</p>
        </div>
        <div className="flex items-center space-x-3">
          {/* View Toggle */}
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setGroupByCategory(false)}
              className={`p-2 rounded-md transition-colors ${
                !groupByCategory 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              title="List view"
            >
              <List size={16} />
            </button>
            <button
              onClick={() => setGroupByCategory(true)}
              className={`p-2 rounded-md transition-colors ${
                groupByCategory 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              title="Group by category"
            >
              <LayoutGrid size={16} />
            </button>
          </div>

          {/* Add Task Button */}
          <button
            onClick={() => setIsTaskFormOpen(true)}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={20} />
            <span>Add Task</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <TaskFilters
        filters={filters}
        onFiltersChange={setFilters}
        taskCounts={taskCounts}
      />

      {/* Task List */}
      <div className="bg-white rounded-lg border border-gray-200">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Loading tasks...</span>
          </div>
        ) : (
          <div className="p-6">
            <TaskList
              tasks={filteredTasks}
              onEditTask={setEditingTask}
              onDeleteTask={setDeletingTask}
              onCompleteTask={handleCompleteTask}
              onStartSession={handleStartSession}
              groupByCategory={groupByCategory}
            />
          </div>
        )}
      </div>

      {/* Task Form Modal */}
      <TaskForm
        task={editingTask || undefined}
        isOpen={isTaskFormOpen || editingTask !== null}
        onClose={() => {
          setIsTaskFormOpen(false);
          setEditingTask(null);
        }}
        onSubmit={editingTask ? handleUpdateTask : handleCreateTask}
        isLoading={isLoading}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deletingTask !== null}
        title="Delete Task"
        message={`Are you sure you want to delete "${deletingTask?.title}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleDeleteTask}
        onCancel={() => setDeletingTask(null)}
        isLoading={isLoading}
        variant="danger"
      />
    </div>
  );
};

export default Tasks;