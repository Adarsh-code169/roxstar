# Roxstar Spin Wheel

A full-stack spin-the-wheel application with realtime updates. Admins create wheels and prizes; participants join and spin, with results broadcast live to every connected client over WebSockets.

## Tech stack

**Client** — React 19, Vite, TypeScript, Tailwind v4, React Router 7, Zustand, React Query, axios, framer-motion, socket.io-client.

**Server** — Node.js, Express 5, TypeScript, Prisma 7, PostgreSQL 15, JWT, bcrypt, zod, helmet, socket.io.

**Infrastructure** — Docker Compose for the local Postgres database.

## Project layout

```
.
├── client/              # React + Vite frontend
│   ├── src/
│   │   ├── components/  # Shared UI (Navbar, ...)
│   │   ├── pages/       # LandingPage, Login, Register, Dashboard, AdminPanel
│   │   ├── services/    # api.ts (axios), socket.ts (socket.io-client)
│   │   ├── store/       # Zustand stores: auth, wheel
│   │   └── config.ts    # API base URL
│   └── ...
├── server/              # Express + Prisma backend
│   ├── prisma/          # schema.prisma + migrations
│   └── src/
│       ├── middleware/  # auth, role, errorHandler
│       ├── routes/      # auth, admin, participant, wheel
│       ├── utils/       # jwt, hash, seed
│       ├── socket.ts    # realtime gateway
│       └── index.ts     # Express entry
└── docker-compose.yml   # Postgres 15 on host port 5433
```

## Prerequisites

- Node.js 20+ and npm
- Docker (for the Postgres database)

## Getting started

### 1. Start the database

```bash
docker-compose up -d
```

Postgres 15 will be available on `localhost:5433` (user `admin`, password `password`, database `spinwheel`).

### 2. Configure the server

```bash
cd server
cp .env.example .env   # or create .env manually
```

Required environment variables:

```env
DATABASE_URL="postgresql://admin:password@localhost:5433/spinwheel?schema=public"
JWT_SECRET="replace-with-a-long-random-string"
PORT=4000
CLIENT_URL="http://localhost:5173,http://localhost:5174"
```

### 3. Install dependencies and run migrations

```bash
cd server
npm install
npm run prisma:generate
npm run prisma:migrate
```

### 4. (Optional) Seed an initial admin user

```bash
npx tsx src/utils/seed.ts
```

### 5. Start the server

```bash
npm run dev
```

The API listens on `http://localhost:4000`.

### 6. Start the client

In another terminal:

```bash
cd client
npm install
npm run dev
```

The app is served at `http://localhost:5173`.

## Features

- **Authentication** — JWT-based register and login, with role-based access (`ADMIN` / `PARTICIPANT`).
- **Admin panel** — Create and manage wheels and their prizes.
- **Participant dashboard** — Join an active wheel and spin for a prize.
- **Realtime updates** — Spin results broadcast to every connected client via socket.io.
- **Validation** — All request payloads validated with zod.
- **Security** — bcrypt password hashing, helmet headers, CORS allowlist.

## Available scripts

### Server (`/server`)

| Script | Purpose |
| --- | --- |
| `npm run dev` | Run the API in watch mode with tsx. |
| `npm run prisma:generate` | Regenerate the Prisma client after a schema change. |
| `npm run prisma:migrate` | Create and apply a development migration. |

### Client (`/client`)

| Script | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite dev server. |
| `npm run build` | Type-check and produce a production build. |
| `npm run preview` | Preview the production build locally. |
| `npm run lint` | Run ESLint over the client source. |

## License

ISC
