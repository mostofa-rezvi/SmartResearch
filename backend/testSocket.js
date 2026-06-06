const { io } = require('socket.io-client');
const axios = require('axios');

async function run() {
  try {
    console.log('Testing socket connection without auth...');
    const noAuthSocket = io('http://localhost:5000');
    
    noAuthSocket.on('connect_error', (err) => {
      console.log('Expected connect_error without auth:', err.message);
      noAuthSocket.disconnect();
    });
    
    noAuthSocket.on('connect', () => {
      console.error('ERROR: Connected without auth!');
      noAuthSocket.disconnect();
    });

    // We need a real user. Let's create one or login as one.
    // The previous tests used Alice. We can try to register a temporary user or login if we know credentials.
    // Usually admin@example.com / password123 exists from seed data, but since we are running live on dev DB...
    
    console.log('\nPlease check terminal output for success if testing manually.');
  } catch (err) {
    console.error(err);
  }
}

run();
