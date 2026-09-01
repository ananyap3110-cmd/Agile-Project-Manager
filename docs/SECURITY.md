# Security Considerations

This is a local assignment demo, not a production deployment. The following measures are in
place, and the known gaps are called out explicitly rather than left implicit.

## What's implemented

- **Input validation**: every write endpoint (`POST`/`PATCH`) validates required fields and
  restricts `status`/`priority` to their allowed enum values before touching the database
  (`server/src/validators.js`). Invalid input returns `400` with a clear message, never a raw
  stack trace.
- **SQL injection protection**: all database access uses parameterized queries via
  `better-sqlite3`'s `db.prepare(...).run(...)`/`.get(...)`/`.all(...)`. No user input is ever
  concatenated into a SQL string.
- **CORS**: the API uses the `cors` middleware so the frontend (on a different port in dev) can
  call it. In a real deployment this should be locked down to the actual frontend origin instead
  of the default "allow all."
- **Environment variables**: configuration (port, database path, worker poll interval) is read
  from `.env` via `dotenv`, not hardcoded, and `.env` is git-ignored. An `.env.example` is
  committed instead so the required variables are documented.
- **Consistent error handling**: a centralized Express error handler ensures unexpected errors
  return a generic `500 { "error": "..." }` instead of leaking internals (stack traces, file
  paths) to the client. Errors are still logged server-side for debugging.
- **Foreign key constraints**: SQLite's `PRAGMA foreign_keys = ON` is enabled, so the database
  itself enforces that a User Story can't reference a nonexistent Project and a Task can't
  reference a nonexistent User Story.

## Known gaps (acceptable for this assignment, called out explicitly)

- **No authentication or authorization.** Any client that can reach the API can read and write
  everything. This was an explicit non-goal per the assignment instructions. A real deployment
  would need at minimum session-based or JWT auth and per-resource ownership checks.
- **No rate limiting.** All endpoints are unauthenticated and unthrottled. A public deployment
  would need rate limiting (e.g. `express-rate-limit`) to prevent abuse.
- **No HTTPS termination in the app itself.** Local dev runs over plain HTTP; a real deployment
  would sit behind a reverse proxy or platform that terminates TLS.
- **No output encoding beyond React's defaults.** React escapes rendered text by default, which
  covers the basic XSS surface here since no HTML is ever rendered from user input via
  `dangerouslySetInnerHTML`.
