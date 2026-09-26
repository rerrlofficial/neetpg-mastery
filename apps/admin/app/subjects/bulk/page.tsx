"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../../lib/supabase";

type Question = {
  id: string;
  subject: string | null;
  unit: string | null;
};

type Subject = {
  id: string;
  name: string;
};

type UnitGroup = {
  unit: string;
  total: number;
  assigned: number;
  unassigned: number;
  currentSubjects: string[];
};

export default function BulkSubjectPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);

  const [loading, setLoading] = useState(true);
  const [savingUnit, setSavingUnit] = useState<string | null>(
    null
  );

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");
  const [selectedSubjects, setSelectedSubjects] = useState<
    Record<string, string>
  >({});

  async function loadData() {
    setLoading(true);
    setError("");

    const [
      questionsResponse,
      subjectsResponse,
    ] = await Promise.all([
      supabase
        .from("questions")
        .select("id, subject, unit")
        .order("created_at", {
          ascending: false,
        }),

      supabase
        .from("subjects")
        .select("id, name")
        .order("name", {
          ascending: true,
        }),
    ]);

    if (questionsResponse.error) {
      setError(
        `Questions: ${questionsResponse.error.message}`
      );
      setLoading(false);
      return;
    }

    if (subjectsResponse.error) {
      setError(
        `Subjects: ${subjectsResponse.error.message}`
      );
      setLoading(false);
      return;
    }

    setQuestions(
      (questionsResponse.data || []) as Question[]
    );

    setSubjects(
      (subjectsResponse.data || []) as Subject[]
    );

    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  const unitGroups = useMemo<UnitGroup[]>(() => {
    const groups = new Map<
      string,
      {
        total: number;
        assigned: number;
        currentSubjects: Set<string>;
      }
    >();

    questions.forEach((question) => {
      const unit =
        question.unit?.trim() || "Unspecified";

      if (!groups.has(unit)) {
        groups.set(unit, {
          total: 0,
          assigned: 0,
          currentSubjects: new Set<string>(),
        });
      }

      const group = groups.get(unit)!;

      group.total += 1;

      if (question.subject?.trim()) {
        group.assigned += 1;
        group.currentSubjects.add(
          question.subject.trim()
        );
      }
    });

    return Array.from(groups.entries())
      .map(([unit, data]) => ({
        unit,
        total: data.total,
        assigned: data.assigned,
        unassigned:
          data.total - data.assigned,
        currentSubjects:
          Array.from(data.currentSubjects).sort(),
      }))
      .sort((a, b) => {
        if (a.unit === "Unspecified") return 1;
        if (b.unit === "Unspecified") return -1;

        return a.unit.localeCompare(b.unit);
      });
  }, [questions]);

  const filteredGroups = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return unitGroups;
    }

    return unitGroups.filter((group) =>
      group.unit.toLowerCase().includes(query)
    );
  }, [unitGroups, search]);

  const totalQuestions = questions.length;

  const assignedQuestions = questions.filter(
    (question) =>
      Boolean(question.subject?.trim())
  ).length;

  const unassignedQuestions =
    totalQuestions - assignedQuestions;

  async function applySubject(unit: string) {
    const subject =
      selectedSubjects[unit]?.trim();

    if (!subject) {
      setError(
        `Please select a subject for "${unit}".`
      );
      setSuccess("");
      return;
    }

    const confirmed = window.confirm(
      `Assign "${subject}" to all questions where Unit = "${unit}"?\n\nThis will update the Subject field for those questions.`
    );

    if (!confirmed) {
      return;
    }

    setSavingUnit(unit);
    setError("");
    setSuccess("");

    const { error: updateError } = await supabase
      .from("questions")
      .update({
        subject,
      })
      .eq("unit", unit);

    setSavingUnit(null);

    if (updateError) {
      setError(
        `Update failed: ${updateError.message}`
      );
      return;
    }

    setSuccess(
      `Successfully assigned "${subject}" to questions in "${unit}".`
    );

    await loadData();
  }

  async function clearSubject(unit: string) {
    const confirmed = window.confirm(
      `Clear the Subject field for all questions where Unit = "${unit}"?`
    );

    if (!confirmed) {
      return;
    }

    setSavingUnit(unit);
    setError("");
    setSuccess("");

    const { error: updateError } = await supabase
      .from("questions")
      .update({
        subject: null,
      })
      .eq("unit", unit);

    setSavingUnit(null);

    if (updateError) {
      setError(
        `Clear failed: ${updateError.message}`
      );
      return;
    }

    setSuccess(
      `Subject cleared for questions in "${unit}".`
    );

    await loadData();
  }

  function selectSubject(
    unit: string,
    subject: string
  ) {
    setSelectedSubjects((current) => ({
      ...current,
      [unit]: subject,
    }));

    setError("");
    setSuccess("");
  }

  return (
    <main style={styles.page}>
      <div style={styles.container}>

        <header style={styles.header}>
          <div>
            <div style={styles.eyebrow}>
              NEET-PG MASTER
            </div>

            <h1 style={styles.title}>
              Bulk Subject Assignment
            </h1>

            <p style={styles.subtitle}>
              Assign NEET-PG subjects to questions
              using their existing Unit values.
            </p>
          </div>

          <div style={styles.headerActions}>
            <a
              href="/subjects"
              style={styles.secondaryButton}
            >
              Subjects
            </a>

            <a
              href="/questions"
              style={styles.secondaryButton}
            >
              Question Bank
            </a>

            <a
              href="/"
              style={styles.primaryButton}
            >
              Dashboard
            </a>
          </div>
        </header>

        <section style={styles.statsGrid}>

          <div style={styles.statCard}>
            <div style={styles.statLabel}>
              Total Questions
            </div>

            <div style={styles.statNumber}>
              {totalQuestions}
            </div>
          </div>

          <div style={styles.statCard}>
            <div style={styles.statLabel}>
              Subject Assigned
            </div>

            <div style={styles.statNumber}>
              {assignedQuestions}
            </div>
          </div>

          <div style={styles.statCard}>
            <div style={styles.statLabel}>
              Subject Missing
            </div>

            <div style={styles.statNumber}>
              {unassignedQuestions}
            </div>
          </div>

          <div style={styles.statCard}>
            <div style={styles.statLabel}>
              Units
            </div>

            <div style={styles.statNumber}>
              {unitGroups.length}
            </div>
          </div>

        </section>

        {error && (
          <section style={styles.errorCard}>
            <strong>
              Something went wrong
            </strong>

            <p style={styles.messageText}>
              {error}
            </p>

            <button
              onClick={loadData}
              style={styles.retryButton}
            >
              Try Again
            </button>
          </section>
        )}

        {success && (
          <section style={styles.successCard}>
            {success}
          </section>
        )}

        <section style={styles.infoCard}>
          <strong>
            How this works
          </strong>

          <p style={styles.infoText}>
            Each row represents a Unit from your
            existing questions. Select the appropriate
            NEET-PG subject and press Apply. Only the
            Subject field will be changed.
          </p>

          <p style={styles.warningText}>
            ⚠️ Review the mapping before applying it.
            Questions with the same Unit will all
            receive the selected subject.
          </p>
        </section>

        <section style={styles.filterCard}>
          <label style={styles.label}>
            Search Units
          </label>

          <input
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search by unit..."
            style={styles.input}
          />
        </section>

        <section style={styles.tableCard}>

          <div style={styles.tableHeader}>
            <div>
              <h2 style={styles.sectionTitle}>
                Unit → Subject Mapping
              </h2>

              <p style={styles.sectionSubtitle}>
                {filteredGroups.length} unit
                {filteredGroups.length === 1
                  ? ""
                  : "s"} displayed
              </p>
            </div>
          </div>

          {loading ? (
            <div style={styles.empty}>
              Loading questions and subjects...
            </div>
          ) : filteredGroups.length === 0 ? (
            <div style={styles.empty}>
              No units found.
            </div>
          ) : (
            <div style={styles.list}>

              {filteredGroups.map((group) => {

                const selected =
                  selectedSubjects[group.unit] ||
                  "";

                const currentSubject =
                  group.currentSubjects.length > 0
                    ? group.currentSubjects.join(", ")
                    : "Not assigned";

                return (
                  <div
                    key={group.unit}
                    style={styles.mappingCard}
                  >

                    <div style={styles.mappingInfo}>

                      <div style={styles.unitName}>
                        {group.unit}
                      </div>

                      <div style={styles.countRow}>
                        <span>
                          Total: {group.total}
                        </span>

                        <span>
                          Assigned: {group.assigned}
                        </span>

                        <span>
                          Missing: {group.unassigned}
                        </span>
                      </div>

                      <div style={styles.currentSubject}>
                        Current subject:{" "}
                        <strong>
                          {currentSubject}
                        </strong>
                      </div>

                    </div>

                    <div style={styles.mappingControls}>

                      <select
                        value={selected}
                        onChange={(event) =>
                          selectSubject(
                            group.unit,
                            event.target.value
                          )
                        }
                        style={styles.select}
                      >
                        <option value="">
                          Select subject
                        </option>

                        {subjects.map((subject) => (
                          <option
                            key={subject.id}
                            value={subject.name}
                          >
                            {subject.name}
                          </option>
                        ))}
                      </select>

                      <button
                        onClick={() =>
                          applySubject(group.unit)
                        }
                        disabled={
                          savingUnit ===
                            group.unit ||
                          !selected
                        }
                        style={
                          styles.applyButton
                        }
                      >
                        {savingUnit === group.unit
                          ? "Applying..."
                          : "Apply"}
                      </button>

                      {group.assigned > 0 && (
                        <button
                          onClick={() =>
                            clearSubject(
                              group.unit
                            )
                          }
                          disabled={
                            savingUnit ===
                            group.unit
                          }
                          style={
                            styles.clearButton
                          }
                        >
                          Clear
                        </button>
                      )}

                    </div>

                  </div>
                );
              })}

            </div>
          )}

        </section>

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
    color: "#172033",
    padding: "32px 16px",
    fontFamily:
      "Arial, Helvetica, sans-serif",
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
    color: "#2563eb",
    fontSize: "12px",
    fontWeight: 800,
    letterSpacing: "1.5px",
    marginBottom: "7px",
  },

  title: {
    margin: 0,
    fontSize: "32px",
    fontWeight: 800,
  },

  subtitle: {
    margin: "8px 0 0",
    color: "#64748b",
    lineHeight: 1.5,
  },

  headerActions: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
  },

  primaryButton: {
    display: "inline-block",
    padding: "11px 15px",
    borderRadius: "10px",
    background: "#2563eb",
    color: "#ffffff",
    textDecoration: "none",
    fontWeight: 700,
    fontSize: "14px",
  },

  secondaryButton: {
    display: "inline-block",
    padding: "11px 15px",
    borderRadius: "10px",
    background: "#ffffff",
    color: "#334155",
    border: "1px solid #dbe3ef",
    textDecoration: "none",
    fontWeight: 700,
    fontSize: "14px",
  },

  statsGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(190px, 1fr))",
    gap: "14px",
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
    fontWeight: 700,
  },

  statNumber: {
    marginTop: "7px",
    fontSize: "28px",
    fontWeight: 800,
  },

  infoCard: {
    background: "#eff6ff",
    border: "1px solid #bfdbfe",
    borderRadius: "16px",
    padding: "18px",
    marginBottom: "18px",
    color: "#1e3a8a",
  },

  infoText: {
    margin: "8px 0",
    lineHeight: 1.55,
  },

  warningText: {
    margin: "8px 0 0",
    fontWeight: 600,
    lineHeight: 1.5,
  },

  errorCard: {
    background: "#fef2f2",
    border: "1px solid #fecaca",
    borderRadius: "14px",
    padding: "18px",
    marginBottom: "18px",
    color: "#991b1b",
  },

  successCard: {
    background: "#f0fdf4",
    border: "1px solid #bbf7d0",
    borderRadius: "14px",
    padding: "15px 18px",
    marginBottom: "18px",
    color: "#166534",
    fontWeight: 700,
  },

  messageText: {
    overflowWrap: "anywhere",
    lineHeight: 1.5,
  },

  retryButton: {
    padding: "10px 14px",
    border: "none",
    borderRadius: "8px",
    background: "#dc2626",
    color: "#ffffff",
    fontWeight: 700,
    cursor: "pointer",
  },

  filterCard: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "16px",
    padding: "18px",
    marginBottom: "18px",
  },

  label: {
    display: "block",
    marginBottom: "7px",
    fontSize: "13px",
    fontWeight: 700,
    color: "#334155",
  },

  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: "12px 13px",
    border: "1px solid #cbd5e1",
    borderRadius: "10px",
    background: "#ffffff",
    color: "#172033",
    fontSize: "14px",
  },

  tableCard: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "16px",
    padding: "20px",
  },

  tableHeader: {
    marginBottom: "18px",
  },

  sectionTitle: {
    margin: 0,
    fontSize: "21px",
  },

  sectionSubtitle: {
    margin: "5px 0 0",
    color: "#64748b",
    fontSize: "13px",
  },

  list: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },

  mappingCard: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "18px",
    flexWrap: "wrap",
    border: "1px solid #e2e8f0",
    borderRadius: "14px",
    padding: "17px",
  },

  mappingInfo: {
    minWidth: 0,
    flex: 1,
  },

  unitName: {
    fontSize: "17px",
    fontWeight: 800,
    color: "#172033",
    overflowWrap: "anywhere",
  },

  countRow: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
    marginTop: "8px",
    color: "#64748b",
    fontSize: "12px",
  },

  currentSubject: {
    marginTop: "8px",
    color: "#475569",
    fontSize: "13px",
    overflowWrap: "anywhere",
  },

  mappingControls: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    flexWrap: "wrap",
    width: "100%",
    maxWidth: "500px",
  },

  select: {
    flex: "1 1 210px",
    minWidth: "190px",
    padding: "11px 12px",
    border: "1px solid #cbd5e1",
    borderRadius: "9px",
    background: "#ffffff",
    color: "#172033",
    fontSize: "14px",
  },

  applyButton: {
    padding: "11px 16px",
    border: "none",
    borderRadius: "9px",
    background: "#16a34a",
    color: "#ffffff",
    fontWeight: 800,
    cursor: "pointer",
  },

  clearButton: {
    padding: "11px 14px",
    border: "1px solid #fecaca",
    borderRadius: "9px",
    background: "#ffffff",
    color: "#dc2626",
    fontWeight: 700,
    cursor: "pointer",
  },

  empty: {
    padding: "40px 20px",
    textAlign: "center",
    color: "#64748b",
  },
};
