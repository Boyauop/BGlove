import { createServer } from 'node:http';
import { Server } from 'socket.io';
import app from './app.js';
import env from './config/env.js';
import { attachPresence } from './presence.js';

const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: env.clientUrl }, transports: ['websocket', 'polling'] });
attachPresence(io);
httpServer.listen(env.port, () => console.log(`BGLove API listening on http://localhost:${env.port}`));