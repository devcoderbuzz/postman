const http = require('http');

const payload = JSON.stringify({
  method: 'GET',
  url: 'https://jsonplaceholder.typicode.com/todos/1'
});

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/proxy',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': payload.length
  }
};

const req = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    console.log('BODY:', data);
    try {
      const json = JSON.parse(data);
      if (json.data && json.data.id === 1) {
        console.log('VERIFICATION PASSED');
      } else {
        console.log('VERIFICATION FAILED: Unexpected data');
      }
    } catch (e) {
      console.log('VERIFICATION FAILED: Invalid JSON', data);
    }
  });
});

req.on('error', (e) => {
  console.error(`problem with request: ${e.message}`);
});

req.write(payload);
req.end();
