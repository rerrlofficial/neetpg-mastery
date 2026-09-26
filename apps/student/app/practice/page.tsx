"use client";

import {
  Suspense,
  useEffect,
  useState,
} from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { supabase } from "../../../lib/supabase";

type Attempt = {
  id: string;
  total_questions: number;
  answered_questions: number;
  correct_answers: number;
  score_percent: number;
};

function ResultContent() {
  const searchParams = useSearchParams();

  const attemptId = searchParams.get("attempt");

  const [attempt, setAttempt] =
    useState<Attempt | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [errorMessage, setErrorMessage] =
    useState("");

  useEffect(() => {
    loadResult();
  }, [attemptId]);

  async function loadResult() {
    if (!attemptId) {
      setErrorMessage(
        "Practice session could not be found."
      );

      setLoading(false);
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      window.location.href = "/login";
      return;
    }

    const { data, error } = await supabase
      .from("attempts")
      .select(
        `
        id,
        total_questions,
        answered_questions,
        correct_answers,
        score_percent
        `
      )
      .eq("id", attemptId)
      .eq("user_id", user.id)
      .single();

    if (error) {
      setErrorMessage(error.message);
      setLoading(false);
      return;
    }

    setAttempt(data as Attempt);
    setLoading(false);
  }

  if (loading) {
    return (
      <main className="result-page">
        <div className="result-loading">
          <div className="loading-mark">
            N
          </div>

          <p>
            Calculating your result...
          </p>
        </div>
      </main>
    );
  }

  if (!attempt || errorMessage) {
    return (
      <main className="result-page">
        <div className="result-card">
          <div className="result-icon">
            !
          </div>

          <h1>
            Result unavailable
          </h1>

          <p>
            {errorMessage ||
              "We could not load this practice session."}
          </p>

          <Link
            href="/dashboard"
            className="result-primary-button"
          >
            Back to Dashboard
          </Link>
        </div>
      </main>
    );
  }

  const percentage = Number(
    attempt.score_percent || 0
  );

  const incorrect = Math.max(
    attempt.answered_questions -
      attempt.correct_answers,
    0
  );

  const unanswered = Math.max(
    attempt.total_questions -
      attempt.answered_questions,
    0
  );

  let performanceMessage =
    "Keep practicing consistently.";

  if (percentage >= 80) {
    performanceMessage =
      "Excellent performance. Keep pushing your accuracy higher.";
  } else if (percentage >= 60) {
    performanceMessage =
      "Good progress. Review the questions you missed.";
  } else if (percentage >= 40) {
    performanceMessage =
      "Keep practicing and focus on your weak areas.";
  }

  return (
    <main className="result-page">
      <header className="result-topbar">
        <div className="result-container result-nav">
          <Link
            href="/dashboard"
            className="result-brand"
          >
            <div className="brand-mark">
              N
            </div>

            <span>
              NEET-PG Master
            </span>
          </Link>
        </div>
      </header>

      <section className="result-container result-main">
        <div className="result-card">
          <div className="result-success-icon">
            ✓
          </div>

          <span className="result-eyebrow">
            PRACTICE COMPLETE
          </span>

          <h1>
            Session completed 🎉
          </h1>

          <p className="result-message">
            {performanceMessage}
          </p>

          <div className="result-score">
            <div className="result-score-number">
              {Math.round(percentage)}%
            </div>

            <div className="result-score-label">
              Score
            </div>
          </div>

          <div className="result-stats">
            <div className="result-stat">
              <div className="result-stat-number">
                {attempt.total_questions}
              </div>

              <div className="result-stat-label">
                Total
              </div>
            </div>

            <div className="result-stat result-stat-correct">
              <div className="result-stat-number">
                {attempt.correct_answers}
              </div>

              <div className="result-stat-label">
                Correct
              </div>
            </div>

            <div className="result-stat result-stat-wrong">
              <div className="result-stat-number">
                {incorrect}
              </div>

              <div className="result-stat-label">
                Incorrect
              </div>
            </div>

            <div className="result-stat">
              <div className="result-stat-number">
                {unanswered}
              </div>

              <div className="result-stat-label">
                Unanswered
              </div>
            </div>
          </div>

          <div className="result-actions">
            <Link
              href="/practice/setup"
              className="result-primary-button"
            >
              Practice Again
            </Link>

            <Link
              href="/dashboard"
              className="result-secondary-button"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

function ResultLoading() {
  return (
    <main className="result-page">
      <div className="result-loading">
        <div className="loading-mark">
          N
        </div>

        <p>
          Loading result...
        </p>
      </div>
    </main>
  );
}

export default function PracticeResultPage() {
  return (
    <Suspense fallback={<ResultLoading />}>
      <ResultContent />
    </Suspense>
  );
}
