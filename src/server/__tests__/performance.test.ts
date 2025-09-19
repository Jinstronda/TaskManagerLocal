import { DatabaseManager } from '../database/DatabaseManager';
import { PerformanceMonitor } from '../utils/PerformanceMonitor';
import { QueryOptimizer } from '../database/QueryOptimizer';
import { SessionRepository } from '../database/repositories/SessionRepository';
import { CategoryRepository } from '../database/repositories/CategoryRepository';
import { TaskRepository } from '../database/repositories/TaskRepository';
import { DailyStatsRepository } from '../database/repositories/DailyStatsRepository';

/**
 * Performance regression tests to ensure the application meets performance requirements:
 * - Startup time: < 1.5 seconds
 * - Memory usage: < 80MB RAM
 * - Database queries: < 50ms response time
 * - Timer accuracy: ±500ms
 * - UI responsiveness: 60fps (tested separately)
 */
describe('Performance Regression Tests', () => {
  let dbManager: DatabaseManager;
  let performanceMonitor: PerformanceMonitor;
  let queryOptimizer: QueryOptimizer;
  let sessionRepo: SessionRepository;
  let categoryRepo: CategoryRepository;
  let taskRepo: TaskRepository;
  let dailyStatsRepo: DailyStatsRepository;

  beforeAll(async () => {
    // Initialize test database
    dbManager = DatabaseManager.getInstance();
    await dbManager.initialize(); // Use default test database
    
    performanceMonitor = PerformanceMonitor.getInstance();
    queryOptimizer = new QueryOptimizer();
    
    // Initialize repositories
    sessionRepo = new SessionRepository();
    categoryRepo = new CategoryRepository();
    taskRepo = new TaskRepository();
    dailyStatsRepo = new DailyStatsRepository();
  });

  afterAll(async () => {
    dbManager.close();
    performanceMonitor.cleanup();
  });

  describe('Startup Performance', () => {
    test('should start up in under 1.5 seconds', async () => {
      const startTime = Date.now();
      
      // Simulate application startup by measuring service initialization
      const services = [
        new SessionRepository(),
        new CategoryRepository(),
        new TaskRepository(),
        new DailyStatsRepository()
      ];
      
      const startupTime = Date.now() - startTime;
      
      expect(startupTime).toBeLessThan(1500); // 1.5 seconds
      expect(services).toHaveLength(4);
    });

    test('should initialize all services quickly', async () => {
      const startTime = performance.now();
      
      // Initialize all core services
      const services = [
        new SessionRepository(),
        new CategoryRepository(),
        new TaskRepository(),
        new DailyStatsRepository()
      ];
      
      const initTime = performance.now() - startTime;
      
      expect(initTime).toBeLessThan(100); // 100ms for service initialization
      expect(services).toHaveLength(4);
    });
  });

  describe('Memory Usage Performance', () => {
    test('should maintain memory usage under 80MB', () => {
      const memoryUsage = process.memoryUsage();
      const rssInMB = memoryUsage.rss / 1024 / 1024;
      
      expect(rssInMB).toBeLessThan(80);
    });

    test('should not have significant memory leaks', async () => {
      const initialMemory = process.memoryUsage().rss;
      
      // Perform memory-intensive operations
      for (let i = 0; i < 100; i++) {
        await categoryRepo.findAll();
        await sessionRepo.findAll();
      }
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      const finalMemory = process.memoryUsage().rss;
      const memoryIncrease = (finalMemory - initialMemory) / 1024 / 1024; // MB
      
      // Memory increase should be minimal (less than 10MB)
      expect(memoryIncrease).toBeLessThan(10);
    });
  });

  describe('Database Query Performance', () => {
    beforeEach(async () => {
      // Create test data
      const category = await categoryRepo.create({
        name: 'Test Category',
        color: '#FF0000',
        weeklyGoal: 300
      });

      // Create multiple sessions for performance testing
      for (let i = 0; i < 50; i++) {
        await sessionRepo.create({
          categoryId: category.id,
          sessionType: 'deep_work',
          startTime: new Date(Date.now() - i * 60000),
          plannedDuration: 25,
          completed: true
        });
      }
    });

    test('should execute SELECT queries in under 50ms', async () => {
      const startTime = performance.now();
      
      const sessions = await sessionRepo.findAll();
      
      const queryTime = performance.now() - startTime;
      
      expect(queryTime).toBeLessThan(50);
      expect(sessions.length).toBeGreaterThan(0);
    });

    test('should execute INSERT queries in under 50ms', async () => {
      const startTime = performance.now();
      
      await sessionRepo.create({
        categoryId: 1,
        sessionType: 'quick_task',
        startTime: new Date(),
        plannedDuration: 15,
        completed: false
      });
      
      const queryTime = performance.now() - startTime;
      
      expect(queryTime).toBeLessThan(50);
    });

    test('should execute UPDATE queries in under 50ms', async () => {
      const session = await sessionRepo.create({
        categoryId: 1,
        sessionType: 'deep_work',
        startTime: new Date(),
        plannedDuration: 25,
        completed: false
      });

      const startTime = performance.now();
      
      await sessionRepo.update(session.id, {
        completed: true,
        actualDuration: 25
      });
      
      const queryTime = performance.now() - startTime;
      
      expect(queryTime).toBeLessThan(50);
    });

    test('should execute DELETE queries in under 50ms', async () => {
      const session = await sessionRepo.create({
        categoryId: 1,
        sessionType: 'deep_work',
        startTime: new Date(),
        plannedDuration: 25,
        completed: false
      });

      const startTime = performance.now();
      
      await sessionRepo.deleteById(session.id);
      
      const queryTime = performance.now() - startTime;
      
      expect(queryTime).toBeLessThan(50);
    });

    test('should handle complex queries efficiently', async () => {
      const startTime = performance.now();
      
      // Complex query with joins and aggregations
      const today = new Date();
      const weekStart = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay());
      const stats = await dailyStatsRepo.getWeeklyStats(weekStart.toISOString().split('T')[0]);
      
      const queryTime = performance.now() - startTime;
      
      expect(queryTime).toBeLessThan(100); // Allow slightly more time for complex queries
      expect(stats).toBeDefined();
    });
  });

  describe('Query Optimization', () => {
    test('should cache frequently accessed queries', async () => {
      const db = dbManager.getDatabase();
      
      // First query (not cached)
      const startTime1 = performance.now();
      await queryOptimizer.executeOptimizedQuery(
        db,
        'SELECT * FROM categories LIMIT 10',
        [],
        'test_cache_query'
      );
      const firstQueryTime = performance.now() - startTime1;

      // Second identical query (should be cached)
      const startTime2 = performance.now();
      await queryOptimizer.executeOptimizedQuery(
        db,
        'SELECT * FROM categories LIMIT 10',
        [],
        'test_cache_query'
      );
      const secondQueryTime = performance.now() - startTime2;

      // Cached query should be significantly faster
      expect(secondQueryTime).toBeLessThan(firstQueryTime);
      expect(secondQueryTime).toBeLessThan(5); // Should be very fast from cache
    });

    test('should provide performance statistics', () => {
      const stats = queryOptimizer.getQueryStats();
      const cacheStats = queryOptimizer.getCacheStats();
      
      expect(stats).toBeInstanceOf(Map);
      expect(cacheStats).toHaveProperty('size');
      expect(cacheStats).toHaveProperty('hitRate');
    });

    test('should generate performance reports', () => {
      const report = queryOptimizer.getPerformanceReport();
      
      expect(report).toHaveProperty('totalQueries');
      expect(report).toHaveProperty('slowQueries');
      expect(report).toHaveProperty('fastQueries');
      expect(report).toHaveProperty('cacheStats');
      expect(report.performanceThreshold).toBe('50ms');
    });
  });

  describe('Performance Monitoring', () => {
    test('should track performance metrics', () => {
      performanceMonitor.recordMetric('test_metric', 25);
      
      const stats = performanceMonitor.getMetricStats('test_metric');
      
      expect(stats).toBeDefined();
      expect(stats?.latest).toBe(25);
      expect(stats?.count).toBe(1);
    });

    test('should measure operation performance', () => {
      const result = performanceMonitor.measureOperation('test_operation', () => {
        // Simulate some work
        let sum = 0;
        for (let i = 0; i < 1000; i++) {
          sum += i;
        }
        return sum;
      });

      expect(result).toBe(499500); // Sum of 0 to 999
      
      const stats = performanceMonitor.getMetricStats('test_operation');
      expect(stats).toBeDefined();
      expect(stats?.count).toBe(1);
    });

    test('should monitor memory usage', () => {
      const memoryUsage = performanceMonitor.getCurrentMemoryUsage();
      const formatted = performanceMonitor.getFormattedMemoryUsage();
      
      expect(memoryUsage).toHaveProperty('rss');
      expect(memoryUsage).toHaveProperty('heapUsed');
      expect(memoryUsage).toHaveProperty('heapTotal');
      expect(formatted).toContain('MB');
    });

    test('should check memory limits', () => {
      const withinLimit = performanceMonitor.checkMemoryUsage();
      
      expect(typeof withinLimit).toBe('boolean');
    });
  });

  describe('Load Testing', () => {
    test('should handle concurrent database operations', async () => {
      const concurrentOperations = 20;
      const startTime = performance.now();
      
      const promises = Array.from({ length: concurrentOperations }, async (_, i) => {
        return sessionRepo.create({
          categoryId: 1,
          sessionType: 'deep_work',
          startTime: new Date(Date.now() + i * 1000),
          plannedDuration: 25,
          completed: false
        });
      });

      const results = await Promise.all(promises);
      const totalTime = performance.now() - startTime;
      const avgTimePerOperation = totalTime / concurrentOperations;

      expect(results).toHaveLength(concurrentOperations);
      expect(avgTimePerOperation).toBeLessThan(50); // Average should be under 50ms
    });

    test('should maintain performance under load', async () => {
      const operations = 100;
      const times: number[] = [];

      for (let i = 0; i < operations; i++) {
        const startTime = performance.now();
        
        await categoryRepo.findAll();
        
        const operationTime = performance.now() - startTime;
        times.push(operationTime);
      }

      const avgTime = times.reduce((sum, time) => sum + time, 0) / times.length;
      const maxTime = Math.max(...times);
      const slowOperations = times.filter(time => time > 50).length;

      expect(avgTime).toBeLessThan(25); // Average should be well under threshold
      expect(maxTime).toBeLessThan(100); // Even worst case should be reasonable
      expect(slowOperations / operations).toBeLessThan(0.1); // Less than 10% slow operations
    });
  });

  describe('Performance Regression Detection', () => {
    test('should detect performance degradation', () => {
      // Simulate baseline performance
      for (let i = 0; i < 10; i++) {
        performanceMonitor.recordMetric('baseline_operation', 20 + Math.random() * 10);
      }

      // Simulate degraded performance
      performanceMonitor.recordMetric('baseline_operation', 80); // Significantly slower

      const stats = performanceMonitor.getMetricStats('baseline_operation');
      const recentPerformance = stats?.latest || 0;
      const avgPerformance = stats?.average || 0;

      // Detect if recent performance is significantly worse than average
      const performanceDegradation = recentPerformance > avgPerformance * 1.5;

      expect(performanceDegradation).toBe(true);
    });

    test('should maintain consistent performance over time', async () => {
      const measurements: number[] = [];
      
      // Take multiple performance measurements
      for (let i = 0; i < 20; i++) {
        const startTime = performance.now();
        await categoryRepo.findAll();
        const duration = performance.now() - startTime;
        measurements.push(duration);
      }

      // Calculate coefficient of variation (standard deviation / mean)
      const mean = measurements.reduce((sum, val) => sum + val, 0) / measurements.length;
      const variance = measurements.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / measurements.length;
      const stdDev = Math.sqrt(variance);
      const coefficientOfVariation = stdDev / mean;

      // Performance should be consistent (low coefficient of variation)
      expect(coefficientOfVariation).toBeLessThan(0.5); // Less than 50% variation
      expect(mean).toBeLessThan(50); // Average should meet threshold
    });
  });
});