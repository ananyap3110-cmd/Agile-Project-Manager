import { useState } from "react";

// A simple, dependency-free "AI assistant" for clients with questions about
// the app. It's a keyword-matched FAQ bot, not a real LLM integration - see
// docs/DESIGN_DECISIONS.md for why (no API key/external service required,
// keeps the project's zero-extra-dependency philosophy, still genuinely
// useful for the small, fixed set of questions a client is likely to ask).
const FAQ = [
  {
    keywords: ["hierarchy", "structure", "organize", "project story task"],
    answer:
      "Work is organized as Project → User Story → Task. Each Project can have multiple User Stories, and each User Story can have multiple Tasks.",
  },
  {
    keywords: ["status", "state", "progress"],
    answer:
      "Projects can be Planning, Active, Completed, or Archived. User Stories can be Backlog, In Progress, or Done. Tasks can be To Do, In Progress, Blocked, or Done. You can change any status from its dropdown.",
  },
  {
    keywords: ["priority"],
    answer: "User Stories and Tasks each have a priority: Low, Medium, or High, shown as a colored badge.",
  },
  {
    keywords: ["overdue", "due date", "deadline"],
    answer:
      "A Task is flagged as overdue automatically if it has a due date in the past and its status isn't Done yet - you'll see it highlighted in the task table.",
  },
  {
    keywords: ["report", "generate report"],
    answer:
      "Click 'Generate Project Report' inside a project to get a summary of user story and task counts. It runs as a background job, so it may take a few seconds - you'll see its status update automatically.",
  },
  {
    keywords: ["dashboard"],
    answer:
      "The Dashboard shows totals across all projects: total projects, total user stories, open tasks, and overdue tasks.",
  },
  {
    keywords: ["delete", "remove"],
    answer:
      "You can delete a project, user story, or task using its Delete button. Deleting a project removes its user stories and tasks too, and deleting a user story removes its tasks - so use it carefully.",
  },
  {
    keywords: ["dark mode", "theme", "black"],
    answer: "Use the theme button in the top-right of the header to switch between light and dark mode.",
  },
  {
    keywords: ["profile", "account"],
    answer: "The Profile page lets you set a name, role, email, and short bio for this local instance of the app.",
  },
  {
    keywords: ["search", "filter", "find"],
    answer: "Use the search box on the Projects page to filter projects by name or description as you type.",
  },
];

const FALLBACK_ANSWER =
  "I'm a simple built-in assistant, so I can only answer questions about how this app works (projects, stories, tasks, statuses, reports, search, and so on). Try rephrasing, or ask about a specific feature.";

function findAnswer(question) {
  const lower = question.toLowerCase();
  const match = FAQ.find((entry) => entry.keywords.some((keyword) => lower.includes(keyword)));
  return match ? match.answer : FALLBACK_ANSWER;
}

function AssistantWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    { from: "bot", text: "Hi! Ask me anything about how this project management tool works." },
  ]);

  function handleSend(e) {
    e.preventDefault();
    const question = input.trim();
    if (!question) return;

    const answer = findAnswer(question);

    setMessages((prev) => [...prev, { from: "user", text: question }, { from: "bot", text: answer }]);
    setInput("");
  }

  return (
    <div className="assistant-widget">
      {open && (
        <div className="assistant-panel">
          <div className="assistant-header">
            <span>Assistant</span>
            <button className="assistant-close" onClick={() => setOpen(false)} aria-label="Close assistant">
              &times;
            </button>
          </div>

          <div className="assistant-messages">
            {messages.map((msg, i) => (
              <div key={i} className={`assistant-message assistant-message-${msg.from}`}>
                {msg.text}
              </div>
            ))}
          </div>

          <form className="assistant-input-row" onSubmit={handleSend}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question..."
              aria-label="Ask the assistant a question"
            />
            <button className="btn btn-primary" type="submit">
              Send
            </button>
          </form>
        </div>
      )}

      <button className="assistant-toggle" onClick={() => setOpen((v) => !v)} aria-label="Toggle assistant">
        {open ? "\u00d7" : "\ud83d\udcac"}
      </button>
    </div>
  );
}

export default AssistantWidget;
