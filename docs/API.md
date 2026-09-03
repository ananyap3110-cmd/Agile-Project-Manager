# API Documentation

Base URL (local dev): `http://localhost:4000/api`

All request/response bodies are JSON. All errors use the shape:

```json
{ "error": "Human readable message" }
```

Status codes used: `200` OK, `201` Created, `202` Accepted (background job enqueued),
`204` No Content (successful delete), `400` invalid input, `404` not found, `500` unexpected error.

---

## Dashboard

### GET /api/dashboard
Returns summary data for the dashboard page: headline counts, status breakdowns, a short overdue
task list, and recently updated projects.

**Response 200**
```json
{
  "totalProjects": 3,
  "totalUserStories": 4,
  "openTasks": 6,
  "overdueTasks": 2,
  "taskStatusCounts": { "TODO": 4, "IN_PROGRESS": 1, "BLOCKED": 1, "DONE": 3 },
  "projectStatusCounts": { "PLANNING": 1, "ACTIVE": 1, "COMPLETED": 1, "ARCHIVED": 0 },
  "overdueTaskList": [
    {
      "id": 3,
      "title": "Write homepage copy",
      "dueDate": "2026-09-02T08:15:05.446Z",
      "priority": "LOW",
      "storyId": 1,
      "storyTitle": "As a visitor, I can view a redesigned homepage",
      "projectId": 1,
      "projectName": "Company Website Redesign"
    }
  ],
  "recentProjects": [
    {
      "id": 1,
      "name": "Company Website Redesign",
      "status": "ACTIVE",
      "userStoryCount": 2,
      "updatedAt": "2026-09-03 08:15:05"
    }
  ]
}
```
`overdueTaskList` and `recentProjects` are each capped at 5 items, most-urgent/most-recent first.

---

## Projects

### GET /api/projects
List all projects, each with a `userStoryCount`.

**Response 200**
```json
[
  {
    "id": 1,
    "name": "Company Website Redesign",
    "description": "Refresh the marketing site.",
    "status": "ACTIVE",
    "createdAt": "2026-08-31 18:57:13",
    "updatedAt": "2026-08-31 18:57:13",
    "userStoryCount": 2
  }
]
```

### POST /api/projects
Create a project.

**Request body**
```json
{ "name": "New Project", "description": "Optional", "status": "PLANNING" }
```
- `name` is required.
- `status` must be one of `PLANNING | ACTIVE | COMPLETED | ARCHIVED` (defaults to `PLANNING`).

**Response 201**: the created project.

### GET /api/projects/:id
Returns a project including its full hierarchy: `userStories`, each with nested `tasks`.

**Response 200**
```json
{
  "id": 1,
  "name": "Company Website Redesign",
  "description": "...",
  "status": "ACTIVE",
  "userStories": [
    {
      "id": 1,
      "title": "As a visitor, I can view a redesigned homepage",
      "status": "IN_PROGRESS",
      "priority": "HIGH",
      "tasks": [
        { "id": 1, "title": "Design hero section mockup", "status": "DONE", "priority": "HIGH", "dueDate": "2026-08-26T18:57:13.901Z" }
      ]
    }
  ]
}
```

**Response 404**: `{ "error": "Project not found" }`

### PATCH /api/projects/:id
Update any of `name`, `description`, `status`. Only send the fields you want to change.

### DELETE /api/projects/:id
Deletes the project and cascades to its user stories, tasks, and background jobs.
**Response 204**, empty body.

### POST /api/projects/:id/reports
Enqueues a background job that generates a project report (see "Background Worker" in the README).

**Response 202**
```json
{ "jobId": 7, "status": "PENDING" }
```

---

## User Stories

### GET /api/projects/:projectId/stories
List stories for a project, each with a `taskCount`.

### POST /api/projects/:projectId/stories
Create a story under a project.

**Request body**
```json
{ "title": "As a user, I can...", "description": "Optional", "status": "BACKLOG", "priority": "MEDIUM" }
```
- `title` is required.
- `status` must be one of `BACKLOG | IN_PROGRESS | DONE`.
- `priority` must be one of `LOW | MEDIUM | HIGH`.

### GET /api/stories/:id
Returns a single story with its `tasks`.

### PATCH /api/stories/:id
Update `title`, `description`, `status`, or `priority`.

### DELETE /api/stories/:id
Deletes the story and cascades to its tasks. **Response 204**.

---

## Tasks

### GET /api/stories/:storyId/tasks
List tasks for a user story.

### POST /api/stories/:storyId/tasks
Create a task under a user story.

**Request body**
```json
{ "title": "Build the thing", "description": "Optional", "status": "TODO", "priority": "MEDIUM", "dueDate": "2026-09-10" }
```
- `title` is required.
- `status` must be one of `TODO | IN_PROGRESS | BLOCKED | DONE`.
- `priority` must be one of `LOW | MEDIUM | HIGH`.
- `dueDate` is optional; must be a valid date string if provided.

### GET /api/tasks/:id
### PATCH /api/tasks/:id
Update `title`, `description`, `status`, `priority`, or `dueDate` (send `dueDate: null` to clear it).

### DELETE /api/tasks/:id
**Response 204**.

---

## Background Jobs

### GET /api/jobs/:id
Inspect a background job's status/result. Used by the frontend to poll after
calling `POST /api/projects/:id/reports`.

**Response 200**
```json
{
  "id": 7,
  "type": "PROJECT_REPORT",
  "status": "COMPLETED",
  "attempts": 1,
  "maxAttempts": 3,
  "payload": { "projectId": 1 },
  "result": {
    "projectId": 1,
    "projectName": "Company Website Redesign",
    "generatedAt": "2026-08-31T18:58:29.860Z",
    "userStoryCount": 2,
    "taskCount": 5,
    "completedTaskCount": 1,
    "incompleteTaskCount": 4
  },
  "error": null,
  "projectId": 1,
  "createdAt": "2026-08-31 18:58:27",
  "startedAt": "2026-08-31 18:58:29",
  "completedAt": "2026-08-31 18:58:29"
}
```

`status` is one of `PENDING | PROCESSING | COMPLETED | FAILED`.

---

## Profile

There's no authentication in this app (see `docs/DESIGN_DECISIONS.md`), so there is exactly one
local profile rather than per-user accounts.

### GET /api/profile
Returns the single profile row.

**Response 200**
```json
{
  "id": 1,
  "name": "Ananya",
  "role": "Team Lead",
  "email": "ananya@example.com",
  "bio": "Building things",
  "updatedAt": "2026-09-01 22:12:41"
}
```

### PATCH /api/profile
Update any of `name`, `role`, `email`, `bio`. Only send the fields you want to change.

**Response 200**: the updated profile.
