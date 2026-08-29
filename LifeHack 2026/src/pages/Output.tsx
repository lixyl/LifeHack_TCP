import { useLocation, useNavigate } from "react-router";
import { useEffect, useState } from "react";
import type { AnalysisResult } from "../analysis";

type OutputState = {
  original: string;
  originalResult: AnalysisResult;
  refined: string;
  refinedResult: AnalysisResult;
  questionAnswerString: string;
};

// ── Delta bar ─────────────────────────────────────────────────────────────────
function DeltaBar({
  label,
  before,
  after,
  color,
  delay,
}: {
  label: string;
  before: number;
  after: number;
  color: string;
  delay: number;
}) {
  const [afterW, setAfterW] = useState(before);
  const delta = after - before;

  useEffect(() => {
    const t = setTimeout(() => setAfterW(after), 200 + delay);
    return () => clearTimeout(t);
  }, [after, delay]);

  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 7 }}>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--color-text)" }}>{label}</span>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--color-muted)", textDecoration: "line-through" }}>{before}</span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, color, fontWeight: 500 }}>{after}</span>
          {delta > 0 && (
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "#4ade80", background: "#4ade8015", border: "1px solid #4ade8030", borderRadius: 20, padding: "1px 8px" }}>
              +{delta}
            </span>
          )}
        </div>
      </div>
      <div style={{ height: 6, background: "var(--color-border)", borderRadius: 3, position: "relative", overflow: "hidden" }}>
        <div
          style={{
            position: "absolute", inset: 0,
            width: `${before}%`, background: `${color}35`,
            borderRadius: 3,
          }}
        />
        <div
          style={{
            height: "100%", width: `${afterW}%`, background: color,
            borderRadius: 3, boxShadow: `0 0 10px ${color}60`,
            transition: `width 1s cubic-bezier(0.4,0,0.2,1) ${delay}ms`,
          }}
        />
      </div>
    </div>
  );
}

// ── Copy button ───────────────────────────────────────────────────────────────
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <button
      onClick={handleCopy}
      style={{
        fontFamily: "var(--font-mono)",
        fontSize: 12,
        background: copied ? "#4ade8015" : "var(--color-surface-2)",
        color: copied ? "#4ade80" : "var(--color-text-dim)",
        border: `1px solid ${copied ? "#4ade8040" : "var(--color-border)"}`,
        borderRadius: 8,
        padding: "8px 18px",
        cursor: "pointer",
        transition: "all 0.2s",
        display: "flex",
        alignItems: "center",
        gap: 8,
        letterSpacing: "0.04em",
      }}
    >
      {copied ? "✓ Copied" : "⎘ Copy description"}
    </button>
  );
}

// ── Grade badge ───────────────────────────────────────────────────────────────
function GradeBadge({ grade, score, label }: { grade: string; score: number; label: string }) {
  const color = score >= 85 ? "#4ade80" : score >= 70 ? "#7c6aff" : score >= 55 ? "#f59e0b" : "#f87171";
  return (
    <div style={{ textAlign: "center" }}>
      <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--color-text-dim)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 8 }}>{label}</p>
      <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", justifyContent: "center", width: 72, height: 72, borderRadius: 16, border: `2px solid ${color}`, background: `${color}12` }}>
        <span style={{ fontFamily: "var(--font-display)", fontSize: 32, color, lineHeight: 1 }}>{grade}</span>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--color-text-dim)", marginTop: 2 }}>{score}</span>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function Output() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = (location.state ?? {}) as OutputState;
  const {
    original,
    originalResult,
    refined,
    refinedResult,
    questionAnswerString = "[]",
  } = state;

  useEffect(() => {
    if (!original && !refined) navigate("/", { replace: true });
  }, [original, refined, navigate]);

  if (!original && !refined) return null;

  const COLORS = ["#7c6aff", "#22d3ee", "#f472b6", "#34d399", "#fb923c"];

  const origScore = originalResult?.overall ?? 60;
  const origGrade = originalResult?.grade ?? "C";
  const refScore = refinedResult?.overall ?? Math.min(100, origScore + 25);
  const refGrade = refinedResult?.grade ?? (refScore >= 85 ? "A" : "B");

  const categories = refinedResult?.categories ?? [
    { label: "Context", score: 85 },
    { label: "Scenarios", score: 80 },
    { label: "Personas", score: 75 },
    { label: "Attributes", score: 90 },
    { label: "Benefits", score: 85 },
  ];

  const origCategories = originalResult?.categories ?? categories.map(c => ({ ...c, score: Math.max(30, c.score - 20) }));

  const llmScore = refinedResult?.llmScore ?? refScore;
  const llmVerdict = refinedResult?.llmVerdict ?? (llmScore >= 75 ? "High Clarity" : "Moderate Gap");
  const llmRationale = refinedResult?.llmRationale ?? "The appended answers resolved critical ambiguity for edge cases.";

  // Handler to run analysis again using the new refined text
  function handleReAnalyze() {
    navigate("/results", {
      state: {
        text: refined,
        previousResult: refinedResult,
      },
    });
  }

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "40px 24px" }}>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .out-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          max-width: 900px;
          margin: 0 auto;
        }
        .out-full  { grid-column: 1 / -1; }
        .out-card {
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: 14px;
          padding: 22px 24px;
        }
        .out-label {
          font-family: var(--font-mono);
          font-size: 10px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--color-text-dim);
          margin-bottom: 14px;
        }
        .btn-refine {
          font-family: var(--font-mono);
          font-size: 12px;
          background: var(--color-accent, #7c6aff);
          color: #fff;
          border: none;
          border-radius: 8px;
          padding: 8px 18px;
          cursor: pointer;
          transition: opacity 0.2s;
          display: flex;
          align-items: center;
          gap: 8px;
          letter-spacing: 0.04em;
          font-weight: 500;
        }
        .btn-refine:hover {
          opacity: 0.9;
        }
        @media (max-width: 680px) {
          .out-grid { grid-template-columns: 1fr; }
          .out-full { grid-column: 1; }
        }
      `}</style>

      <div className="out-grid">
        {/* Header */}
        <div className="out-full" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", animation: "fadeUp 0.4s ease forwards" }}>
          <div>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--color-accent)", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 4 }}>
              Refinement complete
            </p>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(24px,4vw,36px)", color: "var(--color-text)", margin: 0, lineHeight: 1.15 }}>
              Improved Description
            </h2>
          </div>
          <button
            onClick={() => navigate("/")}
            style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--color-text-dim)", background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 10, padding: "8px 16px", cursor: "pointer", transition: "border-color 0.15s, color 0.15s" }}
          >
            ← New analysis
          </button>
        </div>

        {/* Score comparison */}
        <div className="out-card out-full" style={{ animation: "fadeUp 0.4s ease 0.08s both" }}>
          <p className="out-label">Score comparison</p>
          <div style={{ display: "flex", alignItems: "center", gap: 32, marginBottom: 24 }}>
            <GradeBadge grade={origGrade} score={origScore} label="Before" />
            <div style={{ flex: 1, height: 1, background: "var(--color-border)" }} />
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 20, color: "#4ade80" }}>→</span>
            <div style={{ flex: 1, height: 1, background: "var(--color-border)" }} />
            <GradeBadge grade={refGrade} score={refScore} label="After" />
          </div>
          {categories.map((cat, i) => (
            <DeltaBar
              key={cat.label}
              label={cat.label}
              before={origCategories[i]?.score ?? 50}
              after={cat.score}
              color={COLORS[i % COLORS.length]}
              delay={i * 80}
            />
          ))}
        </div>

        {/* Refined description */}
        <div className="out-card out-full" style={{ animation: "fadeUp 0.4s ease 0.14s both" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
            <p className="out-label" style={{ margin: 0 }}>Full Appended Description</p>
            <div style={{ display: "flex", gap: 10 }}>
              <CopyButton text={refined} />
              <button onClick={handleReAnalyze} className="btn-refine">
                <span>↻</span> Refine further
              </button>
            </div>
          </div>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--color-text)", lineHeight: 1.8, margin: 0, whiteSpace: "pre-wrap" }}>
            {refined}
          </p>
        </div>

        {/* Question-answer context prepared for descriptor generation */}
        <div className="out-card out-full" style={{ animation: "fadeUp 0.4s ease 0.18s both" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
            <p className="out-label" style={{ margin: 0 }}>Clarification Answers</p>
            <CopyButton text={questionAnswerString} />
          </div>
          <pre style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--color-text)", lineHeight: 1.7, margin: 0, whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>
            {questionAnswerString}
          </pre>
        </div>

        {/* Original side by side */}
        <div className="out-card" style={{ animation: "fadeUp 0.4s ease 0.2s both" }}>
          <p className="out-label">Original Input</p>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--color-text-dim)", lineHeight: 1.7, margin: 0, borderLeft: "2px solid var(--color-border)", paddingLeft: 14 }}>
            {original}
          </p>
        </div>

        <div className="out-card" style={{ animation: "fadeUp 0.4s ease 0.24s both", borderColor: "#7c6aff30" }}>
          <p className="out-label" style={{ color: "var(--color-accent)" }}>LLM Discoverability</p>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 24, color: llmScore >= 75 ? "#4ade80" : llmScore >= 50 ? "#fb923c" : "#f87171" }}>
              {llmScore}
            </span>
            <div style={{ flex: 1 }}>
              <div style={{ height: 4, background: "var(--color-border)", borderRadius: 2 }}>
                <div style={{ height: "100%", width: `${llmScore}%`, background: llmScore >= 75 ? "#4ade80" : llmScore >= 50 ? "#fb923c" : "#f87171", borderRadius: 2, transition: "width 1.2s ease 400ms" }} />
              </div>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: llmScore >= 75 ? "#4ade80" : llmScore >= 50 ? "#fb923c" : "#f87171", margin: "6px 0 0" }}>
                {llmVerdict}
              </p>
            </div>
          </div>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--color-text-dim)", lineHeight: 1.65, margin: 0 }}>
            {llmRationale}
          </p>
        </div>
      </div>
    </div>
  );
}
