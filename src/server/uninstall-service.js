/**
 * Windows service uninstallation script for Local Task Tracker
 * Removes the application from Windows services
 */

const Service = require('node-windows').Service;
const path = require('path');

// Create a new service object
const svc = new Service({
  name: 'Local Task Tracker',
  description: 'Local Task Tracker - Windows-optimized desktop productivity application',
  script: path.join(__dirname, 'index.js')
});

// Listen for the "uninstall" event so we know when it's done.
svc.on('uninstall', function() {
  console.log('✅ Local Task Tracker service uninstalled successfully!');
  console.log('   The service has been removed from Windows services.');
  console.log('   The application will no longer start automatically with Windows.');
  console.log('');
  console.log('You can still run the application manually using:');
  console.log('   npm start');
});

svc.on('stop', function() {
  console.log('🛑 Local Task Tracker service stopped.');
  console.log('   Proceeding with uninstallation...');
});

svc.on('error', function(err) {
  console.error('❌ Service uninstallation failed:', err.message);
  console.log('');
  console.log('You may need to run this command as Administrator.');
  console.log('Try running Command Prompt as Administrator and run:');
  console.log('   npm run uninstall:service');
  process.exit(1);
});

console.log('Uninstalling Local Task Tracker Windows service...');
console.log('This may take a few moments...');
console.log('');

// Stop the service first if it's running
svc.stop();

// Uninstall the service
svc.uninstall();