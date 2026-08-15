# Personal Calorie Tracker

React frontend + Java (Spring Boot) backend. Built step by step.

**Current step:** 1 — backend skeleton + database schema.

## Stack (this step)

- Java 21, Spring Boot 4, Spring Data JPA
- PostgreSQL 16
- Flyway migrations

## Schema

```
users 1──* goals
users 1──* food_entries
```

- **goals** are versioned. Saving a goal inserts a new row with `effective_from` so later changes do not rewrite history.
- **food_entries** store meal type, quantity, calories, macros, and five micros (vitamin C, calcium, iron, vitamin D, potassium).

CRUD APIs, reports, AI extract, and the React app come in later steps.

## Run step 1

You need Java 21 and Docker (or a local Postgres 16).

```bash
docker compose up -d
cd backend
./mvnw spring-boot:run
```

The API listens on `http://localhost:8080`.

```bash
curl http://localhost:8080/api/health
# {"ok":true,"service":"calorie-tracker"}
```

Flyway applies `backend/src/main/resources/db/migration/V1__init.sql` on startup. Hibernate is set to `validate` — it does not create tables.

Default database settings (override with env vars if needed):

| Variable | Default |
| --- | --- |
| `DATABASE_URL` | `jdbc:postgresql://localhost:5432/calorie_tracker` |
| `DATABASE_USER` | `calorie` |
| `DATABASE_PASSWORD` | `calorie` |

## Assumptions

- Dates will be stored in UTC.
- Meal type is one of `BREAKFAST`, `LUNCH`, `DINNER`, `SNACKS`.
- A `users` table exists from day one so multi-user can be added without a schema rewrite. Auth is not implemented yet.
