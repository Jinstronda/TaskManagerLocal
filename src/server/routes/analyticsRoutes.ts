import { Router, Request, Response } from 'express';
import { SessionRepository } from '../database/repositories/SessionRepository';
import { CategoryRepository } from '../database/repositories/CategoryRepository';
import { DailyStatsRepository } from '../database/repositories/DailyStatsRepository';
import { TimeDistribution, ProductivityPattern, GoalProgress } from '../../shared/types';

const router = Router();

/**
 * Get time distribution by categories for a date range
 * GET /api/analytics/time-distribution?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 */
router.get('/time-distribution', async (req: Request, res: Response): Promise<void> => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      res.status(400).json({
        success: false,
        error: { message: 'startDate and endDate are required', statusCode: 400 }
      });
      return;
    }

    const start = new Date(startDate as string);
    const end = new Date(endDate as string);
    
    // Add one day to end date to include the full end date
    end.setDate(end.getDate() + 1);

    // Initialize repositories
    const sessionRepository = new SessionRepository();
    const categoryRepository = new CategoryRepository();

    // Get time distribution data from sessions
    const distributionData = await sessionRepository.getTimeDistributionByCategory(start, end);
    
    // Get category details
    const categories = await categoryRepository.findAll();
    const categoryMap = new Map(categories.map(cat => [cat.id, cat]));

    // Calculate total time for percentage calculation
    const totalTime = distributionData.reduce((sum, item) => sum + item.totalTime, 0);

    // Build time distribution response
    const timeDistribution: TimeDistribution[] = distributionData.map(item => {
      const category = categoryMap.get(item.categoryId);
      return {
        categoryId: item.categoryId,
        categoryName: category?.name || 'Unknown',
        color: category?.color || '#6B7280',
        totalTime: item.totalTime,
        percentage: totalTime > 0 ? (item.totalTime / totalTime) * 100 : 0
      };
    });

    res.json({
      success: true,
      data: {
        timeDistribution,
        totalTime,
        dateRange: { startDate: startDate as string, endDate: endDate as string }
      }
    });
  } catch (error) {
    console.error('Error getting time distribution:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to get time distribution', statusCode: 500 }
    });
  }
});

/**
 * Get productivity patterns by hour of day
 * GET /api/analytics/productivity-patterns?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 */
router.get('/productivity-patterns', async (req: Request, res: Response): Promise<void> => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      res.status(400).json({
        success: false,
        error: { message: 'startDate and endDate are required', statusCode: 400 }
      });
      return;
    }

    const start = new Date(startDate as string);
    const end = new Date(endDate as string);
    end.setDate(end.getDate() + 1);

    // Initialize repository
    const sessionRepository = new SessionRepository();
    const patterns = await sessionRepository.getProductivityPatterns(start, end);
    
    // Fill in missing hours with zero data
    const fullPatterns: ProductivityPattern[] = [];
    for (let hour = 0; hour < 24; hour++) {
      const existingPattern = patterns.find(p => p.hour === hour);
      fullPatterns.push({
        hour,
        averageFocusTime: existingPattern?.averageFocusTime || 0,
        sessionCount: existingPattern?.sessionCount || 0,
        focusScore: existingPattern?.averageQualityRating ? existingPattern.averageQualityRating * 20 : 0 // Convert 1-5 scale to 0-100
      });
    }

    res.json({
      success: true,
      data: {
        patterns: fullPatterns,
        dateRange: { startDate: startDate as string, endDate: endDate as string }
      }
    });
  } catch (error) {
    console.error('Error getting productivity patterns:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to get productivity patterns', statusCode: 500 }
    });
  }
});

/**
 * Get goal progress for categories
 * GET /api/analytics/goal-progress?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 */
router.get('/goal-progress', async (req: Request, res: Response): Promise<void> => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      res.status(400).json({
        success: false,
        error: { message: 'startDate and endDate are required', statusCode: 400 }
      });
      return;
    }

    const start = new Date(startDate as string);
    const end = new Date(endDate as string);
    end.setDate(end.getDate() + 1);

    // Initialize repositories
    const sessionRepository = new SessionRepository();
    const categoryRepository = new CategoryRepository();

    // Get time distribution data
    const distributionData = await sessionRepository.getTimeDistributionByCategory(start, end);
    
    // Get all categories with goals
    const categories = await categoryRepository.findAll();
    
    // Calculate goal progress
    const goalProgress: GoalProgress[] = categories
      .filter(category => category.weeklyGoal > 0)
      .map(category => {
        const categoryData = distributionData.find(d => d.categoryId === category.id);
        const currentProgress = categoryData?.totalTime || 0;
        
        // Calculate weekly goal based on date range
        const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        const weeksInRange = daysDiff / 7;
        const adjustedGoal = Math.round(category.weeklyGoal * weeksInRange);
        
        const percentage = adjustedGoal > 0 ? (currentProgress / adjustedGoal) * 100 : 0;
        
        return {
          categoryId: category.id,
          categoryName: category.name,
          weeklyGoal: adjustedGoal,
          currentProgress,
          percentage: Math.min(percentage, 100), // Cap at 100%
          isCompleted: percentage >= 100
        };
      });

    res.json({
      success: true,
      data: {
        goalProgress,
        dateRange: { startDate: startDate as string, endDate: endDate as string }
      }
    });
  } catch (error) {
    console.error('Error getting goal progress:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to get goal progress', statusCode: 500 }
    });
  }
});

/**
 * Get time distribution trends by day
 * GET /api/analytics/time-distribution-trends?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 */
router.get('/time-distribution-trends', async (req: Request, res: Response): Promise<void> => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      res.status(400).json({
        success: false,
        error: { message: 'startDate and endDate are required', statusCode: 400 }
      });
      return;
    }

    // Return empty trends for now - this is a nice-to-have feature
    res.json({
      success: true,
      data: {
        trends: [],
        dateRange: { startDate: startDate as string, endDate: endDate as string }
      }
    });
  } catch (error) {
    console.error('Error getting time distribution trends:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to get time distribution trends', statusCode: 500 }
    });
  }
});

/**
 * Get session length analysis and recommendations
 * GET /api/analytics/session-length-analysis?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 */
router.get('/session-length-analysis', async (req: Request, res: Response): Promise<void> => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      res.status(400).json({
        success: false,
        error: { message: 'startDate and endDate are required', statusCode: 400 }
      });
      return;
    }

    const start = new Date(startDate as string);
    const end = new Date(endDate as string);
    end.setDate(end.getDate() + 1);

    const sessionRepository = new SessionRepository();
    const analysis = await sessionRepository.getSessionLengthAnalysis(start, end);

    res.json({
      success: true,
      data: analysis
    });
  } catch (error) {
    console.error('Error getting session length analysis:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to get session length analysis', statusCode: 500 }
    });
  }
});

/**
 * Get productivity heatmap data
 * GET /api/analytics/productivity-heatmap?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 */
router.get('/productivity-heatmap', async (req: Request, res: Response): Promise<void> => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      res.status(400).json({
        success: false,
        error: { message: 'startDate and endDate are required', statusCode: 400 }
      });
      return;
    }

    const start = new Date(startDate as string);
    const end = new Date(endDate as string);
    end.setDate(end.getDate() + 1);

    const sessionRepository = new SessionRepository();
    const heatmapData = await sessionRepository.getProductivityHeatmap(start, end);

    res.json({
      success: true,
      data: { heatmapData }
    });
  } catch (error) {
    console.error('Error getting productivity heatmap:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to get productivity heatmap', statusCode: 500 }
    });
  }
});

/**
 * Get session suggestions based on current time and patterns
 * GET /api/analytics/session-suggestions?hour=14&dayOfWeek=1&startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 */
router.get('/session-suggestions', async (req: Request, res: Response): Promise<void> => {
  try {
    const { hour, dayOfWeek, startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      res.status(400).json({
        success: false,
        error: { message: 'startDate and endDate are required', statusCode: 400 }
      });
      return;
    }

    const currentHour = hour ? parseInt(hour as string) : new Date().getHours();
    const currentDayOfWeek = dayOfWeek ? parseInt(dayOfWeek as string) : new Date().getDay();

    const start = new Date(startDate as string);
    const end = new Date(endDate as string);
    end.setDate(end.getDate() + 1);

    const sessionRepository = new SessionRepository();
    const suggestions = await sessionRepository.getSessionSuggestions(currentHour, currentDayOfWeek, start, end);

    res.json({
      success: true,
      data: suggestions
    });
  } catch (error) {
    console.error('Error getting session suggestions:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to get session suggestions', statusCode: 500 }
    });
  }
});

/**
 * Export analytics data as JSON or CSV
 * GET /api/analytics/export?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&format=json|csv
 */
router.get('/export', async (req: Request, res: Response): Promise<void> => {
  try {
    const { startDate, endDate, format = 'json' } = req.query;
    
    if (!startDate || !endDate) {
      res.status(400).json({
        success: false,
        error: { message: 'startDate and endDate are required', statusCode: 400 }
      });
      return;
    }

    const start = new Date(startDate as string);
    const end = new Date(endDate as string);
    end.setDate(end.getDate() + 1);

    // Initialize repositories
    const sessionRepository = new SessionRepository();
    const categoryRepository = new CategoryRepository();

    // Get all analytics data
    const [sessions, distributionData, patterns, categories] = await Promise.all([
      sessionRepository.findByDateRange(start, end),
      sessionRepository.getTimeDistributionByCategory(start, end),
      sessionRepository.getProductivityPatterns(start, end),
      categoryRepository.findAll()
    ]);

    const stats = await sessionRepository.getStatsByDateRange(start, end);
    
    const exportData = {
      metadata: {
        exportDate: new Date().toISOString(),
        dateRange: { startDate: startDate as string, endDate: endDate as string },
        totalSessions: sessions.length,
        totalTime: stats.totalActualTime
      },
      sessions: sessions.map(session => ({
        id: session.id,
        sessionType: session.sessionType,
        startTime: session.startTime,
        endTime: session.endTime,
        plannedDuration: session.plannedDuration,
        actualDuration: session.actualDuration,
        qualityRating: session.qualityRating,
        categoryId: session.categoryId,
        taskId: session.taskId,
        completed: session.completed
      })),
      timeDistribution: distributionData,
      productivityPatterns: patterns,
      categories: categories.map(cat => ({
        id: cat.id,
        name: cat.name,
        color: cat.color,
        weeklyGoal: cat.weeklyGoal
      })),
      statistics: stats
    };

    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="analytics-export-${startDate}-${endDate}.json"`);
      res.json(exportData);
    } else if (format === 'csv') {
      // Convert sessions to CSV format
      const csvHeaders = [
        'Session ID',
        'Session Type',
        'Start Time',
        'End Time',
        'Planned Duration (min)',
        'Actual Duration (min)',
        'Quality Rating',
        'Category ID',
        'Task ID',
        'Completed'
      ];

      const csvRows = sessions.map(session => [
        session.id,
        session.sessionType,
        session.startTime?.toISOString() || '',
        session.endTime?.toISOString() || '',
        session.plannedDuration || '',
        session.actualDuration || '',
        session.qualityRating || '',
        session.categoryId || '',
        session.taskId || '',
        session.completed ? 'Yes' : 'No'
      ]);

      const csvContent = [
        csvHeaders.join(','),
        ...csvRows.map(row => row.map(cell => 
          typeof cell === 'string' && cell.includes(',') ? `"${cell}"` : cell
        ).join(','))
      ].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="analytics-export-${startDate}-${endDate}.csv"`);
      res.send(csvContent);
    } else {
      res.status(400).json({
        success: false,
        error: { message: 'Supported formats: json, csv', statusCode: 400 }
      });
      return;
    }
  } catch (error) {
    console.error('Error exporting analytics data:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to export analytics data', statusCode: 500 }
    });
  }
});

/**
 * Get weekly and monthly reports with trend analysis
 * GET /api/analytics/reports?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 */
router.get('/reports', async (req: Request, res: Response): Promise<void> => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      res.status(400).json({
        success: false,
        error: { message: 'startDate and endDate are required', statusCode: 400 }
      });
      return;
    }

    const start = new Date(startDate as string);
    const end = new Date(endDate as string);
    end.setDate(end.getDate() + 1);

    const sessionRepository = new SessionRepository();
    const categoryRepository = new CategoryRepository();

    // Generate weekly reports
    const weeklyReports = await generateWeeklyReports(sessionRepository, categoryRepository, start, end);
    
    // Generate monthly reports  
    const monthlyReports = await generateMonthlyReports(sessionRepository, categoryRepository, start, end);
    
    // Generate trend analysis
    const trendAnalysis = await generateTrendAnalysis(sessionRepository, start, end);

    res.json({
      success: true,
      data: {
        weeklyReports,
        monthlyReports,
        trendAnalysis
      }
    });
  } catch (error) {
    console.error('Error getting reports:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to get reports', statusCode: 500 }
    });
  }
});

/**
 * Get focus quality metrics
 * GET /api/analytics/focus-quality?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 */
router.get('/focus-quality', async (req: Request, res: Response): Promise<void> => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      res.status(400).json({
        success: false,
        error: { message: 'startDate and endDate are required', statusCode: 400 }
      });
      return;
    }

    const start = new Date(startDate as string);
    const end = new Date(endDate as string);
    end.setDate(end.getDate() + 1);

    const sessionRepository = new SessionRepository();
    const qualityMetrics = await generateFocusQualityMetrics(sessionRepository, start, end);

    res.json({
      success: true,
      data: qualityMetrics
    });
  } catch (error) {
    console.error('Error getting focus quality metrics:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to get focus quality metrics', statusCode: 500 }
    });
  }
});

/**
 * Get goal progress visualization data
 * GET /api/analytics/goal-progress-visualization?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 */
router.get('/goal-progress-visualization', async (req: Request, res: Response): Promise<void> => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      res.status(400).json({
        success: false,
        error: { message: 'startDate and endDate are required', statusCode: 400 }
      });
      return;
    }

    const start = new Date(startDate as string);
    const end = new Date(endDate as string);
    end.setDate(end.getDate() + 1);

    const sessionRepository = new SessionRepository();
    const categoryRepository = new CategoryRepository();
    const goalProgressData = await generateGoalProgressVisualization(sessionRepository, categoryRepository, start, end);

    res.json({
      success: true,
      data: goalProgressData
    });
  } catch (error) {
    console.error('Error getting goal progress visualization:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to get goal progress visualization', statusCode: 500 }
    });
  }
});

/**
 * Get comparative analysis (week-over-week, month-over-month)
 * GET /api/analytics/comparative?type=week|month&startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 */
router.get('/comparative', async (req: Request, res: Response): Promise<void> => {
  try {
    const { type, startDate, endDate } = req.query;
    
    if (!startDate || !endDate || !type) {
      res.status(400).json({
        success: false,
        error: { message: 'startDate, endDate, and type are required', statusCode: 400 }
      });
      return;
    }

    const start = new Date(startDate as string);
    const end = new Date(endDate as string);
    end.setDate(end.getDate() + 1);

    const sessionRepository = new SessionRepository();
    const comparisonData = await generateComparativeAnalysis(sessionRepository, start, end, type as 'week' | 'month');

    res.json({
      success: true,
      data: comparisonData
    });
  } catch (error) {
    console.error('Error getting comparative analysis:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to get comparative analysis', statusCode: 500 }
    });
  }
});

// Helper functions for generating reports
async function generateWeeklyReports(sessionRepository: SessionRepository, categoryRepository: CategoryRepository, start: Date, end: Date) {
  const reports = [];
  const currentDate = new Date(start);
  
  while (currentDate < end) {
    const weekStart = new Date(currentDate);
    const weekEnd = new Date(currentDate);
    weekEnd.setDate(weekEnd.getDate() + 7);
    
    if (weekEnd > end) weekEnd.setTime(end.getTime());
    
    const weekSessions = await sessionRepository.findByDateRange(weekStart, weekEnd);
    const completedSessions = weekSessions.filter(s => s.completed);
    
    if (completedSessions.length > 0) {
      const totalFocusTime = completedSessions.reduce((sum, s) => sum + (s.actualDuration || 0), 0);
      const averageSessionLength = totalFocusTime / completedSessions.length;
      const averageQuality = completedSessions
        .filter(s => s.qualityRating)
        .reduce((sum, s, _, arr) => sum + (s.qualityRating || 0) / arr.length, 0);
      
      // Get top category
      const categoryTimes = new Map<number, number>();
      completedSessions.forEach(s => {
        const current = categoryTimes.get(s.categoryId) || 0;
        categoryTimes.set(s.categoryId, current + (s.actualDuration || 0));
      });
      
      const topCategoryId = Array.from(categoryTimes.entries())
        .sort(([,a], [,b]) => b - a)[0]?.[0];
      
      const categories = await categoryRepository.findAll();
      const topCategory = categories.find(c => c.id === topCategoryId)?.name || 'Unknown';
      
      reports.push({
        weekStart: weekStart.toISOString().split('T')[0],
        weekEnd: weekEnd.toISOString().split('T')[0],
        totalFocusTime,
        sessionsCompleted: completedSessions.length,
        averageSessionLength,
        focusScore: averageQuality * 20, // Convert to 0-100 scale
        topCategory,
        goalsAchieved: 0, // TODO: Calculate from goals
        totalGoals: 0
      });
    }
    
    currentDate.setDate(currentDate.getDate() + 7);
  }
  
  return reports;
}

async function generateMonthlyReports(sessionRepository: SessionRepository, categoryRepository: CategoryRepository, start: Date, end: Date) {
  const reports = [];
  const currentDate = new Date(start.getFullYear(), start.getMonth(), 1);
  
  while (currentDate < end) {
    const monthStart = new Date(currentDate);
    const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    
    if (monthEnd > end) monthEnd.setTime(end.getTime());
    
    const monthSessions = await sessionRepository.findByDateRange(monthStart, monthEnd);
    const completedSessions = monthSessions.filter(s => s.completed);
    
    if (completedSessions.length > 0) {
      const totalFocusTime = completedSessions.reduce((sum, s) => sum + (s.actualDuration || 0), 0);
      const averageSessionLength = totalFocusTime / completedSessions.length;
      const averageQuality = completedSessions
        .filter(s => s.qualityRating)
        .reduce((sum, s, _, arr) => sum + (s.qualityRating || 0) / arr.length, 0);
      
      // Get top category
      const categoryTimes = new Map<number, number>();
      completedSessions.forEach(s => {
        const current = categoryTimes.get(s.categoryId) || 0;
        categoryTimes.set(s.categoryId, current + (s.actualDuration || 0));
      });
      
      const topCategoryId = Array.from(categoryTimes.entries())
        .sort(([,a], [,b]) => b - a)[0]?.[0];
      
      const categories = await categoryRepository.findAll();
      const topCategory = categories.find(c => c.id === topCategoryId)?.name || 'Unknown';
      
      reports.push({
        month: monthStart.toLocaleDateString('en-US', { month: 'long' }),
        year: monthStart.getFullYear(),
        totalFocusTime,
        sessionsCompleted: completedSessions.length,
        averageSessionLength,
        focusScore: averageQuality * 20,
        topCategory,
        goalsAchieved: 0,
        totalGoals: 0,
        weeklyBreakdown: [] // TODO: Generate weekly breakdown
      });
    }
    
    currentDate.setMonth(currentDate.getMonth() + 1);
  }
  
  return reports;
}

async function generateTrendAnalysis(sessionRepository: SessionRepository, start: Date, end: Date) {
  // Simple trend analysis - can be enhanced
  const sessions = await sessionRepository.findByDateRange(start, end);
  const completedSessions = sessions.filter(s => s.completed);
  
  if (completedSessions.length < 2) {
    return {
      focusTimeTrend: 'stable' as const,
      sessionQualityTrend: 'stable' as const,
      consistencyScore: 50,
      recommendations: ['Complete more sessions to get trend analysis']
    };
  }
  
  // Calculate basic trends
  const midpoint = Math.floor(completedSessions.length / 2);
  const firstHalf = completedSessions.slice(0, midpoint);
  const secondHalf = completedSessions.slice(midpoint);
  
  const firstHalfAvgTime = firstHalf.reduce((sum, s) => sum + (s.actualDuration || 0), 0) / firstHalf.length;
  const secondHalfAvgTime = secondHalf.reduce((sum, s) => sum + (s.actualDuration || 0), 0) / secondHalf.length;
  
  const firstHalfAvgQuality = firstHalf
    .filter(s => s.qualityRating)
    .reduce((sum, s, _, arr) => sum + (s.qualityRating || 0) / arr.length, 0);
  const secondHalfAvgQuality = secondHalf
    .filter(s => s.qualityRating)
    .reduce((sum, s, _, arr) => sum + (s.qualityRating || 0) / arr.length, 0);
  
  const timeTrend = secondHalfAvgTime > firstHalfAvgTime * 1.1 ? 'increasing' : 
                   secondHalfAvgTime < firstHalfAvgTime * 0.9 ? 'decreasing' : 'stable';
  
  const qualityTrend = secondHalfAvgQuality > firstHalfAvgQuality * 1.1 ? 'improving' : 
                       secondHalfAvgQuality < firstHalfAvgQuality * 0.9 ? 'declining' : 'stable';
  
  return {
    focusTimeTrend: timeTrend,
    sessionQualityTrend: qualityTrend,
    consistencyScore: Math.min(100, completedSessions.length * 5), // Simple consistency score
    recommendations: [
      timeTrend === 'decreasing' ? 'Try to maintain longer focus sessions' : '',
      qualityTrend === 'declining' ? 'Focus on session quality over quantity' : '',
      'Maintain consistent daily practice'
    ].filter(Boolean)
  };
}

async function generateFocusQualityMetrics(sessionRepository: SessionRepository, start: Date, end: Date) {
  const sessions = await sessionRepository.findByDateRange(start, end);
  const completedSessions = sessions.filter(s => s.completed && s.actualDuration);
  
  if (completedSessions.length === 0) {
    return null;
  }
  
  // Calculate deep work percentage (sessions >= 45 minutes)
  const deepWorkSessions = completedSessions.filter(s => (s.actualDuration || 0) >= 45);
  const deepWorkPercentage = (deepWorkSessions.length / completedSessions.length) * 100;
  
  // Calculate average quality rating
  const ratedSessions = completedSessions.filter(s => s.qualityRating);
  const averageQualityRating = ratedSessions.length > 0 
    ? ratedSessions.reduce((sum, s) => sum + (s.qualityRating || 0), 0) / ratedSessions.length
    : 0;
  
  // Quality distribution
  const qualityDistribution = [1, 2, 3, 4, 5].map(rating => {
    const count = ratedSessions.filter(s => s.qualityRating === rating).length;
    return {
      rating,
      count,
      percentage: ratedSessions.length > 0 ? (count / ratedSessions.length) * 100 : 0
    };
  });
  
  // Session type breakdown
  const sessionTypes = ['deep_work', 'quick_task', 'break', 'custom'];
  const sessionTypeBreakdown = sessionTypes.map(type => {
    const typeSessions = completedSessions.filter(s => s.sessionType === type);
    const avgQuality = typeSessions.filter(s => s.qualityRating).length > 0
      ? typeSessions.filter(s => s.qualityRating).reduce((sum, s) => sum + (s.qualityRating || 0), 0) / typeSessions.filter(s => s.qualityRating).length
      : 0;
    
    return {
      type,
      count: typeSessions.length,
      averageQuality: avgQuality,
      totalTime: typeSessions.reduce((sum, s) => sum + (s.actualDuration || 0), 0),
      color: type === 'deep_work' ? '#3B82F6' : type === 'quick_task' ? '#10B981' : type === 'break' ? '#F59E0B' : '#8B5CF6'
    };
  }).filter(t => t.count > 0);
  
  // Quality trends (simplified)
  const qualityTrends = [];
  const daysInRange = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  
  for (let i = 0; i < Math.min(daysInRange, 30); i++) {
    const dayStart = new Date(start);
    dayStart.setDate(dayStart.getDate() + i);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);
    
    const daySessions = completedSessions.filter(s => 
      s.startTime && s.startTime >= dayStart && s.startTime < dayEnd
    );
    
    if (daySessions.length > 0) {
      const dayQuality = daySessions.filter(s => s.qualityRating).length > 0
        ? daySessions.filter(s => s.qualityRating).reduce((sum, s) => sum + (s.qualityRating || 0), 0) / daySessions.filter(s => s.qualityRating).length
        : 0;
      
      const deepWorkTime = daySessions.filter(s => (s.actualDuration || 0) >= 45)
        .reduce((sum, s) => sum + (s.actualDuration || 0), 0);
      
      qualityTrends.push({
        date: dayStart.toISOString().split('T')[0],
        averageQuality: dayQuality,
        deepWorkTime,
        totalTime: daySessions.reduce((sum, s) => sum + (s.actualDuration || 0), 0)
      });
    }
  }
  
  return {
    deepWorkPercentage,
    averageQualityRating,
    qualityDistribution,
    sessionTypeBreakdown,
    qualityTrends,
    interruptionAnalysis: {
      averageInterruptions: 0.5, // Placeholder
      interruptionImpact: 15, // Placeholder
      commonInterruptionTimes: []
    },
    focusMetrics: {
      consistencyScore: Math.min(100, completedSessions.length * 3),
      improvementRate: 5, // Placeholder
      optimalSessionLength: deepWorkSessions.length > 0 
        ? deepWorkSessions.reduce((sum, s) => sum + (s.actualDuration || 0), 0) / deepWorkSessions.length
        : 45,
      qualityPredictors: [
        'Sessions between 45-90 minutes show highest quality',
        'Morning sessions (8-11 AM) tend to have better focus',
        'Consistent daily practice improves quality over time'
      ]
    }
  };
}

async function generateGoalProgressVisualization(sessionRepository: SessionRepository, categoryRepository: CategoryRepository, start: Date, end: Date) {
  const categories = await categoryRepository.findAll();
  const sessions = await sessionRepository.findByDateRange(start, end);
  const completedSessions = sessions.filter(s => s.completed);
  
  // Calculate category goals progress
  const categoryGoals = categories
    .filter(cat => cat.weeklyGoal > 0)
    .map(category => {
      const categorySessions = completedSessions.filter(s => s.categoryId === category.id);
      const currentProgress = categorySessions.reduce((sum, s) => sum + (s.actualDuration || 0), 0);
      const percentage = category.weeklyGoal > 0 ? (currentProgress / category.weeklyGoal) * 100 : 0;
      
      return {
        categoryId: category.id,
        categoryName: category.name,
        categoryColor: category.color,
        weeklyGoal: category.weeklyGoal,
        currentProgress,
        percentage: Math.min(percentage, 100),
        isCompleted: percentage >= 100,
        streak: Math.floor(Math.random() * 5) + 1, // Mock data
        bestWeek: Math.max(currentProgress, category.weeklyGoal * 1.2), // Mock data
        averageWeekly: currentProgress * 0.8, // Mock data
        trend: percentage > 80 ? 'up' as const : percentage < 50 ? 'down' as const : 'stable' as const
      };
    });

  // Mock milestones data
  const milestones = [
    {
      id: 1,
      title: '100 Hours of Deep Work',
      description: 'Complete 100 hours of focused work sessions',
      targetValue: 6000, // 100 hours in minutes
      currentValue: Math.min(completedSessions.reduce((sum, s) => sum + (s.actualDuration || 0), 0), 6000),
      unit: 'minutes',
      category: 'Focus',
      isCompleted: false,
      daysRemaining: 30,
      icon: 'clock'
    },
    {
      id: 2,
      title: '30-Day Consistency Streak',
      description: 'Complete at least one focus session every day for 30 days',
      targetValue: 30,
      currentValue: Math.min(15, 30), // Mock current value
      unit: 'days',
      category: 'Consistency',
      isCompleted: false,
      daysRemaining: 15,
      icon: 'calendar'
    }
  ];

  // Mock weekly progress data
  const weeklyProgress = [
    { week: 'Week 1', totalGoals: 3, completedGoals: 2, completionRate: 66.7, totalTime: 1200 },
    { week: 'Week 2', totalGoals: 3, completedGoals: 3, completionRate: 100, totalTime: 1500 },
    { week: 'Week 3', totalGoals: 3, completedGoals: 1, completionRate: 33.3, totalTime: 800 },
    { week: 'Week 4', totalGoals: 3, completedGoals: 2, completionRate: 66.7, totalTime: 1100 }
  ];

  // Mock achievements data
  const achievements = [
    {
      id: 1,
      title: 'First Steps',
      description: 'Complete your first focus session',
      earnedDate: new Date().toISOString(),
      category: 'Getting Started',
      icon: 'star',
      rarity: 'common' as const
    },
    {
      id: 2,
      title: 'Deep Focus Master',
      description: 'Complete a 90-minute deep work session',
      earnedDate: new Date().toISOString(),
      category: 'Focus',
      icon: 'award',
      rarity: 'rare' as const
    }
  ];

  return {
    categoryGoals,
    milestones,
    weeklyProgress,
    achievements
  };
}

async function generateComparativeAnalysis(sessionRepository: SessionRepository, start: Date, end: Date, type: 'week' | 'month') {
  // This is a simplified implementation
  // In a real app, you'd calculate actual period comparisons
  
  const sessions = await sessionRepository.findByDateRange(start, end);
  const completedSessions = sessions.filter(s => s.completed);
  
  if (completedSessions.length === 0) {
    return null;
  }
  
  // Generate mock comparison data
  const mockWeekOverWeek = [
    {
      metric: 'focusTime',
      currentWeek: 1200,
      previousWeek: 1000,
      change: 200,
      changePercentage: 20,
      trend: 'up' as const
    },
    {
      metric: 'sessions',
      currentWeek: 15,
      previousWeek: 12,
      change: 3,
      changePercentage: 25,
      trend: 'up' as const
    },
    {
      metric: 'averageQuality',
      currentWeek: 4.2,
      previousWeek: 3.8,
      change: 0.4,
      changePercentage: 10.5,
      trend: 'up' as const
    }
  ];
  
  const mockMonthOverMonth = mockWeekOverWeek.map(item => ({
    ...item,
    currentMonth: item.currentWeek * 4,
    previousMonth: item.previousWeek * 4,
    change: item.change * 4,
    currentWeek: undefined,
    previousWeek: undefined
  }));
  
  const periodComparison = [
    {
      period: 'This Week',
      focusTime: 1200,
      sessions: 15,
      averageQuality: 4.2,
      goalsAchieved: 3,
      focusScore: 84
    },
    {
      period: 'Last Week',
      focusTime: 1000,
      sessions: 12,
      averageQuality: 3.8,
      goalsAchieved: 2,
      focusScore: 76
    }
  ];
  
  return {
    weekOverWeek: mockWeekOverWeek,
    monthOverMonth: mockMonthOverMonth,
    periodComparison,
    trendAnalysis: {
      overallTrend: 'improving' as const,
      strongestImprovement: 'Session Quality',
      biggestDecline: 'None',
      consistencyRating: 85,
      recommendations: [
        'Continue the upward trend in session quality',
        'Try to increase session frequency',
        'Maintain consistent daily practice'
      ]
    }
  };
}

export default router;