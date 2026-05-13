const net = require('net');
const client = net.createConnection({ port: 5434, host: '127.0.0.1' }, () => {
  console.log('Connected to 127.0.0.1:5434');
  client.end();
});
client.on('error', (err) => {
  console.error('Connection failed:', err.message);
});
