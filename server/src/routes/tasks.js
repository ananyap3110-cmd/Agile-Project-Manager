const express = require("express");
const db = require("../db");
const { isValidId, validateTaskInput } = require("../validators");

// Mounted at /api (see index.js). Handles both:
//   /stories/:storyId/tasks  (list + create, nested under a story)
//   /tasks/:id               (get/update/delete a single task by id)
const router = express.Router();

// GET /api/stories/:storyId/tasks - list tasks for a user story
router.get("/stories/:storyId/tasks", (req, res, next) => {
  try {
    if (!isValidId(req.params.storyId)) return res.status(400).json({ error: "Invalid story id" });

    const story = db.prepare("SELECT * FROM user_stories WHERE id = ?").get(req.params.storyId);
    if (!story) return res.status(404).json({ error: "User story not found" });

    const tasks = db
      .prepare("SELECT * FROM tasks WHERE userStoryId = ? ORDER BY createdAt ASC")
      .all(req.params.storyId);

    res.json(tasks);
  } catch (err) {
    next(err);
  }
});

// POST /api/stories/:storyId/tasks - create a task under a user story
router.post("/stories/:storyId/tasks", (req, res, next) => {
  try {
    if (!isValidId(req.params.storyId)) return res.status(400).json({ error: "Invalid story id" });

    const story = db.prepare("SELECT * FROM user_stories WHERE id = ?").get(req.params.storyId);
    if (!story) return res.status(404).json({ error: "User story not found" });

    const errors = validateTaskInput(req.body);
    if (errors.length > 0) return res.status(400).json({ error: errors.join(", ") });

    const info = db
      .prepare(
        `INSERT INTO tasks (userStoryId, title, description, status, priority, dueDate)
         VALUES (?, ?, ?, ?, ?, ?)`
      )
      .run(
        story.id,
        req.body.title.trim(),
        req.body.description || "",
        req.body.status || "TODO",
        req.body.priority || "MEDIUM",
        req.body.dueDate ? new Date(req.body.dueDate).toISOString() : null
      );

    const task = db.prepare("SELECT * FROM tasks WHERE id = ?").get(info.lastInsertRowid);
    res.status(201).json(task);
  } catch (err) {
    next(err);
  }
});

// GET /api/tasks/:id - single task
router.get("/tasks/:id", (req, res, next) => {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ error: "Invalid task id" });

    const task = db.prepare("SELECT * FROM tasks WHERE id = ?").get(req.params.id);
    if (!task) return res.status(404).json({ error: "Task not found" });

    res.json(task);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/tasks/:id - update a task
router.patch("/tasks/:id", (req, res, next) => {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ error: "Invalid task id" });

    const errors = validateTaskInput(req.body, { partial: true });
    if (errors.length > 0) return res.status(400).json({ error: errors.join(", ") });

    const existing = db.prepare("SELECT * FROM tasks WHERE id = ?").get(req.params.id);
    if (!existing) return res.status(404).json({ error: "Task not found" });

    const nextDueDate =
      req.body.dueDate !== undefined
        ? req.body.dueDate
          ? new Date(req.body.dueDate).toISOString()
          : null
        : existing.dueDate;

    db.prepare(
      `UPDATE tasks
       SET title = ?, description = ?, status = ?, priority = ?, dueDate = ?, updatedAt = datetime('now')
       WHERE id = ?`
    ).run(
      req.body.title !== undefined ? req.body.title.trim() : existing.title,
      req.body.description !== undefined ? req.body.description : existing.description,
      req.body.status !== undefined ? req.body.status : existing.status,
      req.body.priority !== undefined ? req.body.priority : existing.priority,
      nextDueDate,
      req.params.id
    );

    const task = db.prepare("SELECT * FROM tasks WHERE id = ?").get(req.params.id);
    res.json(task);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/tasks/:id
router.delete("/tasks/:id", (req, res, next) => {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ error: "Invalid task id" });

    const existing = db.prepare("SELECT * FROM tasks WHERE id = ?").get(req.params.id);
    if (!existing) return res.status(404).json({ error: "Task not found" });

    db.prepare("DELETE FROM tasks WHERE id = ?").run(req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
