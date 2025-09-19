/**
 * Windows service installation script for Local Task Tracker
 * Installs the application as a Windows service for auto-start functionality
 */

const Service = require('node-windows').Service;
const path = require('path');

// Create a new service object
const svc = new Service({
  name: 'Local Task Tracker',
  description: 'Local Task Tracker - Windows-optimized desktop productivity application',
  script: path.join(__dirname, 'index.js'),
  nodeOptions: [
    '--max_old_space_size=80',
    '--max_semi_space_size=8',
    '--optimize_for_size',
    '--expose-gc'
  ],
  env: {
    name: 'NODE_ENV',
    value: 'production'
  }
});

// Listen for the "install" event, which indicates the process is available as a service.
svc.on('install', function() {
  console.log('✅ Local Task Tracker service installed successfully!');
  console.log('   Service Name: Local Task Tracker');
  console.log('   Status: Ready to start');
  console.log('   Auto-start: Enabled');
  console.log('');
  console.log('To start the service:');
  console.log('   net start "Local Task Tracker"');
  console.log('');
  console.log('To stop the service:');
  console.log('   net stop "Local Task Tracker"');
  console.log('');
  console.log('The application will now start automatically with Windows.');
  
  // Start the service immediately after installation
  svc.start();
});

svc.on('alreadyinstalled', function() {
  console.log('⚠️  Local Task Tracker service is already installed.');
  console.log('   Use "npm run uninstall:service" to remove it first.');
});

svc.on('start', function() {
  console.log('🚀 Local Task Tracker service started successfully!');
  console.log('   The application is now running in the background.');
  console.log('   Access it at: http://localhost:3001');
});

svc.on('error', function(err) {
  console.error('❌ Service installation failed:', err.message);
  process.exit(1);
});

console.log('Installing Local Task Tracker as Windows service...');
console.log('This may take a few moments...');
console.log('');

// Install the service
svc.install();