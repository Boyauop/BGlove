import test from 'node:test';
import assert from 'node:assert/strict';
import { compatibilityScore, defaultMatchingConfig } from '../server/src/matching.js';
import app from '../server/src/app.js';

test('matching score is weighted, two-way, and explainable', () => {
  const user = { id: 'a', dateOfBirth: '1995-01-01', country: 'ET', city: 'Addis Ababa', relationshipGoal: 'Serious relationship', interests: ['Travel', 'Technology'], languages: ['English'], preferredAgeMin: 24, preferredAgeMax: 35, preferredCountries: ['ET'], preferredGender: 'Everyone', timeZone: 'Africa/Addis_Ababa' };
  const candidate = { id: 'b', dateOfBirth: '1994-01-01', country: 'ET', city: 'Addis Ababa', relationshipGoal: 'Serious relationship', interests: ['Travel', 'Cooking'], languages: ['English'], preferredAgeMin: 24, preferredAgeMax: 35, preferredCountries: ['ET'], preferredGender: 'Everyone', timeZone: 'Africa/Addis_Ababa' };
  const match = compatibilityScore(user, candidate);
  assert.ok(match.score >= 70);
  assert.ok(match.components.interests > 0);
  assert.ok(match.reasons.includes('Shared interests'));
  assert.equal(match.direction.viewerToCandidate.relationshipGoal, 1);
  assert.equal(match.direction.candidateToViewer.relationshipGoal, 1);
  assert.equal(Object.values(defaultMatchingConfig.weights).reduce((sum, weight) => sum + weight, 0), 1);
});

test('missing criteria are excluded instead of invented', () => {
  const match = compatibilityScore({ id: 'a', dateOfBirth: '1995-01-01' }, { id: 'b', dateOfBirth: '1994-01-01' });
  assert.equal(match.score, 0);
  assert.deepEqual(match.components, {});
  assert.deepEqual(match.reasons, []);
});

test('recommendation API returns ranked explanations and records negative feedback', async (t) => {
  const server = app.listen(0);
  t.after(() => server.close());
  await new Promise((resolve) => server.once('listening', resolve));
  const baseUrl = `http://127.0.0.1:${server.address().port}/api`;
  const registration = await fetch(`${baseUrl}/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ firstName: 'Recommendation Tester', email: `recommend-${Date.now()}@example.test`, password: 'SecurePass123!', dateOfBirth: '1990-01-01', country: 'US', city: 'Austin', relationshipGoal: 'Serious relationship', confirmAdult: true }) });
  const token = (await registration.json()).data.token;
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  const recommendations = await fetch(`${baseUrl}/ai/recommendations?limit=2`, { headers }).then((response) => response.json());
  assert.equal(recommendations.success, true);
  assert.ok(recommendations.data.length > 0);
  assert.equal(typeof recommendations.data[0].compatibilityScore, 'number');
  assert.ok(Array.isArray(recommendations.data[0].reasons));
  const candidateId = recommendations.data[0].userId;
  const feedback = await fetch(`${baseUrl}/ai/feedback`, { method: 'POST', headers, body: JSON.stringify({ candidateId, action: 'PASS' }) });
  assert.equal(feedback.status, 201);
  const afterFeedback = await fetch(`${baseUrl}/ai/recommendations?limit=50`, { headers }).then((response) => response.json());
  assert.equal(afterFeedback.data.some((item) => item.userId === candidateId), false);
});
