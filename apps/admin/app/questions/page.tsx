"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";

type Answer = "A" | "B" | "C" | "D";

type Question = {
  id: string;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: Answer;
  explanation: string | null;
  subject: string | null;
  unit: string | null;
  subunit: string | null;
  topic: string | null;
  image_url: string | null;
  difficulty: string | null;
  question_type: string | null;
  year: number | null;
  tags: string | null;
  is_active: boolean;
  is_pyq: boolean;
  image_alt: string | null;
  created_at: string;
  updated_at: string;
};

type EditForm = {
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: Answer;
  explanation: string;
  subject: string;
  unit: string;
  subunit: string;
  topic: string;
  image_url: string;
  image_alt: string;
  difficulty: string;
  question_type: string;
  year: string;
  tags: string;
  is_active: boolean;
  is_pyq: boolean;
};

const difficultyOptions = ["Easy", "Moderate", "Hard"];

const questionTypeOptions = [
  "Single Best Answer",
  "Clinical Vignette",
  "Image Based",
  "Assertion-Reason",
  "Other",
];

export default function QuestionBankPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [availableSubjects, setAvailableSubjects] =
    useState<string[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [subjectFilter, setSubjectFilter] =
    useState("All");
  const [unitFilter, setUnitFilter] =
    useState("All");
  const [subunitFilter, setSubunitFilter] =
    useState("All");
  const [topicFilter, setTopicFilter] =
    useState("All");
  const [difficultyFilter, setDifficultyFilter] =
    useState("All");
  const [pyqFilter, setPyqFilter] =
    useState("All");
  const [activeFilter, setActiveFilter] =
    useState("Active");

  const [editingId, setEditingId] =
    useState<string | null>(null);

  const [editForm, setEditForm] =
    useState<EditForm | null>(null);

  const [saving, setSaving] = useState(false);

  const [deletingId, setDeletingId] =
    useState<string | null>(null);

  async function loadQuestions() {
    setLoading(true);
    setError("");

    const { data, error: fetchError } =
      await supabase
        .from("questions")
        .select("*")
        .order("created_at", {
          ascending: false,
        });

    if (fetchError) {
      setError(fetchError.message);
      setQuestions([]);
    } else {
      setQuestions(
        (data || []) as Question[]
      );
    }

    setLoading(false);
  }

  async function loadSubjects() {
    const { data, error: fetchError } =
      await supabase
        .from("subjects")
        .select("name")
        .order("name", {
          ascending: true,
        });

    if (fetchError) {
      setError(fetchError.message);
      return;
    }

    setAvailableSubjects(
      (data || []).map(
        (item) => item.name
      )
    );
  }

  useEffect(() => {
    loadQuestions();
    loadSubjects();
  }, []);

  const subjects = useMemo(() => {
    const set = new Set(
      availableSubjects
    );

    questions.forEach((q) => {
      if (q.subject?.trim()) {
        set.add(q.subject.trim());
      }
    });

    return [
      "All",
      ...Array.from(set).sort(),
    ];
  }, [
    questions,
    availableSubjects,
  ]);

  const units = useMemo(
    () => [
      "All",
      ...uniqueValues(
        questions.map(
          (q) => q.unit
        )
      ),
    ],
    [questions]
  );

  const subunits = useMemo(
    () => [
      "All",
      ...uniqueValues(
        questions.map(
          (q) => q.subunit
        )
      ),
    ],
    [questions]
  );

  const topics = useMemo(
    () => [
      "All",
      ...uniqueValues(
        questions.map(
          (q) => q.topic
        )
      ),
    ],
    [questions]
  );

  const filteredQuestions = useMemo(() => {
    const value =
      search.trim().toLowerCase();

    return questions.filter((q) => {
      if (
        subjectFilter !== "All" &&
        q.subject !== subjectFilter
      ) {
        return false;
      }

      if (
        unitFilter !== "All" &&
        q.unit !== unitFilter
      ) {
        return false;
      }

      if (
        subunitFilter !== "All" &&
        q.subunit !== subunitFilter
      ) {
        return false;
      }

      if (
        topicFilter !== "All" &&
        q.topic !== topicFilter
      ) {
        return false;
      }

      if (
        difficultyFilter !== "All" &&
        q.difficulty !== difficultyFilter
      ) {
        return false;
      }

      if (
        pyqFilter === "PYQ" &&
        !q.is_pyq
      ) {
        return false;
      }

      if (
        pyqFilter === "Non-PYQ" &&
        q.is_pyq
      ) {
        return false;
      }

      if (
        activeFilter === "Active" &&
        !q.is_active
      ) {
        return false;
      }

      if (
        activeFilter === "Inactive" &&
        q.is_active
      ) {
        return false;
      }

      if (!value) {
        return true;
      }

      return [
        q.question,
        q.option_a,
        q.option_b,
        q.option_c,
        q.option_d,
        q.explanation,
        q.subject,
        q.unit,
        q.subunit,
        q.topic,
        q.tags,
        q.question_type,
        q.difficulty,
        q.year,
      ]
        .map((x) =>
          String(x ?? "")
        )
        .join(" ")
        .toLowerCase()
        .includes(value);
    });
  }, [
    questions,
    search,
    subjectFilter,
    unitFilter,
    subunitFilter,
    topicFilter,
    difficultyFilter,
    pyqFilter,
    activeFilter,
  ]);

  function startEditing(q: Question) {
    setEditingId(q.id);

    setEditForm({
      question: q.question,
      option_a: q.option_a,
      option_b: q.option_b,
      option_c: q.option_c,
      option_d: q.option_d,
      correct_answer:
        q.correct_answer,
      explanation:
        q.explanation || "",
      subject: q.subject || "",
      unit: q.unit || "",
      subunit: q.subunit || "",
      topic: q.topic || "",
      image_url:
        q.image_url || "",
      image_alt:
        q.image_alt || "",
      difficulty:
        q.difficulty || "",
      question_type:
        q.question_type || "",
      year: q.year
        ? String(q.year)
        : "",
      tags: q.tags || "",
      is_active: q.is_active,
      is_pyq: q.is_pyq,
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

  function updateField<K extends keyof EditForm>(
    field: K,
    value: EditForm[K]
  ) {
    if (!editForm) return;

    setEditForm({
      ...editForm,
      [field]: value,
    });
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

    const parsedYear =
      editForm.year.trim()
        ? Number(editForm.year.trim())
        : null;

    const { error: updateError } =
      await supabase
        .from("questions")
        .update({
          question:
            editForm.question.trim(),

          option_a:
            editForm.option_a.trim(),

          option_b:
            editForm.option_b.trim(),

          option_c:
            editForm.option_c.trim(),

          option_d:
            editForm.option_d.trim(),

          correct_answer:
            editForm.correct_answer,

          explanation:
            editForm.explanation.trim() ||
            null,

          subject:
            editForm.subject.trim() ||
            null,

          unit:
            editForm.unit.trim() ||
            null,

          subunit:
            editForm.subunit.trim() ||
            null,

          topic:
            editForm.topic.trim() ||
            null,

          image_url:
            editForm.image_url.trim() ||
            null,

          image_alt:
            editForm.image_alt.trim() ||
            null,

          difficulty:
            editForm.difficulty.trim() ||
            null,

          question_type:
            editForm.question_type.trim() ||
            null,

          year:
            parsedYear &&
            Number.isInteger(parsedYear)
              ? parsedYear
              : null,

          tags:
            editForm.tags.trim() ||
            null,

          is_active:
            editForm.is_active,

          is_pyq:
            editForm.is_pyq,

          updated_at:
            new Date().toISOString(),
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

  async function deleteQuestion(
    id: string
  ) {
    const confirmed =
      window.confirm(
        "Are you sure you want to permanently delete this question?\n\nThis action cannot be undone."
      );

    if (!confirmed) {
      return;
    }

    setDeletingId(id);

    const { error: deleteError } =
      await supabase
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

  function resetFilters() {
    setSearch("");
    setSubjectFilter("All");
    setUnitFilter("All");
    setSubunitFilter("All");
    setTopicFilter("All");
    setDifficultyFilter("All");
    setPyqFilter("All");
    setActiveFilter("Active");
  }

  const activeCount =
    questions.filter(
      (q) => q.is_active
    ).length;

  const pyqCount =
    questions.filter(
      (q) => q.is_pyq
    ).length;

  const imageCount =
    questions.filter(
      (q) => Boolean(q.image_url)
    ).length;

  return (
    <main style={styles.page}>
      <div style={styles.container}>

        <header style={styles.header}>
          <div>
            <div style={styles.eyebrow}>
              NEET-PG MASTER
            </div>

            <h1 style={styles.title}>
              Question Bank
            </h1>

            <p style={styles.subtitle}>
              Manage, filter, edit and review
              your complete NEET-PG question bank.
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
              href="/subjects"
              style={styles.secondaryButton}
            >
              Subjects
            </a>

            <a
              href="/upload"
              style={styles.primaryButton}
            >
              + Upload Questions
            </a>
          </div>
        </header>

        {editingId && editForm && (
          <section style={styles.editCard}>

            <div style={styles.editHeader}>
              <div>
                <h2 style={styles.editTitle}>
                  Edit Question
                </h2>

                <p style={styles.editSubtitle}>
                  All NEET-PG metadata can be edited here.
                </p>
              </div>

              <button
                onClick={cancelEditing}
                disabled={saving}
                style={styles.cancelButton}
              >
                Cancel
              </button>
            </div>

            <div style={styles.editGrid}>

              <Field
                label="Question *"
                full
              >
                <textarea
                  rows={4}
                  value={editForm.question}
                  onChange={(e) =>
                    updateField(
                      "question",
                      e.target.value
                    )
                  }
                  style={styles.textarea}
                />
              </Field>

              {(
                [
                  "option_a",
                  "option_b",
                  "option_c",
                  "option_d",
                ] as const
              ).map((field) => (
                <Field
                  key={field}
                  label={`Option ${field
                    .slice(-1)
                    .toUpperCase()} *`}
                >
                  <input
                    value={editForm[field]}
                    onChange={(e) =>
                      updateField(
                        field,
                        e.target.value
                      )
                    }
                    style={styles.input}
                  />
                </Field>
              ))}

              <Field label="Correct Answer">
                <select
                  value={
                    editForm.correct_answer
                  }
                  onChange={(e) =>
                    updateField(
                      "correct_answer",
                      e.target.value as Answer
                    )
                  }
                  style={styles.input}
                >
                  {[
                    "A",
                    "B",
                    "C",
                    "D",
                  ].map((x) => (
                    <option
                      key={x}
                      value={x}
                    >
                      {x}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Subject">
                <select
                  value={editForm.subject}
                  onChange={(e) =>
                    updateField(
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
              </Field>

              <Field label="Unit">
                <input
                  value={editForm.unit}
                  onChange={(e) =>
                    updateField(
                      "unit",
                      e.target.value
                    )
                  }
                  style={styles.input}
                />
              </Field>

              <Field label="Subunit">
                <input
                  value={editForm.subunit}
                  onChange={(e) =>
                    updateField(
                      "subunit",
                      e.target.value
                    )
                  }
                  style={styles.input}
                />
              </Field>

              <Field label="Topic">
                <input
                  value={editForm.topic}
                  onChange={(e) =>
                    updateField(
                      "topic",
                      e.target.value
                    )
                  }
                  style={styles.input}
                />
              </Field>

              <Field label="Difficulty">
                <select
                  value={editForm.difficulty}
                  onChange={(e) =>
                    updateField(
                      "difficulty",
                      e.target.value
                    )
                  }
                  style={styles.input}
                >
                  <option value="">
                    Not set
                  </option>

                  {difficultyOptions.map(
                    (x) => (
                      <option
                        key={x}
                        value={x}
                      >
                        {x}
                      </option>
                    )
                  )}
                </select>
              </Field>

              <Field label="Question Type">
                <select
                  value={
                    editForm.question_type
                  }
                  onChange={(e) =>
                    updateField(
                      "question_type",
                      e.target.value
                    )
                  }
                  style={styles.input}
                >
                  <option value="">
                    Not set
                  </option>

                  {questionTypeOptions.map(
                    (x) => (
                      <option
                        key={x}
                        value={x}
                      >
                        {x}
                      </option>
                    )
                  )}
                </select>
              </Field>

              <Field label="Year">
                <input
                  type="number"
                  min="2000"
                  max="2100"
                  value={editForm.year}
                  onChange={(e) =>
                    updateField(
                      "year",
                      e.target.value
                    )
                  }
                  style={styles.input}
                />
              </Field>

              <Field label="Tags">
                <input
                  value={editForm.tags}
                  onChange={(e) =>
                    updateField(
                      "tags",
                      e.target.value
                    )
                  }
                  placeholder="e.g. GBS, albuminocytologic dissociation"
                  style={styles.input}
                />
              </Field>

              <Field label="Image URL">
                <input
                  value={editForm.image_url}
                  onChange={(e) =>
                    updateField(
                      "image_url",
                      e.target.value
                    )
                  }
                  placeholder="https://..."
                  style={styles.input}
                />
              </Field>

              <Field label="Image Alt Text">
                <input
                  value={editForm.image_alt}
                  onChange={(e) =>
                    updateField(
                      "image_alt",
                      e.target.value
                    )
                  }
                  style={styles.input}
                />
              </Field>

              <Field label="Status">
                <select
                  value={
                    editForm.is_active
                      ? "Active"
                      : "Inactive"
                  }
                  onChange={(e) =>
                    updateField(
                      "is_active",
                      e.target.value ===
                        "Active"
                    )
                  }
                  style={styles.input}
                >
                  <option value="Active">
                    Active
                  </option>
                  <option value="Inactive">
                    Inactive
                  </option>
                </select>
              </Field>

              <Field label="PYQ">
                <select
                  value={
                    editForm.is_pyq
                      ? "Yes"
                      : "No"
                  }
                  onChange={(e) =>
                    updateField(
                      "is_pyq",
                      e.target.value ===
                        "Yes"
                    )
                  }
                  style={styles.input}
                >
                  <option value="Yes">
                    Yes
                  </option>
                  <option value="No">
                    No
                  </option>
                </select>
              </Field>

              <Field
                label="Explanation"
                full
              >
                <textarea
                  rows={5}
                  value={
                    editForm.explanation
                  }
                  onChange={(e) =>
                    updateField(
                      "explanation",
                      e.target.value
                    )
                  }
                  style={styles.textarea}
                />
              </Field>

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

          <Stat
            label="Total Questions"
            value={questions.length}
          />

          <Stat
            label="Showing"
            value={
              filteredQuestions.length
            }
          />

          <Stat
            label="Active"
            value={activeCount}
          />

          <Stat
            label="PYQs"
            value={pyqCount}
          />

          <Stat
            label="With Images"
            value={imageCount}
          />

          <Stat
            label="Subjects"
            value={Math.max(
              subjects.length - 1,
              0
            )}
          />

        </section>

        <section style={styles.filterCard}>

          <div style={styles.filterHeader}>
            <div>
              <h2
                style={
                  styles.sectionTitle
                }
              >
                Question Filters
              </h2>

              <p
                style={
                  styles.sectionSubtitle
                }
              >
                Use multiple filters together.
              </p>
            </div>

            <button
              onClick={resetFilters}
              style={styles.resetButton}
            >
              Reset Filters
            </button>
          </div>

          <div style={styles.filterGrid}>

            <Field label="Search">
              <input
                value={search}
                onChange={(e) =>
                  setSearch(
                    e.target.value
                  )
                }
                placeholder="Question, option, explanation, topic..."
                style={styles.input}
              />
            </Field>

            <SelectField
              label="Subject"
              value={subjectFilter}
              onChange={
                setSubjectFilter
              }
              options={subjects}
            />

            <SelectField
              label="Unit"
              value={unitFilter}
              onChange={setUnitFilter}
              options={units}
            />

            <SelectField
              label="Subunit"
              value={subunitFilter}
              onChange={
                setSubunitFilter
              }
              options={subunits}
            />

            <SelectField
              label="Topic"
              value={topicFilter}
              onChange={setTopicFilter}
              options={topics}
            />

            <SelectField
              label="Difficulty"
              value={difficultyFilter}
              onChange={
                setDifficultyFilter
              }
              options={[
                "All",
                ...difficultyOptions,
              ]}
            />

            <SelectField
              label="PYQ"
              value={pyqFilter}
              onChange={setPyqFilter}
              options={[
                "All",
                "PYQ",
                "Non-PYQ",
              ]}
            />

            <SelectField
              label="Status"
              value={activeFilter}
              onChange={setActiveFilter}
              options={[
                "All",
                "Active",
                "Inactive",
              ]}
            />

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
          filteredQuestions.length ===
            0 && (
            <section
              style={styles.messageCard}
            >
              No questions match your
              current filters.
            </section>
          )}

        {!loading &&
          !error &&
          filteredQuestions.length >
            0 && (
            <div
              style={styles.questionList}
            >

              {filteredQuestions.map(
                (item, index) => (
                  <article
                    key={item.id}
                    style={{
                      ...styles.questionCard,
                      opacity:
                        item.is_active
                          ? 1
                          : 0.65,
                    }}
                  >

                    <div
                      style={
                        styles.questionTop
                      }
                    >

                      <span
                        style={
                          styles.questionNumber
                        }
                      >
                        Q{index + 1}
                      </span>

                      <div
                        style={styles.tags}
                      >

                        {item.subject && (
                          <span
                            style={
                              styles.tag
                            }
                          >
                            {item.subject}
                          </span>
                        )}

                        {item.unit && (
                          <span
                            style={
                              styles.tag
                            }
                          >
                            {item.unit}
                          </span>
                        )}

                        {item.subunit && (
                          <span
                            style={
                              styles.tag
                            }
                          >
                            {item.subunit}
                          </span>
                        )}

                        {item.topic && (
                          <span
                            style={
                              styles.tag
                            }
                          >
                            {item.topic}
                          </span>
                        )}

                        {item.difficulty && (
                          <span
                            style={
                              styles.difficultyTag
                            }
                          >
                            {item.difficulty}
                          </span>
                        )}

                        {item.is_pyq && (
                          <span
                            style={
                              styles.pyqTag
                            }
                          >
                            PYQ{" "}
                            {item.year || ""}
                          </span>
                        )}

                        {!item.is_active && (
                          <span
                            style={
                              styles.inactiveTag
                            }
                          >
                            INACTIVE
                          </span>
                        )}

                      </div>
                    </div>

                    <h2
                      style={
                        styles.question
                      }
                    >
                      {item.question}
                    </h2>

                    {item.image_url && (
                      <div
                        style={
                          styles.imageBox
                        }
                      >
                        <img
                          src={
                            item.image_url
                          }
                          alt={
                            item.image_alt ||
                            "Question image"
                          }
                          style={
                            styles.image
                          }
                        />
                      </div>
                    )}

                    <div
                      style={styles.options}
                    >

                      {(
                        [
                          "A",
                          "B",
                          "C",
                          "D",
                        ] as Answer[]
                      ).map((letter) => {

                        const textValue =
                          item[
                            `option_${letter.toLowerCase()}` as keyof Question
                          ] as string;

                        return (
                          <div
                            key={letter}
                            style={{
                              ...styles.option,
                              ...(item.correct_answer ===
                              letter
                                ? styles.correctOption
                                : {}),
                            }}
                          >
                            <strong>
                              {letter}.
                            </strong>{" "}
                            {textValue}
                          </div>
                        );
                      })}

                    </div>

                    <div
                      style={
                        styles.answerBox
                      }
                    >
                      <strong>
                        Correct Answer:{" "}
                        {item.correct_answer}
                      </strong>
                    </div>

                    {item.explanation && (
                      <details
                        style={
                          styles.explanation
                        }
                      >
                        <summary
                          style={
                            styles.summary
                          }
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

                    <div
                      style={
                        styles.metadata
                      }
                    >

                      {item.question_type && (
                        <span>
                          Type:{" "}
                          {item.question_type}
                        </span>
                      )}

                      {item.tags && (
                        <span>
                          Tags: {item.tags}
                        </span>
                      )}

                      {item.year && (
                        <span>
                          Year: {item.year}
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
                        style={
                          styles.editButton
                        }
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

function uniqueValues(
  values: Array<string | null>
) {
  return Array.from(
    new Set(
      values
        .map((x) => x?.trim())
        .filter(Boolean) as string[]
    )
  ).sort();
}

function Field({
  label,
  children,
  full = false,
}: {
  label: string;
  children: React.ReactNode;
  full?: boolean;
}) {
  return (
    <div
      style={
        full
          ? styles.fullField
          : styles.field
      }
    >
      <label style={styles.label}>
        {label}
      </label>

      {children}
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <Field label={label}>
      <select
        value={value}
        onChange={(e) =>
          onChange(e.target.value)
        }
        style={styles.input}
      >
        {options.map((x) => (
          <option
            key={x}
            value={x}
          >
            {x}
          </option>
        ))}
      </select>
    </Field>
  );
}

function Stat({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div style={styles.statCard}>
      <div style={styles.statLabel}>
        {label}
      </div>

      <div style={styles.statNumber}>
        {value}
      </div>
    </div>
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
    lineHeight: 1.5,
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
    color: "#fff",
    textDecoration: "none",
    fontWeight: 700,
    fontSize: "14px",
  },

  secondaryButton: {
    padding: "12px 16px",
    borderRadius: "10px",
    background: "#fff",
    border: "1px solid #dbe3ef",
    color: "#334155",
    textDecoration: "none",
    fontWeight: 700,
    fontSize: "14px",
  },

  statsGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(170px, 1fr))",
    gap: "14px",
    marginBottom: "20px",
  },

  statCard: {
    background: "#fff",
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
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: "16px",
    padding: "20px",
    marginBottom: "20px",
  },

  filterHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    flexWrap: "wrap",
    marginBottom: "18px",
  },

  sectionTitle: {
    margin: 0,
    fontSize: "20px",
  },

  sectionSubtitle: {
    margin: "5px 0 0",
    color: "#64748b",
    fontSize: "13px",
  },

  filterGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(190px, 1fr))",
    gap: "14px",
  },

  editCard: {
    background: "#fff",
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
      "repeat(auto-fit, minmax(260px, 1fr))",
    gap: "15px",
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
    background: "#fff",
    color: "#172033",
    fontSize: "14px",
    boxSizing: "border-box",
  },

  textarea: {
    width: "100%",
    padding: "12px",
    borderRadius: "10px",
    border: "1px solid #cbd5e1",
    background: "#fff",
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
    color: "#fff",
    fontWeight: 800,
    cursor: "pointer",
  },

  cancelButton: {
    padding: "10px 14px",
    borderRadius: "9px",
    border: "1px solid #cbd5e1",
    background: "#fff",
    color: "#334155",
    fontWeight: 700,
    cursor: "pointer",
  },

  resetButton: {
    padding: "9px 13px",
    borderRadius: "9px",
    border: "1px solid #cbd5e1",
    background: "#fff",
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
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: "16px",
    padding: "22px",
    boxShadow:
      "0 6px 20px rgba(15,23,42,.04)",
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

  difficultyTag: {
    padding: "5px 9px",
    borderRadius: "999px",
    background: "#fef3c7",
    color: "#92400e",
    fontSize: "11px",
    fontWeight: 700,
  },

  pyqTag: {
    padding: "5px 9px",
    borderRadius: "999px",
    background: "#ecfdf5",
    color: "#047857",
    fontSize: "11px",
    fontWeight: 700,
  },

  inactiveTag: {
    padding: "5px 9px",
    borderRadius: "999px",
    background: "#f1f5f9",
    color: "#64748b",
    fontSize: "11px",
    fontWeight: 700,
  },

  question: {
    margin: "0 0 18px",
    fontSize: "18px",
    lineHeight: 1.5,
  },

  imageBox: {
    marginBottom: "16px",
    textAlign: "center",
  },

  image: {
    maxWidth: "100%",
    maxHeight: "420px",
    borderRadius: "12px",
    objectFit: "contain",
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
    background: "#fff",
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
    color: "#fff",
    fontWeight: 700,
    cursor: "pointer",
  },
};
