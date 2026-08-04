import assert from 'node:assert/strict';
import test from 'node:test';

import app from './app.js';

test('app exports an Express app', () => {
  assert.ok(app);
  assert.equal(typeof app.listen, 'function');
});

test('invalid JSON returns a structured 400 response', async () => {
  const server = app.listen(0);

  try {
    const address = server.address();
    assert.ok(address && typeof address === 'object');

    const response = await fetch(`http://127.0.0.1:${address.port}/api/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{"email":',
    });

    assert.equal(response.status, 400);

    const payload = await response.json();
    assert.equal(payload.success, false);
    assert.match(payload.message, /invalid json/i);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});
