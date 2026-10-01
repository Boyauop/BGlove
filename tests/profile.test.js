import test from 'node:test';
import assert from 'node:assert/strict';
import app from '../server/src/app.js';

test('public account responses exclude private fields and profile updates persist', async (t) => {
  const server = app.listen(0);
  t.after(() => server.close());
  await new Promise((resolve) => server.once('listening', resolve));
  const baseUrl = `http://127.0.0.1:${server.address().port}/api`;
  const email = `profile-${Date.now()}@example.test`;
  const registration = await fetch(`${baseUrl}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ firstName: 'Profile Tester', email, password: 'SecurePass123!', dateOfBirth: '1990-01-01', country: 'US', city: 'Austin', relationshipGoal: 'Marriage', confirmAdult: true })
  });
  const registrationBody = await registration.json();
  assert.equal(registration.status, 201);
  const token = registrationBody.data.token;
  assert.equal(Object.hasOwn(registrationBody.data.user, 'email'), false);
  assert.equal(Object.hasOwn(registrationBody.data.user, 'dateOfBirth'), false);
  assert.equal(Object.hasOwn(registrationBody.data.user, 'passwordHash'), false);

  const update = await fetch(`${baseUrl}/me`, { method: 'PATCH', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ bio: 'I enjoy thoughtful conversations and new places.' }) });
  const updateBody = await update.json();
  assert.equal(update.status, 200);
  assert.equal(updateBody.data.bio, 'I enjoy thoughtful conversations and new places.');
  assert.equal(updateBody.data.profileCompletion, 86);
});