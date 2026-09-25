
"use client";

import { ChangeEvent, useState } from "react";
import * as XLSX from "xlsx";

type QuestionRow = Record<string, unknown>;

export default function UploadQuestionsPage() {
  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState<QuestionRow[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setFileName(file.name);
    setRows([]);
    setError("");
    setIsLoading(true);

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;

        if (!data) {
          throw new Error("Unable to read the selected file.");
        }

        const workbook = XLSX.read(data, {
          type: "array",
        });

        const firstSheetName = workbook.SheetNames[0];

        if (!firstSheetName) {
          throw new Error("The Excel file has no worksheets.");
        }

        const worksheet = workbook.Sheets[firstSheetName];

        const jsonData = XLSX.utils.sheet_to_json<QuestionRow>(
          worksheet,
          {
            defval: "",
          }
        );

        setRows(jsonData);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Could not process the Excel file."
        );
      } finally {
        setIsLoading(false);
      }
    };

    reader.onerror = () => {
      setError("An error occurred while reading the file.");
      setIsLoading(false);
    };

    reader.readAsArrayBuffer(file);
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f5f7fb",
        padding: "24px",
        color: "#172033",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
        }}
      >
        <a
          href="/"
          style={{
            color: "#2563eb",
            textDecoration: "none",
            fontWeight: 600,
          }}
        >
          ← Back to Dashboard
        </a>

        <h1
          style={{
            fontSize: "32px",
            margin: "24px 0 8px",
          }}
        >
          Upload Questions
        </h1>

        <p
          style={{
            color: "#64748b",
            lineHeight: 1.6,
          }}
        >
          Import NEET-PG questions from an Excel spreadsheet and
          preview the data before saving it.
        </p>

        <section
          style={{
            background: "#ffffff",
            borderRadius: "20px",
            padding: "28px",
            marginTop: "28px",
            boxShadow: "0 6px 24px rgba(15, 23, 42, 0.06)",
          }}
        >
          <h2
            style={{
              marginTop: 0,
              fontSize: "22px",
            }}
          >
            Select Excel File
          </h2>

          <p
            style={{
              color: "#64748b",
              lineHeight: 1.6,
            }}
          >
            Supported formats: .xlsx and .xls
          </p>

          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileChange}
            style={{
              display: "block",
              width: "100%",
              padding: "16px",
              border: "1px dashed #94a3b8",
              borderRadius: "12px",
              background: "#f8fafc",
            }}
          />

          {fileName && (
            <p
              style={{
                marginTop: "16px",
                color: "#334155",
              }}
            >
              Selected file: <strong>{fileName}</strong>
            </p>
          )}

          {isLoading && (
            <p
              style={{
                color: "#2563eb",
                marginTop: "16px",
              }}
            >
              Processing file...
            </p>
          )}

          {error && (
            <p
              style={{
                color: "#dc2626",
                marginTop: "16px",
              }}
            >
              {error}
            </p>
          )}
        </section>

        {rows.length > 0 && (
          <section
            style={{
              background: "#ffffff",
              borderRadius: "20px",
              padding: "28px",
              marginTop: "24px",
              boxShadow: "0 6px 24px rgba(15, 23, 42, 0.06)",
              overflowX: "auto",
            }}
          >
            <h2
              style={{
                marginTop: 0,
                fontSize: "22px",
              }}
            >
              Question Preview
            </h2>

            <p
              style={{
                color: "#64748b",
              }}
            >
              {rows.length} row(s) detected in the first worksheet.
            </p>

            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                marginTop: "20px",
                minWidth: "700px",
              }}
            >
              <thead>
                <tr>
                  {Object.keys(rows[0]).map((column) => (
                    <th
                      key={column}
                      style={{
                        textAlign: "left",
                        padding: "12px",
                        borderBottom: "2px solid #e2e8f0",
                        background: "#f8fafc",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {rows.slice(0, 10).map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {Object.keys(rows[0]).map((column) => (
                      <td
                        key={`${rowIndex}-${column}`}
                        style={{
                          padding: "12px",
                          borderBottom: "1px solid #e2e8f0",
                          verticalAlign: "top",
                          maxWidth: "320px",
                          whiteSpace: "pre-wrap",
                        }}
                      >
                        {String(row[column] ?? "")}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>

            {rows.length > 10 && (
              <p
                style={{
                  color: "#64748b",
                  marginBottom: 0,
                }}
              >
                Showing the first 10 rows as a preview.
              </p>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
