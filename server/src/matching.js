export const defaultMatchingConfig = {
  weights: {
    age: 0.15,
    relationshipGoal: 0.20,
    interests: 0.20,
    language: 0.10,
    location: 0.10,
    lifestyle: 0.10,
    partnerPreferences: 0.05,
    timezone: 0.05,
    profileCompleteness: 0.05
  },
  semanticEnabled: false
};

const ageFromDate = (dateOfBirth) => {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  if (today < new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate())) age -= 1;
  return age;
};
const normalized = (value) => String(value || '').trim().toLowerCase();
const overlap = (left = [], right = []) => {
  const first = new Set(left.map(normalized).filter(Boolean));
  const second = new Set(right.map(normalized).filter(Boolean));
  if (!first.size || !second.size) return null;
  return [...first].filter((item) => second.has(item)).length / new Set([...first, ...second]).size;
};
const inRange = (age, min, max) => age >= Number(min) && age <= Number(max || 100);
const directional = (viewer, candidate) => {
  const candidateAge = ageFromDate(candidate.dateOfBirth);
  const age = viewer.preferredAgeMin ? (inRange(candidateAge, viewer.preferredAgeMin, viewer.preferredAgeMax) ? 1 : 0) : null;
  const relationshipGoal = viewer.relationshipGoal && candidate.relationshipGoal
    ? normalized(viewer.relationshipGoal) === normalized(candidate.relationshipGoal) ? 1 : 0
    : null;
  const interests = overlap(viewer.interests, candidate.interests);
  const language = overlap(viewer.languages, candidate.languages);
  const location = viewer.country && candidate.country
    ? viewer.country === candidate.country && viewer.city && candidate.city && normalized(viewer.city) === normalized(candidate.city) ? 1
      : viewer.country === candidate.country ? 0.75 : 0.25
    : null;
  const lifestyleFields = ['smoking', 'drinking', 'children'];
  const lifestyleValues = lifestyleFields.filter((field) => viewer[field] && candidate[field]);
  const lifestyle = lifestyleValues.length ? lifestyleValues.filter((field) => normalized(viewer[field]) === normalized(candidate[field])).length / lifestyleValues.length : null;
  const preferredCountry = viewer.preferredCountries?.length && candidate.country
    ? viewer.preferredCountries.map(normalized).includes(normalized(candidate.country)) ? 1 : 0
    : null;
  const preferredGender = viewer.preferredGender && viewer.preferredGender !== 'Everyone' && candidate.gender
    ? normalized(viewer.preferredGender) === normalized(candidate.gender) ? 1 : 0
    : null;
  const partnerPreferences = [preferredCountry, preferredGender].filter((value) => value !== null);
  const timezone = viewer.timeZone && candidate.timeZone ? (viewer.timeZone === candidate.timeZone ? 1 : 0.5) : null;
  const profileCompleteness = typeof candidate.profileCompletion === 'number' ? Math.max(0, Math.min(1, candidate.profileCompletion / 100)) : null;
  return { age, relationshipGoal, interests, language, location, lifestyle, partnerPreferences: partnerPreferences.length ? partnerPreferences.reduce((sum, value) => sum + value, 0) / partnerPreferences.length : null, timezone, profileCompleteness };
};

const mergeComponents = (left, right, weights) => {
  const components = {};
  let weightedTotal = 0;
  let availableWeight = 0;
  for (const [key, weight] of Object.entries(weights)) {
    const leftValue = left[key];
    const rightValue = right[key];
    if (leftValue === null && rightValue === null) continue;
    const value = (leftValue === null ? rightValue : rightValue === null ? leftValue : (leftValue + rightValue) / 2);
    components[key] = Number(value.toFixed(3));
    weightedTotal += value * weight;
    availableWeight += weight;
  }
  return { components, score: availableWeight ? Math.round((weightedTotal / availableWeight) * 100) : 0 };
};

const reasonLabels = {
  age: 'Preferred age ranges overlap', relationshipGoal: 'Compatible relationship goals', interests: 'Shared interests', language: 'Shared language', location: 'Compatible location preference', lifestyle: 'Similar lifestyle preferences', partnerPreferences: 'Partner preferences align', timezone: 'Compatible time zone', profileCompleteness: 'Complete profile information'
};
const reasonThresholds = { interests: 0.01, language: 0.01 };

export function compatibilityScore(viewer, candidate, config = defaultMatchingConfig) {
  const forward = directional(viewer, candidate);
  const reverse = directional(candidate, viewer);
  const merged = mergeComponents(forward, reverse, config.weights);
  const reasons = Object.entries(merged.components).filter(([key, value]) => value >= (reasonThresholds[key] || 0.5)).map(([key]) => reasonLabels[key]);
  return { score: merged.score, components: merged.components, reasons: [...new Set(reasons)], direction: { viewerToCandidate: forward, candidateToViewer: reverse } };
}

export function isEligible(viewer, candidate, filters = {}) {
  const candidateAge = candidate.age || (candidate.dateOfBirth ? ageFromDate(candidate.dateOfBirth) : 0);
  if (!candidate || candidate.id === viewer.id || candidate.deletedAt || candidate.suspendedAt || candidateAge < 18) return false;
  if (filters.country && candidate.country !== filters.country) return false;
  if (filters.city && normalized(candidate.city) !== normalized(filters.city)) return false;
  if (filters.goal && candidate.relationshipGoal !== filters.goal) return false;
  if (filters.language && !(candidate.languages || []).map(normalized).includes(normalized(filters.language))) return false;
  if (filters.minAge && candidateAge < Number(filters.minAge)) return false;
  if (filters.maxAge && candidateAge > Number(filters.maxAge)) return false;
  if (filters.online === 'true' && candidate.online !== true) return false;
  if (filters.verified === 'true' && candidate.verified !== true) return false;
  if (filters.hasPhotos === 'true' && !candidate.photos?.length) return false;
  if (viewer.blockedUserIds?.includes(candidate.id) || candidate.blockedUserIds?.includes(viewer.id)) return false;
  return true;
}

export function recommendationFor(viewer, candidate, config = defaultMatchingConfig) {
  const score = compatibilityScore(viewer, candidate, config);
  return { userId: candidate.id, compatibilityScore: score.score, components: score.components, reasons: score.reasons, profile: candidate };
}
