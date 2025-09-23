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
      className={`group task-card card-interactive p-6 transition-all duration-300 ${
        task.status === 'completed' ? 'opacity-70' : ''
      } ${isOverdue ? 'border-danger-200 !bg-danger-25' : ''} ${
        isDueToday && !isOverdue ? 'border-warning-200 !bg-warning-25' : ''
      }`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1">
          {/* Completion Toggle */}
          <button
            onClick={() => onComplete(task)}
            className={`mt-1.5 transition-all duration-200 hover:scale-110 ${
              task.status === 'completed'
                ? 'text-success-600 hover:text-success-700'
                : 'text-neutral-300 hover:text-success-500'
            }`}
            disabled={task.status === 'archived'}
          >
            {task.status === 'completed' ? (
              <CheckCircle2 size={22} className="drop-shadow-sm" />
            ) : (
              <Circle size={22} />
            )}
          </button>

          {/* Task Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-3 mb-2">
              <h3 className={`font-semibold text-neutral-900 text-lg tracking-tight ${
                task.status === 'completed' ? 'line-through opacity-60' : ''
              }`}>
                {task.title}
              </h3>

              {/* Priority Badge */}
              <span className={`status-indicator priority-${task.priority} text-xs font-semibold`}>
                {task.priority}
              </span>

              {/* Overdue/Due Today Indicators */}
              {isOverdue && (
                <span className="flex items-center text-danger-600 text-xs font-medium bg-danger-100 px-2 py-1 rounded-lg">
                  <AlertTriangle size={12} className="mr-1" />
                  Overdue
                </span>
              )}
              {isDueToday && !isOverdue && (
                <span className="flex items-center text-warning-600 text-xs font-medium bg-warning-100 px-2 py-1 rounded-lg">
                  <Calendar size={12} className="mr-1" />
                  Due Today
                </span>
              )}
            </div>

            {/* Description */}
            {task.description && (
              <p className="text-neutral-600 mb-3 line-clamp-2 leading-relaxed">
                {task.description}
              </p>
            )}

            {/* Task Meta Information */}
            <div className="flex items-center space-x-4 text-sm text-neutral-500">
              {/* Category */}
              {category && (
                <div className="flex items-center space-x-2">
                  <div
                    className="w-3 h-3 rounded-full shadow-sm"
                    style={{ backgroundColor: category.color }}
                  />
                  <span className="font-medium">{category.name}</span>
                </div>
              )}

              {/* Duration Info */}
              {(task.estimatedDuration || task.actualDuration > 0) && (
                <div className="flex items-center space-x-2">
                  <Clock size={14} />
                  <span>
                    {task.actualDuration > 0 && (
                      <span className="text-success-600 font-semibold">
                        {formatDuration(task.actualDuration)}
                      </span>
                    )}
                    {task.estimatedDuration && task.actualDuration > 0 && (
                      <span className="text-neutral-400 mx-1">/</span>
                    )}
                    {task.estimatedDuration && (
                      <span className="text-neutral-600">
                        {formatDuration(task.estimatedDuration)} est.
                      </span>
                    )}
                  </span>
                </div>
              )}

              {/* Due Date */}
              {task.dueDate && (
                <div className="flex items-center space-x-2">
                  <Calendar size={14} />
                  <span className={isOverdue ? 'text-danger-600 font-semibold' : 'font-medium'}>
                    {formatDate(task.dueDate)}
                  </span>
                </div>
              )}

              {/* Status */}
              <span className={`status-${task.status} text-xs`}>
                {task.status}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className={`flex items-center space-x-2 transition-all duration-300 ${
          showActions ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2'
        }`}>
          {/* Start Session Button */}
          {task.status === 'active' && onStartSession && (
            <button
              onClick={() => onStartSession(task)}
              className="p-2.5 text-success-600 hover:text-success-700 hover:bg-success-50 rounded-xl transition-all duration-200 hover:scale-110 active:scale-95 shadow-soft"
              title="Start focus session"
            >
              <Play size={16} />
            </button>
          )}

          {/* Edit Button */}
          {task.status !== 'archived' && (
            <button
              onClick={() => onEdit(task)}
              className="p-2.5 text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-xl transition-all duration-200 hover:scale-110 active:scale-95 shadow-soft"
              title="Edit task"
            >
              <Edit3 size={16} />
            </button>
          )}

          {/* Delete Button */}
          <button
            onClick={() => onDelete(task)}
            className="p-2.5 text-danger-500 hover:text-danger-600 hover:bg-danger-50 rounded-xl transition-all duration-200 hover:scale-110 active:scale-95 shadow-soft"
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