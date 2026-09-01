// Seed script: creates a handful of projects, user stories, and tasks so the
// app is useful immediately after setup. Run with: npm run seed
const db = require("./db");

function daysFromNow(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

function insertProject(name, description, status) {
  const info = db
    .prepare("INSERT INTO projects (name, description, status) VALUES (?, ?, ?)")
    .run(name, description, status);
  return info.lastInsertRowid;
}

function insertStory(projectId, title, description, status, priority) {
  const info = db
    .prepare(
      `INSERT INTO user_stories (projectId, title, description, status, priority)
       VALUES (?, ?, ?, ?, ?)`
    )
    .run(projectId, title, description, status, priority);
  return info.lastInsertRowid;
}

function insertTask(userStoryId, title, status, priority, dueDate) {
  db.prepare(
    `INSERT INTO tasks (userStoryId, title, status, priority, dueDate)
     VALUES (?, ?, ?, ?, ?)`
  ).run(userStoryId, title, status, priority, dueDate);
}

function main() {
  console.log("Clearing existing data...");
  db.exec("DELETE FROM background_jobs; DELETE FROM tasks; DELETE FROM user_stories; DELETE FROM projects;");
  // Reset autoincrement counters so seeded IDs stay small and predictable.
  db.exec("DELETE FROM sqlite_sequence WHERE name IN ('projects','user_stories','tasks','background_jobs');");

  console.log("Creating projects...");
  const website = insertProject(
    "Company Website Redesign",
    "Refresh the marketing site with a new design and CMS.",
    "ACTIVE"
  );
  const mobileApp = insertProject(
    "Mobile App v2",
    "Second major version of the team's mobile app.",
    "PLANNING"
  );
  const internalTools = insertProject(
    "Internal Tools Cleanup",
    "Pay down tech debt in internal admin tools.",
    "COMPLETED"
  );

  console.log("Creating user stories and tasks...");

  const homepageStory = insertStory(
    website,
    "As a visitor, I can view a redesigned homepage",
    "New hero section, updated navigation, and refreshed branding.",
    "IN_PROGRESS",
    "HIGH"
  );
  insertTask(homepageStory, "Design hero section mockup", "DONE", "HIGH", daysFromNow(-5));
  insertTask(homepageStory, "Implement responsive navigation", "IN_PROGRESS", "MEDIUM", daysFromNow(3));
  insertTask(homepageStory, "Write homepage copy", "TODO", "LOW", daysFromNow(-1)); // overdue on purpose

  const cmsStory = insertStory(
    website,
    "As an editor, I can manage page content in a CMS",
    "Replace hard-coded content with editable CMS pages.",
    "BACKLOG",
    "MEDIUM"
  );
  insertTask(cmsStory, "Evaluate headless CMS options", "TODO", "MEDIUM", daysFromNow(7));
  insertTask(cmsStory, "Set up staging environment", "BLOCKED", "LOW", daysFromNow(10));

  const onboardingStory = insertStory(
    mobileApp,
    "As a new user, I can complete onboarding in under a minute",
    "Simplify the onboarding flow to reduce drop-off.",
    "BACKLOG",
    "HIGH"
  );
  insertTask(onboardingStory, "Sketch new onboarding screens", "TODO", "HIGH", daysFromNow(5));
  insertTask(onboardingStory, "User-test current onboarding flow", "TODO", "MEDIUM", daysFromNow(-2)); // overdue

  const dashboardStory = insertStory(
    internalTools,
    "As an admin, I can view a health dashboard",
    "Basic dashboard showing system status for internal tools.",
    "DONE",
    "LOW"
  );
  insertTask(dashboardStory, "Build health check endpoint", "DONE", "LOW", daysFromNow(-20));
  insertTask(dashboardStory, "Add dashboard UI", "DONE", "LOW", daysFromNow(-18));

  console.log("Seed data created successfully.");
}

main();
