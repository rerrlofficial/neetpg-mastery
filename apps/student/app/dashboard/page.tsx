"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

type Profile = {
  full_name: string | null;
  target_exam_year: number | null;
};

export default function StudentDashboard() {
  const router = useRouter();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [questionCount, setQuestionCount] = useState(0);
  const [attemptCount, setAttemptCount] = useState(0);
  const [bookmarkCount, setBookmarkCount] = useState(0);

  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
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

    const [profileResult, questionsResult, attemptsResult, bookmarksResult] =
      await Promise.all([
        supabase
          .from("profiles")
          .select("full_name, target_exam_year")
          .eq("id", user.id)
          .maybeSingle(),

        supabase
          .from("questions")
          .select("id", { count: "exact", head: true })
          .eq("is_active", true),

        supabase
          .from("attempts")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id),

        supabase
          .from("bookmarks")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id),
      ]);

    if (profileResult.error) {
      setErrorMessage(profileResult.error.message);
    } else {
      setProfile(profileResult.data);
    }

    if (!questionsResult.error) {
      setQuestionCount(questionsResult.count ?? 0);
    }

    if (!attemptsResult.error) {
      setAttemptCount(attemptsResult.count ?? 0);
    }

    if (!bookmarksResult.error) {
      setBookmarkCount(bookmarksResult.count ?? 0);
    }

    setLoading(false);
  }

  async function handleLogout() {
    setLoggingOut(true);

    await supabase.auth.signOut();

    router.replace("/login");
    router.refresh();
  }

  if (loading) {
    return (
      <main className="dashboard-page">
        <div className="dashboard-loading">
          <div className="loading-mark">N</div>
          <p>Loading your dashboard...</p>
        </div>
      </main>
    );
  }

  const displayName =
    profile?.full_name?.trim() || "Student";

  return (
    <main className="dashboard-page">
      <header className="dashboard-topbar">
        <div className="dashboard-container dashboard-nav">
          <Link href="/dashboard" className="dashboard-brand">
            <div className="brand-mark">N</div>

            <div>
              <div className="dashboard-brand-title">
                NEET-PG Master
              </div>

              <div className="dashboard-brand-subtitle">
                Student Portal
              </div>
            </div>
          </Link>

          <button
            type="button"
            className="logout-button"
            onClick={handleLogout}
            disabled={loggingOut}
          >
            {loggingOut ? "Logging out..." : "Logout"}
          </button>
        </div>
      </header>

      <section className="dashboard-container dashboard-main">
        <div className="dashboard-welcome">
          <div>
            <span className="dashboard-eyebrow">
              STUDENT DASHBOARD
            </span>

            <h1>
              Welcome, {displayName.split(" ")[0]} 👋
            </h1>

            <p>
              Stay consistent. Practice daily. Improve your rank.
            </p>
          </div>

          <Link
            href="/practice"
            className="dashboard-primary-button"
          >
            Start Practice
          </Link>
        </div>

        {errorMessage && (
          <div className="dashboard-error">
            {errorMessage}
          </div>
        )}

        <div className="dashboard-stats">
          <div className="dashboard-stat-card">
            <div className="dashboard-stat-icon">Q</div>

            <div>
              <div className="dashboard-stat-value">
                {questionCount}
              </div>

              <div className="dashboard-stat-label">
                Questions Available
              </div>
            </div>
          </div>

          <div className="dashboard-stat-card">
            <div className="dashboard-stat-icon">✓</div>

            <div>
              <div className="dashboard-stat-value">
                {attemptCount}
              </div>

              <div className="dashboard-stat-label">
                Questions Attempted
              </div>
            </div>
          </div>

          <div className="dashboard-stat-card">
            <div className="dashboard-stat-icon">★</div>

            <div>
              <div className="dashboard-stat-value">
                {bookmarkCount}
              </div>

              <div className="dashboard-stat-label">
                Bookmarked
              </div>
            </div>
          </div>
        </div>

        <div className="dashboard-section-heading">
          <div>
            <h2>Prepare</h2>
            <p>Choose how you want to study today.</p>
          </div>
        </div>

        <div className="dashboard-action-grid">
          <Link
            href="/practice"
            className="dashboard-action-card dashboard-action-featured"
          >
            <div className="action-card-icon">▶</div>

            <div>
              <h3>Practice MCQs</h3>
              <p>
                Solve NEET-PG style questions with explanations
                and instant feedback.
              </p>
            </div>

            <span className="action-arrow">→</span>
          </Link>

          <Link
            href="/subjects"
            className="dashboard-action-card"
          >
            <div className="action-card-icon">📚</div>

            <div>
              <h3>Subjects</h3>
              <p>
                Practice questions subject-wise and focus on
                high-yield areas.
              </p>
            </div>

            <span className="action-arrow">→</span>
          </Link>

          <Link
            href="/bookmarks"
            className="dashboard-action-card"
          >
            <div className="action-card-icon">🔖</div>

            <div>
              <h3>Bookmarks</h3>
              <p>
                Revisit questions you saved for later revision.
              </p>
            </div>

            <span className="action-arrow">→</span>
          </Link>

          <Link
            href="/incorrect"
            className="dashboard-action-card"
          >
            <div className="action-card-icon">↻</div>

            <div>
              <h3>Incorrect Questions</h3>
              <p>
                Review questions you previously got wrong.
              </p>
            </div>

            <span className="action-arrow">→</span>
          </Link>

          <Link
            href="/performance"
            className="dashboard-action-card"
          >
            <div className="action-card-icon">▥</div>

            <div>
              <h3>Performance</h3>
              <p>
                Track accuracy, attempts and your preparation
                progress.
              </p>
            </div>

            <span className="action-arrow">→</span>
          </Link>

          <Link
            href="/profile"
            className="dashboard-action-card"
          >
            <div className="action-card-icon">👤</div>

            <div>
              <h3>My Profile</h3>
              <p>
                Manage your preparation profile and exam target.
              </p>
            </div>

            <span className="action-arrow">→</span>
          </Link>
        </div>

        <div className="dashboard-target-card">
          <div>
            <span className="dashboard-target-label">
              TARGET EXAM
            </span>

            <h2>
              NEET-PG{" "}
              {profile?.target_exam_year || 2027}
            </h2>

            <p>
              Your preparation dashboard is ready. The next
              module will bring the complete MCQ practice engine.
            </p>
          </div>

          <Link
            href="/practice"
            className="dashboard-outline-button"
          >
            Practice Now
          </Link>
        </div>
      </section>
    </main>
  );
}
