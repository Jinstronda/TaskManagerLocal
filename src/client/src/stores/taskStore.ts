import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { Task, CreateTaskForm, ApiResponse } from '../../../shared/types';

interface TaskFilters {
  categoryId?: number;
  status?: Task['status'];
  priority?: Task['priority'];
  searchQuery?: string;
}

interface TaskStore {
  // State
  tasks: Task[];
  filteredTasks: Task[];
  filters: TaskFilters;
  isLoading: boolean;
  error: string | null;
  selectedTask: Task | null;

  // Actions
  fetchTasks: (filters?: TaskFilters) => Promise<void>;
  createTask: (taskData: CreateTaskForm) => Promise<Task>;
  updateTask: (id: number, updates: Partial<Task>) => Promise<Task>;
  deleteTask: (id: number) => Promise<void>;
  completeTask: (id: number) => Promise<Task>;
  setFilters: (filters: Partial<TaskFilters>) => void;
  setSelectedTask: (task: Task | null) => void;
  clearError: () => void;
  
  // Computed getters
  getTasksByCategory: (categoryId: number) => Task[];
  getTasksByStatus: (status: Task['status']) => Task[];
  getOverdueTasks: () => Task[];
  getDueTodayTasks: () => Task[];
  
  // Helper methods
  applyFilters: (tasks: Task[], filters: TaskFilters) => Task[];
}

const API_BASE = 'http://localhost:8765/api';

// Helper function to parse task dates from API responses
const parseTaskDates = (task: any): Task => {
  return {
    ...task,
    dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
    completedAt: task.completedAt ? new Date(task.completedAt) : undefined,
    createdAt: new Date(task.createdAt),
    updatedAt: new Date(task.updatedAt),
  };
};

export const useTaskStore = create<TaskStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      tasks: [],
      filteredTasks: [],
      filters: {},
      isLoading: false,
      error: null,
      selectedTask: null,

      // Actions
      fetchTasks: async (filters?: TaskFilters) => {
        set({ isLoading: true, error: null });
        
        try {
          const queryParams = new URLSearchParams();
          if (filters?.categoryId) queryParams.append('categoryId', filters.categoryId.toString());
          if (filters?.status) queryParams.append('status', filters.status);
          if (filters?.priority) queryParams.append('priority', filters.priority);

          const response = await fetch(`${API_BASE}/tasks?${queryParams}`);
          const result: ApiResponse<Task[]> = await response.json();

          if (!result.success) {
            throw new Error(result.error?.message || 'Failed to fetch tasks');
          }

          const rawTasks = result.data || [];
          const tasks = rawTasks.map(parseTaskDates);
          set({ 
            tasks, 
            filteredTasks: get().applyFilters(tasks, get().filters),
            isLoading: false 
          });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to fetch tasks',
            isLoading: false 
          });
        }
      },

      createTask: async (taskData: CreateTaskForm) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await fetch(`${API_BASE}/tasks`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(taskData),
          });

          const result: ApiResponse<Task> = await response.json();

          if (!result.success) {
            throw new Error(result.error?.message || 'Failed to create task');
          }

          const rawTask = result.data!;
          const newTask = parseTaskDates(rawTask);
          const currentTasks = get().tasks;
          const updatedTasks = [newTask, ...currentTasks];
          
          set({ 
            tasks: updatedTasks,
            filteredTasks: get().applyFilters(updatedTasks, get().filters),
            isLoading: false 
          });

          return newTask;
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to create task',
            isLoading: false 
          });
          throw error;
        }
      },

      updateTask: async (id: number, updates: Partial<Task>) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await fetch(`${API_BASE}/tasks/${id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(updates),
          });

          const result: ApiResponse<Task> = await response.json();

          if (!result.success) {
            throw new Error(result.error?.message || 'Failed to update task');
          }

          const rawTask = result.data!;
          const updatedTask = parseTaskDates(rawTask);
          const currentTasks = get().tasks;
          const updatedTasks = currentTasks.map(task => 
            task.id === id ? updatedTask : task
          );
          
          set({ 
            tasks: updatedTasks,
            filteredTasks: get().applyFilters(updatedTasks, get().filters),
            selectedTask: get().selectedTask?.id === id ? updatedTask : get().selectedTask,
            isLoading: false 
          });

          return updatedTask;
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to update task',
            isLoading: false 
          });
          throw error;
        }
      },

      deleteTask: async (id: number) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await fetch(`${API_BASE}/tasks/${id}`, {
            method: 'DELETE',
          });

          const result: ApiResponse<void> = await response.json();

          if (!result.success) {
            throw new Error(result.error?.message || 'Failed to delete task');
          }

          const currentTasks = get().tasks;
          const updatedTasks = currentTasks.filter(task => task.id !== id);
          
          set({ 
            tasks: updatedTasks,
            filteredTasks: get().applyFilters(updatedTasks, get().filters),
            selectedTask: get().selectedTask?.id === id ? null : get().selectedTask,
            isLoading: false 
          });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to delete task',
            isLoading: false 
          });
          throw error;
        }
      },

      completeTask: async (id: number) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await fetch(`${API_BASE}/tasks/${id}/complete`, {
            method: 'PATCH',
          });

          const result: ApiResponse<Task> = await response.json();

          if (!result.success) {
            throw new Error(result.error?.message || 'Failed to complete task');
          }

          const rawTask = result.data!;
          const completedTask = parseTaskDates(rawTask);
          const currentTasks = get().tasks;
          const updatedTasks = currentTasks.map(task => 
            task.id === id ? completedTask : task
          );
          
          set({ 
            tasks: updatedTasks,
            filteredTasks: get().applyFilters(updatedTasks, get().filters),
            selectedTask: get().selectedTask?.id === id ? completedTask : get().selectedTask,
            isLoading: false 
          });

          return completedTask;
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to complete task',
            isLoading: false 
          });
          throw error;
        }
      },

      setFilters: (newFilters: Partial<TaskFilters>) => {
        const updatedFilters = { ...get().filters, ...newFilters };
        const filteredTasks = get().applyFilters(get().tasks, updatedFilters);
        
        set({ 
          filters: updatedFilters,
          filteredTasks 
        });
      },

      setSelectedTask: (task: Task | null) => {
        set({ selectedTask: task });
      },

      clearError: () => {
        set({ error: null });
      },

      // Computed getters
      getTasksByCategory: (categoryId: number) => {
        return get().tasks.filter(task => task.categoryId === categoryId);
      },

      getTasksByStatus: (status: Task['status']) => {
        return get().tasks.filter(task => task.status === status);
      },

      getOverdueTasks: () => {
        const now = new Date();
        return get().tasks.filter(task => 
          task.dueDate && 
          task.dueDate < now && 
          task.status === 'active'
        );
      },

      getDueTodayTasks: () => {
        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
        
        return get().tasks.filter(task => 
          task.dueDate && 
          task.dueDate >= startOfDay && 
          task.dueDate < endOfDay && 
          task.status === 'active'
        );
      },

      // Helper function to apply filters (not exposed in interface)
      applyFilters: (tasks: Task[], filters: TaskFilters): Task[] => {
        let filtered = [...tasks];

        if (filters.categoryId) {
          filtered = filtered.filter(task => task.categoryId === filters.categoryId);
        }

        if (filters.status) {
          filtered = filtered.filter(task => task.status === filters.status);
        }

        if (filters.priority) {
          filtered = filtered.filter(task => task.priority === filters.priority);
        }

        if (filters.searchQuery) {
          const query = filters.searchQuery.toLowerCase();
          filtered = filtered.filter(task => 
            task.title.toLowerCase().includes(query) ||
            (task.description && task.description.toLowerCase().includes(query))
          );
        }

        return filtered;
      },
    } as TaskStore),
    {
      name: 'task-store',
    }
  )
);