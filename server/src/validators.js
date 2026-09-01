// Small, dependency-free validation helpers.
// Keeps validation logic simple and explicit instead of pulling in a library.

const PROJECT_STATUSES = ["PLANNING", "ACTIVE", "COMPLETED", "ARCHIVED"];
const STORY_STATUSES = ["BACKLOG", "IN_PROGRESS", "DONE"];
const TASK_STATUSES = ["TODO", "IN_PROGRESS", "BLOCKED", "DONE"];
const PRIORITIES = ["LOW", "MEDIUM", "HIGH"];

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function isValidId(value) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0;
}

function validateProjectInput(body, { partial = false } = {}) {
  const errors = [];

  if (!partial || body.name !== undefined) {
    if (!isNonEmptyString(body.name)) errors.push("name is required");
  }
  if (body.status !== undefined && !PROJECT_STATUSES.includes(body.status)) {
    errors.push(`status must be one of: ${PROJECT_STATUSES.join(", ")}`);
  }
  return errors;
}

function validateStoryInput(body, { partial = false } = {}) {
  const errors = [];

  if (!partial || body.title !== undefined) {
    if (!isNonEmptyString(body.title)) errors.push("title is required");
  }
  if (body.status !== undefined && !STORY_STATUSES.includes(body.status)) {
    errors.push(`status must be one of: ${STORY_STATUSES.join(", ")}`);
  }
  if (body.priority !== undefined && !PRIORITIES.includes(body.priority)) {
    errors.push(`priority must be one of: ${PRIORITIES.join(", ")}`);
  }
  return errors;
}

function validateTaskInput(body, { partial = false } = {}) {
  const errors = [];

  if (!partial || body.title !== undefined) {
    if (!isNonEmptyString(body.title)) errors.push("title is required");
  }
  if (body.status !== undefined && !TASK_STATUSES.includes(body.status)) {
    errors.push(`status must be one of: ${TASK_STATUSES.join(", ")}`);
  }
  if (body.priority !== undefined && !PRIORITIES.includes(body.priority)) {
    errors.push(`priority must be one of: ${PRIORITIES.join(", ")}`);
  }
  if (body.dueDate !== undefined && body.dueDate !== null) {
    const date = new Date(body.dueDate);
    if (Number.isNaN(date.getTime())) errors.push("dueDate must be a valid date");
  }
  return errors;
}

module.exports = {
  PROJECT_STATUSES,
  STORY_STATUSES,
  TASK_STATUSES,
  PRIORITIES,
  isNonEmptyString,
  isValidId,
  validateProjectInput,
  validateStoryInput,
  validateTaskInput,
};
