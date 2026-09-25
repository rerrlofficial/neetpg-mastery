
"use client";

import { ChangeEvent, useState } from "react";
import * as XLSX from "xlsx";
import { supabase } from "../../lib/supabase";

type QuestionRow = Record<string, unknown>;

type PreparedQuestion = {
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
};

const BATCH_SIZE = 500;

function normalizeKey(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function textValue(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value).trim();
}

function getValue(
  row: QuestionRow,
  aliases: string[]
): string {
  const normalizedAliases = aliases.map(normalizeKey);

  for (const key of Object.keys(row)) {
    const normalizedRowKey = normalizeKey(key);

    if (normalizedAliases.includes(normalizedRowKey)) {
      return textValue(row[key]);
    }
  }

  return "";
}

function normalizeAnswer(
  answer: string,
  options: string[]
): "A" | "B" | "C" | "D" | null {
  const value = answer.trim().toUpperCase();

  const directAnswers: Record<
    string,
    "A" | "B" | "C" | "D"
  > = {
    A: "A",
    B: "B",
    C: "C",
    D: "D",
    "1": "A",
    "2": "B",
    "3": "C",
    "4": "D",
    "OPTION A": "A",
    "OPTION B": "B",
    "OPTION C": "C",
    "OPTION D": "D",
  };

  if (directAnswers[value]) {
    return directAnswers[value];
  }

  const optionIndex = options.findIndex(
    (option) => option.trim().toUpperCase() === value
  );

  if (optionIndex === 0) return "A";
  if (optionIndex === 1) return "B";
  if (optionIndex === 2) return "C";
  if (optionIndex === 3) return "D";

  return null;
}

function prepareQuestion(
  row: QuestionRow
): PreparedQuestion | null {
  const question = getValue(row, [
    "question",
    "questions",
    "stem",
  ]);

  const optionA = getValue(row, [
    "option_a",
    "option a",
    "optiona",
    "a",
    "option1",
    "choicea",
  ]);

  const optionB = getValue(row, [
    "option_b",
    "option b",
    "optionb",
    "b",
    "option2",
    "choiceb",
  ]);

  const optionC = getValue(row, [
    "option_c",
    "option c",
    "optionc",
    "c",
    "option3",
    "choicec",
  ]);

  const optionD = getValue(row, [
    "option_d",
    "option d",
    "optiond",
    "d",
    "option4",
    "choiced",
  ]);

  const answer = getValue(row, [
    "correct_answer",
    "correct answer",
    "correctanswer",
    "answer",
    "correct",
    "correctoption",
  ]);

  const options = [optionA, optionB, optionC, optionD];
  const correctAnswer = normalizeAnswer(answer, options);

  if (
    !question ||
    !optionA ||
    !optionB ||
    !optionC ||
    !optionD ||
    !correctAnswer
  ) {
    return null;
  }

  const explanation = getValue(row, [
    "explanation",
    "explain",
    "solution",
  ]);

  const subject = getValue(row, ["subject"]);
  const unit = getValue(row, ["unit"]);
  const subunit = getValue(row, [
    "subunit",
    "sub unit",
  ]);

  const topic = getValue(row, ["topic"]);

  const imageUrl = getValue(row, [
    "image_url",
    "image url",
    "imageurl",
    "image",
    "image link",
  ]);

  return {
    question,
    option_a: optionA,
    option_b: optionB,
    option_c: optionC,
    option_d: optionD,
    correct_answer: correctAnswer,
    explanation: explanation || null,
    subject: subject || null,
    unit: unit || null,
    subunit: subunit || null,
    topic: topic || null,
    image_url: imageUrl || null,
  };
}

function splitIntoBatches<T>(
  items: T[],
  batchSize: number
): T[][] {
  const batches: T[][] = [];

  for (let i = 0; i < items.length; i += batchSize) {
    batches.push(items.slice(i, i + batchSize));
  }

  return batches;
}

export default function UploadQuestionsPage() {
  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState<QuestionRow[]>([]);
  const [isReading, setIsReading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveCompleted, setSaveCompleted] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function handleFileChange(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setFileName(file.name);
    setRows([]);
    setMessage("");
    setError("");
    setSaveCompleted(false);
    setIsReading(true);

    const reader = new FileReader();

    reader.onload = (loadEvent) => {
      try {
        const data = loadEvent.target?.result;

        if (!data) {
          throw new Error("Unable to read the selected file.");
        }

        const workbook = XLSX.read(data, {
          type: "array",
        });

        const firstSheetName = workbook.SheetNames[0];

        if (!firstSheetName) {
          throw new Error("The Excel file has no worksheet.");
        }

        const worksheet = workbook.Sheets[firstSheetName];

        const jsonRows = XLSX.utils.sheet_to_json<QuestionRow>(
          worksheet,
          {
            defval: "",
          }
        );

        if (jsonRows.length === 0) {
          throw new Error(
            "The worksheet does not contain any question rows."
          );
        }

        setRows(jsonRows);
        setMessage(
          `${jsonRows.length} rows loaded successfully.`
        );
      } catch (readError) {
        const errorMessage =
          readError instanceof Error
            ? readError.message
            : "Unable to read the Excel file.";

        setError(errorMessage);
      } finally {
        setIsReading(false);
      }
    };

    reader.onerror = () => {
      setError("An error occurred while reading the file.");
      setIsReading(false);
    };

    reader.readAsArrayBuffer(file);
  }

  async function handleSaveQuestions() {
    if (rows.length === 0) {
      setError("Please select an Excel file first.");
      return;
    }

    if (saveCompleted) {
      setError(
        "These questions have already been saved. Select a new file to save again."
      );
      return;
    }

    setIsSaving(true);
    setError("");
    setMessage("Validating questions...");

    try {
      const preparedQuestions: PreparedQuestion[] = [];
      let invalidRows = 0;

      for (const row of rows) {
        const preparedQuestion = prepareQuestion(row);

        if (preparedQuestion) {
          preparedQuestions.push(preparedQuestion);
        } else {
          invalidRows += 1;
        }
      }

      if (preparedQuestions.length === 0) {
        throw new Error(
          "No valid questions were found. Check your column names and required fields."
        );
      }

      setMessage(
        `Saving ${preparedQuestions.length} questions...`
      );

      const batches = splitIntoBatches(
        preparedQuestions,
        BATCH_SIZE
      );

      let savedCount = 0;

      for (const batch of batches) {
        const { error: insertError } = await supabase
          .from("questions")
          .insert(batch);

        if (insertError) {
          throw new Error(insertError.message);
        }

        savedCount += batch.length;

        setMessage(
          `Saved ${savedCount} of ${preparedQuestions.length} questions...`
        );
      }

      setSaveCompleted(true);

      if (invalidRows > 0) {
        setMessage(
          `Successfully saved ${savedCount} questions. ${invalidRows} invalid rows were skipped.`
        );
      } else {
        setMessage(
          `Successfully saved all ${savedCount} questions to Supabase.`
        );
      }
    } catch (saveError) {
      const errorMessage =
        saveError instanceof Error
          ? saveError.message
          : "An unexpected error occurred while saving.";

      setError(
        `Saving failed: ${errorMessage}`
      );
      setMessage("");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main style={styles.page}>
      <div style={styles.container}>
        <div style={styles.headerRow}>
          <div>
            <p style={styles.eyebrow}>NEET-PG MASTER</p>
            <h1 style={styles.title}>Upload Questions</h1>
            <p style={styles.subtitle}>
              Import MCQs from Excel and save them to Supabase.
            </p>
          </div>

          <a href="/" style={styles.backLink}>
            Back to Dashboard
          </a>
        </div>

        <section style={styles.card}>
          <h2 style={styles.sectionTitle}>
            1. Select Excel File
          </h2>

          <p style={styles.helpText}>
            Supported formats: .xlsx and .xls
          </p>

          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileChange}
            disabled={isReading || isSaving}
            style={styles.fileInput}
          />

          {fileName && (
            <p style={styles.fileName}>
              Selected file: <strong>{fileName}</strong>
            </p>
          )}

          {isReading && (
            <p style={styles.infoMessage}>
              Reading Excel file...
            </p>
          )}
        </section>

        <section style={styles.card}>
          <h2 style={styles.sectionTitle}>
            2. Preview Questions
          </h2>

          {rows.length === 0 ? (
            <p style={styles.helpText}>
              Select an Excel file to preview its questions.
            </p>
          ) : (
            <>
              <p style={styles.infoMessage}>
                Showing the first 10 rows out of {rows.length} total
                rows.
              </p>

              <div style={styles.tableWrapper}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      {Object.keys(rows[0]).map((column) => (
                        <th key={column} style={styles.th}>
                          {column}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {rows.slice(0, 10).map((row, rowIndex) => (
                      <tr key={rowIndex}>
                        {Object.keys(rows[0]).map((column) => (
                          <td key={column} style={styles.td}>
                            {textValue(row[column]) || "—"}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>

        <section style={styles.card}>
          <h2 style={styles.sectionTitle}>
            3. Save to Supabase
          </h2>

          <p style={styles.helpText}>
            Required fields: question, option A, option B, option C,
            option D and correct answer.
          </p>

          <p style={styles.helpText}>
            Optional fields: explanation, subject, unit, subunit,
            topic and image URL.
          </p>

          <button
            type="button"
            onClick={handleSaveQuestions}
            disabled={
              rows.length === 0 ||
              isSaving ||
              saveCompleted
            }
            style={{
              ...styles.saveButton,
              opacity:
                rows.length === 0 ||
                isSaving ||
                saveCompleted
                  ? 0.55
                  : 1,
              cursor:
                rows.length === 0 ||
                isSaving ||
                saveCompleted
                  ? "not-allowed"
                  : "pointer",
            }}
          >
            {isSaving
              ? "Saving Questions..."
              : saveCompleted
              ? "Questions Saved"
              : "Save Questions to Supabase"}
          </button>

          {message && (
            <p style={styles.successMessage}>
              {message}
            </p>
          )}

          {error && (
            <p style={styles.errorMessage}>
              {error}
            </p>
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
    padding: "32px 16px",
    color: "#172033",
  },

  container: {
    maxWidth: "1250px",
    margin: "0 auto",
  },

  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "20px",
    flexWrap: "wrap",
    marginBottom: "28px",
  },

  eyebrow: {
    margin: "0 0 8px",
    fontSize: "12px",
    fontWeight: 800,
    letterSpacing: "1.5px",
    color: "#2563eb",
  },

  title: {
    margin: 0,
    fontSize: "34px",
    fontWeight: 800,
  },

  subtitle: {
    margin: "10px 0 0",
    color: "#64748b",
    fontSize: "15px",
  },

  backLink: {
    display: "inline-block",
    padding: "12px 16px",
    borderRadius: "10px",
    background: "#ffffff",
    border: "1px solid #dbe3ef",
    color: "#1d4ed8",
    textDecoration: "none",
    fontWeight: 700,
    fontSize: "14px",
  },

  card: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "16px",
    padding: "24px",
    marginBottom: "20px",
    boxShadow: "0 8px 25px rgba(15, 23, 42, 0.04)",
  },

  sectionTitle: {
    margin: "0 0 12px",
    fontSize: "20px",
    fontWeight: 800,
  },

  helpText: {
    margin: "8px 0",
    color: "#64748b",
    fontSize: "14px",
    lineHeight: 1.6,
  },

  fileInput: {
    display: "block",
    width: "100%",
    maxWidth: "450px",
    marginTop: "18px",
    padding: "12px",
    border: "1px solid #cbd5e1",
    borderRadius: "10px",
    background: "#f8fafc",
  },

  fileName: {
    marginTop: "16px",
    color: "#334155",
    fontSize: "14px",
  },

  infoMessage: {
    marginTop: "16px",
    padding: "12px 14px",
    borderRadius: "10px",
    background: "#eff6ff",
    color: "#1d4ed8",
    fontSize: "14px",
    lineHeight: 1.5,
  },

  successMessage: {
    marginTop: "16px",
    padding: "12px 14px",
    borderRadius: "10px",
    background: "#ecfdf5",
    color: "#047857",
    fontSize: "14px",
    lineHeight: 1.5,
  },

  errorMessage: {
    marginTop: "16px",
    padding: "12px 14px",
    borderRadius: "10px",
    background: "#fef2f2",
    color: "#b91c1c",
    fontSize: "14px",
    lineHeight: 1.5,
    overflowWrap: "anywhere",
  },

  tableWrapper: {
    width: "100%",
    overflowX: "auto",
    marginTop: "16px",
    border: "1px solid #e2e8f0",
    borderRadius: "10px",
  },

  table: {
    width: "100%",
    minWidth: "850px",
    borderCollapse: "collapse",
    fontSize: "13px",
  },

  th: {
    padding: "12px",
    background: "#f8fafc",
    borderBottom: "1px solid #e2e8f0",
    textAlign: "left",
    whiteSpace: "nowrap",
    fontWeight: 800,
  },

  td: {
    padding: "12px",
    borderBottom: "1px solid #f1f5f9",
    verticalAlign: "top",
    maxWidth: "300px",
    lineHeight: 1.5,
  },

  saveButton: {
    marginTop: "18px",
    padding: "14px 20px",
    border: "none",
    borderRadius: "10px",
    background: "#2563eb",
    color: "#ffffff",
    fontSize: "15px",
    fontWeight: 800,
  },
};
