import bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';

const countries = [
  { code: 'ET', name: 'Ethiopia', flag: 'ET' }, { code: 'KE', name: 'Kenya', flag: 'KE' },
  { code: 'NG', name: 'Nigeria', flag: 'NG' }, { code: 'ZA', name: 'South Africa', flag: 'ZA' },
  { code: 'GB', name: 'United Kingdom', flag: 'GB' }, { code: 'US', name: 'United States', flag: 'US' },
  { code: 'CA', name: 'Canada', flag: 'CA' }, { code: 'DE', name: 'Germany', flag: 'DE' },
  { code: 'IN', name: 'India', flag: 'IN' }, { code: 'BR', name: 'Brazil', flag: 'BR' }
];
const demoProfiles = [
  ['Amara', 'Nairobi', 'KE', 'Long-term relationship', 'Design, hiking, live music', 'I collect stories from every place I visit and believe curiosity makes a beautiful home.'],
  ['Daniel', 'Berlin', 'DE', 'Marriage', 'Cooking, languages, photography', 'Calm energy, good food, and a passport that is always ready for another chapter.'],
  ['Maya', 'Toronto', 'CA', 'Long-term relationship', 'Books, volunteering, travel', 'Looking for someone kind, grounded, and excited to build something real across cultures.'],
  ['Samuel', 'London', 'GB', 'Serious relationship', 'Running, cinema, family', 'I value honest conversations, a little adventure, and showing up consistently.']
];
const users = new Map(); const likes = new Map(); const matches = new Map(); const notifications = new Map();
const ageFromDate = (dateOfBirth) => { const today = new Date(); const birthDate = new Date(dateOfBirth); let age = today.getFullYear() - birthDate.getFullYear(); const birthdayNotPassed = today < new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate()); return birthdayNotPassed ? age - 1 : age; };
const profileCompletion = (user) => { const fields = [user.firstName, user.dateOfBirth, user.country, user.city, user.relationshipGoal, user.interests?.length, user.bio]; return Math.round((fields.filter(Boolean).length / fields.length) * 100); };
const publicUser = (user) => ({ id: user.id, firstName: user.firstName, age: ageFromDate(user.dateOfBirth), gender: user.gender, city: user.city, country: user.country, relationshipGoal: user.relationshipGoal, interests: user.interests || [], values: user.values || [], bio: user.bio || '', verified: user.verified === true, profileCompletion: profileCompletion(user) });
const addNotification = (userId, type, message) => { const list = notifications.get(userId) || []; list.unshift({ id: randomUUID(), type, message, read: false, createdAt: new Date().toISOString() }); notifications.set(userId, list); };
for (const [name, city, country, goal, interests, bio] of demoProfiles) { const id = randomUUID(); users.set(id, { id, firstName: name, lastName: '', email: `${name.toLowerCase()}@demo.bglove.test`, passwordHash: bcrypt.hashSync('DemoPass123!', 10), dateOfBirth: '1994-06-15', gender: 'Prefer not to say', city, country, relationshipGoal: goal, interests: interests.split(', '), values: ['Kindness', 'Family', 'Growth'], bio, verified: true, createdAt: new Date().toISOString() }); notifications.set(id, []); }

export const store = {
  countries, users, likes, matches, notifications, publicUser, addNotification,
  async createUser(input) { const user = { id: randomUUID(), ...input, passwordHash: await bcrypt.hash(input.password, 12), verified: false, createdAt: new Date().toISOString() }; delete user.password; users.set(user.id, user); notifications.set(user.id, []); return user; },
  async verifyPassword(user, password) { return bcrypt.compare(password, user.passwordHash); },
  getUserByEmail(email) { return [...users.values()].find((user) => user.email.toLowerCase() === email.toLowerCase()); },
  getDiscovery(currentUserId) { const current = users.get(currentUserId); return [...users.values()].filter((user) => user.id !== currentUserId && user.country !== current?.country).map(publicUser); },
  getPublicProfile(userId) { const user = users.get(userId); return user ? publicUser(user) : null; }
};