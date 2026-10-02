import test from 'node:test';
import assert from 'node:assert/strict';
import { compatibilityScore, defaultMatchingConfig } from '../server/src/matching.js';

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
