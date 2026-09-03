import { useState } from "react";
import Dashboard from "./components/Dashboard.jsx";
import ProjectsList from "./components/ProjectsList.jsx";
import ProjectDetail from "./components/ProjectDetail.jsx";
import Profile from "./components/Profile.jsx";
import ThemeToggle from "./components/ThemeToggle.jsx";
import AssistantWidget from "./components/AssistantWidget.jsx";

// The whole app is four "pages" swapped by simple state - no router library
// needed for an app this size (see README "Design Decisions").
function App() {
  const [page, setPage] = useState("dashboard"); // "dashboard" | "projects" | "project" | "profile"
  const [selectedProjectId, setSelectedProjectId] = useState(null);

  function openProject(id) {
    setSelectedProjectId(id);
    setPage("project");
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Agile Project Manager</h1>
        <nav className="app-nav">
          <button
            className={page === "dashboard" ? "nav-link active" : "nav-link"}
            onClick={() => setPage("dashboard")}
          >
            Dashboard
          </button>
          <button
            className={page === "projects" || page === "project" ? "nav-link active" : "nav-link"}
            onClick={() => setPage("projects")}
          >
            Projects
          </button>
          <button
            className={page === "profile" ? "nav-link active" : "nav-link"}
            onClick={() => setPage("profile")}
          >
            Profile
          </button>
          <ThemeToggle />
        </nav>
      </header>

      <main className="app-main">
        {page === "dashboard" && <Dashboard onViewProjects={() => setPage("projects")} />}
        {page === "projects" && <ProjectsList onOpenProject={openProject} />}
        {page === "project" && selectedProjectId && (
          <ProjectDetail projectId={selectedProjectId} onBack={() => setPage("projects")} />
        )}
        {page === "profile" && <Profile />}
      </main>

      {/* Floating assistant available on every page. */}
      <AssistantWidget />
    </div>
  );
}

export default App;
