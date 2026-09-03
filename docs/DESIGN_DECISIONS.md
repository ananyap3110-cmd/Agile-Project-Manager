# Design Decisions & Tradeoffs

This document explains the choices made for this assignment and what was traded off, as required
by the submission checklist.

## SQLite via Node's built-in `node:sqlite`, not an ORM or a third-party driver

The TRD suggested SQLite with an ORM (e.g. Prisma) "if it makes database handling easier."
This project uses Node's own built-in `node:sqlite` module instead of an ORM or a third-party
driver like `better-sqlite3`:
- **No native compilation.** Third-party SQLite drivers are native addons — they either ship a
  prebuilt binary for your exact Node version/OS/architecture, or fall back to compiling from
  source with `node-gyp`, which requires Python and a C++ toolchain (Visual Studio Build Tools on
  Windows). That's a real setup hurdle for an assignment meant to run in minutes. `node:sqlite`
  ships inside Node itself — nothing to compile, nothing to download beyond Node.
- No code-generation step, no schema migration tooling to explain — one `db.js` file creates the
  tables with plain `CREATE TABLE IF NOT EXISTS` statements.
- Queries are plain, parameterized SQL (`db.prepare(...).run(...)`), which is easy to read and
  easy to explain line-by-line in an interview — the same shape a `better-sqlite3` based project
  would have, just without the native dependency.
- Tradeoff: `node:sqlite` is still an experimental/Release-Candidate Node API (stable as of
  Node 24/25, unflagged since Node 22.13/23.4), and it requires **Node 22.13+**. It also has no
  automatic migrations, same as the alternative above — schema changes mean editing the
  `CREATE TABLE` statements directly, which is fine at this project's size.

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

## Built-in FAQ assistant instead of a real AI API

The assistant widget answers questions by matching keywords against a small, hardcoded FAQ list
(`client/src/components/AssistantWidget.jsx`), rather than calling an external LLM API. This was
a deliberate choice:
- **No API key required.** A real AI integration would need an OpenAI/Anthropic key, which means
  a cost, a secret to manage, and a dependency that stops working the moment the key is missing
  or the quota runs out — not appropriate for something meant to run in 5 minutes locally with no
  configuration.
- It's still genuinely useful for its actual purpose: answering the small, predictable set of
  questions a client is likely to have about how the tool works (statuses, priorities, reports,
  search, etc.).
- Tradeoff: it can't answer open-ended questions or anything outside its FAQ list — it says so
  explicitly rather than guessing. A production version aimed at more complex questions would
  swap this for a real LLM call (see "Future Improvements").

## Single local profile, not a user accounts system

The Profile page reads/writes one fixed row (`id = 1`) in a `profile` table rather than a `users`
table with authentication. This matches the rest of the app's no-auth design — it's a local
"who am I" note, not an account system. Tradeoff: it doesn't support multiple people having
separate profiles on the same running instance; see "Future Improvements" for real
multi-user accounts.

## Plain `useState`/`useEffect`, no global state library

Every piece of state in this app (a list of projects, a selected project's hierarchy, a job's
status) is owned by the component that displays it and reloaded from the API after each mutation.
There's no cross-cutting state that would justify Redux/Zustand/React Query at this scale.
