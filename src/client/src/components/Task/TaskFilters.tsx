import React from 'react';
import { Search, Filter, X } from 'lucide-react';
import { Task } from '../../../../shared/types';
import { useCategoryStore } from '../../stores/categoryStore';

interface TaskFiltersProps {
  filters: {
    categoryId?: number;
    status?: Task['status'];
    priority?: Task['priority'];
    searchQuery?: string;
  };
  onFiltersChange: (filters: any) => void;
  taskCounts?: {
    total: number;
    active: number;
    completed: number;
    archived: number;
  };
}

const TaskFilters: React.FC<TaskFiltersProps> = ({
  filters,
  onFiltersChange,
  taskCounts
}) => {
  const { categories } = useCategoryStore();

  const handleFilterChange = (key: string, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value === '' ? undefined : value
    });
  };

  const clearFilters = () => {
    onFiltersChange({});
  };

  const hasActiveFilters = Object.values(filters).some(value => value !== undefined && value !== '');

  return (
    <div className="card p-6 space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" />
        <input
          type="text"
          placeholder="Search tasks..."
          value={filters.searchQuery || ''}
          onChange={(e) => handleFilterChange('searchQuery', e.target.value)}
          className="input pl-10 text-neutral-900"
        />
      </div>

      {/* Filter Controls */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center space-x-2">
          <Filter size={16} className="text-neutral-500" />
          <span className="text-sm font-medium text-neutral-700">Filters:</span>
        </div>

        {/* Category Filter */}
        <div className="flex items-center space-x-2">
          <label htmlFor="category-filter" className="text-sm text-neutral-600">
            Category:
          </label>
          <select
            id="category-filter"
            value={filters.categoryId || ''}
            onChange={(e) => handleFilterChange('categoryId', e.target.value ? parseInt(e.target.value) : undefined)}
            className="text-sm border border-neutral-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-neutral-200 focus:border-neutral-400 text-neutral-900 bg-white transition-all duration-200"
          >
            <option value="" className="text-neutral-900">All Categories</option>
            {categories.map(category => (
              <option key={category.id} value={category.id} className="text-neutral-900">
                {category.name}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div className="flex items-center space-x-2">
          <label htmlFor="status-filter" className="text-sm text-neutral-600">
            Status:
          </label>
          <select
            id="status-filter"
            value={filters.status || ''}
            onChange={(e) => handleFilterChange('status', e.target.value || undefined)}
            className="text-sm border border-neutral-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-neutral-200 focus:border-neutral-400 text-neutral-900 bg-white transition-all duration-200"
          >
            <option value="" className="text-neutral-900">All Status</option>
            <option value="active" className="text-neutral-900">Active</option>
            <option value="completed" className="text-neutral-900">Completed</option>
            <option value="archived" className="text-neutral-900">Archived</option>
          </select>
        </div>

        {/* Priority Filter */}
        <div className="flex items-center space-x-2">
          <label htmlFor="priority-filter" className="text-sm text-neutral-600">
            Priority:
          </label>
          <select
            id="priority-filter"
            value={filters.priority || ''}
            onChange={(e) => handleFilterChange('priority', e.target.value || undefined)}
            className="text-sm border border-neutral-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-neutral-200 focus:border-neutral-400 text-neutral-900 bg-white transition-all duration-200"
          >
            <option value="" className="text-neutral-900">All Priorities</option>
            <option value="high" className="text-neutral-900">High</option>
            <option value="medium" className="text-neutral-900">Medium</option>
            <option value="low" className="text-neutral-900">Low</option>
          </select>
        </div>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center space-x-1 text-sm text-danger-600 hover:text-danger-700 transition-colors"
          >
            <X size={16} />
            <span>Clear Filters</span>
          </button>
        )}
      </div>

      {/* Task Counts */}
      {taskCounts && (
        <div className="flex items-center space-x-6 text-sm text-neutral-600 pt-4 border-t border-neutral-100">
          <div className="flex items-center space-x-1">
            <span className="font-medium">{taskCounts.total}</span>
            <span>Total</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-neutral-400 rounded-full"></div>
            <span className="font-medium">{taskCounts.active}</span>
            <span>Active</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-success-500 rounded-full"></div>
            <span className="font-medium">{taskCounts.completed}</span>
            <span>Completed</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-neutral-300 rounded-full"></div>
            <span className="font-medium">{taskCounts.archived}</span>
            <span>Archived</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskFilters;