import test from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcryptjs';

test('passwords are verified against hashes, never compared as plaintext storage', async () => {
  const hash = await bcrypt.hash('SecurePass123!', 10);
  assert.notEqual(hash, 'SecurePass123!');
  assert.equal(await bcrypt.compare('SecurePass123!', hash), true);
  assert.equal(await bcrypt.compare('wrong-password', hash), false);
});