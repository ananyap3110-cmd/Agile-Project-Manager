import { useEffect, useState } from "react";

const STORAGE_KEY = "theme";

function getInitialTheme() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved === "dark" || saved === "light") return saved;
  // Fall back to the user's OS preference if they haven't chosen yet.
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

// Applies the theme to <html data-theme="..."> so plain CSS variables
// (see style.css) can switch every color in the app at once.
function ThemeToggle() {
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  function toggle() {
    setTheme((t) => (t === "dark" ? "light" : "dark"));
  }

  return (
    <button className="theme-toggle" onClick={toggle} title="Toggle dark mode">
      {theme === "dark" ? "\u2600\ufe0f Light" : "\ud83c\udf19 Dark"}
    </button>
  );
}

export default ThemeToggle;
