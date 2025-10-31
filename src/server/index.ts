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
      connectSrc: ["'self'", "http://localhost:*", "http://127.0.0.1:*"] ,
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

// CORS configuration for localhost development and Neutralino internal server
app.use(cors({
  origin(origin, callback) {
    // Allow requests without an Origin (like curl or same-origin)
    if (!origin) return callback(null, true);

    const allowPatterns = [
      /^http:\/\/localhost:\d+$/,
      /^http:\/\/127\.0\.0\.1:\d+$/
    ];

    if (allowPatterns.some((re) => re.test(origin))) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
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

// v0 loader route: redirect to v0 UI if configured, else fall back to legacy UI
app.get('/', (req, res, next) => {
  const v0Port = process.env.V0_PORT;
  if (v0Port) {
    // Lightweight loader that will navigate to v0 UI
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(`<!doctype html><html><head><meta charset="utf-8"><title>Loading Task Tracker...</title><meta http-equiv="X-UA-Compatible" content="IE=edge"/></head><body style="font-family:system-ui,Segoe UI,Arial;padding:24px"><h2>Launching Task Manager UI...</h2><p>If this takes more than a few seconds, the legacy UI will open automatically.</p><noscript><p>JavaScript is required. <a href="/legacy">Open legacy UI</a></p></noscript><script src="/loader.js?v0=${encodeURIComponent(String(v0Port))}"></script></body></html>`);
    return;
  }
  next();
});

// External loader script to comply with CSP
app.get('/loader.js', (req, res) => {
  const v0Port = parseInt(String(req.query.v0 || ''), 10) || 5000;
  res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
  res.send(`(function(){var port=${JSON.stringify(v0Port)};var attempts=0;function ping(){attempts++;fetch('http://localhost:'+port+'/',{mode:'no-cors'}).then(function(){location.href='http://localhost:'+port+'/';}).catch(function(){if(attempts<40){setTimeout(ping,250);}else{location.href='/legacy';}});}ping();})();`);
});

// Serve static files from React build
// Primary: serve from root with maxAge for production performance
const clientDistPath = path.join(__dirname, '../../../src/client/dist');
app.use(express.static(clientDistPath, { 
  maxAge: '1d',
  etag: true,
  lastModified: true
}));
// Alias: also serve at /resources/app for Neutralino compatibility
app.use('/resources/app', express.static(clientDistPath, {
  maxAge: '1d',
  etag: true,
  lastModified: true
}));
// Serve v0 static export at /v0 when available
app.use('/v0', express.static(path.join(__dirname, '../../../v0-task-manager-ui/out')));
// Ensure Next assets resolve whether prefixed or not
app.use('/_next', express.static(path.join(__dirname, '../../../v0-task-manager-ui/out/_next')));

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

// Legacy UI explicit route
app.get('/legacy', (req, res) => {
  res.sendFile(path.join(clientDistPath, 'index.html'));
});

// Serve React app for all non-API routes (must be after API routes)
app.get('*', (req, res) => {
  res.sendFile(path.join(clientDistPath, 'index.html'));
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
      
      // Auto-launch Neutralino UI when running as packaged exe
      // Detect if we're running from dist-exe (packaged) vs dev environment
      const isPackaged = __dirname.includes('dist-exe') || (process as any).pkg !== undefined;
      if (isPackaged) {
        setTimeout(() => launchNeutralinoUI(), 1000); // Wait 1s for server to be ready
      }
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

// Launch Neutralino UI
function launchNeutralinoUI() {
  const { spawn } = require('child_process');
  const fs = require('fs');
  
  // When packaged with pkg, look in the same directory as the executable
  const exeDir = path.dirname(process.execPath);
  const uiPath = path.join(exeDir, 'task-tracker.exe');
  
  if (!fs.existsSync(uiPath)) {
    logger.warn(`Neutralino UI not found at ${uiPath}, skipping auto-launch`);
    return;
  }
  
  logger.info('Launching Neutralino UI...');
  const uiProcess = spawn(uiPath, [], {
    detached: true,
    stdio: 'ignore',
    cwd: exeDir
  });
  
  uiProcess.unref(); // Allow server to exit independently
  logger.info('UI launched successfully');
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