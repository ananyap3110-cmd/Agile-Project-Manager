# Agile Project Management Tool

A lightweight full-stack app for a small team to plan and track work using the hierarchy
**Project → User Story → Task**. Built as a full-stack intern assignment, deliberately kept
simple: React + Vite frontend, Express backend, SQLite database, and a small background worker
for report generation.

## Project Overview

Small teams don't need Jira. This app lets a team:
- Create Projects, break them into User Stories, and break those into Tasks.
- Track status and priority at every level.
- See a dashboard of total projects, stories, open tasks, and overdue tasks.
- Generate a project report as a genuine background job (not just a synchronous calculation).

## Features

- Full CRUD for Projects, User Stories, and Tasks, enforced as a strict hierarchy
  (a Task always belongs to a User Story, a User Story always belongs to a Project).
- Status tracking: Projects (`PLANNING/ACTIVE/COMPLETED/ARCHIVED`), User Stories
  (`BACKLOG/IN_PROGRESS/DONE`), Tasks (`TODO/IN_PROGRESS/BLOCKED/DONE`).
- Priority levels (`LOW/MEDIUM/HIGH`) on Stories and Tasks.
- Due dates on Tasks, with overdue tasks visibly flagged.
- Dashboard with aggregate counts.
- Expandable Project → Story → Task view in the UI.
- Background "Generate Project Report" workflow with a separate polling worker process, retries,
  and failure handling.
- Simple, consistent REST API with documented endpoints.
- Seed data so the app is useful immediately.

## Technologies

- **Frontend**: React (JavaScript), Vite, plain CSS, native `fetch()`.
- **Backend**: Node.js, Express.
- **Database**: SQLite via `better-sqlite3` (no separate ORM — see `docs/DESIGN_DECISIONS.md`).
- **Background jobs**: a plain polling worker process, no external queue/broker.

## Project Structure

```
agile-project-manager/
  server/     Express API + background worker + SQLite database
  client/     React + Vite frontend
  docs/       API docs, architecture, design decisions, security notes
```

See `docs/ARCHITECTURE.md` for a diagram and a walkthrough of how the pieces fit together.

## Installation

Requires Node.js 18+ (for native `fetch` support and modern JS syntax).

```bash
# 1. Clone the repository, then from the project root:
cd server
npm install

cd ../client
npm install
```

## Database Setup

The database is plain SQLite, created automatically — there's no separate "create database" step
or migration tool. The first time the server (or worker, or seed script) runs, it creates
`server/data.db` and all required tables if they don't already exist.

Load the seed data (2-3 projects, several user stories, several tasks, mixed statuses/priorities,
including at least one overdue task):

```bash
cd server
npm run seed
```

You can re-run `npm run seed` at any time — it clears existing data first and recreates it.

## Running the Application

Run these in three separate terminals:

```bash
# Terminal 1 - API server
cd server
npm run server
# -> API server listening on http://localhost:4000

# Terminal 2 - background worker
cd server
npm run worker
# -> Background worker started. Polling every 3000ms.

# Terminal 3 - frontend
cd client
npm run dev
# -> Local: http://localhost:5173
```

Open http://localhost:5173 in your browser. The Vite dev server proxies `/api/*` requests to the
Express server on port 4000, so no extra configuration is needed.

## API Documentation

See [`docs/API.md`](docs/API.md) for every endpoint, its request body, and an example response.

## Database Schema

Four tables, enforced with SQLite foreign keys (`ON DELETE CASCADE`):

- **projects**: `id, name, description, status, createdAt, updatedAt`
- **user_stories**: `id, projectId → projects.id, title, description, status, priority, createdAt, updatedAt`
- **tasks**: `id, userStoryId → user_stories.id, title, description, status, priority, dueDate, createdAt, updatedAt`
- **background_jobs**: `id, type, status, attempts, maxAttempts, payload, result, error, projectId → projects.id, createdAt, startedAt, completedAt`

Relationships: `Project 1—N UserStory`, `UserStory 1—N Task`, `Project 1—N BackgroundJob`.
Deleting a Project cascades to its User Stories, Tasks, and Background Jobs. Deleting a User
Story cascades to its Tasks.

See `docs/ARCHITECTURE.md` for the full picture and `server/src/db.js` for the exact schema.

## Background Worker

- Clicking **Generate Project Report** calls `POST /api/projects/:id/reports`, which inserts a
  row into `background_jobs` with `status = 'PENDING'` and immediately returns a `jobId` — the
  API never blocks waiting for the report.
- The worker (`server/src/worker.js`, run separately with `npm run worker`) polls the
  `background_jobs` table every `WORKER_POLL_INTERVAL_MS` (default 3000ms) for `PENDING` jobs.
- When it finds one, it marks it `PROCESSING`, computes the report (user story count, task count,
  completed tasks, incomplete tasks), and marks it `COMPLETED` with the result attached.
- **Retries**: if processing throws an error, the job is put back to `PENDING` (up to
  `maxAttempts`, default 3) so a later poll retries it. Once `attempts >= maxAttempts`, the job is
  marked `FAILED` with the error message saved — never silently dropped.
- The frontend polls `GET /api/jobs/:id` every 1.5 seconds after starting a report so the user
  sees it move from `PENDING` → `PROCESSING` → `COMPLETED`/`FAILED` in real time.

## Design Decisions

See [`docs/DESIGN_DECISIONS.md`](docs/DESIGN_DECISIONS.md) for the full reasoning. In short:
simple, boring, well-understood tools were chosen deliberately over anything that would need
extra explanation without adding real value at this scale — plain SQLite over an ORM, a polling
worker over a message queue, cascading deletes over soft deletes, and state-based view switching
over a router library.

## Security Considerations

See [`docs/SECURITY.md`](docs/SECURITY.md) for the full list. Summary: server-side input
validation on every write, parameterized SQL (no string concatenation), CORS enabled for local
dev, secrets/config via `.env` (git-ignored), and a centralized error handler that never leaks
internals. No authentication is implemented — this was an explicit non-goal for the assignment.

## AI Usage

AI (Claude) was used as a development assistant to scaffold and write this project based on a
detailed set of requirements (assignment PDF, PRD, and TRD). The generated code should be
reviewed, understood, tested, and the developer submitting it takes responsibility for the
implementation — treat this as a reviewed starting point, not a black box.

## Future Improvements

With more time, the natural next steps would be:
- Real authentication/authorization (roles like admin/member, per-resource ownership).
- Assigning User Stories/Tasks to specific team members.
- Comments/activity log per item.
- Real notifications (email/in-app) instead of on-demand report generation.
- PostgreSQL instead of SQLite for multi-instance/production deployments.
- A proper background job infrastructure (e.g. BullMQ + Redis) for durability across restarts and
  true concurrency.
- More automated tests (see "Manual Testing Checklist" below for what's currently covered
  manually).

## Manual Testing Checklist

Since automated tests are minimal for an assignment this size, use this checklist to verify the
app manually after setup:

- [ ] `npm run seed` runs without errors and dashboard shows non-zero counts.
- [ ] Dashboard page loads and shows Total Projects / User Stories / Open Tasks / Overdue Tasks.
- [ ] Projects page lists the seeded projects with correct user story counts.
- [ ] Create a new project - it appears in the list immediately.
- [ ] Change a project's status via the dropdown - it updates without a page reload.
- [ ] Open a project - see its user stories and tasks in the hierarchy view.
- [ ] Add a new user story to a project - it appears immediately.
- [ ] Add a new task to a user story, with a due date in the past - it's flagged "Overdue" in red.
- [ ] Change a task's status to DONE - the dashboard's "Open Tasks" count decreases.
- [ ] Delete a task, then a story, then a project - each disappears and cascades correctly.
- [ ] Click "Generate Project Report" - a job status appears, worker must be running in a
      separate terminal for it to move from PENDING to COMPLETED.
- [ ] Stop the worker, generate a report, confirm the job stays PENDING until the worker is
      restarted (demonstrates the job survives independently of the worker process).
- [ ] Try creating a project with an empty name - should return a 400 error, shown in the UI.
