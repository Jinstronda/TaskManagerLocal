const fetch = require('node-fetch');

async function debugDatabase() {
  console.log('🔧 Debugging Database constraints...\\n');

  try {
    // Test categories endpoint to see what categories exist
    console.log('📋 Testing categories endpoint...');
    const categoriesResponse = await fetch('http://localhost:8765/api/categories');
    const categoriesData = await categoriesResponse.json();

    if (categoriesResponse.ok) {
      console.log(`✅ Categories API working. Found ${categoriesData.length} categories:`);
      categoriesData.slice(0, 3).forEach(cat => {
        console.log(`  - ID: ${cat.id}, Name: "${cat.name}"`);
      });
      console.log(categoriesData.length > 3 ? `  ... and ${categoriesData.length - 3} more\\n` : '\\n');
    } else {
      console.log('🔴 Categories API failed:', categoriesData);
      return;
    }

    // Test health endpoint to see system status
    console.log('🏥 Testing health endpoint...');
    const healthResponse = await fetch('http://localhost:8765/api/health');
    const healthData = await healthResponse.json();

    console.log(`Health status: ${healthData.status}`);
    console.log(`Database status: ${healthData.checks?.database ? 'OK' : 'FAILED'}`);
    console.log('');

    // Test a direct timer start with known good data
    console.log('⏱️ Testing timer start with debug payload...');

    const timerPayload = {
      sessionType: 'quick_task',
      plannedDuration: 15,
      taskId: null, // explicitly null
      categoryId: categoriesData[0]?.id // use first available category
    };

    console.log('Payload to send:', JSON.stringify(timerPayload, null, 2));

    const timerResponse = await fetch('http://localhost:8765/api/timer/start', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-client-id': 'debug-client'
      },
      body: JSON.stringify(timerPayload)
    });

    console.log(`Timer response status: ${timerResponse.status}`);

    if (timerResponse.ok) {
      const timerData = await timerResponse.json();
      console.log('✅ Timer start successful!');
      console.log('Response:', JSON.stringify(timerData, null, 2));
    } else {
      const errorText = await timerResponse.text();
      console.log('🔴 Timer start failed!');
      console.log('Error response:', errorText);
    }

  } catch (error) {
    console.log('❌ Debug failed:', error.message);
  }
}

debugDatabase().catch(console.error);