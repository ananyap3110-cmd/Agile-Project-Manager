import { useEffect, useState } from "react";
import { api } from "../api.js";

function Dashboard({ onViewProjects }) {
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
    { label: "Total Projects", value: stats.totalProjects },
    { label: "Total User Stories", value: stats.totalUserStories },
    { label: "Open Tasks", value: stats.openTasks },
    { label: "Overdue Tasks", value: stats.overdueTasks },
  ];

  return (
    <div>
      <div className="page-header">
        <h2>Dashboard</h2>
        <button className="btn btn-primary" onClick={onViewProjects}>
          View Projects
        </button>
      </div>

      <div className="stat-grid">
        {cards.map((card) => (
          <div className="stat-card" key={card.label}>
            <div className="stat-value">{card.value}</div>
            <div className="stat-label">{card.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Dashboard;
