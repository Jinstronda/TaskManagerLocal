// Shared types between client and server

export interface Session {
  id: number;
  taskId?: number | undefined;
  categoryId: number;
  sessionType: 'deep_work' | 'quick_task' | 'break' | 'custom';
  startTime: Date;
  endTime?: Date | undefined;
  plannedDuration: number; // minutes
  actualDuration?: number | undefined; // minutes
  qualityRating?: number | undefined; // 1-5
  notes?: string | undefined;
  completed: boolean;
  createdAt: Date;
}

export interface Task {
  id: number;
  title: string;
  description?: string | undefined;
  categoryId: number;
  estimatedDuration?: number | undefined; // minutes
  actualDuration: number; // minutes
  priority: 'low' | 'medium' | 'high';
  status: 'active' | 'completed' | 'archived';
  dueDate?: Date | undefined;
  completedAt?: Date | undefined;
  createdAt: Date;
  updatedAt: Date;
}

export interface Category {
  id: number;
  name: string;
  color: string; // hex color
  icon?: string | undefined; // lucide icon name
  description?: string | undefined;
  weeklyGoal: number; // target minutes
  createdAt: Date;
}

export interface DailyStats {
  date: string; // YYYY-MM-DD
  totalFocusTime: number; // minutes
  sessionsCompleted: number;
  focusScore: number; // 0-100
  streakDay: boolean;
  createdAt: Date;
}

export interface UserSettings {
  key: string;
  value: string;
  updatedAt: Date;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    statusCode: number;
    stack?: string;
  };
}

// Timer state types
export interface TimerState {
  isRunning: boolean;
  isPaused: boolean;
  currentSession: Session | null;
  remainingTime: number; // seconds
  sessionType: Session['sessionType'];
  plannedDuration: number; // minutes
}

// Analytics types
export interface TimeDistribution {
  categoryId: number;
  categoryName: string;
  color: string;
  totalTime: number; // minutes
  percentage: number;
}

export interface ProductivityPattern {
  hour: number;
  averageFocusTime: number; // minutes
  sessionCount: number;
  focusScore: number;
}

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  streakDates: string[]; // YYYY-MM-DD format
}

export interface GoalProgress {
  categoryId: number;
  categoryName: string;
  weeklyGoal: number; // minutes
  currentProgress: number; // minutes
  percentage: number;
  isCompleted: boolean;
}

// Form types
export interface CreateTaskForm {
  title: string;
  description?: string;
  categoryId: number;
  estimatedDuration?: number;
  priority: Task['priority'];
  dueDate?: string; // ISO string
}

export interface CreateCategoryForm {
  name: string;
  color: string;
  icon?: string;
  description?: string;
  weeklyGoal: number;
}

export interface SessionPreferences {
  deepWorkDuration: number; // minutes
  quickTaskDuration: number; // minutes
  breakDuration: number; // minutes
  customDuration: number; // minutes
  autoStartBreaks: boolean;
  soundEnabled: boolean;
  notificationsEnabled: boolean;
}

// Theme and UI types
export type Theme = 'light' | 'dark' | 'system';

export interface UIPreferences {
  theme: Theme;
  fontSize: 'small' | 'medium' | 'large';
  compactMode: boolean;
  showSeconds: boolean;
  dashboardLayout: string[];
}

// Notification preferences types
export interface NotificationPreferences {
  enabled: boolean;
  sessionComplete: {
    enabled: boolean;
    sound: boolean;
    duration: number; // seconds
    showTaskInfo: boolean;
  };
  breakReminders: {
    enabled: boolean;
    sound: boolean;
    frequency: 'after_each' | 'after_2' | 'after_3' | 'smart'; // sessions
    duration: number; // seconds
    smartThreshold: number; // minutes of continuous work
  };
  dailyReview: {
    enabled: boolean;
    time: string; // HH:MM format
    sound: boolean;
    weekendsIncluded: boolean;
  };
  weeklyReview: {
    enabled: boolean;
    dayOfWeek: number; // 0-6, Sunday = 0
    time: string; // HH:MM format
    sound: boolean;
  };
  goalAchievements: {
    enabled: boolean;
    sound: boolean;
    showProgress: boolean;
  };
  streakMilestones: {
    enabled: boolean;
    sound: boolean;
    milestones: number[]; // days [7, 14, 30, 60, 100]
  };
  idleDetection: {
    enabled: boolean;
    threshold: number; // minutes
    sound: boolean;
  };
  systemSleep: {
    enabled: boolean;
    sound: boolean;
  };
  focusMode: {
    suppressOtherNotifications: boolean;
    allowBreakReminders: boolean;
    allowUrgentOnly: boolean;
  };
}

// Smart break suggestion types
export interface BreakSuggestion {
  type: 'time_based' | 'pattern_based' | 'productivity_based';
  reason: string;
  suggestedDuration: number; // minutes
  confidence: number; // 0-1
  sessionsSinceLastBreak: number;
  totalWorkTime: number; // minutes since last break
}

// Review prompt types
export interface ReviewPrompt {
  type: 'daily' | 'weekly' | 'session_end';
  title: string;
  questions: ReviewQuestion[];
  scheduledTime?: Date;
}

export interface ReviewQuestion {
  id: string;
  type: 'rating' | 'text' | 'multiple_choice' | 'yes_no';
  question: string;
  options?: string[]; // for multiple_choice
  required: boolean;
}

export interface ReviewResponse {
  promptId: string;
  responses: Record<string, string | number>;
  completedAt: Date;
}