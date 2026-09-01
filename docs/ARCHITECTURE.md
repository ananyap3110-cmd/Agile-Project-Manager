# Architecture Notes

## Overview

```
┌─────────────┐      fetch() / JSON      ┌──────────────┐      SQL       ┌──────────┐
│  React SPA  │ ───────────────────────▶ │  Express API │ ─────────────▶ │  SQLite  │
│  (Vite)     │ ◀─────────────────────── │  (server/)   │ ◀───────────── │ data.db  │
└─────────────┘                          └──────┬───────┘                └────┬─────┘
                                                 │ writes a row                │
                                                 ▼                            │
                                       background_jobs table ◀────────────────┘
                                                 ▲
                                                 │ polls every few seconds
                                          ┌──────┴───────┐
                                          │ Worker process │
                                          │ (worker.js)    │
                                          └────────────────┘
```

- The **frontend** is a single-page React app. It never talks to SQLite directly — everything
  goes through the REST API.
- The **API server** (`server/src/index.js`) handles all CRUD requests and enqueues background
  jobs, but never does the actual report generation itself — that would block the request.
- The **worker** (`server/src/worker.js`) is a separate Node.js process. It polls the
  `background_jobs` table for `PENDING` rows and processes them one at a time. It shares the
  same SQLite file as the API server, so no extra infrastructure (Redis, message broker) is
  needed.

## Why this shape

A small team's tool doesn't need a distributed system. Two Node processes and one SQLite file:
- are trivial to run locally (`npm run server`, `npm run worker`),
- are trivial to explain in an interview,
- and still demonstrate a genuine separation between the request/response path and background
  work — which is the actual thing being evaluated, not the specific queue technology.

## Data flow: generating a report

1. User clicks "Generate Project Report" in the UI.
2. Frontend calls `POST /api/projects/:id/reports`.
3. API inserts a row into `background_jobs` with `status = 'PENDING'` and returns `{ jobId }`
   immediately (HTTP 202) — the API never waits for the report to be built.
4. Frontend starts polling `GET /api/jobs/:id` every 1.5 seconds.
5. The worker process, on its own timer, notices the `PENDING` row, marks it `PROCESSING`,
   computes the counts (`userStoryCount`, `taskCount`, `completedTaskCount`,
   `incompleteTaskCount`), and writes the result back, setting `status = 'COMPLETED'`.
6. The frontend's next poll sees `COMPLETED` and renders the result. If something throws while
   processing, the worker retries (up to `maxAttempts`) before marking the job `FAILED`.

## Project structure

```
agile-project-manager/
  server/
    src/
      index.js       API entry point (npm run server)
      worker.js       Background worker entry point (npm run worker)
      seed.js         Seed data script (npm run seed)
      db.js           SQLite connection + schema creation
      validators.js   Plain-function input validation
      routes/         One file per resource (projects, stories, tasks, jobs, dashboard)
    data.db           SQLite database file (created on first run, git-ignored)
  client/
    src/
      main.jsx        React entry point
      App.jsx          Top-level view switcher (Dashboard / Projects / Project Detail)
      api.js           fetch() helper used by all components
      components/      Dashboard.jsx, ProjectsList.jsx, ProjectDetail.jsx
      style.css        Plain CSS for the whole app
  docs/               This documentation
  README.md
```
