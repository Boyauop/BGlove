# BGLove

**Love Beyond Borders**

BGLove is a privacy-conscious dating and relationship platform for adults 18+ who want to meet compatible people across countries and cultures.

## Current foundation

This repository contains a runnable first slice:

- React 19 + Vite client with landing, registration, login, discovery, matches, and safety views
- Express REST API with Helmet, CORS, structured JSON errors, Zod validation, JWT sessions, and bcrypt password hashing
- Protected `GET /api/me`, profile discovery, like, mutual-match, notification, and country endpoints
- Development seed profiles from multiple countries
- Environment-based configuration and a focused password security test

The current server uses an in-memory repository for local development. It is isolated in `server/src/store.js`; PostgreSQL and Prisma should replace that repository before production deployment. Messaging, media, AI, video, payments, moderation, and admin workflows are planned service boundaries, not claimed as complete functionality yet.

## Requirements

- Node.js 20+
- npm 10+

## Run locally

```bash
npm install
cp .env.example .env
npm run dev
```

Open `http://localhost:5173`. The API health endpoint is available at `http://localhost:4000/api/health`.

Demo accounts are seeded with the password `DemoPass123!`, for example `amara@demo.bglove.test`.

## Scripts

```bash
npm run dev          # client and API together
npm run dev:client   # Vite client only
npm run dev:server   # API only
npm run build        # production client build
npm test             # Node security test suite
```

## Environment

Copy `.env.example` to `.env`. Never commit `.env` or provider credentials. `DEMO_MODE` is only a local-development switch and must be disabled for production. External integrations are represented by configuration placeholders until their provider contracts and credentials are selected.

## Architecture direction

The intended production structure is a Vite client, Express API, PostgreSQL database managed by Prisma, provider adapters for Cloudinary/AI/video/payments, and database-backed sessions, conversations, reports, notifications, and audit logs. Authentication and authorization remain server-side concerns; the frontend is not trusted for access control.

## Security and privacy

Passwords are hashed with bcrypt and never returned by API responses. The API requires a bearer token for user data and discovery, validates registration server-side, enforces the 18+ registration confirmation and date check, and returns safe error messages. Exact location, payment credentials, verification documents, and internal moderation data are not exposed by the current public user shape.

## Next implementation phase

Replace the in-memory store with Prisma migrations and PostgreSQL, then add photos, persistent conversations, block/report enforcement, provider-backed verification, admin authorization, and the configurable 7-day trial/$1 monthly subscription flow with tests for each boundary.
