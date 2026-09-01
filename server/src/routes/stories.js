const express = require("express");
const db = require("../db");
const { isValidId, validateStoryInput } = require("../validators");

// Mounted at /api (see index.js). Handles both:
//   /projects/:projectId/stories  (list + create, nested under a project)
//   /stories/:id                  (get/update/delete a single story by id)
const router = express.Router();

// GET /api/projects/:projectId/stories - list stories for a project
router.get("/projects/:projectId/stories", (req, res, next) => {
  try {
    if (!isValidId(req.params.projectId)) return res.status(400).json({ error: "Invalid project id" });

    const project = db.prepare("SELECT * FROM projects WHERE id = ?").get(req.params.projectId);
    if (!project) return res.status(404).json({ error: "Project not found" });

    const stories = db
      .prepare(
        `SELECT s.*, COUNT(t.id) AS taskCount
         FROM user_stories s
         LEFT JOIN tasks t ON t.userStoryId = s.id
         WHERE s.projectId = ?
         GROUP BY s.id
         ORDER BY s.createdAt ASC`
      )
      .all(req.params.projectId);

    res.json(stories);
  } catch (err) {
    next(err);
  }
});

// POST /api/projects/:projectId/stories - create a story under a project
router.post("/projects/:projectId/stories", (req, res, next) => {
  try {
    if (!isValidId(req.params.projectId)) return res.status(400).json({ error: "Invalid project id" });

    const project = db.prepare("SELECT * FROM projects WHERE id = ?").get(req.params.projectId);
    if (!project) return res.status(404).json({ error: "Project not found" });

    const errors = validateStoryInput(req.body);
    if (errors.length > 0) return res.status(400).json({ error: errors.join(", ") });

    const info = db
      .prepare(
        `INSERT INTO user_stories (projectId, title, description, status, priority)
         VALUES (?, ?, ?, ?, ?)`
      )
      .run(
        project.id,
        req.body.title.trim(),
        req.body.description || "",
        req.body.status || "BACKLOG",
        req.body.priority || "MEDIUM"
      );

    const story = db.prepare("SELECT * FROM user_stories WHERE id = ?").get(info.lastInsertRowid);
    res.status(201).json(story);
  } catch (err) {
    next(err);
  }
});

// GET /api/stories/:id - single story with its tasks
router.get("/stories/:id", (req, res, next) => {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ error: "Invalid story id" });

    const story = db.prepare("SELECT * FROM user_stories WHERE id = ?").get(req.params.id);
    if (!story) return res.status(404).json({ error: "User story not found" });

    story.tasks = db
      .prepare("SELECT * FROM tasks WHERE userStoryId = ? ORDER BY createdAt ASC")
      .all(story.id);

    res.json(story);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/stories/:id - update a story
router.patch("/stories/:id", (req, res, next) => {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ error: "Invalid story id" });

    const errors = validateStoryInput(req.body, { partial: true });
    if (errors.length > 0) return res.status(400).json({ error: errors.join(", ") });

    const existing = db.prepare("SELECT * FROM user_stories WHERE id = ?").get(req.params.id);
    if (!existing) return res.status(404).json({ error: "User story not found" });

    db.prepare(
      `UPDATE user_stories
       SET title = ?, description = ?, status = ?, priority = ?, updatedAt = datetime('now')
       WHERE id = ?`
    ).run(
      req.body.title !== undefined ? req.body.title.trim() : existing.title,
      req.body.description !== undefined ? req.body.description : existing.description,
      req.body.status !== undefined ? req.body.status : existing.status,
      req.body.priority !== undefined ? req.body.priority : existing.priority,
      req.params.id
    );

    const story = db.prepare("SELECT * FROM user_stories WHERE id = ?").get(req.params.id);
    res.json(story);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/stories/:id - delete a story (cascades to its tasks)
router.delete("/stories/:id", (req, res, next) => {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ error: "Invalid story id" });

    const existing = db.prepare("SELECT * FROM user_stories WHERE id = ?").get(req.params.id);
    if (!existing) return res.status(404).json({ error: "User story not found" });

    db.prepare("DELETE FROM user_stories WHERE id = ?").run(req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
