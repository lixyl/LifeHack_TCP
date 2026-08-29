import { useLocation, useNavigate } from "react-router";
import { useEffect, useState } from "react";
import type { AnalysisResult } from "../analysis";

type OutputState = {
  original: string;
  originalResult: AnalysisResult;
  refined: string;
  refinedResult: AnalysisResult;
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
      {/* Track shows old fill + new fill layered */}
      <div style={{ height: 6, background: "var(--color-border)", borderRadius: 3, position: "relative", overflow: "hidden" }}>
        {/* Ghost bar (before) */}
        <div
          style={{
            position: "absolute", inset: 0,
            width: `${before}%`, background: `${color}35`,
            borderRadius: 3,
          }}
        />
        {/* Live bar (after) */}
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
      onMouseEnter={(e) => {
        if (!copied) (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--color-accent)";
      }}
      onMouseLeave={(e) => {
        if (!copied) (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--color-border)";
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
  const { original, originalResult, refined, refinedResult } = state;

  useEffect(() => {
    if (!original) navigate("/", { replace: true });
  }, [original, navigate]);

  if (!original) return null;

  const COLORS = ["#7c6aff", "#22d3ee", "#f472b6", "#34d399", "#fb923c"];

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
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--color-accent)"; (e.currentTarget as HTMLButtonElement).style.color = "var(--color-accent)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--color-border)"; (e.currentTarget as HTMLButtonElement).style.color = "var(--color-text-dim)"; }}
          >
            ← New analysis
          </button>
        </div>

        {/* Score comparison */}
        <div className="out-card out-full" style={{ animation: "fadeUp 0.4s ease 0.08s both" }}>
          <p className="out-label">Score comparison</p>
          <div style={{ display: "flex", alignItems: "center", gap: 32, marginBottom: 24 }}>
            <GradeBadge grade={originalResult.grade} score={originalResult.overall} label="Before" />
            <div style={{ flex: 1, height: 1, background: "var(--color-border)" }} />
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 20, color: "#4ade80" }}>→</span>
            <div style={{ flex: 1, height: 1, background: "var(--color-border)" }} />
            <GradeBadge grade={refinedResult.grade} score={refinedResult.overall} label="After" />
          </div>
          {refinedResult.categories.map((cat, i) => (
            <DeltaBar
              key={cat.label}
              label={cat.label}
              before={originalResult.categories[i].score}
              after={cat.score}
              color={COLORS[i]}
              delay={i * 80}
            />
          ))}
        </div>

        {/* Refined description */}
        <div className="out-card out-full" style={{ animation: "fadeUp 0.4s ease 0.14s both" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <p className="out-label" style={{ margin: 0 }}>Refined description</p>
            <CopyButton text={refined} />
          </div>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--color-text)", lineHeight: 1.8, margin: 0, whiteSpace: "pre-wrap" }}>
            {refined}
          </p>
        </div>

        {/* Original vs refined side by side */}
        <div className="out-card" style={{ animation: "fadeUp 0.4s ease 0.2s both" }}>
          <p className="out-label">Original</p>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--color-text-dim)", lineHeight: 1.7, margin: 0, borderLeft: "2px solid var(--color-border)", paddingLeft: 14 }}>
            {original.length > 300 ? original.slice(0, 300).trimEnd() + "…" : original}
          </p>
        </div>

        <div className="out-card" style={{ animation: "fadeUp 0.4s ease 0.24s both", borderColor: "#7c6aff30" }}>
          <p className="out-label" style={{ color: "var(--color-accent)" }}>LLM Discoverability</p>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 24, color: refinedResult.llmScore >= 75 ? "#4ade80" : refinedResult.llmScore >= 50 ? "#fb923c" : "#f87171" }}>
              {refinedResult.llmScore}
            </span>
            <div style={{ flex: 1 }}>
              <div style={{ height: 4, background: "var(--color-border)", borderRadius: 2 }}>
                <div style={{ height: "100%", width: `${refinedResult.llmScore}%`, background: refinedResult.llmScore >= 75 ? "#4ade80" : refinedResult.llmScore >= 50 ? "#fb923c" : "#f87171", borderRadius: 2, transition: "width 1.2s ease 400ms" }} />
              </div>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: refinedResult.llmScore >= 75 ? "#4ade80" : refinedResult.llmScore >= 50 ? "#fb923c" : "#f87171", margin: "6px 0 0" }}>
                {refinedResult.llmVerdict}
              </p>
            </div>
          </div>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--color-text-dim)", lineHeight: 1.65, margin: 0 }}>
            {refinedResult.llmRationale}
          </p>
        </div>

        {/* CTA */}
        <div className="out-full" style={{ display: "flex", justifyContent: "center", gap: 12, animation: "fadeUp 0.4s ease 0.28s both" }}>
          <CopyButton text={refined} />
          <button
            onClick={() => navigate("/refine", { state: { result: originalResult, description: original } })}
            style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--color-text-dim)", background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 8, padding: "8px 18px", cursor: "pointer", transition: "border-color 0.15s, color 0.15s" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--color-accent)"; (e.currentTarget as HTMLButtonElement).style.color = "var(--color-accent)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--color-border)"; (e.currentTarget as HTMLButtonElement).style.color = "var(--color-text-dim)"; }}
          >
            Refine further
          </button>
        </div>
      </div>
    </div>
  );
}
