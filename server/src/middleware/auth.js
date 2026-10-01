import jwt from 'jsonwebtoken';
import env from '../config/env.js';
import { store } from '../store.js';

export function requireAuth(req, res, next) {
  const token = req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7) : null;
  if (!token) return res.status(401).json({ success: false, message: 'Authentication required', code: 'UNAUTHORIZED' });
  try { const payload = jwt.verify(token, env.jwtSecret); const user = store.users.get(payload.userId); if (!user) throw new Error('User not found'); req.user = user; next(); } catch { return res.status(401).json({ success: false, message: 'Session expired or invalid', code: 'INVALID_TOKEN' }); }
}