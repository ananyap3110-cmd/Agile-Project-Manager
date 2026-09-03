import { useEffect, useState } from "react";
import { api } from "../api.js";

const TASK_STATUS_LABELS = { TODO: "To Do", IN_PROGRESS: "In Progress", BLOCKED: "Blocked", DONE: "Done" };
const TASK_STATUS_COLORS = { TODO: "#6b7280", IN_PROGRESS: "#2f5d9f", BLOCKED: "#b3382c", DONE: "#2c7a43" };
const PROJECT_STATUS_LABELS = { PLANNING: "Planning", ACTIVE: "Active", COMPLETED: "Completed", ARCHIVED: "Archived" };
const PROJECT_STATUS_COLORS = { PLANNING: "#6b7280", ACTIVE: "#2c7a43", COMPLETED: "#2f5d9f", ARCHIVED: "#8a7a5f" };

function Dashboard({ onViewProjects, onOpenProject }) {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getDashboard()
      .then(setStats)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Loading dashboard...</p>;
  if (error) return <p className="error-text">Error: {error}</p>;

  const cards = [
    { label: "Total Projects", value: stats.totalProjects, icon: "\ud83d\udcc1", accent: "primary" },
    { label: "Total User Stories", value: stats.totalUserStories, icon: "\ud83d\udcdd", accent: "planning" },
    { label: "Open Tasks", value: stats.openTasks, icon: "\u2705", accent: "active" },
    { label: "Overdue Tasks", value: stats.overdueTasks, icon: "\u26a0\ufe0f", accent: "danger" },
  ];

  const totalTasks = Object.values(stats.taskStatusCounts).reduce((sum, n) => sum + n, 0);
  const totalProjectsForBar = Object.values(stats.projectStatusCounts).reduce((sum, n) => sum + n, 0);

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Dashboard</h2>
          <p className="muted">A quick look at how work is moving across every project.</p>
        </div>
        <button className="btn btn-primary" onClick={onViewProjects}>
          View Projects
        </button>
      </div>

      <div className="stat-grid">
        {cards.map((card) => (
          <div className={`stat-card stat-card-${card.accent}`} key={card.label}>
            <div className="stat-icon">{card.icon}</div>
            <div>
              <div className="stat-value">{card.value}</div>
              <div className="stat-label">{card.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="dashboard-columns">
        <div className="card dashboard-panel">
          <h3>Tasks by Status</h3>
          {totalTasks === 0 ? (
            <p className="muted small">No tasks yet.</p>
          ) : (
            <BreakdownBars
              counts={stats.taskStatusCounts}
              labels={TASK_STATUS_LABELS}
              colors={TASK_STATUS_COLORS}
              total={totalTasks}
            />
          )}
        </div>

        <div className="card dashboard-panel">
          <h3>Projects by Status</h3>
          {totalProjectsForBar === 0 ? (
            <p className="muted small">No projects yet.</p>
          ) : (
            <BreakdownBars
              counts={stats.projectStatusCounts}
              labels={PROJECT_STATUS_LABELS}
              colors={PROJECT_STATUS_COLORS}
              total={totalProjectsForBar}
            />
          )}
        </div>
      </div>

      <div className="dashboard-columns">
        <div className="card dashboard-panel">
          <h3>Needs Attention</h3>
          {stats.overdueTaskList.length === 0 ? (
            <p className="muted small">Nothing overdue right now. \ud83c\udf89</p>
          ) : (
            <ul className="dashboard-list">
              {stats.overdueTaskList.map((task) => (
                <li key={task.id} className="dashboard-list-item" onClick={() => onOpenProject(task.projectId)}>
                  <div>
                    <div className="dashboard-list-title">{task.title}</div>
                    <div className="muted small">
                      {task.projectName} &rsaquo; {task.storyTitle}
                    </div>
                  </div>
                  <span className={`badge badge-priority-${task.priority.toLowerCase()}`}>{task.priority}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card dashboard-panel">
          <h3>Recently Updated Projects</h3>
          {stats.recentProjects.length === 0 ? (
            <p className="muted small">No projects yet.</p>
          ) : (
            <ul className="dashboard-list">
              {stats.recentProjects.map((project) => (
                <li key={project.id} className="dashboard-list-item" onClick={() => onOpenProject(project.id)}>
                  <div>
                    <div className="dashboard-list-title">{project.name}</div>
                    <div className="muted small">
                      {project.userStoryCount} user stor{project.userStoryCount === 1 ? "y" : "ies"}
                    </div>
                  </div>
                  <span className={`badge badge-${project.status.toLowerCase()}`}>{project.status}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

// Renders one horizontal bar per status, each proportional to its share of
// the total. Plain CSS/inline styles - no charting library.
function BreakdownBars({ counts, labels, colors, total }) {
  return (
    <div className="breakdown-bars">
      {Object.entries(counts).map(([status, count]) => {
        const percent = total === 0 ? 0 : Math.round((count / total) * 100);
        return (
          <div className="breakdown-row" key={status}>
            <span className="breakdown-label">{labels[status]}</span>
            <div className="breakdown-track">
              <div
                className="breakdown-fill"
                style={{ width: `${percent}%`, backgroundColor: colors[status] }}
              />
            </div>
            <span className="breakdown-count muted small">{count}</span>
          </div>
        );
      })}
    </div>
  );
}

export default Dashboard;
