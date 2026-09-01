// Sets up the SQLite database connection and creates tables if they don't
// exist yet. Uses better-sqlite3, a synchronous SQLite driver — simple to
// reason about and fast enough for a small team's data.
const path = require("path");
const Database = require("better-sqlite3");

const DB_PATH = process.env.DATABASE_PATH || path.join(__dirname, "..", "data.db");

const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON"); // enforce the Project -> UserStory -> Task relationships

db.exec(`
  CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'PLANNING',
    createdAt TEXT NOT NULL DEFAULT (datetime('now')),
    updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS user_stories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    projectId INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'BACKLOG',
    priority TEXT NOT NULL DEFAULT 'MEDIUM',
    createdAt TEXT NOT NULL DEFAULT (datetime('now')),
    updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userStoryId INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'TODO',
    priority TEXT NOT NULL DEFAULT 'MEDIUM',
    dueDate TEXT,
    createdAt TEXT NOT NULL DEFAULT (datetime('now')),
    updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (userStoryId) REFERENCES user_stories(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS background_jobs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING',
    attempts INTEGER NOT NULL DEFAULT 0,
    maxAttempts INTEGER NOT NULL DEFAULT 3,
    payload TEXT NOT NULL DEFAULT '{}',
    result TEXT,
    error TEXT,
    projectId INTEGER NOT NULL,
    createdAt TEXT NOT NULL DEFAULT (datetime('now')),
    startedAt TEXT,
    completedAt TEXT,
    FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_user_stories_projectId ON user_stories(projectId);
  CREATE INDEX IF NOT EXISTS idx_tasks_userStoryId ON tasks(userStoryId);
  CREATE INDEX IF NOT EXISTS idx_background_jobs_status ON background_jobs(status);
`);

module.exports = db;
