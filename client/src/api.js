// Small fetch helper shared by the whole app. Keeps API calls consistent
// (base URL, JSON headers, error handling) without needing a library.
const API_URL = import.meta.env.VITE_API_URL || "/api";

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  // 204 No Content has no body to parse.
  if (response.status === 204) return null;

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message = (data && data.error) || `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return data;
}

export const api = {
  // Dashboard
  getDashboard: () => request("/dashboard"),

  // Projects
  getProjects: () => request("/projects"),
  getProject: (id) => request(`/projects/${id}`),
  createProject: (data) => request("/projects", { method: "POST", body: JSON.stringify(data) }),
  updateProject: (id, data) => request(`/projects/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteProject: (id) => request(`/projects/${id}`, { method: "DELETE" }),
  generateReport: (id) => request(`/projects/${id}/reports`, { method: "POST" }),

  // User stories
  createStory: (projectId, data) =>
    request(`/projects/${projectId}/stories`, { method: "POST", body: JSON.stringify(data) }),
  updateStory: (id, data) => request(`/stories/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteStory: (id) => request(`/stories/${id}`, { method: "DELETE" }),

  // Tasks
  createTask: (storyId, data) =>
    request(`/stories/${storyId}/tasks`, { method: "POST", body: JSON.stringify(data) }),
  updateTask: (id, data) => request(`/tasks/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteTask: (id) => request(`/tasks/${id}`, { method: "DELETE" }),

  // Background jobs
  getJob: (id) => request(`/jobs/${id}`),

  // Profile (single local profile, no auth - see docs/DESIGN_DECISIONS.md)
  getProfile: () => request("/profile"),
  updateProfile: (data) => request("/profile", { method: "PATCH", body: JSON.stringify(data) }),
};
