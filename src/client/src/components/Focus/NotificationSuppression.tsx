import React, { useState, useEffect } from 'react';
import { Bell, BellOff, Clock, AlertTriangle, CheckCircle } from 'lucide-react';

interface NotificationSuppressionProps {
  isActive: boolean;
  onToggle: (enabled: boolean) => void;
  allowBreakReminders?: boolean;
  allowUrgentOnly?: boolean;
  onConfigChange?: (config: { allowBreakReminders: boolean; allowUrgentOnly: boolean }) => void;
}

interface SuppressedNotification {
  id: string;
  title: string;
  message: string;
  timestamp: Date;
  type: 'system' | 'app' | 'break' | 'urgent';
  suppressed: boolean;
}

/**
 * Notification suppression component for focus mode
 * Manages which notifications are blocked during focus sessions
 */
const NotificationSuppression: React.FC<NotificationSuppressionProps> = ({
  isActive,
  onToggle,
  allowBreakReminders = true,
  allowUrgentOnly = false,
  onConfigChange,
}) => {
  const [suppressedNotifications, setSuppressedNotifications] = useState<SuppressedNotification[]>([]);
  const [showSuppressedList, setShowSuppressedList] = useState(false);

  // Mock notification interceptor (in real implementation, this would integrate with system APIs)
  useEffect(() => {
    if (!isActive) return;

    const handleNotification = (event: any) => {
      // This is a mock implementation
      // In reality, this would integrate with browser/system notification APIs
      const notification: SuppressedNotification = {
        id: `notif_${Date.now()}`,
        title: event.title || 'System Notification',
        message: event.body || 'Notification message',
        timestamp: new Date(),
        type: determineNotificationType(event),
        suppressed: shouldSuppressNotification(event),
      };

      if (notification.suppressed) {
        setSuppressedNotifications(prev => [notification, ...prev.slice(0, 9)]); // Keep last 10
      }
    };

    // Mock notification events for demonstration
    const mockNotifications = [
      { title: 'Email', body: 'New email received', type: 'app' },
      { title: 'Break Reminder', body: 'Time for a break!', type: 'break' },
      { title: 'System Update', body: 'Update available', type: 'system' },
      { title: 'Urgent Alert', body: 'Critical system alert', type: 'urgent' },
    ];

    const interval = setInterval(() => {
      if (Math.random() > 0.7) { // 30% chance of notification
        const mockNotif = mockNotifications[Math.floor(Math.random() * mockNotifications.length)];
        handleNotification(mockNotif);
      }
    }, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, [isActive, allowBreakReminders, allowUrgentOnly]);

  // Determine notification type based on content
  const determineNotificationType = (event: any): SuppressedNotification['type'] => {
    const title = event.title?.toLowerCase() || '';
    const body = event.body?.toLowerCase() || '';
    
    if (title.includes('break') || body.includes('break')) return 'break';
    if (title.includes('urgent') || title.includes('critical') || title.includes('alert')) return 'urgent';
    if (title.includes('system') || title.includes('update')) return 'system';
    return 'app';
  };

  // Determine if notification should be suppressed
  const shouldSuppressNotification = (event: any): boolean => {
    if (!isActive) return false;

    const type = determineNotificationType(event);
    
    // Always allow urgent notifications if configured
    if (type === 'urgent' && allowUrgentOnly) return false;
    
    // Allow break reminders if configured
    if (type === 'break' && allowBreakReminders) return false;
    
    // Suppress all others when active
    return true;
  };

  // Get suppression status text
  const getSuppressionStatus = () => {
    if (!isActive) return 'Notifications allowed';
    
    const allowed = [];
    if (allowBreakReminders) allowed.push('break reminders');
    if (allowUrgentOnly) allowed.push('urgent alerts');
    
    if (allowed.length === 0) {
      return 'All notifications blocked';
    } else {
      return `Blocking all except ${allowed.join(' and ')}`;
    }
  };

  // Get icon for notification type
  const getNotificationTypeIcon = (type: SuppressedNotification['type']) => {
    switch (type) {
      case 'break':
        return <Clock className="w-4 h-4 text-orange-500" />;
      case 'urgent':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'system':
        return <CheckCircle className="w-4 h-4 text-blue-500" />;
      default:
        return <Bell className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Main suppression toggle */}
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center space-x-3">
          {isActive ? (
            <BellOff className="w-5 h-5 text-red-600" />
          ) : (
            <Bell className="w-5 h-5 text-gray-600" />
          )}
          <div>
            <h3 className="font-medium text-gray-900">Notification Suppression</h3>
            <p className="text-sm text-gray-600">{getSuppressionStatus()}</p>
          </div>
        </div>
        
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => onToggle(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
        </label>
      </div>

      {/* Configuration options */}
      {isActive && onConfigChange && (
        <div className="space-y-3 p-4 border border-gray-200 rounded-lg">
          <h4 className="font-medium text-gray-900">Suppression Settings</h4>
          
          <div className="space-y-2">
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={allowBreakReminders}
                onChange={(e) => onConfigChange({
                  allowBreakReminders: e.target.checked,
                  allowUrgentOnly,
                })}
                className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
              />
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-orange-500" />
                <span className="text-sm text-gray-700">Allow break reminders</span>
              </div>
            </label>
            
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={allowUrgentOnly}
                onChange={(e) => onConfigChange({
                  allowBreakReminders,
                  allowUrgentOnly: e.target.checked,
                })}
                className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
              />
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <span className="text-sm text-gray-700">Allow urgent notifications only</span>
              </div>
            </label>
          </div>
        </div>
      )}

      {/* Suppressed notifications list */}
      {isActive && suppressedNotifications.length > 0 && (
        <div className="border border-gray-200 rounded-lg">
          <button
            onClick={() => setShowSuppressedList(!showSuppressedList)}
            className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center space-x-2">
              <BellOff className="w-4 h-4 text-red-500" />
              <span className="font-medium text-gray-900">
                Suppressed Notifications ({suppressedNotifications.length})
              </span>
            </div>
            <div className={`transform transition-transform ${showSuppressedList ? 'rotate-180' : ''}`}>
              ↓
            </div>
          </button>
          
          {showSuppressedList && (
            <div className="border-t border-gray-200 max-h-64 overflow-y-auto">
              {suppressedNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className="flex items-start space-x-3 p-3 border-b border-gray-100 last:border-b-0"
                >
                  {getNotificationTypeIcon(notification.type)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {notification.title}
                    </p>
                    <p className="text-xs text-gray-600 truncate">
                      {notification.message}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {notification.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      Blocked
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Statistics */}
      {isActive && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-red-50 p-3 rounded-lg">
            <div className="text-2xl font-bold text-red-600">
              {suppressedNotifications.length}
            </div>
            <div className="text-sm text-red-700">Notifications blocked</div>
          </div>
          
          <div className="bg-green-50 p-3 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {suppressedNotifications.filter(n => !n.suppressed).length}
            </div>
            <div className="text-sm text-green-700">Notifications allowed</div>
          </div>
        </div>
      )}

      {/* Help text */}
      <div className="text-xs text-gray-500 bg-blue-50 p-3 rounded-lg">
        <p>
          <strong>Tip:</strong> Notification suppression helps maintain focus during work sessions. 
          Important notifications will be queued and shown when focus mode is disabled.
        </p>
      </div>
    </div>
  );
};

export default NotificationSuppression;