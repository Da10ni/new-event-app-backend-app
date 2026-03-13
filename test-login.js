// Test login API
import http from 'http';

// Try original seeded admin
const data = JSON.stringify({
  email: 'admin@eventsplatform.com',
  password: 'Admin@123456'
});

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/v1/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data)
  }
};

console.log('Testing login for:', JSON.parse(data).email);
console.log('Endpoint:', `http://${options.hostname}:${options.port}${options.path}`);
console.log('');

const req = http.request(options, (res) => {
  console.log('Status:', res.statusCode);
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    console.log('\nResponse Body:');
    try {
      console.log(JSON.stringify(JSON.parse(body), null, 2));
    } catch {
      console.log(body || '(empty)');
    }
  });
});

req.on('error', (e) => {
  console.error('Connection Error:', e.message);
});

req.write(data);
req.end();
