import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';
import { Category, CreateCategoryForm } from '../../../../shared/types';
import { ColorPicker } from './ColorPicker';
import { IconPicker } from './IconPicker';
import { useCategoryActions } from '../../stores/categoryStore';

interface CategoryFormProps {
  category?: Category; // If provided, this is an edit form
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (category: Category) => void;
}

export const CategoryForm: React.FC<CategoryFormProps> = ({
  category,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { createCategory, updateCategory, checkNameUnique } = useCategoryActions();
  
  const [formData, setFormData] = useState<CreateCategoryForm>({
    name: '',
    color: '#3B82F6',
    icon: undefined,
    description: '',
    weeklyGoal: 0,
  });

  const [errors, setErrors] = useState<Partial<CreateCategoryForm>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [nameCheckTimeout, setNameCheckTimeout] = useState<NodeJS.Timeout | null>(null);
  const [isNameUnique, setIsNameUnique] = useState(true);

  const isEditMode = !!category;

  // Initialize form data when category changes
  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name,
        color: category.color,
        icon: category.icon,
        description: category.description || '',
        weeklyGoal: category.weeklyGoal,
      });
    } else {
      setFormData({
        name: '',
        color: '#3B82F6',
        icon: undefined,
        description: '',
        weeklyGoal: 0,
      });
    }
    setErrors({});
    setIsNameUnique(true);
  }, [category, isOpen]);

  // Debounced name uniqueness check
  useEffect(() => {
    if (nameCheckTimeout) {
      clearTimeout(nameCheckTimeout);
    }

    if (formData.name && formData.name.trim()) {
      const timeout = setTimeout(async () => {
        const unique = await checkNameUnique(
          formData.name.trim(),
          isEditMode ? category?.id : undefined
        );
        setIsNameUnique(unique);
      }, 500);
      setNameCheckTimeout(timeout);
    } else {
      setIsNameUnique(true);
    }

    return () => {
      if (nameCheckTimeout) {
        clearTimeout(nameCheckTimeout);
      }
    };
  }, [formData.name, checkNameUnique, isEditMode, category?.id]);

  const validateForm = (): boolean => {
    const newErrors: Partial<CreateCategoryForm> = {};

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Category name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Category name must be at least 2 characters';
    } else if (formData.name.trim().length > 50) {
      newErrors.name = 'Category name must be less than 50 characters';
    } else if (!isNameUnique) {
      newErrors.name = 'Category name already exists';
    }

    // Color validation
    const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    if (!formData.color) {
      newErrors.color = 'Color is required';
    } else if (!hexColorRegex.test(formData.color)) {
      newErrors.color = 'Invalid color format';
    }

    // Weekly goal validation
    if (formData.weeklyGoal < 0) {
      newErrors.weeklyGoal = 'Weekly goal cannot be negative' as any;
    } else if (formData.weeklyGoal > 10080) { // 7 days * 24 hours * 60 minutes
      newErrors.weeklyGoal = 'Weekly goal cannot exceed 10,080 minutes (7 days)' as any;
    }

    // Description validation
    if (formData.description && formData.description.length > 200) {
      newErrors.description = 'Description must be less than 200 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      let result: Category | null = null;

      if (isEditMode && category) {
        result = await updateCategory(category.id, {
          ...formData,
          name: formData.name.trim(),
          description: formData.description?.trim() || undefined,
        });
      } else {
        result = await createCategory({
          ...formData,
          name: formData.name.trim(),
          description: formData.description?.trim() || undefined,
        });
      }

      if (result) {
        onSuccess?.(result);
        onClose();
      }
    } catch (error) {
      console.error('Error saving category:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof CreateCategoryForm, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const formatMinutesToHours = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            {isEditMode ? 'Edit Category' : 'Create New Category'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Name Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Category Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className={`
                w-full px-3 py-2 border rounded-md
                ${errors.name || !isNameUnique
                  ? 'border-red-300 dark:border-red-600'
                  : 'border-gray-300 dark:border-gray-600'
                }
                bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                focus:ring-2 focus:ring-blue-500 focus:border-transparent
              `}
              placeholder="e.g., Work Projects, Personal Development"
              maxLength={50}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errors.name}
              </p>
            )}
            {!errors.name && !isNameUnique && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                This category name already exists
              </p>
            )}
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {formData.name.length}/50 characters
            </p>
          </div>

          {/* Color Picker */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Category Color *
            </label>
            <ColorPicker
              selectedColor={formData.color}
              onColorChange={(color) => handleInputChange('color', color)}
            />
            {errors.color && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errors.color}
              </p>
            )}
          </div>

          {/* Icon Picker */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Category Icon (Optional)
            </label>
            <IconPicker
              selectedIcon={formData.icon}
              onIconChange={(icon) => handleInputChange('icon', icon)}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description (Optional)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={3}
              className={`
                w-full px-3 py-2 border rounded-md resize-none
                ${errors.description
                  ? 'border-red-300 dark:border-red-600'
                  : 'border-gray-300 dark:border-gray-600'
                }
                bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                focus:ring-2 focus:ring-blue-500 focus:border-transparent
              `}
              placeholder="Brief description of this category..."
              maxLength={200}
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errors.description}
              </p>
            )}
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {(formData.description || '').length}/200 characters
            </p>
          </div>

          {/* Weekly Goal */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Weekly Time Goal (Optional)
            </label>
            <div className="flex items-center space-x-4">
              <input
                type="number"
                min="0"
                max="10080"
                value={formData.weeklyGoal}
                onChange={(e) => handleInputChange('weeklyGoal', parseInt(e.target.value) || 0)}
                className={`
                  w-32 px-3 py-2 border rounded-md
                  ${errors.weeklyGoal
                    ? 'border-red-300 dark:border-red-600'
                    : 'border-gray-300 dark:border-gray-600'
                  }
                  bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                  focus:ring-2 focus:ring-blue-500 focus:border-transparent
                `}
              />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                minutes per week
              </span>
              {formData.weeklyGoal > 0 && (
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  ({formatMinutesToHours(formData.weeklyGoal)})
                </span>
              )}
            </div>
            {errors.weeklyGoal && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errors.weeklyGoal}
              </p>
            )}
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Set a weekly time goal to track your progress in this category
            </p>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !isNameUnique || Object.keys(errors).length > 0}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-md transition-colors flex items-center space-x-2 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              <span>{isSubmitting ? 'Saving...' : (isEditMode ? 'Update' : 'Create')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};