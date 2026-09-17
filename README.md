# IoT Deployment Management System

An IoT security platform prototype: register devices, track telemetry, and
manage security alerts across your fleet.

**Status: working prototype.** Backend and frontend build cleanly, the test
suite passes, and the register -> login -> profile flow is verified end-to-end
against a local PostgreSQL + Redis stack. This is a portfolio/learning project,
not a production deployment. See [Limitations](#limitations).

## Stack

| Layer      | Tech |
|------------|------|
| Backend    | NestJS 10, Prisma 5 (PostgreSQL), Bull (Redis), Socket.IO, JWT auth |
| Frontend   | React 18, Vite, TailwindCSS, Chart.js/Recharts |
| Device agent | Python 3 (heartbeats + telemetry to the API) |
| Infra      | Docker Compose for PostgreSQL + Redis |

## Quick start

### 1. Start PostgreSQL and Redis

```bash
docker compose up -d
```

Prefer native services? Any PostgreSQL 14+ and Redis 6+ work — point
`DATABASE_URL` / `REDIS_HOST` at them.

### 2. Configure the backend

```bash
cd backend
cp .env.example .env
# Edit .env — DATABASE_URL, JWT_SECRET (32+ chars), REDIS_*, CORS_ORIGIN
```

The backend refuses to start with a missing/short `JWT_SECRET` and exits if the
database is unreachable — no silent degraded mode.

### 3. Migrate, build, run

```bash
npm ci
npm run prisma:deploy        # or: npx prisma db push (dev)
npm run build
npm run start:prod           # API on http://localhost:3000
```

Interactive docs at `http://localhost:3000/api/docs` (Swagger UI).

### 4. Frontend

```bash
cd ../frontend
npm ci
npm run dev                  # http://localhost:3001
```

## Tests

```bash
cd backend
npm test                     # 24 unit/integration tests (services, auth, DB lifecycle)
```

The auth tests boot the real Nest `AuthModule` (DI, JWT signing) with the
database stubbed; the database lifecycle test asserts fail-fast startup.

## API quick tour

```bash
# Register + login
curl -X POST http://localhost:3000/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","password":"Str0ng!Pass","firstName":"A","lastName":"B"}'
# -> 201 {"access_token": "...", "user": {...}}

curl -X POST http://localhost:3000/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","password":"Str0ng!Pass"}'

# Authenticated profile
curl http://localhost:3000/v1/auth/profile -H "Authorization: Bearer <token>"
```

Endpoints: auth, users, devices (+heartbeat, security-score), telemetry,
vulnerability scans, alerts, anomaly detection, exports, WebSocket stream.

## Project layout

```
backend/          NestJS API (src/auth, src/devices, src/telemetry, ...)
frontend/         React dashboard (Vite)
device-agent/     Python telemetry agent (agent.json.example shows config)
docker/           PostgreSQL + Redis compose stack
```

## Limitations

- Prototype: no rate-limit tuning for real traffic, no HTTPS termination, no
  multi-instance session story. Vulnerability scanning is a data model +
  workflow skeleton, not a real scanner.
- The device agent is illustrative; harden before pointing it at real hardware.
- Dependency audit: `npm audit` reports known advisories in both apps —
  review before any exposure beyond localhost.
- Registration assigns the default USER role; there is no public
  privilege escalation, but review `src/auth` before real use.
