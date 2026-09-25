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

export default function QuestionBankPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("All");

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

  useEffect(() => {
    loadQuestions();
  }, []);

  const subjects = useMemo(() => {
    const uniqueSubjects = new Set<string>();

    questions.forEach((item) => {
      if (item.subject) {
        uniqueSubjects.add(item.subject);
      }
    });

    return ["All", ...Array.from(uniqueSubjects).sort()];
  }, [questions]);

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
              Manage and review your uploaded NEET-PG questions.
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

        <section style={styles.statsCard}>
          <div>
            <div style={styles.statLabel}>
              Total Questions
            </div>

            <div style={styles.statNumber}>
              {questions.length}
            </div>
          </div>

          <div>
            <div style={styles.statLabel}>
              Showing
            </div>

            <div style={styles.statNumber}>
              {filteredQuestions.length}
            </div>
          </div>

          <div>
            <div style={styles.statLabel}>
              Subjects
            </div>

            <div style={styles.statNumber}>
              {Math.max(subjects.length - 1, 0)}
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
                onChange={(event) =>
                  setSearch(event.target.value)
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
                onChange={(event) =>
                  setSubjectFilter(event.target.value)
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
              No questions match your current search/filter.
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
                      <span style={styles.questionNumber}>
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
                          ...(item.correct_answer === "A"
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
                          ...(item.correct_answer === "B"
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
                          ...(item.correct_answer === "C"
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
                          ...(item.correct_answer === "D"
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
                      <details style={styles.explanation}>
                        <summary style={styles.summary}>
                          View Explanation
                        </summary>

                        <p style={styles.explanationText}>
                          {item.explanation}
                        </p>
                      </details>
                    )}

                    <div style={styles.metadata}>
                      {item.subunit && (
                        <span>
                          Subunit: {item.subunit}
                        </span>
                      )}

                      {item.topic && (
                        <span>
                          Topic: {item.topic}
                        </span>
                      )}
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

const styles: Record<string, React.CSSProperties> = {
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

  statsCard: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "16px",
    marginBottom: "20px",
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
