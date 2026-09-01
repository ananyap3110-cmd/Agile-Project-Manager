const express = require("express");
const db = require("../db");
const { isValidId } = require("../validators");

const router = express.Router();

// GET /api/jobs/:id - inspect a background job's status/result
router.get("/:id", (req, res, next) => {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ error: "Invalid job id" });

    const job = db.prepare("SELECT * FROM background_jobs WHERE id = ?").get(req.params.id);
    if (!job) return res.status(404).json({ error: "Job not found" });

    res.json({
      ...job,
      payload: safeParse(job.payload),
      result: safeParse(job.result),
    });
  } catch (err) {
    next(err);
  }
});

function safeParse(value) {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

module.exports = router;
