// Entry point for the REST API. Run with: npm run server
require("dotenv").config();
require("./db"); // ensure tables exist before the server starts handling requests
const express = require("express");
const cors = require("cors");

const dashboardRoutes = require("./routes/dashboard");
const projectRoutes = require("./routes/projects");
const storyRoutes = require("./routes/stories");
const taskRoutes = require("./routes/tasks");
const jobRoutes = require("./routes/jobs");
const profileRoutes = require("./routes/profile");

const app = express();

app.use(cors());
app.use(express.json());

// Basic request logging so it's easy to see what's happening in the terminal.
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

app.get("/api/health", (req, res) => res.json({ status: "ok" }));

app.use("/api/dashboard", dashboardRoutes);
app.use("/api/projects", projectRoutes);
// storyRoutes/taskRoutes define their own full sub-paths (e.g. /projects/:id/stories,
// /stories/:id, /stories/:id/tasks, /tasks/:id) so they're mounted at /api directly.
app.use("/api", storyRoutes);
app.use("/api", taskRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/profile", profileRoutes);

// 404 handler for unknown routes
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Centralized error handler - keeps the error response shape consistent.
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Something went wrong on the server" });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`API server listening on http://localhost:${PORT}`);
});
