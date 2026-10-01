import jwt from 'jsonwebtoken';
import env from './config/env.js';
import { store } from './store.js';

const heartbeatMs = Number(process.env.PRESENCE_HEARTBEAT_MS || 30_000);
const sessions = new Map();

function snapshot() {
  return Object.fromEntries([...sessions.entries()].map(([userId, userSessions]) => [userId, {
    status: userSessions.size ? 'live' : 'offline',
    lastActiveAt: Math.max(...[...userSessions.values()].map((session) => session.lastActiveAt))
  }]));
}

function broadcast(io) {
  io.emit('presence:snapshot', snapshot());
}

export function attachPresence(io) {
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      const payload = jwt.verify(token, env.jwtSecret);
      if (!store.users.has(payload.userId)) return next(new Error('User not found'));
      socket.userId = payload.userId;
      next();
    } catch {
      next(new Error('Authentication required'));
    }
  });

  io.on('connection', (socket) => {
    const userSessions = sessions.get(socket.userId) || new Map();
    userSessions.set(socket.id, { lastActiveAt: Date.now() });
    sessions.set(socket.userId, userSessions);
    broadcast(io);

    socket.on('presence:heartbeat', () => {
      const currentSessions = sessions.get(socket.userId);
      const session = currentSessions?.get(socket.id);
      if (session) session.lastActiveAt = Date.now();
    });

    socket.on('disconnect', () => {
      const currentSessions = sessions.get(socket.userId);
      currentSessions?.delete(socket.id);
      if (currentSessions?.size === 0) sessions.delete(socket.userId);
      broadcast(io);
    });
  });

  const cleanup = setInterval(() => {
    const cutoff = Date.now() - heartbeatMs * 2;
    for (const [userId, userSessions] of sessions.entries()) {
      for (const [socketId, session] of userSessions.entries()) if (session.lastActiveAt < cutoff) userSessions.delete(socketId);
      if (userSessions.size === 0) sessions.delete(userId);
    }
    broadcast(io);
  }, heartbeatMs);
  cleanup.unref();
}

export { heartbeatMs, snapshot };