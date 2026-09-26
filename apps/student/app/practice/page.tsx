"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

type Question = {
  id: string;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
  explanation: string | null;
  subject: string | null;
  unit: string | null;
  subunit: string | null;
  topic: string | null;
  image_url: string | null;
  difficulty: string | null;
  question_type: string | null;
  year: number | null;
};

type Attempt = {
  id: string;
};

const OPTION_KEYS = ["A", "B", "C", "D"] as const;

export default function PracticePage() {
  const router = useRouter();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [answered, setAnswered] = useState(false);

  const [userId, setUserId] = useState("");
  const [attempt, setAttempt] = useState<Attempt | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [score, setScore] = useState(0);
  const [answeredCount, setAnsweredCount] = useState(0);

  useEffect(() => {
    initializePractice();
  }, []);

  async function initializePractice() {
    setLoading(true);
    setErrorMessage("");

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      router.replace("/login");
      return;
    }

    setUserId(user.id);

    const { data, error } = await supabase
      .from("questions")
      .select(
        `
        id,
        question,
        option_a,
        option_b,
        option_c,
        option_d,
        correct_answer,
        explanation,
        subject,
        unit,
        subunit,
        topic,
        image_url,
        difficulty,
        question_type,
        year
        `
      )
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) {
      setErrorMessage(error.message);
      setLoading(false);
      return;
    }

    if (!data || data.length === 0) {
      setErrorMessage("No active questions are available yet.");
      setLoading(false);
      return;
    }

    setQuestions(data as Question[]);

    const { data: attemptData, error: attemptError } =
      await supabase
        .from("attempts")
        .insert({
          user_id: user.id,
          total_questions: data.length,
          score: 0,
        })
        .select("id")
        .single();

    if (attemptError) {
      setErrorMessage(
        `Questions loaded, but the practice session could not be created: ${attemptError.message}`
      );
      setLoading(false);
      return;
    }

    setAttempt(attemptData);
    setLoading(false);
  }

  function getOptionText(
    question: Question,
    option: string
  ) {
    if (option === "A") return question.option_a;
    if (option === "B") return question.option_b;
    if (option === "C") return question.option_c;
    return question.option_d;
  }

  function normalizeAnswer(answer: string) {
    const cleaned = answer.trim().toUpperCase();

    if (cleaned.startsWith("A")) return "A";
    if (cleaned.startsWith("B")) return "B";
    if (cleaned.startsWith("C")) return "C";
    if (cleaned.startsWith("D")) return "D";

    return cleaned;
  }

  async function selectAnswer(answer: string) {
    if (answered || saving) return;

    const question = questions[currentIndex];

    if (!question || !attempt || !userId) return;

    setSelectedAnswer(answer);
    setAnswered(true);
    setSaving(true);

    const normalizedCorrect = normalizeAnswer(
      question.correct_answer
    );

    const isCorrect =
      answer === normalizedCorrect;

    if (isCorrect) {
      setScore((previous) => previous + 1);
    }

    setAnsweredCount((previous) => previous + 1);

    const { error } = await supabase
      .from("attempt_answers")
      .insert({
        attempt_id: attempt.id,
        user_id: userId,
        question_id: question.id,
        selected_answer: answer,
        is_correct: isCorrect,
      });

    if (error) {
      setErrorMessage(
        `Your answer was shown, but it could not be saved: ${error.message}`
      );
    }

    const nextAnsweredCount = answeredCount + 1;
    const nextScore =
      score + (isCorrect ? 1 : 0);

    await supabase
      .from("attempts")
      .update({
        score: nextScore,
        answered_questions: nextAnsweredCount,
      })
      .eq("id", attempt.id)
      .eq("user_id", userId);

    setSaving(false);
  }

  function goToNextQuestion() {
    if (currentIndex >= questions.length - 1) {
      router.push(
        `/practice/result?score=${score}&total=${questions.length}&attempt=${attempt?.id ?? ""}`
      );
      return;
    }

    setCurrentIndex((previous) => previous + 1);
    setSelectedAnswer("");
    setAnswered(false);
    setErrorMessage("");
  }

  function getOptionClass(option: string) {
    if (!answered) {
      return "practice-option";
    }

    const question = questions[currentIndex];
    const correct = normalizeAnswer(
      question.correct_answer
    );

    if (option === correct) {
      return "practice-option practice-option-correct";
    }

    if (
      option === selectedAnswer &&
      option !== correct
    ) {
      return "practice-option practice-option-wrong";
    }

    return "practice-option practice-option-disabled";
  }

  if (loading) {
    return (
      <main className="practice-page">
        <div className="practice-loading">
          <div className="loading-mark">N</div>
          <p>Loading practice session...</p>
        </div>
      </main>
    );
  }

  if (errorMessage && questions.length === 0) {
    return (
      <main className="practice-page">
        <div className="practice-message-card">
          <h1>Practice unavailable</h1>
          <p>{errorMessage}</p>

          <Link
            href="/dashboard"
            className="practice-button"
          >
            Back to Dashboard
          </Link>
        </div>
      </main>
    );
  }

  const question = questions[currentIndex];

  const progress =
    ((currentIndex + 1) / questions.length) * 100;

  const correctAnswer =
    normalizeAnswer(question.correct_answer);

  const isCurrentCorrect =
    selectedAnswer === correctAnswer;

  return (
    <main className="practice-page">
      <header className="practice-topbar">
        <div className="practice-container practice-nav">
          <Link
            href="/dashboard"
            className="practice-brand"
          >
            <div className="brand-mark">N</div>
            <span>NEET-PG Master</span>
          </Link>

          <div className="practice-session-score">
            Score: <strong>{score}</strong>
          </div>
        </div>
      </header>

      <section className="practice-container practice-main">
        <div className="practice-header">
          <div>
            <span className="practice-eyebrow">
              PRACTICE SESSION
            </span>

            <h1>NEET-PG MCQs</h1>
          </div>

          <div className="practice-progress-text">
            Question {currentIndex + 1} of{" "}
            {questions.length}
          </div>
        </div>

        <div className="practice-progress-bar">
          <div
            className="practice-progress-fill"
            style={{ width: `${progress}%` }}
          />
        </div>

        <article className="question-card">
          <div className="question-meta">
            {question.subject && (
              <span>{question.subject}</span>
            )}

            {question.unit && (
              <span>{question.unit}</span>
            )}

            {question.difficulty && (
              <span>{question.difficulty}</span>
            )}

            {question.year && (
              <span>PYQ {question.year}</span>
            )}
          </div>

          <div className="question-number">
            Question {currentIndex + 1}
          </div>

          <h2 className="question-text">
            {question.question}
          </h2>

          {question.image_url && (
            <div className="question-image-wrapper">
              <img
                src={question.image_url}
                alt="Question illustration"
                className="question-image"
              />
            </div>
          )}

          <div className="options-list">
            {OPTION_KEYS.map((option) => (
              <button
                key={option}
                type="button"
                className={getOptionClass(option)}
                onClick={() =>
                  selectAnswer(option)
                }
                disabled={answered || saving}
              >
                <span className="option-letter">
                  {option}
                </span>

                <span className="option-text">
                  {getOptionText(question, option)}
                </span>
              </button>
            ))}
          </div>

          {answered && (
            <div
              className={
                isCurrentCorrect
                  ? "answer-feedback answer-feedback-correct"
                  : "answer-feedback answer-feedback-wrong"
              }
            >
              <div className="answer-feedback-title">
                {isCurrentCorrect
                  ? "✓ Correct"
                  : `✕ Incorrect — Correct answer: ${correctAnswer}`}
              </div>

              {question.explanation && (
                <div className="answer-explanation">
                  <strong>Explanation</strong>

                  <p>
                    {question.explanation}
                  </p>
                </div>
              )}
            </div>
          )}

          {errorMessage && (
            <div className="practice-inline-error">
              {errorMessage}
            </div>
          )}

          {answered && (
            <div className="question-footer">
              <span>
                {answeredCount} of{" "}
                {questions.length} answered
              </span>

              <button
                type="button"
                className="practice-next-button"
                onClick={goToNextQuestion}
              >
                {currentIndex ===
                questions.length - 1
                  ? "Finish Session"
                  : "Next Question →"}
              </button>
            </div>
          )}
        </article>
      </section>
    </main>
  );
}
