# Design Decisions & Tradeoffs

This document explains the choices made for this assignment and what was traded off, as required
by the submission checklist.

## SQLite via `better-sqlite3`, not an ORM

The TRD suggested SQLite with an ORM (e.g. Prisma) "if it makes database handling easier."
In practice, `better-sqlite3` was simpler for this project's size:
- No code-generation step, no external binary download at install time, no schema migration
  tooling to explain — one `db.js` file creates the tables with plain `CREATE TABLE IF NOT EXISTS`
  statements.
- Queries are plain, parameterized SQL (`db.prepare(...).run(...)`), which is easy to read and
  easy to explain line-by-line in an interview.
- Tradeoff: no automatic migrations. For a project this size that's an acceptable tradeoff —
  schema changes just mean editing the `CREATE TABLE` statements. A larger project would want a
  real migration tool.

## Polling worker instead of a message queue

The assignment explicitly allows (and the TRD recommends) a simple polling job over
Redis/BullMQ/Kafka. A `setInterval` loop that checks the `background_jobs` table every few
seconds is:
- Zero extra infrastructure — it uses the same SQLite file as the API.
- Easy to reason about: PENDING → PROCESSING → COMPLETED/FAILED, with a bounded number of retries.
- Tradeoff: jobs are only picked up on the next poll tick (a few seconds of latency), and there's
  no true concurrency — only one job is processed at a time. Both are fine for a small team's
  report-generation workload; see "Future Improvements" for the production-grade path.

## Cascading deletes, not soft deletes

Deleting a Project removes its User Stories and Tasks (and any Background Jobs) via SQLite
foreign keys with `ON DELETE CASCADE`. This keeps the data model simple and avoids every query
needing a `WHERE deletedAt IS NULL` clause. The tradeoff is that deletion is permanent — there's
no "trash" or undo. For a real product, soft deletes (a `deletedAt` column) would be a reasonable
next step.

## No authentication

The assignment's "No Unnecessary Features" section explicitly excludes auth. Every user of a
running instance can see and edit everything. This is fine for a local assignment demo; see
"Future Improvements" in the README for what a real deployment would need.

## Report generation as the async workflow (not a digest/reminder email)

The PRD's suggested async workflow was a daily digest/reminder email. This implementation instead
uses on-demand project report generation, which the assignment PDF explicitly lists as an
acceptable example ("notifications, reminders, report generation, or background processing").
Report generation was chosen because:
- It's directly observable in the UI (click a button, watch a job go from PENDING to COMPLETED),
  which makes the async behavior easy to demonstrate without needing an email provider or a mock
  scheduler.
- It doesn't require a "current user" concept, which keeps the no-auth simplification consistent.

## State-based navigation instead of a router library

The frontend has exactly three views (Dashboard, Projects, Project Detail). Rather than add
`react-router-dom` for three screens, `App.jsx` swaps between them with a single `useState`. This
matches the assignment's instruction to avoid dependencies that aren't earning their place.

## Plain `useState`/`useEffect`, no global state library

Every piece of state in this app (a list of projects, a selected project's hierarchy, a job's
status) is owned by the component that displays it and reloaded from the API after each mutation.
There's no cross-cutting state that would justify Redux/Zustand/React Query at this scale.
