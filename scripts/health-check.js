const http = require('http');

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function checkEndpoint(hostname, port, path = '', timeout = 5000) {
  return new Promise((resolve) => {
    const req = http.request({
      hostname,
      port,
      path,
      timeout
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let parsedData = null;
        try {
          if (data && data.trim().startsWith('{')) {
            parsedData = JSON.parse(data);
          }
        } catch (e) {
          // Not JSON, that's fine
        }

        resolve({
          success: true,
          status: res.statusCode,
          data: parsedData,
          raw: data
        });
      });
    });

    req.on('error', (err) => {
      resolve({
        success: false,
        error: err.message
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        success: false,
        error: 'Timeout'
      });
    });

    req.end();
  });
}

async function healthCheck() {
  log('🏥 Local Task Tracker Health Check', colors.bright + colors.cyan);
  log('=====================================', colors.cyan);

  const checks = [
    {
      name: 'Frontend Server',
      host: 'localhost',
      port: 3000,
      path: '/',
      expected: 'HTML page'
    },
    {
      name: 'Backend Server',
      host: 'localhost',
      port: 8765,
      path: '/api/health',
      expected: 'Health status'
    },
    {
      name: 'Categories API',
      host: 'localhost',
      port: 8765,
      path: '/api/categories',
      expected: 'Categories list'
    },
    {
      name: 'Tasks API',
      host: 'localhost',
      port: 8765,
      path: '/api/tasks',
      expected: 'Tasks list'
    },
    {
      name: 'Timer API',
      host: 'localhost',
      port: 8765,
      path: '/api/timer/status',
      expected: 'Timer status'
    }
  ];

  let allHealthy = true;

  for (const check of checks) {
    process.stdout.write(`🔍 ${check.name}... `);

    const result = await checkEndpoint(check.host, check.port, check.path);

    if (result.success) {
      if (check.path === '/api/health' && result.data) {
        const health = result.data;
        const status = health.status === 'healthy' ? '✅' :
                      health.status === 'degraded' ? '⚠️' : '❌';
        log(`${status} ${check.name} (${health.status})`,
            health.status === 'healthy' ? colors.green : colors.yellow);

        if (health.status !== 'healthy') {
          log(`    Memory: ${health.memory.usage}`, colors.yellow);
          if (health.checks) {
            Object.entries(health.checks).forEach(([key, value]) => {
              const checkStatus = value ? '✅' : '❌';
              log(`    ${key}: ${checkStatus}`, value ? colors.green : colors.red);
            });
          }
        }
      } else if (result.data && result.data.success !== undefined) {
        log(`✅ ${check.name} (${result.data.data?.length || 0} items)`, colors.green);
      } else if (result.raw && result.raw.includes('<!doctype html>')) {
        log(`✅ ${check.name} (HTML page)`, colors.green);
      } else {
        log(`✅ ${check.name}`, colors.green);
      }
    } else {
      log(`❌ ${check.name} - ${result.error}`, colors.red);
      allHealthy = false;
    }
  }

  log('\n=====================================', colors.cyan);

  if (allHealthy) {
    log('🎉 All systems are healthy!', colors.bright + colors.green);
    log('🔗 Application: http://localhost:3000', colors.blue);
  } else {
    log('⚠️ Some systems are not healthy', colors.yellow);
    log('💡 Try running: npm run dev', colors.blue);
  }

  return allHealthy;
}

if (require.main === module) {
  healthCheck().then(healthy => {
    process.exit(healthy ? 0 : 1);
  }).catch(error => {
    log(`💥 Health check failed: ${error.message}`, colors.red);
    process.exit(1);
  });
}

module.exports = healthCheck;