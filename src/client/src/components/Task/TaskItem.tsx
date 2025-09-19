import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  Calendar, 
  Edit3, 
  Trash2, 
  AlertTriangle,
  Play
} from 'lucide-react';
import { Task } from '../../../../shared/types';
import { useCategoryStore } from '../../stores/categoryStore';

interface TaskItemProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onComplete: (task: Task) => void;
  onStartSession?: (task: Task) => void;
}

const TaskItem: React.FC<TaskItemProps> = ({
  task,
  onEdit,
  onDelete,
  onComplete,
  onStartSession
}) => {
  const { categories } = useCategoryStore();
  const [showActions, setShowActions] = useState(false);

  const category = categories.find(c => c.id === task.categoryId);
  
  const isOverdue = task.dueDate && task.dueDate < new Date() && task.status === 'active';
  const isDueToday = task.dueDate && 
    task.dueDate.toDateString() === new Date().toDateString() && 
    task.status === 'active';

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusColor = (status: Task['status']) => {
    switch (status) {
      case 'completed': return 'text-green-600';
      case 'archived': return 'text-gray-400';
      case 'active': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const formatDate = (date: Date) => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <div 
      className={`group bg-white border rounded-lg p-4 hover:shadow-md transition-all duration-200 ${
        task.status === 'completed' ? 'opacity-75' : ''
      } ${isOverdue ? 'border-red-200 bg-red-50' : 'border-gray-200'}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1">
          {/* Completion Toggle */}
          <button
            onClick={() => onComplete(task)}
            className={`mt-1 transition-colors ${
              task.status === 'completed' 
                ? 'text-green-600 hover:text-green-700' 
                : 'text-gray-400 hover:text-green-600'
            }`}
            disabled={task.status === 'archived'}
          >
            {task.status === 'completed' ? (
              <CheckCircle2 size={20} />
            ) : (
              <Circle size={20} />
            )}
          </button>

          {/* Task Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <h3 className={`font-medium text-gray-900 ${
                task.status === 'completed' ? 'line-through' : ''
              }`}>
                {task.title}
              </h3>
              
              {/* Priority Badge */}
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(task.priority)}`}>
                {task.priority}
              </span>

              {/* Overdue/Due Today Indicators */}
              {isOverdue && (
                <span className="flex items-center text-red-600 text-xs">
                  <AlertTriangle size={14} className="mr-1" />
                  Overdue
                </span>
              )}
              {isDueToday && !isOverdue && (
                <span className="flex items-center text-orange-600 text-xs">
                  <Calendar size={14} className="mr-1" />
                  Due Today
                </span>
              )}
            </div>

            {/* Description */}
            {task.description && (
              <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                {task.description}
              </p>
            )}

            {/* Task Meta Information */}
            <div className="flex items-center space-x-4 text-xs text-gray-500">
              {/* Category */}
              {category && (
                <div className="flex items-center space-x-1">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: category.color }}
                  />
                  <span>{category.name}</span>
                </div>
              )}

              {/* Duration Info */}
              {(task.estimatedDuration || task.actualDuration > 0) && (
                <div className="flex items-center space-x-1">
                  <Clock size={12} />
                  <span>
                    {task.actualDuration > 0 && (
                      <span className="text-green-600 font-medium">
                        {formatDuration(task.actualDuration)}
                      </span>
                    )}
                    {task.estimatedDuration && task.actualDuration > 0 && ' / '}
                    {task.estimatedDuration && (
                      <span>
                        {formatDuration(task.estimatedDuration)} est.
                      </span>
                    )}
                  </span>
                </div>
              )}

              {/* Due Date */}
              {task.dueDate && (
                <div className="flex items-center space-x-1">
                  <Calendar size={12} />
                  <span className={isOverdue ? 'text-red-600 font-medium' : ''}>
                    {formatDate(task.dueDate)}
                  </span>
                </div>
              )}

              {/* Status */}
              <span className={`font-medium ${getStatusColor(task.status)}`}>
                {task.status}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className={`flex items-center space-x-1 transition-opacity ${
          showActions ? 'opacity-100' : 'opacity-0'
        }`}>
          {/* Start Session Button */}
          {task.status === 'active' && onStartSession && (
            <button
              onClick={() => onStartSession(task)}
              className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-md transition-colors"
              title="Start focus session"
            >
              <Play size={16} />
            </button>
          )}

          {/* Edit Button */}
          {task.status !== 'archived' && (
            <button
              onClick={() => onEdit(task)}
              className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
              title="Edit task"
            >
              <Edit3 size={16} />
            </button>
          )}

          {/* Delete Button */}
          <button
            onClick={() => onDelete(task)}
            className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
            title="Delete task"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskItem;