"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";

type Subject = {
  id: string;
  name: string;
};

type QuestionMeta = {
  subject: string | null;
  unit: string | null;
};

export default function PracticeSetupPage() {
  const router = useRouter();

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [questionMeta, setQuestionMeta] = useState<QuestionMeta[]>([]);

  const [selectedSubject, setSelectedSubject] =
    useState("");

  const [selectedUnit, setSelectedUnit] =
    useState("");

  const [difficulty, setDifficulty] =
    useState("all");

  const [pyq, setPyq] = useState("all");

  const [questionCount, setQuestionCount] =
    useState("20");

  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [errorMessage, setErrorMessage] =
    useState("");

  useEffect(() => {
    loadSetupData();
  }, []);

  async function loadSetupData() {
    setLoading(true);
    setErrorMessage("");

    const [
      subjectsResult,
      questionsResult,
    ] = await Promise.all([
      supabase
        .from("subjects")
        .select("id, name")
        .order("name", {
          ascending: true,
        }),

      supabase
        .from("questions")
        .select("subject, unit")
        .eq("is_active", true),
    ]);

    if (subjectsResult.error) {
      setErrorMessage(
        subjectsResult.error.message
      );

      setLoading(false);
      return;
    }

    if (questionsResult.error) {
      setErrorMessage(
        questionsResult.error.message
      );

      setLoading(false);
      return;
    }

    setSubjects(
      (subjectsResult.data || []) as Subject[]
    );

    setQuestionMeta(
      (questionsResult.data || []) as QuestionMeta[]
    );

    setLoading(false);
  }

  const availableUnits = useMemo(() => {
    const units = questionMeta
      .filter((item) => {
        if (!selectedSubject) {
          return Boolean(item.unit);
        }

        return (
          item.subject === selectedSubject &&
          Boolean(item.unit)
        );
      })
      .map((item) => item.unit as string);

    return Array.from(
      new Set(units)
    ).sort();
  }, [questionMeta, selectedSubject]);

  function handleSubjectChange(
    value: string
  ) {
    setSelectedSubject(value);
    setSelectedUnit("");
  }

  function startPractice() {
    setStarting(true);
    setErrorMessage("");

    const params = new URLSearchParams();

    if (selectedSubject) {
      params.set(
        "subject",
        selectedSubject
      );
    }

    if (selectedUnit) {
      params.set(
        "unit",
        selectedUnit
      );
    }

    if (difficulty !== "all") {
      params.set(
        "difficulty",
        difficulty
      );
    }

    if (pyq !== "all") {
      params.set(
        "pyq",
        pyq
      );
    }

    params.set(
      "count",
      questionCount
    );

    router.push(
      `/practice?${params.toString()}`
    );
  }

  if (loading) {
    return (
      <main className="setup-page">
        <div className="setup-loading">
          <div className="loading-mark">
            N
          </div>

          <p>
            Loading practice options...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="setup-page">
      <header className="setup-topbar">
        <div className="setup-container setup-nav">
          <Link
            href="/dashboard"
            className="setup-brand"
          >
            <div className="brand-mark">
              N
            </div>

            <span>
              NEET-PG Master
            </span>
          </Link>

          <Link
            href="/dashboard"
            className="setup-back"
          >
            ← Dashboard
          </Link>
        </div>
      </header>

      <section className="setup-container setup-main">
        <div className="setup-heading">
          <span className="setup-eyebrow">
            PRACTICE
          </span>

          <h1>
            Configure your practice
          </h1>

          <p>
            Choose what you want to practice
            today.
          </p>
        </div>

        {errorMessage && (
          <div className="setup-error">
            {errorMessage}
          </div>
        )}

        <div className="setup-card">
          <div className="setup-field">
            <label htmlFor="subject">
              Subject
            </label>

            <select
              id="subject"
              value={selectedSubject}
              onChange={(event) =>
                handleSubjectChange(
                  event.target.value
                )
              }
            >
              <option value="">
                All Subjects
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
          </div>

          <div className="setup-field">
            <label htmlFor="unit">
              Unit
            </label>

            <select
              id="unit"
              value={selectedUnit}
              onChange={(event) =>
                setSelectedUnit(
                  event.target.value
                )
              }
              disabled={
                availableUnits.length === 0
              }
            >
              <option value="">
                All Units
              </option>

              {availableUnits.map((unit) => (
                <option
                  key={unit}
                  value={unit}
                >
                  {unit}
                </option>
              ))}
            </select>

            {selectedSubject &&
              availableUnits.length ===
                0 && (
                <small>
                  No units are currently
                  available for this subject.
                </small>
              )}
          </div>

          <div className="setup-field">
            <label htmlFor="difficulty">
              Difficulty
            </label>

            <select
              id="difficulty"
              value={difficulty}
              onChange={(event) =>
                setDifficulty(
                  event.target.value
                )
              }
            >
              <option value="all">
                All Difficulties
              </option>

              <option value="Easy">
                Easy
              </option>

              <option value="Moderate">
                Moderate
              </option>

              <option value="Hard">
                Hard
              </option>
            </select>
          </div>

          <div className="setup-field">
            <label htmlFor="pyq">
              Question Type
            </label>

            <select
              id="pyq"
              value={pyq}
              onChange={(event) =>
                setPyq(
                  event.target.value
                )
              }
            >
              <option value="all">
                All Questions
              </option>

              <option value="pyq">
                PYQs Only
              </option>

              <option value="non-pyq">
                Non-PYQs Only
              </option>
            </select>
          </div>

          <div className="setup-field">
            <label htmlFor="count">
              Number of Questions
            </label>

            <select
              id="count"
              value={questionCount}
              onChange={(event) =>
                setQuestionCount(
                  event.target.value
                )
              }
            >
              <option value="10">
                10 Questions
              </option>

              <option value="20">
                20 Questions
              </option>

              <option value="30">
                30 Questions
              </option>

              <option value="50">
                50 Questions
              </option>
            </select>
          </div>

          <div className="setup-summary">
            <div className="setup-summary-icon">
              ✓
            </div>

            <div>
              <strong>
                Ready to practice
              </strong>

              <p>
                {selectedSubject ||
                  "All Subjects"}
                {" • "}
                {selectedUnit ||
                  "All Units"}
                {" • "}
                {questionCount} questions
              </p>
            </div>
          </div>

          <button
            type="button"
            className="setup-start-button"
            onClick={startPractice}
            disabled={starting}
          >
            {starting
              ? "Starting..."
              : "Start Practice →"}
          </button>
        </div>
      </section>
    </main>
  );
}
