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

test('structured profile fields, photos, and match explanations are exposed safely', async (t) => {
  const server = app.listen(0);
  t.after(() => server.close());
  await new Promise((resolve) => server.once('listening', resolve));
  const baseUrl = `http://127.0.0.1:${server.address().port}/api`;
  const email = `structured-${Date.now()}@example.test`;
  const registration = await fetch(`${baseUrl}/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ firstName: 'Structured Tester', email, password: 'SecurePass123!', dateOfBirth: '1990-01-01', country: 'US', city: 'Austin', relationshipGoal: 'Serious relationship', confirmAdult: true }) });
  const token = (await registration.json()).data.token;
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  const update = await fetch(`${baseUrl}/me`, { method: 'PATCH', headers, body: JSON.stringify({ displayName: 'Structured', education: 'Bachelor degree', languages: ['English'], interests: ['Travel', 'Technology'], preferredAgeMin: 24, preferredAgeMax: 36, preferredCountries: ['KE'] }) });
  const updated = await update.json();
  assert.equal(update.status, 200);
  assert.equal(updated.data.displayName, 'Structured');
  assert.deepEqual(updated.data.languages, ['English']);
  assert.deepEqual(updated.data.preferredCountries, ['KE']);

  const photo = await fetch(`${baseUrl}/me/photos`, { method: 'POST', headers, body: JSON.stringify({ url: 'https://cdn.example.test/profile.jpg', privacy: 'private' }) });
  const photoBody = await photo.json();
  assert.equal(photo.status, 201);
  assert.equal(photoBody.data.photos.length, 0);

  const discovery = await fetch(`${baseUrl}/profiles`, { headers });
  assert.equal(discovery.status, 200);
  const discoveryBody = await discovery.json();
  assert.equal(Array.isArray(discoveryBody.data), true);
  assert.equal(typeof discoveryBody.data[0]?.compatibility?.score, 'number');
  assert.equal(Array.isArray(discoveryBody.data[0]?.compatibility?.criteria), true);
});