import React, { useState } from 'react';
import {
  Folder,
  FolderOpen,
  Briefcase,
  Code,
  BookOpen,
  Heart,
  Home,
  User,
  Star,
  Target,
  Zap,
  Coffee,
  Music,
  Camera,
  Palette,
  Gamepad2,
  Dumbbell,
  Car,
  Plane,
  ShoppingBag,
  DollarSign,
  TrendingUp,
  Calendar,
  Clock,
  CheckCircle,
  X,
  Search,
  Archive,
  Bookmark,
  Tag,
  Flag,
  Wifi,
  Smartphone,
  Monitor,
  Laptop,
  Tablet,
  Headphones,
  Database,
  Server,
  Cloud,
  Users,
  Award,
  Trophy,
  Medal,
  Flower,
  Leaf,
  Smile,
  Cpu,
} from 'lucide-react';

interface IconPickerProps {
  selectedIcon?: string;
  onIconChange: (icon: string | undefined) => void;
  className?: string;
}

// Icon categories for better organization
const ICON_CATEGORIES = {
  'Work & Business': [
    { name: 'briefcase', icon: Briefcase },
    { name: 'code', icon: Code },
    { name: 'trending-up', icon: TrendingUp },
    { name: 'dollar-sign', icon: DollarSign },
    { name: 'target', icon: Target },
    { name: 'award', icon: Award },
    { name: 'trophy', icon: Trophy },
    { name: 'medal', icon: Medal },
  ],
  'Learning & Education': [
    { name: 'book-open', icon: BookOpen },
    { name: 'lightbulb', icon: Zap },
  ],
  'Personal & Life': [
    { name: 'heart', icon: Heart },
    { name: 'home', icon: Home },
    { name: 'user', icon: User },
    { name: 'users', icon: Users },
    { name: 'smile', icon: Smile },
    { name: 'coffee', icon: Coffee },
    { name: 'dumbbell', icon: Dumbbell },
    { name: 'car', icon: Car },
    { name: 'plane', icon: Plane },
    { name: 'shopping-bag', icon: ShoppingBag },
  ],
  'Creative & Hobbies': [
    { name: 'palette', icon: Palette },
    { name: 'camera', icon: Camera },
    { name: 'music', icon: Music },
    { name: 'gamepad-2', icon: Gamepad2 },
    { name: 'flower', icon: Flower },
    { name: 'leaf', icon: Leaf },
  ],
  'Organization': [
    { name: 'folder', icon: Folder },
    { name: 'folder-open', icon: FolderOpen },
    { name: 'calendar', icon: Calendar },
    { name: 'clock', icon: Clock },
    { name: 'check-circle', icon: CheckCircle },
    { name: 'star', icon: Star },
    { name: 'bookmark', icon: Bookmark },
    { name: 'tag', icon: Tag },
    { name: 'flag', icon: Flag },
    { name: 'archive', icon: Archive },
  ],
  'Technology': [
    { name: 'monitor', icon: Monitor },
    { name: 'laptop', icon: Laptop },
    { name: 'smartphone', icon: Smartphone },
    { name: 'tablet', icon: Tablet },
    { name: 'headphones', icon: Headphones },
    { name: 'wifi', icon: Wifi },
    { name: 'cloud', icon: Cloud },
    { name: 'database', icon: Database },
    { name: 'server', icon: Server },
    { name: 'cpu', icon: Cpu },
  ],
};

export const IconPicker: React.FC<IconPickerProps> = ({
  selectedIcon,
  onIconChange,
  className = '',
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('Work & Business');
  const [searchTerm, setSearchTerm] = useState('');

  // Get all icons for search
  const allIcons = Object.values(ICON_CATEGORIES).flat();

  // Filter icons based on search term
  const filteredIcons = searchTerm
    ? allIcons.filter(icon =>
        icon.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : ICON_CATEGORIES[activeCategory as keyof typeof ICON_CATEGORIES] || [];

  const handleIconSelect = (iconName: string) => {
    onIconChange(iconName === selectedIcon ? undefined : iconName);
  };

  const handleClearIcon = () => {
    onIconChange(undefined);
  };

  const getIconComponent = (iconName: string) => {
    const iconData = allIcons.find(icon => icon.name === iconName);
    return iconData?.icon || Folder;
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search icons..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Category Tabs */}
      {!searchTerm && (
        <div className="flex flex-wrap gap-1">
          {Object.keys(ICON_CATEGORIES).map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setActiveCategory(category)}
              className={`
                px-3 py-1 text-xs rounded-full transition-colors
                ${activeCategory === category
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                }
              `}
            >
              {category}
            </button>
          ))}
        </div>
      )}

      {/* Selected Icon Display */}
      {selectedIcon && (
        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 text-gray-600 dark:text-gray-400">
              {React.createElement(getIconComponent(selectedIcon))}
            </div>
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Selected: {selectedIcon}
            </span>
          </div>
          <button
            type="button"
            onClick={handleClearIcon}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            title="Clear selection"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Icon Grid */}
      <div className="grid grid-cols-8 gap-2 max-h-64 overflow-y-auto">
        {filteredIcons.map(({ name, icon: IconComponent }) => (
          <button
            key={name}
            type="button"
            onClick={() => handleIconSelect(name)}
            className={`
              w-10 h-10 rounded-lg border-2 transition-all duration-200 hover:scale-110 flex items-center justify-center
              ${selectedIcon === name
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                : 'border-gray-200 dark:border-gray-600 hover:border-gray-400 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
              }
            `}
            title={name}
          >
            <IconComponent className="w-5 h-5" />
          </button>
        ))}
      </div>

      {/* No results message */}
      {searchTerm && filteredIcons.length === 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>No icons found for "{searchTerm}"</p>
        </div>
      )}

      {/* Help text */}
      <p className="text-xs text-gray-500 dark:text-gray-400">
        Click an icon to select it, or click again to deselect. Icons help identify categories at a glance.
      </p>
    </div>
  );
};