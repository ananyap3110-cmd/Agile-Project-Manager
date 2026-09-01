// Background worker for the Agile Project Management Tool.
// Run with: npm run worker (in a separate terminal from the API server)
//
// This is intentionally a simple polling worker instead of a message queue:
// it periodically checks the background_jobs table for PENDING jobs and
// processes them one at a time. That's enough for a small team's workload
// and is easy to explain/debug (see README "Background Worker" section).
require("dotenv").config();
const db = require("./db");

const POLL_INTERVAL_MS = Number(process.env.WORKER_POLL_INTERVAL_MS) || 3000;

function processPendingJobs() {
  const job = db
    .prepare("SELECT * FROM background_jobs WHERE status = 'PENDING' ORDER BY createdAt ASC LIMIT 1")
    .get();

  if (!job) return; // nothing to do this tick

  const attempts = job.attempts + 1;
  db.prepare(
    "UPDATE background_jobs SET status = 'PROCESSING', startedAt = datetime('now'), attempts = ? WHERE id = ?"
  ).run(attempts, job.id);

  try {
    if (job.type !== "PROJECT_REPORT") {
      throw new Error(`Unknown job type: ${job.type}`);
    }

    const result = generateProjectReport(job.projectId);

    db.prepare(
      `UPDATE background_jobs
       SET status = 'COMPLETED', result = ?, error = NULL, completedAt = datetime('now')
       WHERE id = ?`
    ).run(JSON.stringify(result), job.id);

    console.log(`Job ${job.id}: report generated for project ${job.projectId}`);
  } catch (err) {
    console.error(`Job ${job.id} failed on attempt ${attempts}:`, err.message);

    if (attempts >= job.maxAttempts) {
      db.prepare(
        "UPDATE background_jobs SET status = 'FAILED', error = ?, completedAt = datetime('now') WHERE id = ?"
      ).run(err.message, job.id);
      console.error(`Job ${job.id}: giving up after ${attempts} attempts`);
    } else {
      // Put it back to PENDING so a future tick retries it.
      db.prepare("UPDATE background_jobs SET status = 'PENDING', error = ? WHERE id = ?").run(
        err.message,
        job.id
      );
      console.log(`Job ${job.id}: will retry (attempt ${attempts}/${job.maxAttempts})`);
    }
  }
}

// Computes the actual project report: story/task counts and completion stats.
function generateProjectReport(projectId) {
  const project = db.prepare("SELECT * FROM projects WHERE id = ?").get(projectId);
  if (!project) throw new Error(`Project ${projectId} no longer exists`);

  const userStoryCount = db
    .prepare("SELECT COUNT(*) AS count FROM user_stories WHERE projectId = ?")
    .get(projectId).count;

  const taskCount = db
    .prepare(
      `SELECT COUNT(*) AS count FROM tasks t
       JOIN user_stories s ON s.id = t.userStoryId
       WHERE s.projectId = ?`
    )
    .get(projectId).count;

  const completedTaskCount = db
    .prepare(
      `SELECT COUNT(*) AS count FROM tasks t
       JOIN user_stories s ON s.id = t.userStoryId
       WHERE s.projectId = ? AND t.status = 'DONE'`
    )
    .get(projectId).count;

  return {
    projectId,
    projectName: project.name,
    generatedAt: new Date().toISOString(),
    userStoryCount,
    taskCount,
    completedTaskCount,
    incompleteTaskCount: taskCount - completedTaskCount,
  };
}

function start() {
  console.log(`Background worker started. Polling every ${POLL_INTERVAL_MS}ms.`);
  setInterval(() => {
    try {
      processPendingJobs();
    } catch (err) {
      console.error("Worker tick failed:", err);
    }
  }, POLL_INTERVAL_MS);
}

start();
