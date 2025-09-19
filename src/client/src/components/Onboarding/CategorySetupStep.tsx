import React, { useState } from 'react';
import { useOnboardingStore } from '../../stores/onboardingStore';
import { Plus, X, Code, BookOpen, Briefcase, Heart, Zap, Target } from 'lucide-react';

interface CategorySetupStepProps {
  onNext: () => void;
  onPrevious: () => void;
}

interface Category {
  name: string;
  color: string;
  icon: string;
  weeklyGoal: number;
}

export const CategorySetupStep: React.FC<CategorySetupStepProps> = ({ onNext, onPrevious }) => {
  const { preferences, updatePreferences } = useOnboardingStore();
  const [categories, setCategories] = useState<Category[]>(
    preferences.categories.length > 0 ? preferences.categories : [
      { name: 'Deep Work', color: '#3B82F6', icon: 'Target', weeklyGoal: 300 },
      { name: 'Learning', color: '#10B981', icon: 'BookOpen', weeklyGoal: 180 }
    ]
  );

  const availableColors = [
    '#3B82F6', // Blue
    '#10B981', // Green
    '#8B5CF6', // Purple
    '#F59E0B', // Orange
    '#EF4444', // Red
    '#06B6D4', // Cyan
    '#84CC16', // Lime
    '#F97316', // Orange
    '#EC4899', // Pink
    '#6B7280'  // Gray
  ];

  const availableIcons = [
    { name: 'Target', icon: Target },
    { name: 'BookOpen', icon: BookOpen },
    { name: 'Code', icon: Code },
    { name: 'Briefcase', icon: Briefcase },
    { name: 'Heart', icon: Heart },
    { name: 'Zap', icon: Zap }
  ];

  const addCategory = () => {
    if (categories.length < 8) {
      const newCategory: Category = {
        name: '',
        color: availableColors[categories.length % availableColors.length]!,
        icon: 'Target',
        weeklyGoal: 120
      };
      setCategories([...categories, newCategory]);
    }
  };

  const removeCategory = (index: number) => {
    if (categories.length > 1) {
      setCategories(categories.filter((_, i) => i !== index));
    }
  };

  const updateCategory = (index: number, updates: Partial<Category>) => {
    setCategories(categories.map((cat, i) => 
      i === index ? { ...cat, ...updates } : cat
    ));
  };

  const handleNext = () => {
    const validCategories = categories.filter(cat => cat.name.trim() !== '');
    updatePreferences({ categories: validCategories });
    onNext();
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Set up your categories
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Organize your work into categories to track time and set goals for different areas.
        </p>
      </div>

      {/* Categories List */}
      <div className="space-y-3 max-h-80 overflow-y-auto">
        {categories.map((category, index) => {
          const IconComponent = availableIcons.find(i => i.name === category.icon)?.icon || Target;
          
          return (
            <div key={index} className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-start space-x-3">
                {/* Icon and Color */}
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: category.color + '20' }}
                  >
                    <IconComponent 
                      className="w-4 h-4" 
                      style={{ color: category.color }}
                    />
                  </div>
                  
                  {/* Color Picker */}
                  <div className="flex space-x-1">
                    {availableColors.slice(0, 5).map((color) => (
                      <button
                        key={color}
                        onClick={() => updateCategory(index, { color })}
                        className={`w-4 h-4 rounded-full border-2 ${
                          category.color === color 
                            ? 'border-gray-400 dark:border-gray-300' 
                            : 'border-transparent'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                {/* Category Details */}
                <div className="flex-1 space-y-3">
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={category.name}
                      onChange={(e) => updateCategory(index, { name: e.target.value })}
                      placeholder="Category name"
                      className="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 
                               rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                               focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                      maxLength={30}
                    />
                    
                    {/* Icon Picker */}
                    <select
                      value={category.icon}
                      onChange={(e) => updateCategory(index, { icon: e.target.value })}
                      className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 
                               rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                               focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                    >
                      {availableIcons.map((icon) => (
                        <option key={icon.name} value={icon.name}>
                          {icon.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Weekly Goal */}
                  <div className="flex items-center space-x-2">
                    <label className="text-xs text-gray-600 dark:text-gray-400 min-w-0 flex-shrink-0">
                      Weekly goal:
                    </label>
                    <input
                      type="range"
                      min="30"
                      max="600"
                      step="30"
                      value={category.weeklyGoal}
                      onChange={(e) => updateCategory(index, { weeklyGoal: parseInt(e.target.value) })}
                      className="flex-1 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <span className="text-xs font-medium text-gray-900 dark:text-gray-100 min-w-0 flex-shrink-0">
                      {formatTime(category.weeklyGoal)}
                    </span>
                  </div>
                </div>

                {/* Remove Button */}
                {categories.length > 1 && (
                  <button
                    onClick={() => removeCategory(index)}
                    className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Category Button */}
      {categories.length < 8 && (
        <button
          onClick={addCategory}
          className="w-full p-3 border-2 border-dashed border-gray-300 dark:border-gray-600 
                   rounded-lg text-gray-600 dark:text-gray-400 hover:border-primary-400 
                   hover:text-primary-600 dark:hover:text-primary-400 transition-colors
                   flex items-center justify-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span className="text-sm">Add Category</span>
        </button>
      )}

      {/* Summary */}
      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
          Categories Summary
        </h4>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          <p>
            <span className="font-medium">{categories.filter(c => c.name.trim()).length}</span> categories
          </p>
          <p className="mt-1">
            <span className="font-medium">Total weekly goal:</span> {' '}
            {formatTime(categories.reduce((sum, cat) => sum + cat.weeklyGoal, 0))}
          </p>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          You can add, edit, or remove categories anytime in the app.
        </p>
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          onClick={onPrevious}
          className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 
                   transition-colors"
        >
          Previous
        </button>
        <button
          onClick={handleNext}
          disabled={categories.filter(c => c.name.trim()).length === 0}
          className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 
                   focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 
                   transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue
        </button>
      </div>
    </div>
  );
};