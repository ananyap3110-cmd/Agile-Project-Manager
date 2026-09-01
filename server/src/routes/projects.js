const express = require("express");
const db = require("../db");
const { isValidId, validateProjectInput } = require("../validators");

const router = express.Router();

// GET /api/projects - list all projects with a user story count
router.get("/", (req, res, next) => {
  try {
    const projects = db
      .prepare(
        `SELECT p.*, COUNT(s.id) AS userStoryCount
         FROM projects p
         LEFT JOIN user_stories s ON s.projectId = p.id
         GROUP BY p.id
         ORDER BY p.createdAt DESC`
      )
      .all();

    res.json(projects);
  } catch (err) {
    next(err);
  }
});

// POST /api/projects - create a project
router.post("/", (req, res, next) => {
  try {
    const errors = validateProjectInput(req.body);
    if (errors.length > 0) return res.status(400).json({ error: errors.join(", ") });

    const info = db
      .prepare("INSERT INTO projects (name, description, status) VALUES (?, ?, ?)")
      .run(req.body.name.trim(), req.body.description || "", req.body.status || "PLANNING");

    const project = db.prepare("SELECT * FROM projects WHERE id = ?").get(info.lastInsertRowid);
    res.status(201).json(project);
  } catch (err) {
    next(err);
  }
});

// GET /api/projects/:id - project details including the full hierarchy
router.get("/:id", (req, res, next) => {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ error: "Invalid project id" });

    const project = db.prepare("SELECT * FROM projects WHERE id = ?").get(req.params.id);
    if (!project) return res.status(404).json({ error: "Project not found" });

    const userStories = db
      .prepare("SELECT * FROM user_stories WHERE projectId = ? ORDER BY createdAt ASC")
      .all(project.id);

    const tasks = db
      .prepare(
        `SELECT t.* FROM tasks t
         JOIN user_stories s ON s.id = t.userStoryId
         WHERE s.projectId = ?
         ORDER BY t.createdAt ASC`
      )
      .all(project.id);

    project.userStories = userStories.map((story) => ({
      ...story,
      tasks: tasks.filter((task) => task.userStoryId === story.id),
    }));

    res.json(project);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/projects/:id - update a project
router.patch("/:id", (req, res, next) => {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ error: "Invalid project id" });

    const errors = validateProjectInput(req.body, { partial: true });
    if (errors.length > 0) return res.status(400).json({ error: errors.join(", ") });

    const existing = db.prepare("SELECT * FROM projects WHERE id = ?").get(req.params.id);
    if (!existing) return res.status(404).json({ error: "Project not found" });

    db.prepare(
      `UPDATE projects
       SET name = ?, description = ?, status = ?, updatedAt = datetime('now')
       WHERE id = ?`
    ).run(
      req.body.name !== undefined ? req.body.name.trim() : existing.name,
      req.body.description !== undefined ? req.body.description : existing.description,
      req.body.status !== undefined ? req.body.status : existing.status,
      req.params.id
    );

    const project = db.prepare("SELECT * FROM projects WHERE id = ?").get(req.params.id);
    res.json(project);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/projects/:id - delete a project (cascades to stories/tasks/jobs)
router.delete("/:id", (req, res, next) => {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ error: "Invalid project id" });

    const existing = db.prepare("SELECT * FROM projects WHERE id = ?").get(req.params.id);
    if (!existing) return res.status(404).json({ error: "Project not found" });

    db.prepare("DELETE FROM projects WHERE id = ?").run(req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

// POST /api/projects/:id/reports - enqueue a background "generate project report" job
router.post("/:id/reports", (req, res, next) => {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ error: "Invalid project id" });

    const project = db.prepare("SELECT * FROM projects WHERE id = ?").get(req.params.id);
    if (!project) return res.status(404).json({ error: "Project not found" });

    const info = db
      .prepare(
        `INSERT INTO background_jobs (type, status, projectId, payload)
         VALUES ('PROJECT_REPORT', 'PENDING', ?, ?)`
      )
      .run(project.id, JSON.stringify({ projectId: project.id }));

    // The API only enqueues the job here; the separate worker process
    // (src/worker.js) picks it up and does the actual work. This keeps the
    // request/response cycle fast regardless of how long the report takes.
    res.status(202).json({ jobId: info.lastInsertRowid, status: "PENDING" });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
