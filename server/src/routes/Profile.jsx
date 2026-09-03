import { useEffect, useState } from "react";
import { api } from "../api.js";

// A simple local profile page. There's no authentication in this app (see
// docs/DESIGN_DECISIONS.md), so this represents the one person using this
// local instance - not a multi-user account system.
function Profile() {
  const [form, setForm] = useState({ name: "", role: "", email: "", bio: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [savedMessage, setSavedMessage] = useState("");

  useEffect(() => {
    api
      .getProfile()
      .then((profile) => setForm({ name: profile.name, role: profile.role, email: profile.email, bio: profile.bio }))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  function updateField(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
    setSavedMessage("");
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await api.updateProfile(form);
      setSavedMessage("Saved.");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p>Loading profile...</p>;

  const initials = (form.name || "?")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");

  return (
    <div>
      <div className="page-header">
        <h2>Profile</h2>
      </div>

      {error && <p className="error-text">Error: {error}</p>}

      <div className="card profile-card">
        <div className="profile-avatar">{initials}</div>

        <form className="form profile-form" onSubmit={handleSave}>
          <label>
            Name
            <input value={form.name} onChange={(e) => updateField("name", e.target.value)} placeholder="Your name" />
          </label>
          <label>
            Role
            <input
              value={form.role}
              onChange={(e) => updateField("role", e.target.value)}
              placeholder="e.g. Team Lead, Contributor"
            />
          </label>
          <label>
            Email
            <input
              type="email"
              value={form.email}
              onChange={(e) => updateField("email", e.target.value)}
              placeholder="you@example.com"
            />
          </label>
          <label>
            Bio
            <textarea
              value={form.bio}
              onChange={(e) => updateField("bio", e.target.value)}
              rows={3}
              placeholder="A short note about yourself"
            />
          </label>

          <div className="profile-form-footer">
            <button className="btn btn-primary" type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save Profile"}
            </button>
            {savedMessage && <span className="muted small">{savedMessage}</span>}
          </div>
        </form>
      </div>
    </div>
  );
}

export default Profile;
