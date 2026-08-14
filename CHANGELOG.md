# Changelog

Granular build log for reviewers.

## 1. Scaffold and schema
- Monorepo folders (`backend/`, `frontend/`)
- PostgreSQL + Prisma schema (`users`, versioned `goals`, `food_entries`)
- Docker Compose for local Postgres
- Initial SQL migration

## 2. Backend CRUD
- JWT register/login/`me`
- Goal version create/list/current/delete
- Food-entry CRUD with date-range + meal-type filters
- Shared limit/offset pagination

## 3. Reports, AI, chat
- Aggregation endpoints: calories, macros, micros, goal-vs-actual
- Vision extraction from uploaded photos
- Conversational chat with tool-use against the same services
- Demo seed user and two weeks of meals

## 4. Frontend
- Auth, today dashboard, diary, meal form, goals, reports, chat
- Recharts wired to report APIs
- Photo pre-fill on the meal form

## 5. Docs and polish
- README, ARCHITECTURE, environment examples
- Validation ranges, isolation at the query layer, error payloads
