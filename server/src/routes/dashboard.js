const express = require("express");
const db = require("../db");

const router = express.Router();

// GET /api/dashboard - high level counts shown on the dashboard page
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

    res.json({ totalProjects, totalUserStories, openTasks, overdueTasks });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
