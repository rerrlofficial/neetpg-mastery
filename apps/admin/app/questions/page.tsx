"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";

type Question = {
  id: string;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: "A" | "B" | "C" | "D";
  explanation: string | null;
  subject: string | null;
  unit: string | null;
  subunit: string | null;
  topic: string | null;
  image_url: string | null;
  created_at: string;
};

type EditForm = {
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: "A" | "B" | "C" | "D";
  explanation: string;
  subject: string;
  unit: string;
  subunit: string;
  topic: string;
  image_url: string;
};

export default function QuestionBankPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [availableSubjects, setAvailableSubjects] = useState<string[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("All");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditForm | null>(null);

  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function loadQuestions() {
    setLoading(true);
    setError("");

    const { data, error: fetchError } = await supabase
      .from("questions")
      .select("*")
      .order("created_at", { ascending: false });

    if (fetchError) {
      setError(fetchError.message);
      setQuestions([]);
    } else {
      setQuestions((data || []) as Question[]);
    }

    setLoading(false);
  }

  async function loadSubjects() {
    const { data, error: fetchError } = await supabase
      .from("subjects")
      .select("name")
      .order("name", { ascending: true });

    if (fetchError) {
      setError(fetchError.message);
      return;
    }

    setAvailableSubjects(
      (data || []).map((item) => item.name)
    );
  }

  useEffect(() => {
    loadQuestions();
    loadSubjects();
  }, []);

  const subjects = useMemo(() => {
    const uniqueSubjects = new Set<string>(
      availableSubjects
    );

    questions.forEach((item) => {
      if (item.subject) {
        uniqueSubjects.add(item.subject);
      }
    });

    return [
      "All",
      ...Array.from(uniqueSubjects).sort(),
    ];
  }, [questions, availableSubjects]);

  const filteredQuestions = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    return questions.filter((item) => {
      const matchesSubject =
        subjectFilter === "All" ||
        item.subject === subjectFilter;

      if (!matchesSubject) {
        return false;
      }

      if (!searchValue) {
        return true;
      }

      const searchableText = [
        item.question,
        item.option_a,
        item.option_b,
        item.option_c,
        item.option_d,
        item.explanation || "",
        item.subject || "",
        item.unit || "",
        item.subunit || "",
        item.topic || "",
      ]
        .join(" ")
        .toLowerCase();

      return searchableText.includes(searchValue);
    });
  }, [questions, search, subjectFilter]);

  function startEditing(item: Question) {
    setEditingId(item.id);

    setEditForm({
      question: item.question,
      option_a: item.option_a,
      option_b: item.option_b,
      option_c: item.option_c,
      option_d: item.option_d,
      correct_answer: item.correct_answer,
      explanation: item.explanation || "",
      subject: item.subject || "",
      unit: item.unit || "",
      subunit: item.subunit || "",
      topic: item.topic || "",
      image_url: item.image_url || "",
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function cancelEditing() {
    setEditingId(null);
    setEditForm(null);
  }

  async function saveEdit() {
    if (!editingId || !editForm) {
      return;
    }

    if (
      !editForm.question.trim() ||
      !editForm.option_a.trim() ||
      !editForm.option_b.trim() ||
      !editForm.option_c.trim() ||
      !editForm.option_d.trim()
    ) {
      alert(
        "Question and all four options are required."
      );
      return;
    }

    setSaving(true);

    const { error: updateError } = await supabase
      .from("questions")
      .update({
        question: editForm.question.trim(),
        option_a: editForm.option_a.trim(),
        option_b: editForm.option_b.trim(),
        option_c: editForm.option_c.trim(),
        option_d: editForm.option_d.trim(),
        correct_answer: editForm.correct_answer,
        explanation:
          editForm.explanation.trim() || null,
        subject:
          editForm.subject.trim() || null,
        unit:
          editForm.unit.trim() || null,
        subunit:
          editForm.subunit.trim() || null,
        topic:
          editForm.topic.trim() || null,
        image_url:
          editForm.image_url.trim() || null,
      })
      .eq("id", editingId);

    setSaving(false);

    if (updateError) {
      alert(
        `Update failed: ${updateError.message}`
      );
      return;
    }

    cancelEditing();
    await loadQuestions();
  }

  async function deleteQuestion(id: string) {
    const confirmed = window.confirm(
      "Are you sure you want to permanently delete this question?\n\nThis action cannot be undone."
    );

    if (!confirmed) {
      return;
    }

    setDeletingId(id);

    const { error: deleteError } = await supabase
      .from("questions")
      .delete()
      .eq("id", id);

    setDeletingId(null);

    if (deleteError) {
      alert(
        `Delete failed: ${deleteError.message}`
      );
      return;
    }

    if (editingId === id) {
      cancelEditing();
    }

    await loadQuestions();
  }

  function updateEditField(
    field: keyof EditForm,
    value: string
  ) {
    if (!editForm) {
      return;
    }

    setEditForm({
      ...editForm,
      [field]: value,
    } as EditForm);
  }

  return (
    <main style={styles.page}>
      <div style={styles.container}>

        <div style={styles.header}>
          <div>
            <div style={styles.eyebrow}>
              NEET-PG MASTER
            </div>

            <h1 style={styles.title}>
              Question Bank
            </h1>

            <p style={styles.subtitle}>
              Manage, edit and review your NEET-PG
              questions.
            </p>
          </div>

          <div style={styles.headerActions}>
            <a
              href="/"
              style={styles.secondaryButton}
            >
              Dashboard
            </a>

            <a
              href="/upload"
              style={styles.primaryButton}
            >
              + Upload Questions
            </a>
          </div>
        </div>

        {editingId && editForm && (
          <section style={styles.editCard}>
            <div style={styles.editHeader}>
              <div>
                <h2 style={styles.editTitle}>
                  Edit Question
                </h2>

                <p style={styles.editSubtitle}>
                  Modify the question and save your
                  changes.
                </p>
              </div>

              <button
                onClick={cancelEditing}
                style={styles.cancelButton}
                disabled={saving}
              >
                Cancel
              </button>
            </div>

            <div style={styles.editGrid}>

              <div style={styles.fullField}>
                <label style={styles.label}>
                  Question *
                </label>

                <textarea
                  value={editForm.question}
                  onChange={(e) =>
                    updateEditField(
                      "question",
                      e.target.value
                    )
                  }
                  style={styles.textarea}
                  rows={4}
                />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>
                  Option A *
                </label>

                <input
                  value={editForm.option_a}
                  onChange={(e) =>
                    updateEditField(
                      "option_a",
                      e.target.value
                    )
                  }
                  style={styles.input}
                />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>
                  Option B *
                </label>

                <input
                  value={editForm.option_b}
                  onChange={(e) =>
                    updateEditField(
                      "option_b",
                      e.target.value
                    )
                  }
                  style={styles.input}
                />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>
                  Option C *
                </label>

                <input
                  value={editForm.option_c}
                  onChange={(e) =>
                    updateEditField(
                      "option_c",
                      e.target.value
                    )
                  }
                  style={styles.input}
                />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>
                  Option D *
                </label>

                <input
                  value={editForm.option_d}
                  onChange={(e) =>
                    updateEditField(
                      "option_d",
                      e.target.value
                    )
                  }
                  style={styles.input}
                />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>
                  Correct Answer *
                </label>

                <select
                  value={editForm.correct_answer}
                  onChange={(e) =>
                    updateEditField(
                      "correct_answer",
                      e.target.value
                    )
                  }
                  style={styles.input}
                >
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                  <option value="D">D</option>
                </select>
              </div>

              <div style={styles.field}>
                <label style={styles.label}>
                  Subject
                </label>

                <select
                  value={editForm.subject}
                  onChange={(e) =>
                    updateEditField(
                      "subject",
                      e.target.value
                    )
                  }
                  style={styles.input}
                >
                  <option value="">
                    Select subject
                  </option>

                  {availableSubjects.map(
                    (subject) => (
                      <option
                        key={subject}
                        value={subject}
                      >
                        {subject}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div style={styles.field}>
                <label style={styles.label}>
                  Unit
                </label>

                <input
                  value={editForm.unit}
                  onChange={(e) =>
                    updateEditField(
                      "unit",
                      e.target.value
                    )
                  }
                  style={styles.input}
                />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>
                  Subunit
                </label>

                <input
                  value={editForm.subunit}
                  onChange={(e) =>
                    updateEditField(
                      "subunit",
                      e.target.value
                    )
                  }
                  style={styles.input}
                />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>
                  Topic
                </label>

                <input
                  value={editForm.topic}
                  onChange={(e) =>
                    updateEditField(
                      "topic",
                      e.target.value
                    )
                  }
                  style={styles.input}
                />
              </div>

              <div style={styles.fullField}>
                <label style={styles.label}>
                  Explanation
                </label>

                <textarea
                  value={editForm.explanation}
                  onChange={(e) =>
                    updateEditField(
                      "explanation",
                      e.target.value
                    )
                  }
                  style={styles.textarea}
                  rows={5}
                />
              </div>

              <div style={styles.fullField}>
                <label style={styles.label}>
                  Image URL
                </label>

                <input
                  value={editForm.image_url}
                  onChange={(e) =>
                    updateEditField(
                      "image_url",
                      e.target.value
                    )
                  }
                  style={styles.input}
                  placeholder="https://..."
                />
              </div>

            </div>

            <button
              onClick={saveEdit}
              disabled={saving}
              style={styles.saveButton}
            >
              {saving
                ? "Saving..."
                : "Save Changes"}
            </button>
          </section>
        )}

        <section style={styles.statsGrid}>

          <div style={styles.statCard}>
            <div style={styles.statLabel}>
              Total Questions
            </div>

            <div style={styles.statNumber}>
              {questions.length}
            </div>
          </div>

          <div style={styles.statCard}>
            <div style={styles.statLabel}>
              Showing
            </div>

            <div style={styles.statNumber}>
              {filteredQuestions.length}
            </div>
          </div>

          <div style={styles.statCard}>
            <div style={styles.statLabel}>
              Subjects
            </div>

            <div style={styles.statNumber}>
              {Math.max(
                subjects.length - 1,
                0
              )}
            </div>
          </div>

        </section>

        <section style={styles.filterCard}>
          <div style={styles.filterGrid}>

            <div style={styles.field}>
              <label style={styles.label}>
                Search
              </label>

              <input
                type="text"
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                placeholder="Search question, topic, explanation..."
                style={styles.input}
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>
                Subject
              </label>

              <select
                value={subjectFilter}
                onChange={(e) =>
                  setSubjectFilter(
                    e.target.value
                  )
                }
                style={styles.input}
              >
                {subjects.map((subject) => (
                  <option
                    key={subject}
                    value={subject}
                  >
                    {subject}
                  </option>
                ))}
              </select>
            </div>

          </div>
        </section>

        {loading && (
          <section style={styles.messageCard}>
            Loading questions...
          </section>
        )}

        {error && (
          <section style={styles.errorCard}>
            <strong>
              Unable to load questions
            </strong>

            <p style={styles.errorText}>
              {error}
            </p>

            <button
              onClick={loadQuestions}
              style={styles.retryButton}
            >
              Try Again
            </button>
          </section>
        )}

        {!loading &&
          !error &&
          filteredQuestions.length === 0 && (
            <section style={styles.messageCard}>
              No questions match your current
              search/filter.
            </section>
          )}

        {!loading &&
          !error &&
          filteredQuestions.length > 0 && (
            <div style={styles.questionList}>

              {filteredQuestions.map(
                (item, index) => (
                  <article
                    key={item.id}
                    style={styles.questionCard}
                  >

                    <div style={styles.questionTop}>
                      <span
                        style={
                          styles.questionNumber
                        }
                      >
                        Q{index + 1}
                      </span>

                      <div style={styles.tags}>

                        {item.subject && (
                          <span style={styles.tag}>
                            {item.subject}
                          </span>
                        )}

                        {item.unit && (
                          <span style={styles.tag}>
                            {item.unit}
                          </span>
                        )}

                        {item.topic && (
                          <span style={styles.tag}>
                            {item.topic}
                          </span>
                        )}

                      </div>
                    </div>

                    <h2 style={styles.question}>
                      {item.question}
                    </h2>

                    <div style={styles.options}>

                      <div
                        style={{
                          ...styles.option,
                          ...(item.correct_answer ===
                          "A"
                            ? styles.correctOption
                            : {}),
                        }}
                      >
                        <strong>A.</strong>{" "}
                        {item.option_a}
                      </div>

                      <div
                        style={{
                          ...styles.option,
                          ...(item.correct_answer ===
                          "B"
                            ? styles.correctOption
                            : {}),
                        }}
                      >
                        <strong>B.</strong>{" "}
                        {item.option_b}
                      </div>

                      <div
                        style={{
                          ...styles.option,
                          ...(item.correct_answer ===
                          "C"
                            ? styles.correctOption
                            : {}),
                        }}
                      >
                        <strong>C.</strong>{" "}
                        {item.option_c}
                      </div>

                      <div
                        style={{
                          ...styles.option,
                          ...(item.correct_answer ===
                          "D"
                            ? styles.correctOption
                            : {}),
                        }}
                      >
                        <strong>D.</strong>{" "}
                        {item.option_d}
                      </div>

                    </div>

                    <div style={styles.answerBox}>
                      <strong>
                        Correct Answer:{" "}
                        {item.correct_answer}
                      </strong>
                    </div>

                    {item.explanation && (
                      <details
                        style={styles.explanation}
                      >
                        <summary
                          style={styles.summary}
                        >
                          View Explanation
                        </summary>

                        <p
                          style={
                            styles.explanationText
                          }
                        >
                          {item.explanation}
                        </p>
                      </details>
                    )}

                    <div style={styles.metadata}>

                      {item.subunit && (
                        <span>
                          Subunit:{" "}
                          {item.subunit}
                        </span>
                      )}

                      {item.topic && (
                        <span>
                          Topic: {item.topic}
                        </span>
                      )}

                    </div>

                    <div
                      style={
                        styles.managementBar
                      }
                    >

                      <button
                        onClick={() =>
                          startEditing(item)
                        }
                        style={styles.editButton}
                      >
                        ✏️ Edit
                      </button>

                      <button
                        onClick={() =>
                          deleteQuestion(
                            item.id
                          )
                        }
                        disabled={
                          deletingId ===
                          item.id
                        }
                        style={
                          styles.deleteButton
                        }
                      >
                        {deletingId ===
                        item.id
                          ? "Deleting..."
                          : "🗑️ Delete"}
                      </button>

                    </div>

                  </article>
                )
              )}

            </div>
          )}

      </div>
    </main>
  );
}

const styles: Record<
  string,
  React.CSSProperties
> = {
  page: {
    minHeight: "100vh",
    background: "#f5f7fb",
    padding: "32px 16px",
    color: "#172033",
  },

  container: {
    maxWidth: "1200px",
    margin: "0 auto",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "20px",
    flexWrap: "wrap",
    marginBottom: "24px",
  },

  eyebrow: {
    fontSize: "12px",
    fontWeight: 800,
    letterSpacing: "1.5px",
    color: "#2563eb",
    marginBottom: "8px",
  },

  title: {
    margin: 0,
    fontSize: "34px",
    fontWeight: 800,
  },

  subtitle: {
    margin: "8px 0 0",
    color: "#64748b",
  },

  headerActions: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
  },

  primaryButton: {
    padding: "12px 16px",
    borderRadius: "10px",
    background: "#2563eb",
    color: "#ffffff",
    textDecoration: "none",
    fontWeight: 700,
    fontSize: "14px",
  },

  secondaryButton: {
    padding: "12px 16px",
    borderRadius: "10px",
    background: "#ffffff",
    border: "1px solid #dbe3ef",
    color: "#334155",
    textDecoration: "none",
    fontWeight: 700,
    fontSize: "14px",
  },

  statsGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "16px",
    marginBottom: "20px",
  },

  statCard: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "16px",
    padding: "18px",
  },

  statLabel: {
    color: "#64748b",
    fontSize: "13px",
    fontWeight: 600,
  },

  statNumber: {
    fontSize: "28px",
    fontWeight: 800,
    marginTop: "6px",
  },

  filterCard: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "16px",
    padding: "20px",
    marginBottom: "20px",
  },

  filterGrid: {
    display: "grid",
    gridTemplateColumns:
      "minmax(0, 2fr) minmax(180px, 1fr)",
    gap: "16px",
  },

  editCard: {
    background: "#ffffff",
    border: "2px solid #2563eb",
    borderRadius: "16px",
    padding: "22px",
    marginBottom: "24px",
  },

  editHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "15px",
    marginBottom: "20px",
  },

  editTitle: {
    margin: 0,
    fontSize: "22px",
  },

  editSubtitle: {
    margin: "5px 0 0",
    color: "#64748b",
  },

  editGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "16px",
  },

  fullField: {
    gridColumn: "1 / -1",
    display: "flex",
    flexDirection: "column",
    gap: "7px",
  },

  field: {
    display: "flex",
    flexDirection: "column",
    gap: "7px",
  },

  label: {
    fontSize: "13px",
    fontWeight: 700,
    color: "#334155",
  },

  input: {
    width: "100%",
    padding: "12px",
    borderRadius: "10px",
    border: "1px solid #cbd5e1",
    background: "#ffffff",
    color: "#172033",
    fontSize: "14px",
    boxSizing: "border-box",
  },

  textarea: {
    width: "100%",
    padding: "12px",
    borderRadius: "10px",
    border: "1px solid #cbd5e1",
    background: "#ffffff",
    color: "#172033",
    fontSize: "14px",
    resize: "vertical",
    fontFamily: "inherit",
    lineHeight: 1.5,
    boxSizing: "border-box",
  },

  saveButton: {
    marginTop: "20px",
    padding: "12px 18px",
    border: "none",
    borderRadius: "10px",
    background: "#16a34a",
    color: "#ffffff",
    fontWeight: 800,
    cursor: "pointer",
  },

  cancelButton: {
    padding: "10px 14px",
    borderRadius: "9px",
    border: "1px solid #cbd5e1",
    background: "#ffffff",
    color: "#334155",
    fontWeight: 700,
    cursor: "pointer",
  },

  questionList: {
    display: "flex",
    flexDirection: "column",
    gap: "18px",
  },

  questionCard: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "16px",
    padding: "22px",
    boxShadow:
      "0 6px 20px rgba(15, 23, 42, 0.04)",
  },

  questionTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    flexWrap: "wrap",
    marginBottom: "14px",
  },

  questionNumber: {
    fontWeight: 800,
    color: "#2563eb",
  },

  tags: {
    display: "flex",
    gap: "6px",
    flexWrap: "wrap",
  },

  tag: {
    padding: "5px 9px",
    borderRadius: "999px",
    background: "#eff6ff",
    color: "#1d4ed8",
    fontSize: "11px",
    fontWeight: 700,
  },

  question: {
    margin: "0 0 18px",
    fontSize: "18px",
    lineHeight: 1.5,
  },

  options: {
    display: "grid",
    gap: "9px",
  },

  option: {
    padding: "12px 14px",
    borderRadius: "10px",
    border: "1px solid #e2e8f0",
    background: "#f8fafc",
    lineHeight: 1.5,
  },

  correctOption: {
    border: "1px solid #86efac",
    background: "#f0fdf4",
  },

  answerBox: {
    marginTop: "14px",
    padding: "11px 13px",
    borderRadius: "10px",
    background: "#ecfdf5",
    color: "#047857",
    fontSize: "14px",
  },

  explanation: {
    marginTop: "14px",
    borderTop: "1px solid #e2e8f0",
    paddingTop: "14px",
  },

  summary: {
    cursor: "pointer",
    fontWeight: 700,
    color: "#334155",
  },

  explanationText: {
    color: "#475569",
    lineHeight: 1.6,
    whiteSpace: "pre-wrap",
  },

  metadata: {
    display: "flex",
    gap: "16px",
    flexWrap: "wrap",
    marginTop: "14px",
    paddingTop: "14px",
    borderTop: "1px solid #f1f5f9",
    color: "#64748b",
    fontSize: "12px",
  },

  managementBar: {
    display: "flex",
    gap: "10px",
    marginTop: "18px",
    paddingTop: "15px",
    borderTop: "1px solid #e2e8f0",
  },

  editButton: {
    padding: "10px 15px",
    border: "1px solid #bfdbfe",
    borderRadius: "9px",
    background: "#eff6ff",
    color: "#1d4ed8",
    fontWeight: 800,
    cursor: "pointer",
  },

  deleteButton: {
    padding: "10px 15px",
    border: "1px solid #fecaca",
    borderRadius: "9px",
    background: "#fef2f2",
    color: "#dc2626",
    fontWeight: 800,
    cursor: "pointer",
  },

  messageCard: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "16px",
    padding: "30px",
    textAlign: "center",
    color: "#64748b",
  },

  errorCard: {
    background: "#fef2f2",
    border: "1px solid #fecaca",
    borderRadius: "16px",
    padding: "24px",
    color: "#991b1b",
  },

  errorText: {
    overflowWrap: "anywhere",
  },

  retryButton: {
    padding: "10px 15px",
    border: "none",
    borderRadius: "8px",
    background: "#dc2626",
    color: "#ffffff",
    fontWeight: 700,
    cursor: "pointer",
  },
};
