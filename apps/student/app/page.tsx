import Link from "next/link";

export default function StudentHome() {
  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="container">
          <div className="brand">
            <div className="brand-mark">N</div>
            <span>NEET-PG Master</span>
          </div>
        </div>
      </header>

      <section className="hero">
        <div className="container">
          <h1>
            Prepare smarter.
            <br />
            Practice better.
          </h1>

          <p>
            Your focused NEET-PG preparation platform for high-yield MCQs,
            clinical questions, explanations, revision and performance
            tracking.
          </p>

          <Link href="/login" className="primary-button">
            Start Preparing
          </Link>
        </div>
      </section>

      <section className="container">
        <div className="card-grid">
          <div className="card">
            <h2>Practice MCQs</h2>
            <p>
              Solve NEET-PG style questions with focused subject and topic
              practice.
            </p>
          </div>

          <div className="card">
            <h2>Learn from Explanations</h2>
            <p>
              Review the correct answer and explanation immediately after
              attempting a question.
            </p>
          </div>

          <div className="card">
            <h2>Track Your Progress</h2>
            <p>
              Build your performance history and identify topics that need
              more revision.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
