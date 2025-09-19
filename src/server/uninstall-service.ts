import { Service } from 'node-windows';
import path from 'path';
import { logger } from './utils/logger';

// Create a new service object
const svc = new Service({
  name: 'Local Task Tracker',
  description: 'Local Task Tracker productivity application service',
  script: path.join(__dirname, 'index.js')
});

// Listen for the "uninstall" event so we know when it's done.
svc.on('uninstall', () => {
  logger.info('Local Task Tracker service uninstalled successfully');
  console.log('Service has been uninstalled.');
});

svc.on('error', (error?: Error) => {
  logger.error('Service uninstall error:', error);
});

// Uninstall the service
console.log('Uninstalling Local Task Tracker service...');
svc.uninstall();