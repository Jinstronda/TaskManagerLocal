import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();
import { DatabaseManager } from './database/DatabaseManager';
import { SessionRepository } from './database/repositories/SessionRepository';
import { BackgroundTimerService } from './services/BackgroundTimerService';
import { NotificationService } from './services/NotificationService';
import { SystemTrayService } from './services/SystemTrayService';
import { createTimerRoutes } from './routes/timerRoutes';
import { createCategoryRoutes } from './routes/categoryRoutes';
import { createStreakRoutes } from './routes/streakRoutes';
import { createWeeklyGoalsRoutes } from './routes/weeklyGoalsRoutes';
import { createFocusScoreRoutes } from './routes/focusScoreRoutes';
import analyticsRoutes from './routes/analyticsRoutes';
import { createTaskRoutes } from './routes/taskRoutes';
import settingsRoutes from './routes/settingsRoutes';
import { errorHandler } from './middleware/errorHandler';
import { performanceMiddleware } from './middleware/performanceMiddleware';
import { logger } from './utils/logger';
import { PerformanceMonitor } from './utils/PerformanceMonitor';
import { portManager } from './utils/PortManager';
import { singleInstanceManager } from './utils/SingleInstanceManager';

// Initialize performance monitoring
const performanceMonitor = PerformanceMonitor.getInstance();
performanceMonitor.markStartupBegin();

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});
app.use('/api', limiter);

// CORS configuration for localhost development
app.use(cors({
  origin: [
    'http://localhost:3000', 
    'http://localhost:3001', 
    'http://localhost:3002', 
    'http://localhost:3003',
    'http://localhost:3004',
    'http://localhost:3005',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
    'http://127.0.0.1:3002',
    'http://127.0.0.1:3003',
    'http://127.0.0.1:3004',
    'http://127.0.0.1:3005'
  ],
  credentials: true,
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression middleware
app.use(compression());

// Performance monitoring middleware
app.use(performanceMiddleware.trackApiPerformance());
app.use(performanceMiddleware.trackDatabasePerformance());
app.use(performanceMiddleware.enforcePerformanceBudgets());
app.use(performanceMiddleware.monitorMemoryUsage());

// Logging middleware
app.use(morgan('combined', {
  stream: { write: (message) => logger.info(message.trim()) }
}));

// Serve static files from React build (adjust path for build structure)
app.use(express.static(path.join(__dirname, '../../../src/client/dist')));

// API routes are set up in the startServer function

// Error handling middleware
app.use(errorHandler);

// Initialize database and start server with performance optimization
async function startServer() {
  try {
    // Check for existing instance first
    const lockAcquired = await singleInstanceManager.acquireLock();
    if (!lockAcquired) {
      logger.info('Another instance of Local Task Tracker is already running');
      
      // Try to notify the existing instance to focus/show window
      const notified = await singleInstanceManager.notifyExistingInstance('focus');
      if (notified) {
        logger.info('Notified existing instance to focus');
      }
      
      logger.info('Exiting to prevent duplicate instances');
      process.exit(0);
    }
    // Initialize database with performance monitoring
    const dbManager = await performanceMonitor.measureOperation('databaseInit', async () => {
      const manager = DatabaseManager.getInstance();
      await manager.initialize();
      return manager;
    });
    logger.info('Database initialized successfully');
    
    // Seed default data
    const { initializeDefaultData } = await import('./database/seedData');
    await initializeDefaultData();
    logger.info('Default data initialization completed');

    // Initialize repositories
    const sessionRepository = new SessionRepository();

    // Initialize core services with lazy loading for non-critical services
    const backgroundTimerService = new BackgroundTimerService(sessionRepository);
    
    // Initialize critical services first
    const notificationService = await performanceMonitor.measureOperation('notificationServiceInit', async () => {
      return new NotificationService();
    });

    // Set up service event handlers early
    setupServiceEventHandlers(backgroundTimerService, notificationService);

    // Initialize system tray asynchronously (non-blocking)
    let systemTrayService: SystemTrayService | null = null;
    setImmediate(async () => {
      try {
        systemTrayService = new SystemTrayService();
        await systemTrayService.initialize();
        // Update event handlers to include tray service
        if (systemTrayService) {
          setupServiceEventHandlers(backgroundTimerService, notificationService, systemTrayService);
        }
        logger.info('System tray initialized asynchronously');
      } catch (error) {
        logger.warn('System tray initialization failed (non-critical):', error);
      }
    });

    // Set up API routes with performance monitoring
    await performanceMonitor.measureOperation('routeSetup', async () => {
      app.use('/api/timer', createTimerRoutes(
        backgroundTimerService,
        notificationService,
        null, // System tray service will be initialized asynchronously
        sessionRepository
      ));
      app.use('/api/categories', createCategoryRoutes());
      app.use('/api/tasks', createTaskRoutes());
      app.use('/api/streaks', createStreakRoutes());
      app.use('/api/weekly-goals', createWeeklyGoalsRoutes());
      app.use('/api/focus-score', createFocusScoreRoutes());
      app.use('/api/analytics', analyticsRoutes);
      app.use('/api/settings', settingsRoutes);
      
      // Add performance monitoring endpoints
      app.get('/api/performance', (req, res) => {
        res.json({
          metrics: performanceMonitor.getAllMetrics(),
          memoryUsage: performanceMonitor.getFormattedMemoryUsage(),
          uptime: process.uptime(),
        });
      });

      // Add health check endpoint with performance metrics
      app.get('/api/health', performanceMiddleware.healthCheck());
    });

    // Serve React app for all non-API routes (must be after API routes)
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, '../../../src/client/dist/index.html'));
    });

    // Get port from environment or use default
    const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 8001;
    const server = app.listen(port, () => {
      performanceMonitor.markStartupComplete();
      logger.info(`Server running on http://localhost:${port}`);
      logger.info('Local Task Tracker API ready');
      
      // Save port configuration for other processes
      portManager.savePortConfig(port);
      
      // Log performance summary
      performanceMonitor.logPerformanceSummary();
      
      // Force garbage collection if available to optimize memory
      performanceMonitor.forceGarbageCollection();
    });

    // Set up instance communication for window focusing
    singleInstanceManager.setupInstanceCommunication((message) => {
      if (message.action === 'focus' && systemTrayService) {
        // Focus the application window if possible
        systemTrayService.showTrayNotification(
          'Local Task Tracker',
          'Application is already running. Click to focus.'
        );
      }
    });

    // Graceful shutdown with cleanup
    const shutdown = async () => {
      logger.info('Shutting down gracefully...');
      
      try {
        // Stop background services
        await backgroundTimerService.shutdown();
        
        // Cleanup system tray if initialized
        if (systemTrayService) {
          systemTrayService.cleanup();
        }
        
        // Cleanup performance monitoring
        performanceMonitor.cleanup();
        
        // Cleanup port configuration
        await portManager.cleanupPortConfig();
        
        // Release single instance lock
        await singleInstanceManager.releaseLock();
        
        // Close server
        server.close(() => {
          dbManager.close();
          logger.info('Server shutdown complete');
          process.exit(0);
        });
      } catch (error) {
        logger.error('Error during shutdown:', error);
        process.exit(1);
      }
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Set up event handlers for background services (with optional tray service)
function setupServiceEventHandlers(
  backgroundTimerService: BackgroundTimerService,
  notificationService: NotificationService,
  systemTrayService?: SystemTrayService | null
) {
  // Timer completion notifications
  backgroundTimerService.on('timerCompleted', async (data) => {
    const { sessionId, actualDuration } = data;
    await notificationService.showSessionCompleteNotification(
      'focus_session',
      actualDuration
    );
    
    // Only show tray notification if tray service is available
    if (systemTrayService) {
      systemTrayService.showTrayNotification(
        'Session Complete!',
        `Focus session completed. Duration: ${actualDuration} minutes.`
      );
    }
  });

  // Idle detection notifications
  backgroundTimerService.on('clientIdle', async (data) => {
    await notificationService.showIdleDetectionNotification();
  });

  // System tray timer controls (only if tray service is available)
  if (systemTrayService) {
    systemTrayService.on('startTimer', () => {
      logger.info('Start timer requested from system tray');
      // This would need to be handled by the client application
    });

    systemTrayService.on('pauseTimer', () => {
      logger.info('Pause timer requested from system tray');
      // This would need to be handled by the client application
    });

    systemTrayService.on('stopTimer', () => {
      logger.info('Stop timer requested from system tray');
      // This would need to be handled by the client application
    });

    systemTrayService.on('exitApp', () => {
      logger.info('Exit app requested from system tray');
      process.exit(0);
    });
  }
}

startServer();

export default app;