# Nourish — Personal Calorie Tracker

A full-stack app for logging meals, versioning nutrition goals, and reading macro/micro trends. The React client talks to an Express API over REST. Everything lives in PostgreSQL.

AI coding assistance was used for scaffolding (Vite/Express/Prisma boilerplate), CRUD route wiring, and Recharts setup. Schema design, goal versioning, server-side aggregation, pagination rules, and the product/UX decisions were specified and reviewed by hand.

## Stack

| Layer | Choice |
| --- | --- |
| API | Node.js 20+, Express, TypeScript |
| ORM | Prisma 6 |
| Database | PostgreSQL 16 |
| Web | React 18, Vite, TypeScript, Tailwind CSS |
| Charts | Recharts |
| Auth | JWT + bcrypt |
| Vision / chat | Anthropic Claude or OpenAI GPT-4o |

## Requirements covered

1. **Goal setting** — CRUD-style API and UI. Updates insert a new timestamped version so historical comparisons stay honest.
2. **Meal entry** — Breakfast / Lunch / Dinner / Snacks with quantity, calories, macros, and five micros. Numeric fields are validated (non-negative, capped ranges).
3. **Time-range listing** — `GET /api/entries?from=&to=&mealType=` with limit/offset pagination. Matching diary UI.
4. **Reports** — weekly/daily calorie trend, stacked macros, micronutrient summary, goal vs actual. All computed by dedicated aggregation endpoints.
5. **AI extraction** — upload a label or plate photo; structured nutrition comes back to pre-fill the form, including partial results and warnings.

Bonus implemented: **multi-user JWT auth** (data isolated in every query) and a **tool-using chat** that logs meals and reads reports through the same services. PDF bulk import was skipped (highest parsing risk).

## Setup

### Prerequisites

- Node.js 20+
- Docker (for PostgreSQL) **or** a local Postgres 16 instance
- Optional: `ANTHROPIC_API_KEY` or `OPENAI_API_KEY` for photo extraction and chat

### 1. Start the database

```bash
docker compose up -d
```

Without Docker, create a database and user that match `backend/.env`.

### 2. Backend

```bash
cd backend
cp .env.example .env
# edit JWT_SECRET (required in production) and optional AI keys
npm install
npx prisma generate
npx prisma migrate deploy
npm run prisma:seed
npm run dev
```

API listens on `http://localhost:3001`.

### 3. Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Vite serves `http://localhost:5173` and proxies `/api` to the backend.

### Demo account

After seeding:

- Email: `demo@nourish.local`
- Password: `DemoPass123!`

The seed writes two goal versions and 14 days of meals so reports have something to draw.

## Environment variables

### `backend/.env`

| Name | Purpose |
| --- | --- |
| `DATABASE_URL` | Prisma connection string |
| `JWT_SECRET` | HMAC secret for access tokens |
| `JWT_EXPIRES_IN` | Token lifetime (default `7d`) |
| `PORT` | API port (default `3001`) |
| `CLIENT_ORIGIN` | CORS origin (default `http://localhost:5173`) |
| `OPENAI_API_KEY` | Optional GPT-4o vision + chat |
| `ANTHROPIC_API_KEY` | Optional Claude vision + chat |
| `AI_PROVIDER` | `auto` (default), `openai`, or `anthropic` |

### `frontend/.env`

| Name | Purpose |
| --- | --- |
| `VITE_API_BASE_URL` | Leave empty to use the Vite proxy |

## API

All list endpoints take `limit` (1–100, default 20) and `offset` (≥ 0).

Authenticated routes need `Authorization: Bearer <token>`.

| Method | Path | Notes |
| --- | --- | --- |
| POST | `/api/auth/register` | `{ email, password, displayName }` |
| POST | `/api/auth/login` | `{ email, password }` |
| GET | `/api/auth/me` | Current user |
| GET | `/api/goals` | Paginated versions, newest `effectiveFrom` first |
| GET | `/api/goals/current` | Version in force now |
| GET | `/api/goals/:id` | One version |
| POST | `/api/goals` | Insert a new version |
| DELETE | `/api/goals/:id` | Rejected if it is the current version |
| GET | `/api/entries` | `from`, `to`, optional `mealType` |
| GET | `/api/entries/:id` | |
| POST | `/api/entries` | |
| PATCH | `/api/entries/:id` | |
| DELETE | `/api/entries/:id` | |
| GET | `/api/reports/calories` | `from`, `to`, `granularity=day\|week` |
| GET | `/api/reports/macros` | same |
| GET | `/api/reports/micros` | totals + daily averages |
| GET | `/api/reports/goal-vs-actual` | per-day actual vs the goal active that day |
| POST | `/api/ai/extract` | multipart field `image` |
| POST | `/api/chat` | `{ messages: [{ role, content }] }` |
| GET | `/api/health` | Liveness |

Error shape: `{ error: { code, message, details? } }`.

## Assumptions

- Date filters are **UTC calendar days**. A `YYYY-MM-DD` `to` is inclusive.
- Micronutrient targets on the reports page are common adult reference values for scale, not medical advice.
- Photo analysis and chat require a configured LLM key. Without one, those endpoints return `503 AI_UNAVAILABLE` instead of inventing numbers.
- Multi-user isolation is enforced in repositories (`where: { userId }`). Crossing another user's id returns 404, not the row.
- PDF import is out of scope for this submission.

## Project layout

```
backend/src/
  routes/ controllers/ services/ repositories/ validators/ middleware/
frontend/src/
  api/ pages/ components/ context/ hooks-free date helpers
```

See [ARCHITECTURE.md](ARCHITECTURE.md) for the goal-versioning and aggregation design.
