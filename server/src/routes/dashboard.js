const express = require("express");
const db = require("../db");

const router = express.Router();

const TASK_STATUSES = ["TODO", "IN_PROGRESS", "BLOCKED", "DONE"];
const PROJECT_STATUSES = ["PLANNING", "ACTIVE", "COMPLETED", "ARCHIVED"];

// Turns [{status, count}, ...] into {STATUS: count, ...} with every known
// status present (defaulting to 0), so the frontend never has to guess
// about missing keys when rendering a bar for each status.
function toCountMap(rows, knownStatuses) {
  const map = Object.fromEntries(knownStatuses.map((status) => [status, 0]));
  for (const row of rows) {
    map[row.status] = row.count;
  }
  return map;
}

// GET /api/dashboard - summary data for the dashboard page: headline counts,
// status breakdowns for the small bar charts, a short overdue-tasks list,
// and the most recently updated projects.
router.get("/", (req, res, next) => {
  try {
    const totalProjects = db.prepare("SELECT COUNT(*) AS count FROM projects").get().count;
    const totalUserStories = db.prepare("SELECT COUNT(*) AS count FROM user_stories").get().count;
    const openTasks = db
      .prepare("SELECT COUNT(*) AS count FROM tasks WHERE status != 'DONE'")
      .get().count;
    const overdueTasks = db
      .prepare(
        `SELECT COUNT(*) AS count FROM tasks
         WHERE status != 'DONE' AND dueDate IS NOT NULL AND dueDate < datetime('now')`
      )
      .get().count;

    const taskStatusRows = db
      .prepare("SELECT status, COUNT(*) AS count FROM tasks GROUP BY status")
      .all();
    const taskStatusCounts = toCountMap(taskStatusRows, TASK_STATUSES);

    const projectStatusRows = db
      .prepare("SELECT status, COUNT(*) AS count FROM projects GROUP BY status")
      .all();
    const projectStatusCounts = toCountMap(projectStatusRows, PROJECT_STATUSES);

    const overdueTaskList = db
      .prepare(
        `SELECT t.id, t.title, t.dueDate, t.priority,
                s.id AS storyId, s.title AS storyTitle,
                p.id AS projectId, p.name AS projectName
         FROM tasks t
         JOIN user_stories s ON s.id = t.userStoryId
         JOIN projects p ON p.id = s.projectId
         WHERE t.status != 'DONE' AND t.dueDate IS NOT NULL AND t.dueDate < datetime('now')
         ORDER BY t.dueDate ASC
         LIMIT 5`
      )
      .all();

    const recentProjects = db
      .prepare(
        `SELECT p.*, COUNT(s.id) AS userStoryCount
         FROM projects p
         LEFT JOIN user_stories s ON s.projectId = p.id
         GROUP BY p.id
         ORDER BY p.updatedAt DESC
         LIMIT 5`
      )
      .all();

    res.json({
      totalProjects,
      totalUserStories,
      openTasks,
      overdueTasks,
      taskStatusCounts,
      projectStatusCounts,
      overdueTaskList,
      recentProjects,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
