import { DatabaseManager } from '../database/DatabaseManager';
import {
  CategoryRepository,
  TaskRepository,
  SessionRepository,
  DailyStatsRepository,
  UserSettingsRepository
} from '../database/repositories';
import { Category, Task, Session, DailyStats } from '../../shared/types';

describe('Database Layer', () => {
  let dbManager: DatabaseManager;
  let categoryRepo: CategoryRepository;
  let taskRepo: TaskRepository;
  let sessionRepo: SessionRepository;
  let dailyStatsRepo: DailyStatsRepository;
  let userSettingsRepo: UserSettingsRepository;

  beforeAll(async () => {
    dbManager = DatabaseManager.getInstance();
    await dbManager.initialize();
    
    categoryRepo = new CategoryRepository();
    taskRepo = new TaskRepository();
    sessionRepo = new SessionRepository();
    dailyStatsRepo = new DailyStatsRepository();
    userSettingsRepo = new UserSettingsRepository();
  });

  afterAll(() => {
    dbManager.close();
  });

  describe('DatabaseManager', () => {
    test('should initialize database successfully', () => {
      expect(dbManager.isHealthy()).toBe(true);
    });

    test('should create tables successfully', (done) => {
      const db = dbManager.getDatabase();
      
      // Check if tables exist
      db.all(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name NOT LIKE 'sqlite_%'
      `, (err, tables) => {
        if (err) {
          done(err);
          return;
        }
        
        const tableNames = tables.map((table: any) => table.name);
        
        expect(tableNames).toContain('categories');
        expect(tableNames).toContain('tasks');
        expect(tableNames).toContain('sessions');
        expect(tableNames).toContain('user_settings');
        expect(tableNames).toContain('daily_stats');
        done();
      });
    });

    test('should have proper indexes', (done) => {
      const db = dbManager.getDatabase();
      
      db.all(`
        SELECT name FROM sqlite_master 
        WHERE type='index' AND name NOT LIKE 'sqlite_%'
      `, (err, indexes) => {
        if (err) {
          done(err);
          return;
        }
        
        const indexNames = indexes.map((index: any) => index.name);
        
        expect(indexNames).toContain('idx_sessions_start_time');
        expect(indexNames).toContain('idx_tasks_category_id');
        expect(indexNames).toContain('idx_sessions_category_id');
        done();
      });
    });

    test('should check health correctly', async () => {
      expect(dbManager.isHealthy()).toBe(true);
      expect(await dbManager.checkHealth()).toBe(true);
    });
  });

  describe('CategoryRepository', () => {
    let testCategory: Category;

    test('should create a category', async () => {
      const categoryData = {
        name: 'Test Category',
        color: '#3B82F6',
        icon: 'folder',
        description: 'Test category description',
        weeklyGoal: 300
      };

      testCategory = await categoryRepo.create(categoryData);

      expect(testCategory.id).toBeDefined();
      expect(testCategory.name).toBe(categoryData.name);
      expect(testCategory.color).toBe(categoryData.color);
      expect(testCategory.icon).toBe(categoryData.icon);
      expect(testCategory.weeklyGoal).toBe(categoryData.weeklyGoal);
      expect(testCategory.createdAt).toBeInstanceOf(Date);
    });

    test('should find category by id', async () => {
      const found = await categoryRepo.findById(testCategory.id);
      
      expect(found).toBeDefined();
      expect(found!.id).toBe(testCategory.id);
      expect(found!.name).toBe(testCategory.name);
    });

    test('should find category by name', async () => {
      const found = await categoryRepo.findByName(testCategory.name);
      
      expect(found).toBeDefined();
      expect(found!.id).toBe(testCategory.id);
    });

    test('should update category', async () => {
      const updates = {
        name: 'Updated Category',
        weeklyGoal: 400
      };

      const updated = await categoryRepo.update(testCategory.id, updates);
      
      expect(updated).toBeDefined();
      expect(updated!.name).toBe(updates.name);
      expect(updated!.weeklyGoal).toBe(updates.weeklyGoal);
      expect(updated!.color).toBe(testCategory.color); // Should remain unchanged
    });

    test('should check name uniqueness', async () => {
      const isUnique = await categoryRepo.isNameUnique('Unique Name');
      const isNotUnique = await categoryRepo.isNameUnique('Updated Category');
      
      expect(isUnique).toBe(true);
      expect(isNotUnique).toBe(false);
    });

    test('should get all categories', async () => {
      const categories = await categoryRepo.findAll();
      
      expect(categories).toBeInstanceOf(Array);
      expect(categories.length).toBeGreaterThan(0);
      expect(categories.some(cat => cat.id === testCategory.id)).toBe(true);
    });
  });

  describe('TaskRepository', () => {
    let testTask: Task;
    let testCategory: Category;

    beforeAll(async () => {
      // Create a category for testing tasks
      testCategory = await categoryRepo.create({
        name: 'Task Test Category',
        color: '#10B981',
        weeklyGoal: 200
      });
    });

    test('should create a task', async () => {
      const taskData = {
        title: 'Test Task',
        description: 'Test task description',
        categoryId: testCategory.id,
        estimatedDuration: 60,
        actualDuration: 0,
        priority: 'high' as const,
        status: 'active' as const,
        dueDate: new Date('2024-12-31')
      };

      testTask = await taskRepo.create(taskData);

      expect(testTask.id).toBeDefined();
      expect(testTask.title).toBe(taskData.title);
      expect(testTask.categoryId).toBe(taskData.categoryId);
      expect(testTask.priority).toBe(taskData.priority);
      expect(testTask.status).toBe(taskData.status);
      expect(testTask.createdAt).toBeInstanceOf(Date);
      expect(testTask.updatedAt).toBeInstanceOf(Date);
    });

    test('should find tasks by category', async () => {
      const tasks = await taskRepo.findByCategory(testCategory.id);
      
      expect(tasks).toBeInstanceOf(Array);
      expect(tasks.some(task => task.id === testTask.id)).toBe(true);
    });

    test('should find tasks by status', async () => {
      const activeTasks = await taskRepo.findByStatus('active');
      
      expect(activeTasks).toBeInstanceOf(Array);
      expect(activeTasks.some(task => task.id === testTask.id)).toBe(true);
    });

    test('should complete a task', async () => {
      const completed = await taskRepo.complete(testTask.id);
      
      expect(completed).toBeDefined();
      expect(completed!.status).toBe('completed');
      expect(completed!.completedAt).toBeInstanceOf(Date);
    });

    test('should search tasks', async () => {
      const results = await taskRepo.search('Test');
      
      expect(results).toBeInstanceOf(Array);
      expect(results.some(task => task.title.includes('Test'))).toBe(true);
    });

    test('should get task statistics by category', async () => {
      const stats = await taskRepo.getStatsByCategory(testCategory.id);
      
      expect(stats.total).toBeGreaterThan(0);
      expect(stats.completed).toBeGreaterThan(0);
      expect(typeof stats.totalEstimatedTime).toBe('number');
      expect(typeof stats.totalActualTime).toBe('number');
    });
  });

  describe('SessionRepository', () => {
    let testSession: Session;
    let testCategory: Category;
    let testTask: Task;

    beforeAll(async () => {
      // Create test data
      testCategory = await categoryRepo.create({
        name: 'Session Test Category',
        color: '#F59E0B',
        weeklyGoal: 150
      });

      testTask = await taskRepo.create({
        title: 'Session Test Task',
        categoryId: testCategory.id,
        actualDuration: 0,
        priority: 'medium',
        status: 'active'
      });
    });

    test('should create a session', async () => {
      const sessionData = {
        taskId: testTask.id,
        categoryId: testCategory.id,
        sessionType: 'deep_work' as const,
        startTime: new Date(),
        plannedDuration: 25,
        completed: false
      };

      testSession = await sessionRepo.create(sessionData);

      expect(testSession.id).toBeDefined();
      expect(testSession.taskId).toBe(sessionData.taskId);
      expect(testSession.categoryId).toBe(sessionData.categoryId);
      expect(testSession.sessionType).toBe(sessionData.sessionType);
      expect(testSession.plannedDuration).toBe(sessionData.plannedDuration);
      expect(testSession.completed).toBe(false);
    });

    test('should find active session', async () => {
      const activeSession = await sessionRepo.findActive();
      
      expect(activeSession).toBeDefined();
      expect(activeSession!.id).toBe(testSession.id);
      expect(activeSession!.completed).toBe(false);
    });

    test('should complete a session', async () => {
      const endTime = new Date();
      const actualDuration = 23;
      const qualityRating = 4;

      const completed = await sessionRepo.complete(testSession.id, endTime, actualDuration, qualityRating);
      
      expect(completed).toBeDefined();
      expect(completed!.completed).toBe(true);
      expect(completed!.actualDuration).toBe(actualDuration);
      expect(completed!.qualityRating).toBe(qualityRating);
      expect(completed!.endTime).toBeInstanceOf(Date);
    });

    test('should get session statistics', async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
      const endDate = new Date();

      const stats = await sessionRepo.getStatsByDateRange(startDate, endDate);
      
      expect(stats.totalSessions).toBeGreaterThan(0);
      expect(stats.completedSessions).toBeGreaterThan(0);
      expect(typeof stats.totalPlannedTime).toBe('number');
      expect(typeof stats.totalActualTime).toBe('number');
    });

    test('should get time distribution by category', async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
      const endDate = new Date();

      const distribution = await sessionRepo.getTimeDistributionByCategory(startDate, endDate);
      
      expect(distribution).toBeInstanceOf(Array);
      expect(distribution.some(item => item.categoryId === testCategory.id)).toBe(true);
    });
  });

  describe('DailyStatsRepository', () => {
    const testDate = '2024-01-15';

    test('should create/update daily stats', async () => {
      const statsData = {
        date: testDate,
        totalFocusTime: 120,
        sessionsCompleted: 3,
        focusScore: 85.5,
        streakDay: true
      };

      const stats = await dailyStatsRepo.upsert(statsData);

      expect(stats.date).toBe(statsData.date);
      expect(stats.totalFocusTime).toBe(statsData.totalFocusTime);
      expect(stats.sessionsCompleted).toBe(statsData.sessionsCompleted);
      expect(stats.focusScore).toBe(statsData.focusScore);
      expect(stats.streakDay).toBe(statsData.streakDay);
    });

    test('should find stats by date', async () => {
      const stats = await dailyStatsRepo.findByDate(testDate);
      
      expect(stats).toBeDefined();
      expect(stats!.date).toBe(testDate);
      expect(stats!.totalFocusTime).toBe(120);
    });

    test('should get current streak', async () => {
      const streakData = await dailyStatsRepo.getCurrentStreak();
      
      expect(typeof streakData.currentStreak).toBe('number');
      expect(typeof streakData.longestStreak).toBe('number');
      expect(streakData.streakDates).toBeInstanceOf(Array);
    });

    test('should calculate stats from sessions', async () => {
      const today = new Date().toISOString().split('T')[0];
      const calculatedStats = await dailyStatsRepo.calculateAndUpdateFromSessions(today!);
      
      expect(calculatedStats.date).toBe(today);
      expect(typeof calculatedStats.totalFocusTime).toBe('number');
      expect(typeof calculatedStats.focusScore).toBe('number');
    });
  });

  describe('UserSettingsRepository', () => {
    test('should set and get settings', async () => {
      const key = 'test_setting';
      const value = 'test_value';

      await userSettingsRepo.set(key, value);
      const retrieved = await userSettingsRepo.get(key);
      
      expect(retrieved).toBe(value);
    });

    test('should handle typed settings', async () => {
      const boolKey = 'bool_setting';
      const numberKey = 'number_setting';
      const objectKey = 'object_setting';

      await userSettingsRepo.setTyped(boolKey, true);
      await userSettingsRepo.setTyped(numberKey, 42);
      await userSettingsRepo.setTyped(objectKey, { test: 'value' });

      const boolValue = await userSettingsRepo.getTyped(boolKey, false);
      const numberValue = await userSettingsRepo.getTyped(numberKey, 0);
      const objectValue = await userSettingsRepo.getTyped(objectKey, {});

      expect(boolValue).toBe(true);
      expect(numberValue).toBe(42);
      expect(objectValue).toEqual({ test: 'value' });
    });

    test('should handle multiple settings', async () => {
      const settings = {
        'multi_1': 'value1',
        'multi_2': 'value2',
        'multi_3': 'value3'
      };

      await userSettingsRepo.setMultiple(settings);
      const retrieved = await userSettingsRepo.getMultiple(Object.keys(settings));
      
      expect(retrieved).toEqual(settings);
    });

    test('should initialize defaults', async () => {
      const defaults = {
        'default_1': 'default_value_1',
        'default_2': 'default_value_2'
      };

      await userSettingsRepo.initializeDefaults(defaults);
      
      const value1 = await userSettingsRepo.get('default_1');
      const value2 = await userSettingsRepo.get('default_2');
      
      expect(value1).toBe('default_value_1');
      expect(value2).toBe('default_value_2');
    });
  });

  describe('Data Validation', () => {
    test('should enforce foreign key constraints', async () => {
      // Try to create a task with non-existent category
      await expect(taskRepo.create({
        title: 'Invalid Task',
        categoryId: 99999,
        actualDuration: 0,
        priority: 'medium',
        status: 'active'
      })).rejects.toThrow();
    });

    test('should enforce unique constraints', async () => {
      // Try to create duplicate category name
      await categoryRepo.create({
        name: 'Unique Test Category',
        color: '#FF0000',
        weeklyGoal: 100
      });

      await expect(categoryRepo.create({
        name: 'Unique Test Category',
        color: '#00FF00',
        weeklyGoal: 200
      })).rejects.toThrow();
    });

    test('should handle invalid data types gracefully', async () => {
      // Test with invalid session type
      await expect(sessionRepo.create({
        categoryId: 1,
        sessionType: 'invalid_type' as any,
        startTime: new Date(),
        plannedDuration: 25,
        completed: false
      })).resolves.toBeDefined(); // Should still create but with the invalid type
    });
  });

  describe('Performance Tests', () => {
    test('should handle bulk operations efficiently', async () => {
      const startTime = Date.now();
      
      // Create multiple categories
      const promises = [];
      for (let i = 0; i < 50; i++) {
        promises.push(categoryRepo.create({
          name: `Bulk Category ${i}`,
          color: '#000000',
          weeklyGoal: 100
        }));
      }
      
      await Promise.all(promises);
      const endTime = Date.now();
      
      // Should complete within reasonable time (less than 1 second)
      expect(endTime - startTime).toBeLessThan(1000);
    });

    test('should execute queries within performance requirements', async () => {
      const startTime = Date.now();
      
      // Test complex query
      await sessionRepo.getProductivityPatterns(
        new Date('2024-01-01'),
        new Date('2024-12-31')
      );
      
      const endTime = Date.now();
      
      // Should complete within 50ms as per requirements
      expect(endTime - startTime).toBeLessThan(50);
    });
  });
});