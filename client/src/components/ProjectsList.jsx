import { useEffect, useState } from "react";
import { api } from "../api.js";

const STATUS_OPTIONS = ["PLANNING", "ACTIVE", "COMPLETED", "ARCHIVED"];

function ProjectsList({ onOpenProject }) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  function loadProjects() {
    setLoading(true);
    api
      .getProjects()
      .then(setProjects)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(loadProjects, []);

  const filteredProjects = projects.filter((project) => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return true;
    return (
      project.name.toLowerCase().includes(term) ||
      (project.description || "").toLowerCase().includes(term)
    );
  });

  async function handleCreate(e) {
    e.preventDefault();
    if (!name.trim()) return;

    setSubmitting(true);
    setError("");
    try {
      await api.createProject({ name, description });
      setName("");
      setDescription("");
      setShowForm(false);
      loadProjects();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Delete this project and everything inside it?")) return;
    try {
      await api.deleteProject(id);
      loadProjects();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <div className="page-header">
        <h2>Projects</h2>
        <button className="btn btn-primary" onClick={() => setShowForm((v) => !v)}>
          {showForm ? "Cancel" : "New Project"}
        </button>
      </div>

      {error && <p className="error-text">Error: {error}</p>}

      <input
        className="search-input"
        type="text"
        placeholder="Search projects by name or description..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        aria-label="Search projects"
      />

      {showForm && (
        <form className="card form" onSubmit={handleCreate}>
          <label>
            Name
            <input value={name} onChange={(e) => setName(e.target.value)} required />
          </label>
          <label>
            Description
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
          </label>
          <button className="btn btn-primary" type="submit" disabled={submitting}>
            {submitting ? "Creating..." : "Create Project"}
          </button>
        </form>
      )}

      {loading ? (
        <p>Loading projects...</p>
      ) : projects.length === 0 ? (
        <p>No projects yet. Create one to get started.</p>
      ) : filteredProjects.length === 0 ? (
        <p>No projects match "{searchTerm}".</p>
      ) : (
        <div className="card-list">
          {filteredProjects.map((project) => (
            <div className="card project-card" key={project.id}>
              <div className="project-card-main" onClick={() => onOpenProject(project.id)}>
                <div className="project-card-title-row">
                  <h3>{project.name}</h3>
                  <span className={`badge badge-${project.status.toLowerCase()}`}>{project.status}</span>
                </div>
                {project.description && <p className="muted">{project.description}</p>}
                <p className="muted small">{project.userStoryCount} user stor{project.userStoryCount === 1 ? "y" : "ies"}</p>
              </div>
              <div className="project-card-actions">
                <StatusSelect project={project} onChanged={loadProjects} onError={setError} />
                <button className="btn btn-secondary" onClick={() => onOpenProject(project.id)}>
                  Open
                </button>
                <button className="btn btn-danger" onClick={() => handleDelete(project.id)}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatusSelect({ project, onChanged, onError }) {
  async function handleChange(e) {
    try {
      await api.updateProject(project.id, { status: e.target.value });
      onChanged();
    } catch (err) {
      onError(err.message);
    }
  }

  return (
    <select value={project.status} onChange={handleChange} className="status-select">
      {STATUS_OPTIONS.map((status) => (
        <option key={status} value={status}>
          {status}
        </option>
      ))}
    </select>
  );
}

export default ProjectsList;
