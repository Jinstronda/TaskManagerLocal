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
    <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search tasks..."
          value={filters.searchQuery || ''}
          onChange={(e) => handleFilterChange('searchQuery', e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Filter Controls */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center space-x-2">
          <Filter size={16} className="text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Filters:</span>
        </div>

        {/* Category Filter */}
        <div className="flex items-center space-x-2">
          <label htmlFor="category-filter" className="text-sm text-gray-600">
            Category:
          </label>
          <select
            id="category-filter"
            value={filters.categoryId || ''}
            onChange={(e) => handleFilterChange('categoryId', e.target.value ? parseInt(e.target.value) : undefined)}
            className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900 bg-white"
          >
            <option value="" className="text-gray-900">All Categories</option>
            {categories.map(category => (
              <option key={category.id} value={category.id} className="text-gray-900">
                {category.name}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div className="flex items-center space-x-2">
          <label htmlFor="status-filter" className="text-sm text-gray-600">
            Status:
          </label>
          <select
            id="status-filter"
            value={filters.status || ''}
            onChange={(e) => handleFilterChange('status', e.target.value || undefined)}
            className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900 bg-white"
          >
            <option value="" className="text-gray-900">All Status</option>
            <option value="active" className="text-gray-900">Active</option>
            <option value="completed" className="text-gray-900">Completed</option>
            <option value="archived" className="text-gray-900">Archived</option>
          </select>
        </div>

        {/* Priority Filter */}
        <div className="flex items-center space-x-2">
          <label htmlFor="priority-filter" className="text-sm text-gray-600">
            Priority:
          </label>
          <select
            id="priority-filter"
            value={filters.priority || ''}
            onChange={(e) => handleFilterChange('priority', e.target.value || undefined)}
            className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900 bg-white"
          >
            <option value="" className="text-gray-900">All Priorities</option>
            <option value="high" className="text-gray-900">High</option>
            <option value="medium" className="text-gray-900">Medium</option>
            <option value="low" className="text-gray-900">Low</option>
          </select>
        </div>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center space-x-1 text-sm text-red-600 hover:text-red-700 transition-colors"
          >
            <X size={16} />
            <span>Clear Filters</span>
          </button>
        )}
      </div>

      {/* Task Counts */}
      {taskCounts && (
        <div className="flex items-center space-x-6 text-sm text-gray-600 pt-2 border-t border-gray-100">
          <div className="flex items-center space-x-1">
            <span className="font-medium">{taskCounts.total}</span>
            <span>Total</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span className="font-medium">{taskCounts.active}</span>
            <span>Active</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="font-medium">{taskCounts.completed}</span>
            <span>Completed</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
            <span className="font-medium">{taskCounts.archived}</span>
            <span>Archived</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskFilters;