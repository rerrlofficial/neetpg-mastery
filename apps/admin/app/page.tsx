"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";

type Subject = {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
};

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [search, setSearch] = useState("");

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    loadSubjects();
  }, []);

  async function loadSubjects() {
    setLoading(true);
    setError("");

    const { data, error } = await supabase
      .from("subjects")
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSubjects(data ?? []);
    setLoading(false);
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setSuccess("");

    const trimmedName = name.trim();
    const trimmedDescription = description.trim();

    if (!trimmedName) {
      setError("Subject name is required.");
      return;
    }

    setSaving(true);

    if (editingId) {
      const { error } = await supabase
        .from("subjects")
        .update({
          name: trimmedName,
          description:
            trimmedDescription || null
        })
        .eq("id", editingId);

      if (error) {
        setError(error.message);
        setSaving(false);
        return;
      }

      setSuccess("Subject updated successfully.");
    } else {
      const { error } = await supabase
        .from("subjects")
        .insert({
          name: trimmedName,
          description:
            trimmedDescription || null
        });

      if (error) {
        if (error.code === "23505") {
          setError(
            "A subject with this name already exists."
          );
        } else {
          setError(error.message);
        }

        setSaving(false);
        return;
      }

      setSuccess("Subject added successfully.");
    }

    setName("");
    setDescription("");
    setEditingId(null);
    setSaving(false);

    await loadSubjects();
  }

  function startEdit(subject: Subject) {
    setEditingId(subject.id);
    setName(subject.name);
    setDescription(subject.description ?? "");
    setError("");
    setSuccess("");

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setName("");
    setDescription("");
    setError("");
    setSuccess("");
  }

  async function deleteSubject(subject: Subject) {
    const confirmed = window.confirm(
      `Delete "${subject.name}"?`
    );

    if (!confirmed) {
      return;
    }

    setError("");
    setSuccess("");

    const { error } = await supabase
      .from("subjects")
      .delete()
      .eq("id", subject.id);

    if (error) {
      setError(error.message);
      return;
    }

    setSuccess("Subject deleted successfully.");
    await loadSubjects();
  }

  const filteredSubjects = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return subjects;
    }

    return subjects.filter((subject) =>
      `${subject.name} ${
        subject.description ?? ""
      }`
        .toLowerCase()
        .includes(query)
    );
  }, [subjects, search]);

  return (
    <main style={styles.page}>
      <div style={styles.container}>

        <header style={styles.header}>
          <div>
            <p style={styles.eyebrow}>
              NEET-PG MASTER
            </p>

            <h1 style={styles.title}>
              Subjects
            </h1>

            <p style={styles.subtitle}>
              Manage the subjects used throughout your
              NEET-PG question bank.
            </p>
          </div>

          <a href="/" style={styles.backButton}>
            ← Dashboard
          </a>
        </header>

        <section style={styles.formCard}>
          <div style={styles.sectionHeader}>
            <div>
              <h2 style={styles.sectionTitle}>
                {editingId
                  ? "Edit Subject"
                  : "Add Subject"}
              </h2>

              <p style={styles.sectionSubtitle}>
                {editingId
                  ? "Update the selected subject."
                  : "Create a new NEET-PG subject."}
              </p>
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            style={styles.form}
          >
            <div style={styles.field}>
              <label style={styles.label}>
                Subject Name
              </label>

              <input
                value={name}
                onChange={(event) =>
                  setName(event.target.value)
                }
                placeholder="e.g. Anatomy"
                required
                style={styles.input}
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>
                Description
              </label>

              <textarea
                value={description}
                onChange={(event) =>
                  setDescription(event.target.value)
                }
                placeholder="Optional description"
                rows={3}
                style={styles.textarea}
              />
            </div>

            {error && (
              <div style={styles.error}>
                {error}
              </div>
            )}

            {success && (
              <div style={styles.success}>
                {success}
              </div>
            )}

            <div style={styles.formActions}>
              <button
                type="submit"
                disabled={saving}
                style={styles.primaryButton}
              >
                {saving
                  ? "Saving..."
                  : editingId
                    ? "Update Subject"
                    : "Add Subject"}
              </button>

              {editingId && (
                <button
                  type="button"
                  onClick={cancelEdit}
                  style={styles.secondaryButton}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </section>

        <section style={styles.listCard}>
          <div style={styles.listHeader}>
            <div>
              <h2 style={styles.sectionTitle}>
                Subject List
              </h2>

              <p style={styles.sectionSubtitle}>
                {subjects.length} subject
                {subjects.length === 1 ? "" : "s"}
              </p>
            </div>

            <input
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search subjects..."
              style={styles.searchInput}
            />
          </div>

          {loading ? (
            <div style={styles.empty}>
              Loading subjects...
            </div>
          ) : filteredSubjects.length === 0 ? (
            <div style={styles.empty}>
              {search
                ? "No subjects match your search."
                : "No subjects found."}
            </div>
          ) : (
            <div style={styles.subjectList}>
              {filteredSubjects.map((subject) => (
                <div
                  key={subject.id}
                  style={styles.subjectCard}
                >
                  <div style={styles.subjectInfo}>
                    <h3 style={styles.subjectName}>
                      {subject.name}
                    </h3>

                    <p style={styles.subjectDescription}>
                      {subject.description ||
                        "No description added."}
                    </p>
                  </div>

                  <div style={styles.subjectActions}>
                    <button
                      onClick={() =>
                        startEdit(subject)
                      }
                      style={styles.editButton}
                    >
                      Edit
                    </button>

                    <button
                      onClick={() =>
                        deleteSubject(subject)
                      }
                      style={styles.deleteButton}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

      </div>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#f5f7fb",
    color: "#172033",
    fontFamily: "Arial, sans-serif",
    padding: "24px"
  },

  container: {
    maxWidth: "1100px",
    margin: "0 auto"
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    flexWrap: "wrap",
    gap: "16px",
    marginBottom: "24px"
  },

  eyebrow: {
    margin: 0,
    color: "#2563eb",
    fontSize: "13px",
    fontWeight: 800,
    letterSpacing: "0.8px"
  },

  title: {
    margin: "7px 0 5px",
    fontSize: "32px"
  },

  subtitle: {
    margin: 0,
    color: "#64748b",
    lineHeight: 1.5
  },

  backButton: {
    display: "inline-block",
    textDecoration: "none",
    background: "#ffffff",
    color: "#334155",
    border: "1px solid #dbe3ef",
    borderRadius: "10px",
    padding: "11px 15px",
    fontWeight: 700
  },

  formCard: {
    background: "#ffffff",
    borderRadius: "20px",
    padding: "26px",
    boxShadow:
      "0 6px 24px rgba(15, 23, 42, 0.06)",
    marginBottom: "24px"
  },

  listCard: {
    background: "#ffffff",
    borderRadius: "20px",
    padding: "26px",
    boxShadow:
      "0 6px 24px rgba(15, 23, 42, 0.06)"
  },

  sectionHeader: {
    marginBottom: "20px"
  },

  sectionTitle: {
    margin: 0,
    fontSize: "21px"
  },

  sectionSubtitle: {
    margin: "6px 0 0",
    color: "#64748b",
    fontSize: "14px"
  },

  form: {
    display: "flex",
    flexDirection: "column",
    gap: "16px"
  },

  field: {
    display: "flex",
    flexDirection: "column",
    gap: "7px"
  },

  label: {
    fontSize: "13px",
    fontWeight: 700,
    color: "#334155"
  },

  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: "13px 14px",
    border: "1px solid #cbd5e1",
    borderRadius: "10px",
    background: "#ffffff",
    color: "#172033",
    fontSize: "15px"
  },

  textarea: {
    width: "100%",
    boxSizing: "border-box",
    padding: "13px 14px",
    border: "1px solid #cbd5e1",
    borderRadius: "10px",
    background: "#ffffff",
    color: "#172033",
    fontSize: "15px",
    resize: "vertical"
  },

  formActions: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px"
  },

  primaryButton: {
    border: "none",
    borderRadius: "10px",
    padding: "13px 18px",
    background: "#2563eb",
    color: "#ffffff",
    fontWeight: 800,
    cursor: "pointer"
  },

  secondaryButton: {
    border: "1px solid #dbe3ef",
    borderRadius: "10px",
    padding: "13px 18px",
    background: "#ffffff",
    color: "#334155",
    fontWeight: 700,
    cursor: "pointer"
  },

  error: {
    padding: "11px 13px",
    borderRadius: "9px",
    background: "#fef2f2",
    border: "1px solid #fecaca",
    color: "#b91c1c",
    fontSize: "13px"
  },

  success: {
    padding: "11px 13px",
    borderRadius: "9px",
    background: "#f0fdf4",
    border: "1px solid #bbf7d0",
    color: "#15803d",
    fontSize: "13px"
  },

  listHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "14px",
    marginBottom: "20px"
  },

  searchInput: {
    width: "260px",
    maxWidth: "100%",
    boxSizing: "border-box",
    padding: "11px 13px",
    border: "1px solid #cbd5e1",
    borderRadius: "10px",
    background: "#ffffff",
    color: "#172033",
    fontSize: "14px"
  },

  empty: {
    padding: "40px 20px",
    textAlign: "center",
    color: "#64748b"
  },

  subjectList: {
    display: "flex",
    flexDirection: "column",
    gap: "12px"
  },

  subjectCard: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "16px",
    flexWrap: "wrap",
    padding: "18px",
    border: "1px solid #e2e8f0",
    borderRadius: "14px"
  },

  subjectInfo: {
    minWidth: 0,
    flex: 1
  },

  subjectName: {
    margin: 0,
    fontSize: "17px"
  },

  subjectDescription: {
    margin: "6px 0 0",
    color: "#64748b",
    fontSize: "14px",
    lineHeight: 1.5
  },

  subjectActions: {
    display: "flex",
    gap: "8px",
    flexShrink: 0
  },

  editButton: {
    border: "1px solid #dbe3ef",
    borderRadius: "9px",
    padding: "9px 13px",
    background: "#ffffff",
    color: "#2563eb",
    fontWeight: 700,
    cursor: "pointer"
  },

  deleteButton: {
    border: "1px solid #fecaca",
    borderRadius: "9px",
    padding: "9px 13px",
    background: "#ffffff",
    color: "#dc2626",
    fontWeight: 700,
    cursor: "pointer"
  }
};
