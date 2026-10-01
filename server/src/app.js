import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import env from './config/env.js';
import router from './routes.js';

const app = express(); app.use(helmet()); app.use(cors({ origin: env.clientUrl })); app.use(express.json({ limit: '100kb' })); app.use('/api', router);
const clientDist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../client/dist');
app.use(express.static(clientDist));
app.get('*', (req, res, next) => { if (req.path.startsWith('/api')) return next(); return res.sendFile(path.join(clientDist, 'index.html')); });
app.use((_req, res) => res.status(404).json({ success: false, message: 'Route not found', code: 'NOT_FOUND' }));
app.use((error, _req, res, _next) => { console.error(error); res.status(500).json({ success: false, message: 'Something went wrong.', code: 'INTERNAL_ERROR' }); });
export default app;