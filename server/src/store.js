import bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import { compatibilityScore, defaultMatchingConfig } from './matching.js';

const countries = [
  { code: 'ET', name: 'Ethiopia', flag: 'ET' }, { code: 'KE', name: 'Kenya', flag: 'KE' },
  { code: 'NG', name: 'Nigeria', flag: 'NG' }, { code: 'ZA', name: 'South Africa', flag: 'ZA' },
  { code: 'GB', name: 'United Kingdom', flag: 'GB' }, { code: 'US', name: 'United States', flag: 'US' },
  { code: 'CA', name: 'Canada', flag: 'CA' }, { code: 'DE', name: 'Germany', flag: 'DE' },
  { code: 'IN', name: 'India', flag: 'IN' }, { code: 'BR', name: 'Brazil', flag: 'BR' }
];
const interestCategories = {
  Entertainment: ['Movies', 'Music', 'Concerts', 'TV', 'Gaming'],
  Lifestyle: ['Cooking', 'Fitness', 'Travel', 'Nature', 'Photography'],
  Learning: ['Reading', 'Technology', 'Education', 'Science'],
  Sports: ['Football', 'Basketball', 'Running', 'Swimming']
};
const demoProfiles = [
  ['Amara', 'Nairobi', 'KE', 'Long-term relationship', 'Design, hiking, live music', 'I collect stories from every place I visit and believe curiosity makes a beautiful home.'],
  ['Daniel', 'Berlin', 'DE', 'Marriage', 'Cooking, languages, photography', 'Calm energy, good food, and a passport that is always ready for another chapter.'],
  ['Maya', 'Toronto', 'CA', 'Long-term relationship', 'Books, volunteering, travel', 'Looking for someone kind, grounded, and excited to build something real across cultures.'],
  ['Samuel', 'London', 'GB', 'Serious relationship', 'Running, cinema, family', 'I value honest conversations, a little adventure, and showing up consistently.']
];
const users = new Map(); const likes = new Map(); const matches = new Map(); const notifications = new Map();
const ageFromDate = (dateOfBirth) => { const today = new Date(); const birthDate = new Date(dateOfBirth); let age = today.getFullYear() - birthDate.getFullYear(); const birthdayNotPassed = today < new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate()); return birthdayNotPassed ? age - 1 : age; };
const profileCompletion = (user) => { const fields = [user.firstName, user.dateOfBirth, user.country, user.city, user.relationshipGoal, user.interests?.length, user.bio]; return Math.round((fields.filter(Boolean).length / fields.length) * 100); };
const publicUser = (user, viewer) => ({
  id: user.id, bgloveId: user.bgloveId, firstName: user.firstName, displayName: user.displayName || user.firstName,
  age: ageFromDate(user.dateOfBirth), gender: user.gender, city: user.city, country: user.country,
  relationshipStatus: user.relationshipStatus, relationshipGoal: user.relationshipGoal, education: user.education,
  occupation: user.occupation, height: user.height, bodyType: user.bodyType, children: user.children,
  smoking: user.smoking, drinking: user.drinking, languages: user.languages || [], interests: user.interests || [],
  hobbies: user.hobbies || [], personality: user.personality || [], idealPartner: user.idealPartner || '',
  preferredAgeMin: user.preferredAgeMin, preferredAgeMax: user.preferredAgeMax,
  preferredCountries: user.preferredCountries || [], bio: user.bio || '', photos: (user.photos || []).filter((photo) => photo.privacy !== 'private'),
  verified: user.verified === true, profileCompletion: profileCompletion(user), compatibility: viewer && viewer.id !== user.id ? (() => { const match = compatibilityScore(viewer, user, store.matchingConfig); return { score: match.score, criteria: Object.entries(match.components).map(([label, value]) => ({ label, matched: value >= 0.5, score: value })), reasons: match.reasons }; })() : null
});
const addNotification = (userId, type, message) => { const list = notifications.get(userId) || []; list.unshift({ id: randomUUID(), type, message, read: false, createdAt: new Date().toISOString() }); notifications.set(userId, list); };
for (const [name, city, country, goal, interests, bio] of demoProfiles) { const id = randomUUID(); users.set(id, { id, bgloveId: `BG-${id.slice(0, 8).toUpperCase()}`, firstName: name, lastName: '', email: `${name.toLowerCase()}@demo.bglove.test`, passwordHash: bcrypt.hashSync('DemoPass123!', 10), dateOfBirth: '1994-06-15', gender: 'Prefer not to say', city, country, relationshipGoal: goal, interests: interests.split(', '), languages: ['English'], preferredAgeMin: 22, preferredAgeMax: 38, values: ['Kindness', 'Family', 'Growth'], photos: [], bio, verified: true, createdAt: new Date().toISOString() }); notifications.set(id, []); }

export const store = {
  countries, interestCategories, users, likes, matches, notifications, recommendationFeedback: [], matchingConfig: structuredClone(defaultMatchingConfig), publicUser, addNotification,
  async createUser(input) { const id = randomUUID(); const user = { id, bgloveId: `BG-${id.slice(0, 8).toUpperCase()}`, ...input, languages: [], interests: [], hobbies: [], personality: [], preferredCountries: [], photos: [], passwordHash: await bcrypt.hash(input.password, 12), verified: false, createdAt: new Date().toISOString() }; delete user.password; users.set(user.id, user); notifications.set(user.id, []); return user; },
  async verifyPassword(user, password) { return bcrypt.compare(password, user.passwordHash); },
  getUserByEmail(email) { return [...users.values()].find((user) => user.email.toLowerCase() === email.toLowerCase()); },
  getDiscovery(currentUserId, filters = {}) { const current = users.get(currentUserId); return [...users.values()].filter((user) => user.id !== currentUserId && user.country !== current?.country).filter((user) => !filters.country || user.country === filters.country).filter((user) => !filters.gender || filters.gender === 'all' || user.gender === filters.gender).filter((user) => !filters.relationshipGoal || user.relationshipGoal === filters.relationshipGoal).filter((user) => !filters.language || (user.languages || []).includes(filters.language)).filter((user) => filters.online !== 'true' || user.online === true).filter((user) => filters.hasPhotos !== 'true' || user.photos?.length).filter((user) => !filters.minAge || ageFromDate(user.dateOfBirth) >= Number(filters.minAge)).filter((user) => !filters.maxAge || ageFromDate(user.dateOfBirth) <= Number(filters.maxAge)).map((user) => publicUser(user, current)); },
  getPublicProfile(userId, viewer) { const user = users.get(userId); return user ? publicUser(user, viewer) : null; }
};