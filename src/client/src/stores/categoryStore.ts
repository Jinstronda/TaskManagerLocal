import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { Category, CreateCategoryForm, ApiResponse } from '../../../shared/types';

interface CategoryState {
  categories: Category[];
  categoriesWithCounts: Array<Category & { taskCount: number }>;
  categoriesWithProgress: Array<Category & { weeklyProgress: number }>;
  isLoading: boolean;
  error: string | null;
  selectedCategory: Category | null;
}

interface CategoryActions {
  // Data fetching
  fetchCategories: () => Promise<void>;
  fetchCategoriesWithCounts: () => Promise<void>;
  fetchCategoriesWithProgress: (weekStart?: Date) => Promise<void>;
  fetchCategoryById: (id: number) => Promise<Category | null>;
  
  // CRUD operations
  createCategory: (categoryData: CreateCategoryForm) => Promise<Category | null>;
  updateCategory: (id: number, updates: Partial<CreateCategoryForm>) => Promise<Category | null>;
  deleteCategory: (id: number, reassignToCategoryId?: number) => Promise<boolean>;
  
  // Utility functions
  checkNameUnique: (name: string, excludeId?: number) => Promise<boolean>;
  selectCategory: (category: Category | null) => void;
  clearError: () => void;
  
  // Local state helpers
  getCategoryById: (id: number) => Category | undefined;
  getCategoryByName: (name: string) => Category | undefined;
}

type CategoryStore = CategoryState & CategoryActions;

const initialState: CategoryState = {
  categories: [],
  categoriesWithCounts: [],
  categoriesWithProgress: [],
  isLoading: false,
  error: null,
  selectedCategory: null,
};

export const useCategoryStore = create<CategoryStore>()(
  devtools(
    (set, get) => ({
      ...initialState,

      // Data fetching
      fetchCategories: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch('/api/categories');
          const result: ApiResponse<Category[]> = await response.json();
          
          if (result.success && result.data) {
            set({ categories: result.data, isLoading: false });
          } else {
            set({ 
              error: result.error?.message || 'Failed to fetch categories',
              isLoading: false 
            });
          }
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Network error',
            isLoading: false 
          });
        }
      },

      fetchCategoriesWithCounts: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch('/api/categories/with-counts');
          const result: ApiResponse<Array<Category & { taskCount: number }>> = await response.json();
          
          if (result.success && result.data) {
            set({ 
              categoriesWithCounts: result.data,
              categories: result.data, // Also update base categories
              isLoading: false 
            });
          } else {
            set({ 
              error: result.error?.message || 'Failed to fetch categories with counts',
              isLoading: false 
            });
          }
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Network error',
            isLoading: false 
          });
        }
      },

      fetchCategoriesWithProgress: async (weekStart?: Date) => {
        set({ isLoading: true, error: null });
        try {
          const params = weekStart ? `?weekStart=${weekStart.toISOString()}` : '';
          const response = await fetch(`/api/categories/with-progress${params}`);
          const result: ApiResponse<Array<Category & { weeklyProgress: number }>> = await response.json();
          
          if (result.success && result.data) {
            set({ 
              categoriesWithProgress: result.data,
              categories: result.data, // Also update base categories
              isLoading: false 
            });
          } else {
            set({ 
              error: result.error?.message || 'Failed to fetch categories with progress',
              isLoading: false 
            });
          }
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Network error',
            isLoading: false 
          });
        }
      },

      fetchCategoryById: async (id: number) => {
        try {
          const response = await fetch(`/api/categories/${id}`);
          const result: ApiResponse<Category> = await response.json();
          
          if (result.success && result.data) {
            return result.data;
          } else {
            set({ error: result.error?.message || 'Failed to fetch category' });
            return null;
          }
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Network error' });
          return null;
        }
      },

      // CRUD operations
      createCategory: async (categoryData: CreateCategoryForm) => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch('/api/categories', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(categoryData),
          });
          
          const result: ApiResponse<Category> = await response.json();
          
          if (result.success && result.data) {
            const newCategory = result.data;
            set(state => ({
              categories: [...state.categories, newCategory],
              categoriesWithCounts: [...state.categoriesWithCounts, { ...newCategory, taskCount: 0 }],
              categoriesWithProgress: [...state.categoriesWithProgress, { ...newCategory, weeklyProgress: 0 }],
              isLoading: false
            }));
            return newCategory;
          } else {
            set({ 
              error: result.error?.message || 'Failed to create category',
              isLoading: false 
            });
            return null;
          }
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Network error',
            isLoading: false 
          });
          return null;
        }
      },

      updateCategory: async (id: number, updates: Partial<CreateCategoryForm>) => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch(`/api/categories/${id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(updates),
          });
          
          const result: ApiResponse<Category> = await response.json();
          
          if (result.success && result.data) {
            const updatedCategory = result.data;
            set(state => ({
              categories: state.categories.map(cat => 
                cat.id === id ? updatedCategory : cat
              ),
              categoriesWithCounts: state.categoriesWithCounts.map(cat => 
                cat.id === id ? { ...updatedCategory, taskCount: cat.taskCount } : cat
              ),
              categoriesWithProgress: state.categoriesWithProgress.map(cat => 
                cat.id === id ? { ...updatedCategory, weeklyProgress: cat.weeklyProgress } : cat
              ),
              selectedCategory: state.selectedCategory?.id === id ? updatedCategory : state.selectedCategory,
              isLoading: false
            }));
            return updatedCategory;
          } else {
            set({ 
              error: result.error?.message || 'Failed to update category',
              isLoading: false 
            });
            return null;
          }
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Network error',
            isLoading: false 
          });
          return null;
        }
      },

      deleteCategory: async (id: number, reassignToCategoryId?: number) => {
        set({ isLoading: true, error: null });
        try {
          const params = reassignToCategoryId ? `?reassignTo=${reassignToCategoryId}` : '';
          const response = await fetch(`/api/categories/${id}${params}`, {
            method: 'DELETE',
          });
          
          const result: ApiResponse = await response.json();
          
          if (result.success) {
            set(state => ({
              categories: state.categories.filter(cat => cat.id !== id),
              categoriesWithCounts: state.categoriesWithCounts.filter(cat => cat.id !== id),
              categoriesWithProgress: state.categoriesWithProgress.filter(cat => cat.id !== id),
              selectedCategory: state.selectedCategory?.id === id ? null : state.selectedCategory,
              isLoading: false
            }));
            return true;
          } else {
            set({ 
              error: result.error?.message || 'Failed to delete category',
              isLoading: false 
            });
            return false;
          }
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Network error',
            isLoading: false 
          });
          return false;
        }
      },

      // Utility functions
      checkNameUnique: async (name: string, excludeId?: number) => {
        try {
          const response = await fetch('/api/categories/check-name', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name, excludeId }),
          });
          
          const result: ApiResponse<{ isUnique: boolean }> = await response.json();
          
          if (result.success && result.data) {
            return result.data.isUnique;
          }
          return false;
        } catch (error) {
          console.error('Error checking name uniqueness:', error);
          return false;
        }
      },

      selectCategory: (category: Category | null) => {
        set({ selectedCategory: category });
      },

      clearError: () => {
        set({ error: null });
      },

      // Local state helpers
      getCategoryById: (id: number) => {
        return get().categories.find(cat => cat.id === id);
      },

      getCategoryByName: (name: string) => {
        return get().categories.find(cat => cat.name.toLowerCase() === name.toLowerCase());
      },
    }),
    {
      name: 'category-store',
    }
  )
);

// Selector hooks for better performance
export const useCategoriesData = () => useCategoryStore(state => ({
  categories: state.categories,
  categoriesWithCounts: state.categoriesWithCounts,
  categoriesWithProgress: state.categoriesWithProgress,
  isLoading: state.isLoading,
  error: state.error,
}));

export const useCategoryActions = () => useCategoryStore(state => ({
  fetchCategories: state.fetchCategories,
  fetchCategoriesWithCounts: state.fetchCategoriesWithCounts,
  fetchCategoriesWithProgress: state.fetchCategoriesWithProgress,
  fetchCategoryById: state.fetchCategoryById,
  createCategory: state.createCategory,
  updateCategory: state.updateCategory,
  deleteCategory: state.deleteCategory,
  checkNameUnique: state.checkNameUnique,
  selectCategory: state.selectCategory,
  clearError: state.clearError,
}));

export const useSelectedCategory = () => useCategoryStore(state => state.selectedCategory);