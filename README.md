# CivicTrack Gambia

CivicTrack Gambia is a mobile-first civic reporting and public-complaint tracking platform. Citizens can report community issues (blocked drains, waste disposal, damaged roads, streetlights, public facilities), receive a unique reference code, and track progress. Authorized officers can review reports, update statuses, and record public progress notes.

> **Important:** This is a hackathon **prototype**. It is not affiliated with or endorsed by any government agency. Submitting a report does not guarantee official action. All data is fictional unless you enter your own.

## Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, Vite, TypeScript, Tailwind CSS |
| Routing | React Router |
| Forms | React Hook Form + Zod |
| Icons | Lucide React |
| Backend | Node.js, Express, TypeScript |
| Validation | Zod |
| Database | PostgreSQL 18 + Prisma ORM |
| Auth | JWT in HttpOnly, SameSite=Strict cookie; bcryptjs password hashing |
| Rate limiting | express-rate-limit |
| Email delivery | Resend (official SDK), server-side only |
| Testing | Vitest + Supertest |

## Project structure

```
civictrack-gambia/
  apps/
    web/          # React frontend (Vite + Tailwind + React Router)
    api/          # Express backend (Prisma + PostgreSQL)
      prisma/
        schema.prisma
        seed.ts
        migrations/
      tests/
  docker-compose.yml   # PostgreSQL via Docker (kept for reference)
  package.json         # Root workspace scripts
  .env.example         # Copy to .env
  .gitignore
  README.md
```

Frontend and backend code are separated into `apps/web` and `apps/api`.

## Prerequisites

- Node.js >= 20 (tested with Node 24.19.0, npm 11.17.0)
- PostgreSQL 18 (running). Docker is **not** available in this environment, so PostgreSQL was installed directly and runs on `localhost:5433`.
- Git

## Environment setup

1. Copy `.env.example` to `.env` (create `apps/api/.env` too — see below).
2. Adjust `DATABASE_URL` to point at your PostgreSQL instance.
3. Set `DEMO_OFFICER_EMAIL`, `DEMO_OFFICER_PASSWORD`, and `JWT_SECRET`.

`apps/api/.env` (local development, already created):

```
DATABASE_URL="postgresql://civictrack@localhost:5433/civictrack_gambia?schema=public"
PORT=4000
NODE_ENV=development
API_BASE_URL=http://localhost:4000
FRONTEND_URL=http://localhost:5173
JWT_SECRET=dev-secret-do-not-use-in-production
JWT_EXPIRES_IN=8h
DEMO_OFFICER_NAME="Duty Officer"
DEMO_OFFICER_EMAIL=officer@civictrack.gm
DEMO_OFFICER_PASSWORD=DemoOfficerPass123!
RESEND_API_KEY=re_your_resend_api_key
EMAIL_FROM="CivicTrack Gambia <onboarding@resend.dev>"
```

`apps/web/.env` is not required — `VITE_API_URL` defaults to `http://localhost:4000` and the Vite dev server proxies `/api` to the backend.

### Email configuration

Confirmation emails are sent through [Resend](https://resend.com). All email configuration lives in `apps/api/.env` (server-side only) and is **never** exposed to the Vite frontend:

- `RESEND_API_KEY` — your Resend API key (create one at https://resend.com/api-keys).
- `EMAIL_FROM` — a verified sender address, e.g. `CivicTrack Gambia <onboarding@resend.dev>`. In Resend's test mode `onboarding@resend.dev` works without verification; in production you must verify your own domain (see "Sender domain verification" below).
- `FRONTEND_URL` — the public frontend origin used in confirmation email tracking links (e.g. `https://civictrack-gambia.vercel.app`).

See `.env.example` for placeholders. Real secrets must never be committed; `.env` files are gitignored.

> Secrets are never committed. `.env` is gitignored. Only `.env.example` is tracked.

## Installation

```bash
npm install            # installs root + workspace dependencies
```

## Starting the database (PostgreSQL)

Docker is unavailable here, so PostgreSQL was installed directly (PostgreSQL 18). A self-managed data directory lives in `.pgdata` (gitignored) and runs on port 5433.

```bash
# Initialize once (already done in this repo):
# initdb -D .pgdata -U civictrack --auth=trust --locale=C -E UTF8

# Start:
pg_ctl -D .pgdata -o "-p 5433" -l .pgdata/pg.log start

# Create the database:
createdb -U civictrack -h localhost -p 5433 civictrack_gambia
```

If you have Docker instead, use `docker-compose.yml` (service `postgres` on port 5432) and set `DATABASE_URL` accordingly.

## Applying migrations & seeding

```bash
cd apps/api
npx prisma generate
npx prisma migrate deploy      # applies prisma/migrations/20261019032510_init
npx prisma db seed             # seeds demo officer + 6 fictional reports
```

The seed script is idempotent (safe to re-run). It creates:

- Demo officer: `officer@civictrack.gm` / password from `DEMO_OFFICER_PASSWORD`
- Six fictional sample reports across categories and statuses, with status histories

## Starting the application

```bash
# Terminal 1 — API
cd apps/api
npm run dev          # tsx watch on http://localhost:4000

# Terminal 2 — frontend
cd apps/web
npm run dev          # Vite on http://localhost:5173 (proxies /api to :4000)
```

Or from the repo root:

```bash
npm run dev:api      # backend
npm run dev:web      # frontend
```

Root scripts: `npm run dev`, `npm run dev:api`, `npm run dev:web`, `npm run build:api`, `npm run build:web`, `npm run test`, `npm run db:setup`.

Open `http://localhost:5173/`.

## Running tests

```bash
cd apps/api
npm test             # vitest run — 12 tests, all passing
```

Tests verify:
1. API health responds successfully
2. Valid reports are saved with a unique reference code
3. Invalid reports are rejected
4. Reference codes are unique across submissions
5. Reports are retrievable by reference code
6. Invalid references return a safe 404 (no DB internals leaked)
7. Public tracking excludes contact details
8. Unauthenticated status updates are rejected (401)
9. Authenticated officers can update reports
10. Status changes create history records
11. Latest status appears in tracking responses
12. Dashboard counts reflect database records

## Demo officer setup

Credentials come from environment variables (never hardcoded):

```
DEMO_OFFICER_EMAIL=officer@civictrack.gm
DEMO_OFFICER_PASSWORD=DemoOfficerPass123!
```

The seed script upserts this officer. Sign in at `/officer/login`, then access `/officer/dashboard`.

## API contract

Public endpoints:
- `GET /api/health` — health check
- `POST /api/reports` — submit a report (rate-limited: 20/15min per IP). Returns `{ referenceCode, status, emailSent, message }`. The report is persisted before the confirmation email is attempted; if email delivery fails the report is still saved and `emailSent` is `false`.
- `GET /api/reports/track/:reference` — public tracking (rate-limited: 30/15min per IP). Returns public report + timeline, no contact/officer info. Citizen email is never exposed.
- `POST /api/reports/track/:reference/resend-confirmation` — re-send the confirmation email to the address already on file (rate-limited: 3/15min per IP). Citizens cannot choose the recipient.
- `GET /api/reports/categories` — list issue categories

Officer endpoints (all require authenticated session via HttpOnly cookie):
- `POST /api/auth/login` — sign in (rate-limited: 10/15min per IP)
- `POST /api/auth/logout`
- `GET /api/auth/me` — current session
- `GET /api/officer/dashboard` — summary counts
- `GET /api/officer/reports` — paginated, searchable, filterable report list
- `GET /api/officer/reports/:id` — report detail (officer view, includes contact info)
- `PATCH /api/officer/reports/:id/status` — change status + public note (creates status history)

Statuses: SUBMITTED, UNDER_REVIEW, ASSIGNED, IN_PROGRESS, RESOLVED, REJECTED (shown with readable labels).

## Deployment considerations

- Set `NODE_ENV=production` and a strong `JWT_SECRET`.
- Use HTTPS so the Secure session cookie works.
- Set `FRONTEND_URL` to your frontend origin for CORS and for confirmation email tracking links.
- Point `DATABASE_URL` at a managed PostgreSQL instance.
- Run `npx prisma migrate deploy` before starting the API.
- The frontend build output (`apps/web/dist`) can be served statically; set `VITE_API_URL` at build time.

### Email in production

1. Add `RESEND_API_KEY`, `EMAIL_FROM`, and `FRONTEND_URL` to the Render environment (via the dashboard or `render.yaml`; they are marked `sync: false` so you set them manually).
2. Verify your sender domain in Resend and update `EMAIL_FROM` to an address on that domain (e.g. `CivicTrack Gambia <reports@civictrack.gm>`). Resend requires DNS records (SPF/DKIM/DMARC) for the domain; see Resend's domain verification docs. Until verified, use Resend's test mode with `onboarding@resend.dev`.
3. Resend enforces daily sending limits on free plans; monitor the `emailSent` flag in submission responses — a `false` value means delivery could not be confirmed and the citizen should be advised to save their reference code.

### Sender domain verification

- Add and verify your domain in Resend (https://resend.com/domains).
- Publish the DKIM and SPF records Resend provides to your DNS.
- Set `EMAIL_FROM` to an address from the verified domain, e.g. `CivicTrack Gambia <reports@yourdomain.gm>`.
- Never set `EMAIL_FROM` to a value supplied by a user; the API constructs all emails from templates.

## Known limitations

- Docker is unavailable in this environment; PostgreSQL runs directly on localhost:5433. `docker-compose.yml` is included for environments with Docker.
- Authentication uses a single demo officer account suitable for a hackathon demo, not multi-user production auth.
- Image uploads are not implemented; an optional image URL field could be added.
- No real government integration, statistics, or partnerships are claimed.

## Commands summary

```bash
npm install
cd apps/api && npx prisma generate && npx prisma migrate deploy && npx prisma db seed
cd apps/api && npm run dev        # backend :4000
cd apps/web && npm run dev        # frontend :5173
cd apps/api && npm test           # 12 tests
```

## Definition of Done (verified)

1. PostgreSQL + API + frontend started ✅
2. Homepage opens ✅
3. Fictional blocked-drain report submitted ✅
4. Unique backend-generated reference code received (`CTG-2026-...`) ✅
5. Tracking page retrieves the report ✅
6. Demo officer signs in (`officer@civictrack.gm`) ✅
7. Report opened in officer dashboard ✅
8. Status changed to IN_PROGRESS with a public note ✅
9. Update saved via database transaction (status + history) ✅
10. Citizen tracking page shows the new status and timeline ✅
11. API restarted; report and history persist in PostgreSQL ✅
