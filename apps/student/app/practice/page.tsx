"use client";

import {
  Suspense,
  useEffect,
  useRef,
  useState,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  is_pyq: boolean;
};

function PracticeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const subject = searchParams.get("subject") || "";
  const unit = searchParams.get("unit") || "";
  const difficulty = searchParams.get("difficulty") || "";
  const pyq = searchParams.get("pyq") || "all";

  const requestedCount = Number(
    searchParams.get("count") || "10"
  );

  const questionCount = [10, 20, 30, 50].includes(
    requestedCount
  )
    ? requestedCount
    : 10;

  const initializedRef = useRef(false);

  const [questions, setQuestions] = useState<Question[]>(
    []
  );

  const [currentIndex, setCurrentIndex] = useState(0);

  const [selectedAnswer, setSelectedAnswer] =
    useState<string | null>(null);

  const [showExplanation, setShowExplanation] =
    useState(false);

  const [score, setScore] = useState(0);

  const [answeredCount, setAnsweredCount] =
    useState(0);

  const [attemptId, setAttemptId] =
    useState<string | null>(null);

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

  useEffect(() => {
    if (initializedRef.current) {
      return;
    }

    initializedRef.current = true;

    startPractice();
  }, []);

  async function startPractice() {
    setLoading(true);
    setErrorMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.replace("/login");
      return;
    }

    let query = supabase
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
        year,
        is_pyq
        `
      )
      .eq("is_active", true);

    if (subject) {
      query = query.eq("subject", subject);
    }

    if (unit) {
      query = query.eq("unit", unit);
    }

    if (difficulty) {
      query = query.eq("difficulty", difficulty);
    }

    if (pyq === "pyq") {
      query = query.eq("is_pyq", true);
    }

    if (pyq === "non-pyq") {
      query = query.eq("is_pyq", false);
    }

    const { data, error } = await query;

    if (error) {
      setErrorMessage(error.message);
      setLoading(false);
      return;
    }

    if (!data || data.length === 0) {
      setErrorMessage(
        "No questions match the selected filters. Try changing the subject, unit, difficulty or PYQ filter."
      );

      setLoading(false);
      return;
    }

    /*
     * Shuffle the matching question pool.
     * We fetch the matching pool first and then
     * randomly select the requested number.
     */
    const shuffled = [...(data as Question[])].sort(
      () => Math.random() - 0.5
    );

    const selectedQuestions = shuffled.slice(
      0,
      Math.min(questionCount, shuffled.length)
    );

    const { data: attempt, error: attemptError } =
      await supabase
        .from("attempts")
        .insert({
          user_id: user.id,
          total_questions: selectedQuestions.length,
          answered_questions: 0,
          correct_answers: 0,
          score_percent: 0,
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

    setQuestions(selectedQuestions);
    setAttemptId(attempt.id);
    setLoading(false);
  }

  async function selectAnswer(answer: string) {
    if (
      saving ||
      selectedAnswer ||
      !questions[currentIndex] ||
      !attemptId
    ) {
      return;
    }

    const currentQuestion =
      questions[currentIndex];

    const isCorrect =
      answer === currentQuestion.correct_answer;

    const nextScore = isCorrect
      ? score + 1
      : score;

    const nextAnsweredCount =
      answeredCount + 1;

    setSelectedAnswer(answer);
    setScore(nextScore);
    setAnsweredCount(nextAnsweredCount);
    setShowExplanation(true);
    setSaving(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setSaving(false);
      router.replace("/login");
      return;
    }

    const { error: answerError } =
      await supabase
        .from("attempt_answers")
        .insert({
          attempt_id: attemptId,
          user_id: user.id,
          question_id: currentQuestion.id,
          selected_answer: answer,
          is_correct: isCorrect,
        });

    if (answerError) {
      setErrorMessage(
        `Your answer could not be saved: ${answerError.message}`
      );

      setSaving(false);
      return;
    }

    const scorePercent =
      selectedQuestionsPercent(
        nextScore,
        questions.length
      );

    const { error: attemptUpdateError } =
      await supabase
        .from("attempts")
        .update({
          answered_questions:
            nextAnsweredCount,
          correct_answers: nextScore,
          score_percent: scorePercent,
        })
        .eq("id", attemptId)
        .eq("user_id", user.id);

    if (attemptUpdateError) {
      setErrorMessage(
        `Your answer was saved, but the practice score could not be updated: ${attemptUpdateError.message}`
      );
    }

    setSaving(false);
  }

  function selectedQuestionsPercent(
    correct: number,
    total: number
  ) {
    if (!total) {
      return 0;
    }

    return Number(
      ((correct / total) * 100).toFixed(2)
    );
  }

  function goToNextQuestion() {
    if (
      currentIndex >= questions.length - 1
    ) {
      if (attemptId) {
        router.push(
          `/practice/result?attempt=${attemptId}`
        );
      }

      return;
    }

    setCurrentIndex(
      (previous) => previous + 1
    );

    setSelectedAnswer(null);
    setShowExplanation(false);
  }

  if (loading) {
    return (
      <main className="practice-page">
        <div className="practice-loading">
          <div className="loading-mark">N</div>

          <p>
            Preparing your practice session...
          </p>
        </div>
      </main>
    );
  }

  if (errorMessage || questions.length === 0) {
    return (
      <main className="practice-page">
        <div className="practice-error">
          <div className="practice-error-icon">
            !
          </div>

          <h1>Practice unavailable</h1>

          <p>
            {errorMessage ||
              "No questions are available for this practice session."}
          </p>

          <button
            type="button"
            className="practice-primary-button"
            onClick={() =>
              router.push("/practice/setup")
            }
          >
            Change Filters
          </button>
        </div>
      </main>
    );
  }

  const currentQuestion =
    questions[currentIndex];

  const progress =
    ((currentIndex + 1) /
      questions.length) *
    100;

  const options = [
    {
      key: "A",
      text: currentQuestion.option_a,
    },
    {
      key: "B",
      text: currentQuestion.option_b,
    },
    {
      key: "C",
      text: currentQuestion.option_c,
    },
    {
      key: "D",
      text: currentQuestion.option_d,
    },
  ];

  return (
    <main className="practice-page">
      <header className="practice-topbar">
        <div className="practice-container practice-nav">
          <button
            type="button"
            className="practice-back-button"
            onClick={() =>
              router.push("/practice/setup")
            }
          >
            ←
          </button>

          <div className="practice-brand">
            <div className="brand-mark">N</div>

            <span>NEET-PG Master</span>
          </div>

          <div className="practice-counter">
            {currentIndex + 1} /{" "}
            {questions.length}
          </div>
        </div>
      </header>

      <section className="practice-container practice-main">
        <div className="practice-progress-wrapper">
          <div className="practice-progress-track">
            <div
              className="practice-progress-fill"
              style={{
                width: `${progress}%`,
              }}
            />
          </div>
        </div>

        <div className="practice-meta">
          <div>
            {currentQuestion.subject && (
              <span>
                {currentQuestion.subject}
              </span>
            )}

            {currentQuestion.unit && (
              <span>
                {currentQuestion.unit}
              </span>
            )}

            {currentQuestion.difficulty && (
              <span>
                {currentQuestion.difficulty}
              </span>
            )}

            {currentQuestion.is_pyq && (
              <span>PYQ</span>
            )}
          </div>

          <span>
            Score: {score}
          </span>
        </div>

        <article className="practice-card">
          <div className="practice-question-number">
            Question {currentIndex + 1}
          </div>

          <h1 className="practice-question">
            {currentQuestion.question}
          </h1>

          {currentQuestion.image_url && (
            <div className="practice-image-wrapper">
              <img
                src={currentQuestion.image_url}
                alt={
                  currentQuestion.question
                }
                className="practice-question-image"
              />
            </div>
          )}

          <div className="practice-options">
            {options.map((option) => {
              const isSelected =
                selectedAnswer ===
                option.key;

              const isCorrect =
                option.key ===
                currentQuestion.correct_answer;

              let className =
                "practice-option";

              if (selectedAnswer) {
                if (isCorrect) {
                  className +=
                    " practice-option-correct";
                } else if (isSelected) {
                  className +=
                    " practice-option-wrong";
                }
              }

              return (
                <button
                  key={option.key}
                  type="button"
                  className={className}
                  onClick={() =>
                    selectAnswer(
                      option.key
                    )
                  }
                  disabled={
                    !!selectedAnswer ||
                    saving
                  }
                >
                  <span className="practice-option-key">
                    {option.key}
                  </span>

                  <span className="practice-option-text">
                    {option.text}
                  </span>
                </button>
              );
            })}
          </div>

          {showExplanation && (
            <div className="practice-explanation">
              <div className="practice-explanation-title">
                Explanation
              </div>

              <p>
                {currentQuestion.explanation ||
                  "No explanation is available for this question."}
              </p>
            </div>
          )}

          {showExplanation && (
            <button
              type="button"
              className="practice-next-button"
              onClick={goToNextQuestion}
              disabled={saving}
            >
              {saving
                ? "Saving..."
                : currentIndex ===
                    questions.length - 1
                  ? "View Result"
                  : "Next Question →"}
            </button>
          )}
        </article>
      </section>
    </main>
  );
}

function PracticeLoading() {
  return (
    <main className="practice-page">
      <div className="practice-loading">
        <div className="loading-mark">N</div>

        <p>Loading practice...</p>
      </div>
    </main>
  );
}

export default function PracticePage() {
  return (
    <Suspense fallback={<PracticeLoading />}>
      <PracticeContent />
    </Suspense>
  );
}
