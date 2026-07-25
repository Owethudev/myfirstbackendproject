import assert from 'node:assert/strict';
import test from 'node:test';

import app from './app.js';

test('app exports an Express app', () => {
  assert.ok(app);
  assert.equal(typeof app.listen, 'function');
});
