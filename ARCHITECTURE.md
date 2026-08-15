# Architecture

## System boundary

Nourish runs as two independent applications:

```text
React / Vite browser app
        │ Bearer JWT + JSON REST + multipart image upload
        ▼
Spring Boot API
        │ JPA + parameterized JDBC aggregation
        ▼
PostgreSQL

Spring Boot ── server-side API key ──► Gemini Developer API
```

The React application never connects to PostgreSQL or Gemini directly. The
Gemini key stays in the backend process. Vite proxies `/api` to Spring Boot in
development; separately hosted builds use `VITE_API_BASE_URL` and
`CLIENT_ORIGIN`.

## Backend layering

```text
api (controllers, requests, responses, centralized errors)
  └─► service (validation and business rules)
       └─► repository (JPA persistence and report SQL)
            └─► domain / PostgreSQL
```

- Controllers translate HTTP input and output.
- Services own rules such as UTC date ranges, immutable goal history, ownership,
  and extraction status.
- Spring Data repositories handle entity persistence.
- Spring Security validates HMAC JWTs before protected controllers run.
- `CurrentUserService` resolves the JWT subject to a persisted user.
- `ReportRepository` uses parameterized JDBC because zero-filled time series,
  lateral historical-goal lookup, and grouped nutrition totals are clearer and
  more efficient in SQL.
- Flyway owns schema changes. Hibernate runs with `ddl-auto=validate` and fails
  startup if entity mappings drift from the migrations.

## Data model

```text
users 1 ─── * goals
users 1 ─── * food_entries
```

### Users

Users register with a unique normalized email and BCrypt password hash. Login
issues a signed, expiring JWT whose subject is the user UUID. All goal, entry,
and report services obtain that UUID from the authenticated security context;
resource lookups return not found when an ID belongs to another user. A seeded
demo account makes reviewer setup immediate without bypassing authentication.

### Goals

Goals are versions, not an editable singleton:

```text
user_id
effective_from       unique with user_id; normalized to UTC midnight
daily_calorie_target
protein_grams
carbs_grams
fat_grams
weight_goal_kg
```

Saving inserts a new version. Once a version becomes effective it cannot be
deleted, because removal would retroactively change report results. A scheduled
future version may be deleted. One version per user and UTC date prevents
ambiguous ordering.

For each report date, the server selects the latest goal with
`effective_from < next UTC midnight`. Since versions are normalized to midnight,
`GET /goals/current` and daily historical reports use consistent semantics.

### Food entries

Each entry stores:

- meal type: Breakfast, Lunch, Dinner, or Snacks
- food name, quantity, and serving unit
- calories and protein/carbohydrate/fat grams
- vitamin C, calcium, iron, vitamin D, and potassium
- UTC consumption and audit timestamps

Request validation prevents negative or unreasonable values. Database indexes
cover user/date and user/meal/date access paths.

## Time ranges and pagination

Date-only API ranges are inclusive UTC calendar days. Internally, the server
uses `[from midnight, midnight after to)` instants. Report SQL explicitly applies
UTC rather than relying on the PostgreSQL session timezone.

All resource-list endpoints use the same contract:

```json
{
  "data": [],
  "pagination": {
    "limit": 20,
    "offset": 0,
    "total": 0
  }
}
```

`limit` is constrained to 1–100 and `offset` is non-negative. Aggregation
responses are bounded to 366 days and are not resource-list endpoints.

## Reporting

Dedicated endpoints calculate chart-ready data on the server:

1. Calories: zero-filled daily or Monday-based weekly totals.
2. Macros: stacked protein, carbohydrate, and fat totals by day/week.
3. Micronutrients: period totals, daily averages, and reference targets.
4. Goal vs actual: daily nutrition beside the immutable goal effective that day.

The dashboard and reports use these aggregations for totals. Raw paginated
entries are used only to display individual meals.

## Gemini extraction

`POST /api/ai/extract` accepts JPEG, PNG, or WebP up to 5 MB.

1. The backend checks MIME type, size, and file signature.
2. The image is base64-encoded and sent to Gemini with a strict JSON schema.
3. Returned numbers are normalized and negative values are discarded.
4. The API classifies the result as `ok`, `partial`, or `failed`.
5. The frontend pre-fills non-null values only for usable results.
6. A user must review and explicitly save; extraction never creates an entry.

Outbound Gemini calls have connect/read timeouts. Missing keys, quota limits,
provider failures, and malformed responses use distinct error codes.

## Gemini conversational tools

The chat endpoint receives a bounded transcript and starts a fresh Gemini
interaction for each browser request. Gemini can call a fixed allowlist of
functions for goals, meals, and reports. The backend executes those calls
through the existing authenticated services and returns function results to
Gemini until it produces a user-facing answer.

Provider interaction IDs never come from or return to the browser; they are used
only while resolving tools inside one request. This prevents users from
attempting to resume another account's provider-side interaction. A maximum of
five consecutive tool rounds bounds cost and accidental loops. Tool validation,
JWT ownership, and immutable-goal rules are identical to the traditional UI.

## Error handling and validation

Jakarta Bean Validation handles request DTO constraints. `GlobalExceptionHandler`
returns a consistent JSON error shape for validation, malformed input, missing
resources, business conflicts, oversized images, and unexpected errors. The
React API client converts these responses to typed `ApiError` objects and keeps
form state intact on failures.

## Authentication and isolation

`POST /api/auth/register`, `POST /api/auth/login`, and the health endpoint are
public. Every other API requires a valid Bearer token. The server is stateless:
it stores no HTTP session and verifies the HMAC signature and expiry on every
request.

The browser stores the token in local storage for this self-contained demo,
attaches it in the typed API client, clears it on HTTP 401, and redirects to
login. A production application with a same-site deployment could instead use a
secure HTTP-only cookie plus CSRF protection.

## Deliberate remaining scope

The core assignment, JWT multi-user bonus, and conversational-chat bonus are
complete. PDF import remains optional and was intentionally deferred because
tabular PDF extraction has substantially higher parsing risk than the completed
features.
