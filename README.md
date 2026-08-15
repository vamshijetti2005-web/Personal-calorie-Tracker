# Personal Calorie Tracker

React frontend + Java (Spring Boot) backend for logging meals, managing
historically accurate goals, and understanding nutrition trends.

## Requirements covered

| Assignment requirement | Implementation |
| --- | --- |
| Goal setting | Daily calories, macros, and weight goals with immutable UTC-day versions |
| Meal entry | Breakfast, Lunch, Dinner, and Snacks with serving, macros, and five micros |
| Time-range listing | Inclusive UTC dates, meal filter, and `limit`/`offset` pagination |
| Nutrition reports | Calorie trend, macro breakdown, micro summary, and historical goal comparison |
| AI calorie extraction | Gemini image analysis with confidence, warnings, and editable form prefill |
| API / frontend separation | React communicates with Spring Boot only through REST APIs |
| Database persistence | PostgreSQL managed by Flyway and Spring Data JPA |
| Multi-user bonus | JWT signup/login with BCrypt passwords and query-layer data isolation |

## Stack

- Java 21, Spring Boot 4, Spring Data JPA
- Spring Security resource server, HMAC JWT, and BCrypt
- PostgreSQL 16
- Flyway migrations
- React 19, Vite, TypeScript, Tailwind CSS, Recharts
- Gemini 3.5 Flash image understanding with structured JSON output

## AI-assisted development

AI coding assistance was used for initial project scaffolding, repetitive CRUD
wiring, chart integration, and test boilerplate. Manual engineering judgment
defined the data model, immutable goal-history rules, UTC report semantics,
validation limits, Gemini safety/error behavior, and the final architecture and
quality review. Generated code was compiled, tested, manually exercised, and
cleaned before submission.

## Schema

```
users 1──* goals
users 1──* food_entries
```

- **goals** are versioned. Saving a goal inserts a new row with `effective_from` so later changes do not rewrite history.
- **food_entries** store meal type, quantity, calories, macros, and five micros (vitamin C, calcium, iron, vitamin D, potassium).

See [ARCHITECTURE.md](ARCHITECTURE.md) for data flow, layering, and historical
goal-selection details.

## Run the backend

You need Java 21 and Docker (or a local Postgres 16).

```bash
docker compose up -d
cd backend
./mvnw spring-boot:run
```

On Windows without Docker, install PostgreSQL directly and create the defaults
from SQL Shell:

```sql
CREATE USER calorie WITH PASSWORD 'calorie';
CREATE DATABASE calorie_tracker OWNER calorie;
```

Then run `.\mvnw.cmd spring-boot:run` from `backend`.

The API listens on `http://localhost:8080`.

```bash
curl http://localhost:8080/api/health
# {"ok":true,"service":"calorie-tracker"}
```

Flyway applies the scripts under `backend/src/main/resources/db/migration/` on startup. Hibernate is set to `validate` — it does not create tables.

Default database settings (override with env vars if needed):

| Variable | Default |
| --- | --- |
| `DATABASE_URL` | `jdbc:postgresql://localhost:5432/calorie_tracker` |
| `DATABASE_USER` | `calorie` |
| `DATABASE_PASSWORD` | `calorie` |
| `CLIENT_ORIGIN` | `http://localhost:5173` |
| `GEMINI_API_KEY` | Empty (AI endpoint disabled) |
| `GEMINI_MODEL` | `gemini-3.5-flash` |
| `JWT_SECRET` | Development-only default; set 32+ random bytes in production |
| `JWT_EXPIRATION_HOURS` | `24` |

### Enable Gemini image extraction

Create a Gemini Developer API key in [Google AI Studio](https://aistudio.google.com/app/apikey).
The limited free tier is sufficient for development. Do not commit the key.

PowerShell:

```powershell
$env:GEMINI_API_KEY="your-key"
cd backend
.\mvnw.cmd spring-boot:run
```

macOS/Linux:

```bash
export GEMINI_API_KEY="your-key"
cd backend
./mvnw spring-boot:run
```

`GEMINI_MODEL` optionally overrides the default stable model, `gemini-3.5-flash`.
Without a key, the rest of the app works and the extraction endpoint returns a clear `503
AI_UNAVAILABLE` error.

## Authentication

All goal, entry, report, and AI endpoints require:

```text
Authorization: Bearer <token>
```

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/api/auth/register` | Create an account and receive a JWT |
| `POST` | `/api/auth/login` | Verify a BCrypt password and receive a JWT |
| `GET` | `/api/auth/me` | Return the authenticated user |

Seeded demo credentials:

```text
Email: demo@nourish.local
Password: DemoPass123!
```

The demo password is encoded with BCrypt on first startup. Set a strong,
environment-specific `JWT_SECRET` before deployment.

## Core resource APIs

Every list API uses `limit` (1–100) and `offset` (0 or greater).

### Goals

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/api/goals` | Insert a goal version effective at UTC midnight |
| `GET` | `/api/goals/current` | Current effective goal |
| `GET` | `/api/goals?limit=20&offset=0` | Paginated version history |
| `GET` | `/api/goals/{id}` | One version |
| `DELETE` | `/api/goals/{id}` | Delete a scheduled future version only |

Example:

```bash
curl -X POST http://localhost:8080/api/goals \
  -H "Content-Type: application/json" \
  -d '{"dailyCalorieTarget":2100,"proteinGrams":150,"carbsGrams":210,"fatGrams":70,"weightGoalKg":70}'
```

Effective and historical goals are immutable because deleting them would change
past report results. Only future scheduled versions can be removed. One goal
version is allowed per UTC date.

### Food entries

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/api/entries` | Create an entry |
| `GET` | `/api/entries/{id}` | Read an entry |
| `PATCH` | `/api/entries/{id}` | Update supplied fields |
| `DELETE` | `/api/entries/{id}` | Delete an entry |
| `GET` | `/api/entries?from=2026-08-01&to=2026-08-15&mealType=LUNCH&limit=20&offset=0` | Date range, optional meal filter, pagination |

Date-only ranges are UTC and inclusive at both ends.

Example:

```bash
curl -X POST http://localhost:8080/api/entries \
  -H "Content-Type: application/json" \
  -d '{"mealType":"LUNCH","foodName":"Rice and dal","quantity":1,"servingUnit":"plate","calories":520,"proteinGrams":20,"carbsGrams":82,"fatGrams":12,"consumedAt":"2026-08-15T12:30:00Z"}'
```

Validation and application errors use:

```json
{
  "timestamp": "2026-08-15T13:00:00Z",
  "status": 400,
  "code": "VALIDATION_ERROR",
  "message": "Request validation failed",
  "fieldErrors": {
    "calories": "must be greater than or equal to 0.0"
  }
}
```

## Step 3 report APIs

Reports are aggregated on the server from persisted entries. The React app consumes
these responses directly instead of calculating chart data from paginated diary rows.

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/reports/calories?from=2026-08-01&to=2026-08-15&granularity=day` | Zero-filled calorie trend by day or week |
| `GET` | `/api/reports/macros?from=2026-08-01&to=2026-08-15&granularity=week` | Protein, carb, and fat totals by day or week |
| `GET` | `/api/reports/micros?from=2026-08-01&to=2026-08-15` | Micronutrient totals, daily averages, and reference targets |
| `GET` | `/api/reports/goal-vs-actual?from=2026-08-01&to=2026-08-15` | Daily actuals against the goal version effective that day |

`granularity` accepts `day` (default) or `week`. Weeks begin Monday. Partial weeks are clipped
to the requested range. Report ranges are limited to 366 days.

Micronutrient reference targets are common adult values used only as a chart scale; they are not
medical advice.

## Run the React frontend

Keep the backend running on port `8080`. In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`. Vite proxies `/api` to the Java backend during local development.

Sign in with the demo credentials above or register a new account. Each user's
goals, meals, and reports are isolated by `user_id` in backend queries.

The frontend includes:

- Today dashboard with current calorie/macro progress
- Meal create/edit form with five micronutrients
- Date-range diary with meal filtering and pagination
- Goal form and paginated version history
- Calorie, macro, micronutrient, and historical goal-vs-actual charts

For a separately hosted frontend, set `VITE_API_BASE_URL` to the backend origin
before building and set backend `CLIENT_ORIGIN` to the frontend origin. Local
development needs neither because it uses the Vite proxy.

## Step 5 AI image extraction

`POST /api/ai/extract` accepts a multipart `image` field containing JPEG, PNG, or WebP up to
5 MB. The backend verifies the file signature before sending base64 image data to Gemini. API
keys never reach the browser.

The response includes:

- `status`: `ok`, `partial`, or `failed`
- Structured serving, calorie, macro, and micronutrient fields
- `confidence`: `high`, `medium`, or `low`
- Human-readable notes and warnings

The meal form pre-fills only non-null extracted fields. Users must review and explicitly save the
entry. Gemini failure, quota, configuration, and malformed-image cases are shown clearly rather
than silently producing a meal.

The Gemini free tier may use submitted content to improve Google products. Use non-sensitive test
images and review Google's current API terms before handling personal images.

## Verification and production builds

Backend tests require the configured PostgreSQL database:

```bash
cd backend
./mvnw test
```

Frontend checks:

```bash
cd frontend
npm ci
npm run lint
npm run build
```

The frontend production output is written to `frontend/dist/`. Serve those
static files from a web host and configure `VITE_API_BASE_URL` / `CLIENT_ORIGIN`
as described above. Run the Spring Boot JAR with:

```bash
cd backend
./mvnw clean package
java -jar target/calorie-tracker-0.0.1-SNAPSHOT.jar
```

## Project layout

```text
backend/src/main/java/com/nourish/tracker/
  api/          REST controllers, request validation, response DTOs, errors
  service/      goal, diary, reporting, and Gemini business logic
  security/     JWT issuing and authenticated-user resolution
  repository/   Spring Data repositories and SQL report aggregation
  domain/       JPA entities and meal type
  config/       cross-origin API configuration
backend/src/main/resources/db/migration/
  Flyway schema and seed migrations
frontend/src/
  pages/        dashboard, diary, meal form, goals, reports
  components/   application shell and reusable UI
  api.ts        typed REST client
```

## Assumptions

- Dates and report boundaries use UTC.
- Goals take effect at UTC midnight and remain immutable once effective.
- Meal type is one of `BREAKFAST`, `LUNCH`, `DINNER`, `SNACKS`.
- JWTs are stateless and stored in browser local storage for this web demo.
- Every data read/write is scoped to the authenticated user's UUID in the backend.
- Micronutrient reference values are display context, not medical advice.
