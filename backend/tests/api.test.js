const test = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const path = require('node:path');

let server;
let serverUrl;

function waitForServer(url, timeout = 20000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const tryOnce = () => {
      fetch(url)
        .then((res) => resolve(res))
        .catch(() => {
          if (Date.now() - start > timeout) {
            reject(new Error('Server did not start in time'));
            return;
          }
          setTimeout(tryOnce, 250);
        });
    };
    tryOnce();
  });
}

test.before(async () => {
  const cwd = path.join(__dirname, '..');
  server = spawn('node', ['index.js'], {
    cwd,
    env: { ...process.env, PORT: '5010', NODE_ENV: 'test' },
    stdio: ['ignore', 'pipe', 'pipe']
  });

  server.stdout.on('data', (chunk) => process.stdout.write(chunk));
  server.stderr.on('data', (chunk) => process.stderr.write(chunk));

  serverUrl = 'http://127.0.0.1:5010';
  await waitForServer(`${serverUrl}/health`);
});

test.after(() => {
  if (server) server.kill('SIGTERM');
});

test('health endpoint responds', async () => {
  const res = await fetch(`${serverUrl}/health`);
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.status, 'OK');
});

test('services endpoint returns data payload', async () => {
  const res = await fetch(`${serverUrl}/api/services`);
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.ok(Array.isArray(body.data));
});

test('track endpoint returns structured not-found response', async () => {
  const res = await fetch(`${serverUrl}/api/track/does-not-exist`);
  assert.equal(res.status, 404);
  const body = await res.json();
  assert.equal(body.error.code, 'TRACK_NOT_FOUND');
});
