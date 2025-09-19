import React, { useState } from 'react';
import { Check } from 'lucide-react';

interface ColorPickerProps {
  selectedColor: string;
  onColorChange: (color: string) => void;
  className?: string;
}

// Predefined color palette optimized for productivity apps
const COLOR_PALETTE = [
  '#3B82F6', // Blue
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#8B5CF6', // Violet
  '#06B6D4', // Cyan
  '#84CC16', // Lime
  '#F97316', // Orange
  '#EC4899', // Pink
  '#6B7280', // Gray
  '#14B8A6', // Teal
  '#A855F7', // Purple
  '#DC2626', // Red-600
  '#059669', // Emerald-600
  '#D97706', // Amber-600
  '#7C3AED', // Violet-600
  '#0891B2', // Cyan-600
  '#65A30D', // Lime-600
  '#EA580C', // Orange-600
  '#DB2777', // Pink-600
  '#4B5563', // Gray-600
  '#0D9488', // Teal-600
  '#9333EA', // Purple-600
  '#B91C1C', // Red-700
];

export const ColorPicker: React.FC<ColorPickerProps> = ({
  selectedColor,
  onColorChange,
  className = '',
}) => {
  const [customColor, setCustomColor] = useState(selectedColor);
  const [showCustomInput, setShowCustomInput] = useState(false);

  const handleCustomColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const color = e.target.value;
    setCustomColor(color);
    onColorChange(color);
  };

  const handlePresetColorClick = (color: string) => {
    setCustomColor(color);
    onColorChange(color);
    setShowCustomInput(false);
  };

  const isValidHexColor = (color: string) => {
    return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Color Palette Grid */}
      <div className="grid grid-cols-8 gap-2">
        {COLOR_PALETTE.map((color) => (
          <button
            key={color}
            type="button"
            className={`
              w-8 h-8 rounded-lg border-2 transition-all duration-200 hover:scale-110
              ${selectedColor === color 
                ? 'border-gray-900 dark:border-white shadow-lg' 
                : 'border-gray-200 dark:border-gray-600 hover:border-gray-400'
              }
            `}
            style={{ backgroundColor: color }}
            onClick={() => handlePresetColorClick(color)}
            title={color}
          >
            {selectedColor === color && (
              <Check className="w-4 h-4 text-white mx-auto drop-shadow-sm" />
            )}
          </button>
        ))}
      </div>

      {/* Custom Color Section */}
      <div className="space-y-2">
        <button
          type="button"
          className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
          onClick={() => setShowCustomInput(!showCustomInput)}
        >
          {showCustomInput ? 'Hide custom color' : 'Use custom color'}
        </button>

        {showCustomInput && (
          <div className="flex items-center space-x-3">
            <div className="relative">
              <input
                type="color"
                value={customColor}
                onChange={handleCustomColorChange}
                className="w-12 h-8 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
              />
            </div>
            <div className="flex-1">
              <input
                type="text"
                value={customColor}
                onChange={(e) => {
                  setCustomColor(e.target.value);
                  if (isValidHexColor(e.target.value)) {
                    onColorChange(e.target.value);
                  }
                }}
                placeholder="#3B82F6"
                className={`
                  w-full px-3 py-1 text-sm border rounded-md
                  ${isValidHexColor(customColor)
                    ? 'border-gray-300 dark:border-gray-600'
                    : 'border-red-300 dark:border-red-600'
                  }
                  bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                  focus:ring-2 focus:ring-blue-500 focus:border-transparent
                `}
              />
              {!isValidHexColor(customColor) && (
                <p className="text-xs text-red-500 mt-1">
                  Please enter a valid hex color (e.g., #3B82F6)
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Selected Color Preview */}
      <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
        <span>Selected:</span>
        <div
          className="w-6 h-6 rounded border border-gray-300 dark:border-gray-600"
          style={{ backgroundColor: selectedColor }}
        />
        <span className="font-mono">{selectedColor}</span>
      </div>
    </div>
  );
};