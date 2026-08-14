# Architecture

Nourish is a two-process app: a React SPA and an Express API. The browser talks to the API over REST only. There is no shared runtime package and no server-rendered UI.

## Data model

```
users 1──* goals
users 1──* food_entries
```

### `users`
Account record. Passwords are bcrypt hashes. JWT identity is `{ userId, email }`. Every query that reads or writes goals/entries filters by `userId` in the repository layer, not only in the UI.

### `goals` (versioned)
Goals are **append-only versions**, not a single mutable row.

| Field | Role |
| --- | --- |
| `effective_from` | Instant this version becomes the active target |
| `daily_calorie_target`, macro grams, `weight_goal_kg` | The targets themselves |

Saving goals from the UI always `INSERT`s a new row. Historical reports stay accurate after a later change because each calendar day uses the latest version whose `effective_from` is on or before that day.

Deleting the currently effective version is rejected. Create a newer version first.

### `food_entries`
One row per logged food item, tagged with `meal_type` (`BREAKFAST` \| `LUNCH` \| `DINNER` \| `SNACKS`) and `consumed_at`.

Micronutrients are a small representative set, not a full nutrient database:

- vitamin C (mg)
- calcium (mg)
- iron (mg)
- vitamin D (IU)
- potassium (mg)

## Pagination

Every list endpoint uses the same `limit` (1–100, default 20) and `offset` (≥ 0) contract:

- `GET /api/goals`
- `GET /api/entries`

Responses look like `{ data, pagination: { limit, offset, total } }`.

## Goal vs actual

`GET /api/reports/goal-vs-actual` is computed on the server:

1. Aggregate `food_entries` by UTC calendar day in `[from, to]`.
2. Load the user's goal versions ordered by `effective_from`.
3. For each day, pick the latest version with `effective_from <= end of that UTC day`.
4. Return actual totals beside that day's goal (or `goal: null` if none existed yet).

Calorie, macro, and micro reports are also SQL aggregates. The frontend never sums raw entry lists to draw charts.

## Dates

All range filters treat `YYYY-MM-DD` as UTC days. `to` is inclusive for date-only strings (the exclusive bound is the next UTC midnight). This is an explicit assumption so local timezone offsets cannot silently shift a day.

## AI features

- `POST /api/ai/extract` accepts a multipart image, sends it to Claude or GPT-4o, and parses a strict JSON nutrition object. The API returns `status: ok | partial | failed` plus any warnings. Missing keys stay `null` so the form can pre-fill what was found.
- `POST /api/chat` is a tool-using LLM loop. Tools call the same `entryService`, `goalService`, and `reportService` functions as the REST controllers.

Provider selection: `AI_PROVIDER=auto` prefers Anthropic if `ANTHROPIC_API_KEY` is set, otherwise OpenAI. Either feature returns `503 AI_UNAVAILABLE` when no key is configured.

## Layering

```
routes → controllers → services → repositories → Prisma/PostgreSQL
                 ↘ validators (Zod)
```

Cross-cutting: JWT `requireAuth`, centralized `errorHandler`, `asyncHandler` for rejected promises.

## What was left out

PDF bulk import is the highest-risk bonus and was not implemented. Multi-user auth and the chat interface were implemented instead.
