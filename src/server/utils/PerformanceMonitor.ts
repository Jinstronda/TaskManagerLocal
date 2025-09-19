import { logger } from './logger';

/**
 * Performance monitoring utility for tracking startup time, memory usage, and other metrics
 * Helps ensure we meet the performance requirements:
 * - Startup time: < 1.5 seconds
 * - Memory usage: < 80MB RAM
 * - Database queries: < 50ms response time
 * - Timer accuracy: ±500ms
 * - UI responsiveness: 60fps
 */
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number[]> = new Map();
  private startupTime: number = Date.now();
  private memoryCheckInterval: NodeJS.Timeout | null = null;
  private performanceThresholds = {
    startupTime: 1500, // 1.5 seconds in ms
    memoryUsage: 80 * 1024 * 1024, // 80MB in bytes
    databaseQuery: 50, // 50ms
    timerAccuracy: 500, // ±500ms
  };

  private constructor() {
    this.startMemoryMonitoring();
  }

  public static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  /**
   * Mark the start of application startup
   */
  public markStartupBegin(): void {
    this.startupTime = Date.now();
    logger.info('Application startup began');
  }

  /**
   * Mark the completion of application startup and log performance
   */
  public markStartupComplete(): void {
    const startupDuration = Date.now() - this.startupTime;
    this.recordMetric('startupTime', startupDuration);
    
    const status = startupDuration <= this.performanceThresholds.startupTime ? 'PASS' : 'FAIL';
    logger.info(`Application startup completed in ${startupDuration}ms [${status}]`);
    
    if (startupDuration > this.performanceThresholds.startupTime) {
      logger.warn(`Startup time exceeded threshold: ${startupDuration}ms > ${this.performanceThresholds.startupTime}ms`);
    }
  }

  /**
   * Measure the execution time of an operation
   */
  public measureOperation<T>(name: string, operation: () => T): T;
  public measureOperation<T>(name: string, operation: () => Promise<T>): Promise<T>;
  public measureOperation<T>(name: string, operation: () => T | Promise<T>): T | Promise<T> {
    const start = performance.now();
    
    const result = operation();
    
    if (result instanceof Promise) {
      return result.then((value) => {
        const duration = performance.now() - start;
        this.recordMetric(name, duration);
        this.checkThreshold(name, duration);
        return value;
      }).catch((error) => {
        const duration = performance.now() - start;
        this.recordMetric(name, duration);
        logger.error(`Operation ${name} failed after ${duration}ms:`, error);
        throw error;
      });
    } else {
      const duration = performance.now() - start;
      this.recordMetric(name, duration);
      this.checkThreshold(name, duration);
      return result;
    }
  }

  /**
   * Record a performance metric
   */
  public recordMetric(name: string, value: number): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    
    const values = this.metrics.get(name)!;
    values.push(value);
    
    // Keep only the last 100 measurements to prevent memory bloat
    if (values.length > 100) {
      values.shift();
    }
  }

  /**
   * Get current memory usage
   */
  public getCurrentMemoryUsage(): NodeJS.MemoryUsage {
    return process.memoryUsage();
  }

  /**
   * Get formatted memory usage string
   */
  public getFormattedMemoryUsage(): string {
    const usage = this.getCurrentMemoryUsage();
    const rss = Math.round(usage.rss / 1024 / 1024 * 100) / 100;
    const heapUsed = Math.round(usage.heapUsed / 1024 / 1024 * 100) / 100;
    const heapTotal = Math.round(usage.heapTotal / 1024 / 1024 * 100) / 100;
    
    return `RSS: ${rss}MB, Heap Used: ${heapUsed}MB, Heap Total: ${heapTotal}MB`;
  }

  /**
   * Check if memory usage is within limits
   */
  public checkMemoryUsage(): boolean {
    const usage = this.getCurrentMemoryUsage();
    const withinLimit = usage.rss <= this.performanceThresholds.memoryUsage;
    
    if (!withinLimit) {
      const rssInMB = Math.round(usage.rss / 1024 / 1024);
      const limitInMB = Math.round(this.performanceThresholds.memoryUsage / 1024 / 1024);
      logger.warn(`Memory usage exceeded threshold: ${rssInMB}MB > ${limitInMB}MB`);
    }
    
    return withinLimit;
  }

  /**
   * Get performance statistics for a metric
   */
  public getMetricStats(name: string): { 
    count: number; 
    average: number; 
    min: number; 
    max: number; 
    latest: number;
  } | null {
    const values = this.metrics.get(name);
    if (!values || values.length === 0) {
      return null;
    }

    const count = values.length;
    const sum = values.reduce((a, b) => a + b, 0);
    const average = sum / count;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const latest = values[values.length - 1] || 0;

    return { count, average, min, max, latest };
  }

  /**
   * Get all performance metrics
   */
  public getAllMetrics(): Record<string, any> {
    const result: Record<string, any> = {};
    
    for (const [name, values] of this.metrics.entries()) {
      result[name] = this.getMetricStats(name);
    }
    
    // Add current memory usage
    result.memoryUsage = {
      current: this.getCurrentMemoryUsage(),
      formatted: this.getFormattedMemoryUsage(),
      withinLimit: this.checkMemoryUsage(),
    };
    
    return result;
  }

  /**
   * Log performance summary
   */
  public logPerformanceSummary(): void {
    logger.info('=== Performance Summary ===');
    logger.info(`Memory Usage: ${this.getFormattedMemoryUsage()}`);
    
    const startupStats = this.getMetricStats('startupTime');
    if (startupStats) {
      logger.info(`Startup Time: ${startupStats.latest}ms (avg: ${Math.round(startupStats.average)}ms)`);
    }
    
    const dbStats = this.getMetricStats('databaseQuery');
    if (dbStats) {
      logger.info(`Database Queries: avg ${Math.round(dbStats.average)}ms, max ${Math.round(dbStats.max)}ms`);
    }
    
    logger.info('=== End Performance Summary ===');
  }

  /**
   * Start continuous memory monitoring
   */
  private startMemoryMonitoring(): void {
    // Check memory usage every 30 seconds
    this.memoryCheckInterval = setInterval(() => {
      const usage = this.getCurrentMemoryUsage();
      this.recordMetric('memoryUsage', usage.rss);

      // Log memory usage if it's getting high (>70MB)
      if (usage.rss > 70 * 1024 * 1024) {
        logger.warn(`High memory usage detected: ${this.getFormattedMemoryUsage()}`);

        // Trigger garbage collection if available and memory is very high (>150MB)
        if (usage.rss > 150 * 1024 * 1024 && global.gc) {
          try {
            global.gc();
            const newUsage = this.getCurrentMemoryUsage();
            const rssReduced = Math.round((usage.rss - newUsage.rss) / 1024 / 1024 * 100) / 100;
            logger.info(`Garbage collection triggered, freed ${rssReduced}MB`);
          } catch (error) {
            logger.warn('Garbage collection failed:', error);
          }
        } else if (usage.rss > 150 * 1024 * 1024) {
          logger.debug('Garbage collection not available (run with --expose-gc flag)');
        }
      }
    }, 30000);
  }

  /**
   * Check if a metric value exceeds its threshold
   */
  private checkThreshold(name: string, value: number): void {
    let threshold: number | undefined;
    
    switch (name) {
      case 'startupTime':
        threshold = this.performanceThresholds.startupTime;
        break;
      case 'databaseQuery':
        threshold = this.performanceThresholds.databaseQuery;
        break;
      case 'timerAccuracy':
        threshold = this.performanceThresholds.timerAccuracy;
        break;
    }
    
    if (threshold && value > threshold) {
      logger.warn(`Performance threshold exceeded for ${name}: ${value}ms > ${threshold}ms`);
    }
  }

  /**
   * Cleanup monitoring resources
   */
  public cleanup(): void {
    if (this.memoryCheckInterval) {
      clearInterval(this.memoryCheckInterval);
      this.memoryCheckInterval = null;
    }
  }

  /**
   * Force garbage collection if available (for memory optimization)
   */
  public forceGarbageCollection(): void {
    if (global.gc) {
      const beforeGC = this.getCurrentMemoryUsage();
      global.gc();
      const afterGC = this.getCurrentMemoryUsage();
      
      const beforeMB = Math.round(beforeGC.rss / 1024 / 1024);
      const afterMB = Math.round(afterGC.rss / 1024 / 1024);
      const freedMB = beforeMB - afterMB;
      
      if (freedMB > 0) {
        logger.info(`Garbage collection freed ${freedMB}MB (${beforeMB}MB -> ${afterMB}MB)`);
      }
    } else {
      logger.debug('Garbage collection not available (run with --expose-gc flag)');
    }
  }
}