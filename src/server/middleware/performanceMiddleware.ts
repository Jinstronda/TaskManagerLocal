import { Request, Response, NextFunction } from 'express';
import { PerformanceMonitor } from '../utils/PerformanceMonitor';
import { logger } from '../utils/logger';

/**
 * Performance monitoring middleware for tracking API response times
 * and ensuring database queries meet the <50ms requirement
 */
export class PerformanceMiddleware {
  private performanceMonitor: PerformanceMonitor;

  constructor() {
    this.performanceMonitor = PerformanceMonitor.getInstance();
  }

  /**
   * Middleware to track API endpoint performance
   */
  public trackApiPerformance() {
    return (req: Request, res: Response, next: NextFunction) => {
      const startTime = performance.now();
      const endpoint = `${req.method} ${req.path}`;

      // Override res.json to capture response time
      const originalJson = res.json;
      const self = this;
      res.json = function(body: any) {
        const duration = performance.now() - startTime;
        
        // Record the metric
        self.performanceMonitor.recordMetric(`api_${endpoint}`, duration);
        
        // Log slow endpoints
        if (duration > 100) { // Log if over 100ms
          logger.warn(`Slow API endpoint: ${endpoint} took ${duration.toFixed(2)}ms`);
        }
        
        // Add performance headers
        res.setHeader('X-Response-Time', `${duration.toFixed(2)}ms`);
        res.setHeader('X-Memory-Usage', self.performanceMonitor.getFormattedMemoryUsage());
        
        return originalJson.call(this, body);
      };

      next();
    };
  }

  /**
   * Middleware to track database query performance
   */
  public trackDatabasePerformance() {
    return (req: Request, res: Response, next: NextFunction) => {
      // Add database performance tracking to request context
      const self = this;
      req.dbPerformance = {
        startQuery: (queryName: string) => {
          const startTime = performance.now();
          return {
            end: () => {
              const duration = performance.now() - startTime;
              self.performanceMonitor.recordMetric(`db_${queryName}`, duration);
              
              // Alert if database query exceeds 50ms threshold
              if (duration > 50) {
                logger.warn(`Slow database query: ${queryName} took ${duration.toFixed(2)}ms (threshold: 50ms)`);
              }
              
              return duration;
            }
          };
        }
      };

      next();
    };
  }

  /**
   * Middleware to enforce performance budgets
   */
  public enforcePerformanceBudgets() {
    return (req: Request, res: Response, next: NextFunction) => {
      const startTime = performance.now();
      
      // Override res.end to check performance budgets
      const originalEnd = res.end;
      res.end = function(chunk?: any, encoding?: any) {
        const duration = performance.now() - startTime;
        const endpoint = `${req.method} ${req.path}`;
        
        // Performance budget enforcement
        const budgets = {
          '/api/timer': 100,      // Timer operations should be fast
          '/api/categories': 75,   // Category operations
          '/api/tasks': 100,       // Task operations
          '/api/analytics': 200,   // Analytics can be slower
          '/api/settings': 50,     // Settings should be very fast
        };
        
        const budget = budgets[req.path as keyof typeof budgets] || 150; // Default budget
        
        if (duration > budget) {
          logger.warn(`Performance budget exceeded: ${endpoint} took ${duration.toFixed(2)}ms (budget: ${budget}ms)`);
          
          // Add warning header
          res.setHeader('X-Performance-Warning', `Budget exceeded: ${duration.toFixed(2)}ms > ${budget}ms`);
        }
        
        return originalEnd.call(this, chunk, encoding);
      };

      next();
    };
  }

  /**
   * Middleware to monitor memory usage and trigger garbage collection
   */
  public monitorMemoryUsage() {
    return (req: Request, res: Response, next: NextFunction) => {
      // Check memory usage before processing request
      const memoryBefore = process.memoryUsage();
      
      // Override res.end to check memory after processing
      const originalEnd = res.end;
      const self = this;
      res.end = function(chunk?: any, encoding?: any) {
        const memoryAfter = process.memoryUsage();
        const memoryDelta = memoryAfter.rss - memoryBefore.rss;
        
        // Record memory usage
        self.performanceMonitor.recordMetric('memory_delta', memoryDelta);
        
        // Trigger garbage collection if memory usage is high
        if (memoryAfter.rss > 70 * 1024 * 1024) { // 70MB threshold
          self.performanceMonitor.forceGarbageCollection();
        }
        
        // Add memory usage header
        res.setHeader('X-Memory-Delta', `${(memoryDelta / 1024 / 1024).toFixed(2)}MB`);
        
        return originalEnd.call(this, chunk, encoding);
      };

      next();
    };
  }

  /**
   * Get performance metrics for monitoring dashboard
   */
  public getPerformanceMetrics(): any {
    return this.performanceMonitor.getAllMetrics();
  }

  /**
   * Health check middleware that includes performance metrics
   */
  public healthCheck() {
    return (req: Request, res: Response) => {
      const metrics = this.performanceMonitor.getAllMetrics();
      const memoryUsage = this.performanceMonitor.getCurrentMemoryUsage();
      
      // Determine health status based on performance metrics
      const isHealthy = {
        memory: memoryUsage.rss < 80 * 1024 * 1024, // Under 80MB
        startup: !metrics.startupTime || metrics.startupTime.latest < 1500, // Under 1.5s
        database: !metrics.databaseQuery || metrics.databaseQuery.average < 50, // Under 50ms
      };
      
      const overallHealth = Object.values(isHealthy).every(Boolean);
      
      res.status(overallHealth ? 200 : 503).json({
        status: overallHealth ? 'healthy' : 'degraded',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: {
          usage: this.performanceMonitor.getFormattedMemoryUsage(),
          withinLimit: isHealthy.memory,
          limit: '80MB'
        },
        performance: {
          startup: metrics.startupTime?.latest || 0,
          database: metrics.databaseQuery?.average || 0,
          api: metrics.api_GET_performance?.average || 0,
        },
        checks: isHealthy,
        metrics: metrics
      });
    };
  }
}

// Extend Express Request interface to include database performance tracking
declare global {
  namespace Express {
    interface Request {
      dbPerformance?: {
        startQuery: (queryName: string) => {
          end: () => number;
        };
      };
    }
  }
}

export const performanceMiddleware = new PerformanceMiddleware();