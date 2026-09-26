import { Suspense } from "react";
import ResultClient from "./ResultClient";

export default function PracticeResultPage() {
  return (
    <Suspense
      fallback={
        <main className="result-page">
          <div className="result-loading">
            <div className="loading-mark">N</div>

            <p>Loading result...</p>
          </div>
        </main>
      }
    >
      <ResultClient />
    </Suspense>
  );
}
