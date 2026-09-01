import { useEffect, useState } from "react";
import { api } from "../api.js";

const STORY_STATUSES = ["BACKLOG", "IN_PROGRESS", "DONE"];
const TASK_STATUSES = ["TODO", "IN_PROGRESS", "BLOCKED", "DONE"];
const PRIORITIES = ["LOW", "MEDIUM", "HIGH"];

function ProjectDetail({ projectId, onBack }) {
  const [project, setProject] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [showStoryForm, setShowStoryForm] = useState(false);

  function loadProject() {
    setLoading(true);
    api
      .getProject(projectId)
      .then(setProject)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(loadProject, [projectId]);

  if (loading) return <p>Loading project...</p>;
  if (error && !project) return <p className="error-text">Error: {error}</p>;
  if (!project) return null;

  return (
    <div>
      <button className="btn-link" onClick={onBack}>
        &larr; Back to Projects
      </button>

      <div className="page-header">
        <div>
          <h2>{project.name}</h2>
          <p className="muted">{project.description}</p>
        </div>
        <ReportButton projectId={project.id} />
      </div>

      {error && <p className="error-text">Error: {error}</p>}

      <div className="page-header">
        <h3>User Stories</h3>
        <button className="btn btn-primary" onClick={() => setShowStoryForm((v) => !v)}>
          {showStoryForm ? "Cancel" : "Add User Story"}
        </button>
      </div>

      {showStoryForm && (
        <AddStoryForm
          projectId={project.id}
          onCreated={() => {
            setShowStoryForm(false);
            loadProject();
          }}
          onError={setError}
        />
      )}

      {project.userStories.length === 0 ? (
        <p>No user stories yet. Add one to start breaking down the work.</p>
      ) : (
        <div className="story-list">
          {project.userStories.map((story) => (
            <StoryCard key={story.id} story={story} onChanged={loadProject} onError={setError} />
          ))}
        </div>
      )}
    </div>
  );
}

function AddStoryForm({ projectId, onCreated, onError }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim()) return;
    setSubmitting(true);
    try {
      await api.createStory(projectId, { title, description, priority });
      setTitle("");
      setDescription("");
      setPriority("MEDIUM");
      onCreated();
    } catch (err) {
      onError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="card form" onSubmit={handleSubmit}>
      <label>
        Title
        <input value={title} onChange={(e) => setTitle(e.target.value)} required />
      </label>
      <label>
        Description
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
      </label>
      <label>
        Priority
        <select value={priority} onChange={(e) => setPriority(e.target.value)}>
          {PRIORITIES.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </label>
      <button className="btn btn-primary" type="submit" disabled={submitting}>
        {submitting ? "Adding..." : "Add User Story"}
      </button>
    </form>
  );
}

function StoryCard({ story, onChanged, onError }) {
  const [expanded, setExpanded] = useState(true);
  const [showTaskForm, setShowTaskForm] = useState(false);

  async function handleStatusChange(e) {
    try {
      await api.updateStory(story.id, { status: e.target.value });
      onChanged();
    } catch (err) {
      onError(err.message);
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this user story and its tasks?")) return;
    try {
      await api.deleteStory(story.id);
      onChanged();
    } catch (err) {
      onError(err.message);
    }
  }

  return (
    <div className="card story-card">
      <div className="story-card-header" onClick={() => setExpanded((v) => !v)}>
        <span className="expand-icon">{expanded ? "\u25be" : "\u25b8"}</span>
        <h4>{story.title}</h4>
        <span className={`badge badge-priority-${story.priority.toLowerCase()}`}>{story.priority}</span>
        <span className="story-task-count muted small">
          {story.tasks.length} task{story.tasks.length === 1 ? "" : "s"}
        </span>
      </div>

      {expanded && (
        <div className="story-card-body">
          {story.description && <p className="muted">{story.description}</p>}

          <div className="story-card-controls">
            <label className="inline-label">
              Status
              <select value={story.status} onChange={handleStatusChange}>
                {STORY_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
            <button className="btn btn-secondary" onClick={() => setShowTaskForm((v) => !v)}>
              {showTaskForm ? "Cancel" : "Add Task"}
            </button>
            <button className="btn btn-danger" onClick={handleDelete}>
              Delete Story
            </button>
          </div>

          {showTaskForm && (
            <AddTaskForm
              storyId={story.id}
              onCreated={() => {
                setShowTaskForm(false);
                onChanged();
              }}
              onError={onError}
            />
          )}

          {story.tasks.length > 0 && (
            <table className="task-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Due Date</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {story.tasks.map((task) => (
                  <TaskRow key={task.id} task={task} onChanged={onChanged} onError={onError} />
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

function AddTaskForm({ storyId, onCreated, onError }) {
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [dueDate, setDueDate] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim()) return;
    setSubmitting(true);
    try {
      await api.createTask(storyId, { title, priority, dueDate: dueDate || null });
      setTitle("");
      setPriority("MEDIUM");
      setDueDate("");
      onCreated();
    } catch (err) {
      onError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="card form inline-form" onSubmit={handleSubmit}>
      <label>
        Title
        <input value={title} onChange={(e) => setTitle(e.target.value)} required />
      </label>
      <label>
        Priority
        <select value={priority} onChange={(e) => setPriority(e.target.value)}>
          {PRIORITIES.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </label>
      <label>
        Due Date
        <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
      </label>
      <button className="btn btn-primary" type="submit" disabled={submitting}>
        {submitting ? "Adding..." : "Add Task"}
      </button>
    </form>
  );
}

function TaskRow({ task, onChanged, onError }) {
  const isOverdue = task.dueDate && task.status !== "DONE" && new Date(task.dueDate) < new Date();

  async function handleStatusChange(e) {
    try {
      await api.updateTask(task.id, { status: e.target.value });
      onChanged();
    } catch (err) {
      onError(err.message);
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this task?")) return;
    try {
      await api.deleteTask(task.id);
      onChanged();
    } catch (err) {
      onError(err.message);
    }
  }

  return (
    <tr className={isOverdue ? "overdue-row" : ""}>
      <td>{task.title}</td>
      <td>
        <select value={task.status} onChange={handleStatusChange}>
          {TASK_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </td>
      <td>
        <span className={`badge badge-priority-${task.priority.toLowerCase()}`}>{task.priority}</span>
      </td>
      <td>
        {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "-"}
        {isOverdue && <span className="overdue-tag"> Overdue</span>}
      </td>
      <td>
        <button className="btn-link btn-link-danger" onClick={handleDelete}>
          Delete
        </button>
      </td>
    </tr>
  );
}

function ReportButton({ projectId }) {
  const [job, setJob] = useState(null);
  const [error, setError] = useState("");
  const [starting, setStarting] = useState(false);

  // Poll the job while it's pending/processing, so the user can see the
  // background worker pick it up and complete it without refreshing.
  useEffect(() => {
    if (!job || job.status === "COMPLETED" || job.status === "FAILED") return;

    const timer = setInterval(async () => {
      try {
        const updated = await api.getJob(job.id);
        setJob(updated);
      } catch (err) {
        setError(err.message);
      }
    }, 1500);

    return () => clearInterval(timer);
  }, [job]);

  async function handleGenerate() {
    setStarting(true);
    setError("");
    setJob(null);
    try {
      const { jobId } = await api.generateReport(projectId);
      const created = await api.getJob(jobId);
      setJob(created);
    } catch (err) {
      setError(err.message);
    } finally {
      setStarting(false);
    }
  }

  return (
    <div className="report-panel">
      <button className="btn btn-secondary" onClick={handleGenerate} disabled={starting}>
        {starting ? "Starting..." : "Generate Project Report"}
      </button>

      {error && <p className="error-text small">{error}</p>}

      {job && (
        <div className="job-status">
          <p>
            Job #{job.id}: <strong>{job.status}</strong>
          </p>
          {job.status === "COMPLETED" && job.result && (
            <ul className="report-result">
              <li>User stories: {job.result.userStoryCount}</li>
              <li>Total tasks: {job.result.taskCount}</li>
              <li>Completed tasks: {job.result.completedTaskCount}</li>
              <li>Incomplete tasks: {job.result.incompleteTaskCount}</li>
            </ul>
          )}
          {job.status === "FAILED" && <p className="error-text small">Error: {job.error}</p>}
        </div>
      )}
    </div>
  );
}

export default ProjectDetail;
