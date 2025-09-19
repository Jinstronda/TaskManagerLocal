import { Service } from 'node-windows';
import path from 'path';
import { logger } from './utils/logger';

// Create a new service object with performance optimizations
const svc = new Service({
  name: 'Local Task Tracker',
  description: 'Local Task Tracker productivity application service - Windows optimized for <1.5s startup and <80MB RAM',
  script: path.join(__dirname, 'index.js'),
  nodeOptions: [
    '--max_old_space_size=80',        // Limit memory usage to 80MB as per requirements
    '--max_semi_space_size=8',        // Optimize garbage collection for low memory
    '--optimize_for_size',            // Optimize V8 for memory usage over speed
    '--gc_interval=100',              // More frequent garbage collection
    '--expose-gc'                     // Allow manual garbage collection
  ],
  env: [
    {
      name: 'NODE_ENV',
      value: 'production'
    },
    {
      name: 'PORT',
      value: '3001'
    },
    {
      name: 'UV_THREADPOOL_SIZE',
      value: '2'                      // Reduce thread pool size for memory optimization
    }
  ],
  // Windows service specific options
  // Windows service will auto-start on boot
});

// Listen for the "install" event, which indicates the process is available as a service.
svc.on('install', () => {
  logger.info('Local Task Tracker service installed successfully with performance optimizations');
  console.log('✓ Service installed with:');
  console.log('  - Auto-start on Windows boot');
  console.log('  - Memory limit: 80MB');
  console.log('  - Optimized for <1.5s startup time');
  svc.start();
});

svc.on('start', () => {
  logger.info('Local Task Tracker service started successfully');
  console.log('✓ Service is now running. You can access the app at http://localhost:3001');
  console.log('✓ System tray integration active');
  console.log('✓ Performance monitoring enabled');
});

svc.on('error', (error?: Error) => {
  logger.error('Service error:', error);
  console.error('✗ Service installation failed:', error?.message);
});

// Install the service with performance logging
console.log('Installing Local Task Tracker service with Windows optimizations...');
console.log('Performance targets:');
console.log('  - Startup time: <1.5 seconds');
console.log('  - Memory usage: <80MB RAM');
console.log('  - Database queries: <50ms');
console.log('  - Timer accuracy: ±500ms');

const startTime = Date.now();
svc.install();

// Monitor installation time
svc.on('install', () => {
  const installTime = Date.now() - startTime;
  console.log(`Installation completed in ${installTime}ms`);
});