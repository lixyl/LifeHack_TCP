import { useLocation, useNavigate } from "react-router";
import { useEffect, useMemo, useState } from "react";
import { generateChallenges } from "../analysis";
import type {
  AnalysisResult,
  Challenge,
  ChallengeType,
  ChallengeStatus,
} from "../analysis";

// ── Constants ─────────────────────────────────────────────────────────────────

const STATUS_SYMBOL: Record<ChallengeStatus, string> = {
  PASSED: "✓",
  PARTIAL: "△",
  FAILED: "×",
};

const STATUS_COLOR: Record<ChallengeStatus, string> = {
  PASSED: "#4ade80",
  PARTIAL: "#f59e0b",
  FAILED: "#f87171",
};

const FILTERS: Array<"All" | ChallengeType> = [
  "All",
  "Persona",
  "Context",
  "Intent",
  "Comparison",
];

// ── Confidence bar ────────────────────────────────────────────────────────────

function ConfBar({ confidence, status }: { confidence: number; status: ChallengeStatus }) {
  const [w, setW] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setW(confidence), 120);
    return () => clearTimeout(t);
  }, [confidence]);

  const color = STATUS_COLOR[status];
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--color-text-dim)" }}>
          AI confidence
        </span>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color }}>{confidence}%</span>
      </div>
      <div style={{ height: 4, background: "#1e2230", borderRadius: 1 }}>
        <div
          style={{
            height: "100%", width: `${w}%`, background: color,
            borderRadius: 1, boxShadow: `0 0 8px ${color}50`,
            transition: "width 0.9s cubic-bezier(0.4,0,0.2,1)",
          }}
        />
      </div>
    </div>
  );
}

// ── Inline expand panel ───────────────────────────────────────────────────────

function InlinePanel({
  challenge,
  onClose,
}: {
  challenge: Challenge;
  onClose: () => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const [freeText, setFreeText] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const { panel } = challenge;

  function handleSubmit() {
    if (!selected && !freeText.trim()) return;
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div
        className="inline-panel"
        style={{ animation: "expandDown 0.25s ease forwards" }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--color-text-dim)", letterSpacing: "0.12em", textTransform: "uppercase" }}>
            Knowledge Updated
          </span>
          <button className="term-btn" onClick={onClose} style={{ color: "var(--color-text-dim)", borderColor: "var(--color-border)", fontSize: 11, padding: "3px 10px" }}>
            [ Close ]
          </button>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 18, color: "#4ade80" }}>✓</span>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--color-text)", margin: 0 }}>
            This information will improve AI confidence for this challenge.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="inline-panel" style={{ animation: "expandDown 0.25s ease forwards" }}>

      {/* Header row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
        <div>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--color-text-dim)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 4 }}>
            Help AI Understand
          </p>
          {/* Missing knowledge chips */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {panel.missingKnowledge.map((item) => (
              <span key={item} style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "#f87171", background: "#f8717115", border: "1px solid #f8717130", borderRadius: 3, padding: "2px 8px" }}>
                ✕ {item}
              </span>
            ))}
          </div>
        </div>
        <button
          className="term-btn"
          onClick={onClose}
          style={{ color: "var(--color-text-dim)", borderColor: "var(--color-border)", fontSize: 11, padding: "3px 10px", flexShrink: 0, alignSelf: "flex-start" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--color-text-dim)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--color-border)"; }}
        >
          [ Skip ]
        </button>
      </div>

      {/* Why it failed */}
      <p style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--color-text-dim)", lineHeight: 1.65, marginBottom: 20, borderLeft: "2px solid var(--color-border)", paddingLeft: 12 }}>
        {panel.whyFailed}
      </p>

      {/* The question */}
      <p style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--color-text)", lineHeight: 1.55, marginBottom: 14 }}>
        ◈ {panel.question}
      </p>

      {/* Options — listed directly, not a dropdown */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
        {panel.options.map((opt, i) => {
          const active = selected === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => setSelected(active ? null : opt.value)}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 12,
                fontFamily: "var(--font-mono)",
                fontSize: 12,
                color: active ? "var(--color-accent)" : "var(--color-text)",
                background: active ? "var(--color-accent-dim)" : "#ffffff05",
                border: `1px solid ${active ? "var(--color-accent)" : "var(--color-border)"}`,
                borderRadius: 3,
                padding: "10px 14px",
                cursor: "pointer",
                textAlign: "left",
                lineHeight: 1.4,
                transition: "background 0.12s, border-color 0.12s, color 0.12s",
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "#3a405a";
                  (e.currentTarget as HTMLButtonElement).style.background = "#ffffff0a";
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--color-border)";
                  (e.currentTarget as HTMLButtonElement).style.background = "#ffffff05";
                }
              }}
            >
              <span style={{ color: active ? "var(--color-accent)" : "var(--color-muted)", flexShrink: 0, minWidth: 18 }}>
                {active ? "◉" : "○"}
              </span>
              <span>
                <span style={{ color: "var(--color-muted)", marginRight: 8 }}>{i + 1}.</span>
                {opt.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Free text box */}
      <textarea
        value={freeText}
        onChange={(e) => setFreeText(e.target.value)}
        placeholder="Add more context or your own answer… (optional)"
        rows={3}
        style={{
          width: "100%",
          fontFamily: "var(--font-mono)",
          fontSize: 12,
          color: "var(--color-text)",
          background: "#ffffff05",
          border: "1px solid var(--color-border)",
          borderRadius: 3,
          padding: "10px 14px",
          resize: "none",
          outline: "none",
          lineHeight: 1.55,
          transition: "border-color 0.15s",
          marginBottom: 14,
          boxSizing: "border-box",
        }}
        onFocus={(e) => { (e.currentTarget as HTMLTextAreaElement).style.borderColor = "var(--color-accent)"; }}
        onBlur={(e) => { (e.currentTarget as HTMLTextAreaElement).style.borderColor = "var(--color-border)"; }}
      />

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={!selected && !freeText.trim()}
        className="term-btn"
        style={{
          color: selected || freeText.trim() ? "var(--color-accent)" : "var(--color-muted)",
          borderColor: selected || freeText.trim() ? "var(--color-accent)" : "var(--color-border)",
          cursor: selected || freeText.trim() ? "pointer" : "default",
          width: "100%",
          textAlign: "center",
          padding: "9px 14px",
        }}
        onMouseEnter={(e) => {
          if (selected || freeText.trim()) {
            (e.currentTarget as HTMLButtonElement).style.background = "var(--color-accent)";
            (e.currentTarget as HTMLButtonElement).style.color = "#fff";
          }
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = "transparent";
          (e.currentTarget as HTMLButtonElement).style.color = selected || freeText.trim() ? "var(--color-accent)" : "var(--color-muted)";
        }}
      >
        [ Update Knowledge ]
      </button>
    </div>
  );
}

// ── Challenge card ────────────────────────────────────────────────────────────

function ChallengeCard({
  c,
  index,
  expanded,
  onToggle,
}: {
  c: Challenge;
  index: number;
  expanded: boolean;
  onToggle: () => void;
}) {
  const color = STATUS_COLOR[c.status];
  const sym = STATUS_SYMBOL[c.status];

  return (
    <div style={{ animation: `fadeUp 0.35s ease ${index * 80}ms both` }}>
      {/* Card body */}
      <div
        className="term-card"
        style={{ borderBottomLeftRadius: expanded ? 0 : 3, borderBottomRightRadius: expanded ? 0 : 3, borderBottom: expanded ? "1px solid var(--color-accent)30" : "1px solid var(--color-border)" }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--color-text)", display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ color: "var(--color-text-dim)" }}>{c.icon}</span>
            {c.type} Challenge
          </span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color, letterSpacing: "0.1em" }}>
            {sym} {c.status}
          </span>
        </div>

        <div style={{ borderLeft: "2px solid var(--color-border)", paddingLeft: 12, marginBottom: 14 }}>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--color-text)", lineHeight: 1.6, margin: 0 }}>
            "{c.query}"
          </p>
        </div>

        <ConfBar confidence={c.confidence} status={c.status} />

        {c.missing && (
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--color-text-dim)", margin: "12px 0 0" }}>
            Missing: <span style={{ color: "#f59e0b" }}>{c.missing}</span>
          </p>
        )}

        {c.status !== "PASSED" && (
          <button
            className="term-btn"
            onClick={onToggle}
            style={{
              marginTop: 14,
              color: expanded ? "var(--color-text-dim)" : "var(--color-accent)",
              borderColor: expanded ? "var(--color-border)" : "var(--color-accent)",
            }}
            onMouseEnter={(e) => {
              if (!expanded) {
                (e.currentTarget as HTMLButtonElement).style.background = "var(--color-accent)";
                (e.currentTarget as HTMLButtonElement).style.color = "#fff";
              }
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "transparent";
              (e.currentTarget as HTMLButtonElement).style.color = expanded ? "var(--color-text-dim)" : "var(--color-accent)";
            }}
          >
            {expanded ? "[ Close ↑ ]" : "[ Help AI Understand → ]"}
          </button>
        )}
      </div>

      {/* Inline expansion */}
      {expanded && (
        <InlinePanel challenge={c} onClose={onToggle} />
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function Challenge() {
  const location = useLocation();
  const navigate = useNavigate();
  const { result, description } = (location.state ?? {}) as {
    result: AnalysisResult;
    description: string;
  };

  useEffect(() => {
    if (!result) navigate("/", { replace: true });
  }, [result, navigate]);

  const report = useMemo(
    () => (result ? generateChallenges(description, result) : null),
    [description, result]
  );

  const [filter, setFilter] = useState<"All" | ChallengeType>("All");
  const [readBar, setReadBar] = useState(0);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    if (!report) return;
    const t = setTimeout(() => setReadBar(report.readiness), 300);
    return () => clearTimeout(t);
  }, [report]);

  if (!report) return null;

  const visible =
    filter === "All"
      ? report.challenges
      : report.challenges.filter((c) => c.type === filter);

  const readColor =
    report.readiness >= 70 ? "#4ade80" :
    report.readiness >= 45 ? "#f59e0b" : "#f87171";

  function toggleExpand(id: number) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "40px 24px" }}>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes expandDown {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .term-outer {
          max-width: 780px;
          margin: 0 auto;
          border: 1px solid var(--color-border);
          border-radius: 4px;
        }
        .term-topbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 14px 20px;
          border-bottom: 1px solid var(--color-border);
        }
        .term-inner { padding: 20px; }
        .term-section-label {
          font-family: var(--font-mono);
          font-size: 11px;
          letter-spacing: 0.12em;
          color: var(--color-text-dim);
          margin: 0 0 14px;
          text-transform: uppercase;
        }
        .term-readiness {
          border: 1px solid var(--color-border);
          border-radius: 3px;
          padding: 16px 20px;
          margin-bottom: 24px;
        }
        .term-score {
          font-family: var(--font-mono);
          font-size: 28px;
          color: var(--color-text);
          margin: 0 0 10px;
          letter-spacing: 0.04em;
        }
        .term-stats {
          display: flex;
          gap: 24px;
          font-size: 12px;
          font-family: var(--font-mono);
          color: var(--color-text-dim);
        }
        .term-filters {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 22px;
        }
        .term-filter {
          font-family: var(--font-mono);
          font-size: 12px;
          background: transparent;
          border: 1px solid var(--color-border);
          color: var(--color-text-dim);
          padding: 5px 13px;
          border-radius: 2px;
          cursor: pointer;
          transition: border-color 0.15s, color 0.15s;
        }
        .term-filter:hover { border-color: var(--color-text-dim); color: var(--color-text); }
        .term-filter.active { border-color: var(--color-accent); color: var(--color-accent); }

        .term-cards { display: flex; flex-direction: column; gap: 16px; }

        .term-card {
          border: 1px solid var(--color-border);
          border-radius: 3px;
          padding: 18px 20px;
          background: var(--color-surface-2);
          transition: border-color 0.15s;
        }
        .term-card:hover { border-color: #2e334a; }

        .inline-panel {
          border: 1px solid var(--color-border);
          border-top: none;
          border-radius: 0 0 3px 3px;
          padding: 20px;
          background: var(--color-surface);
          border-left-color: var(--color-accent);
          border-right-color: var(--color-accent);
          border-bottom-color: var(--color-accent);
        }

        .term-btn {
          font-family: var(--font-mono);
          font-size: 12px;
          background: transparent;
          border: 1px solid;
          border-radius: 2px;
          padding: 6px 14px;
          cursor: pointer;
          transition: background 0.15s, color 0.15s;
          letter-spacing: 0.03em;
        }

        .back-row {
          max-width: 780px;
          margin: 0 auto 18px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          animation: fadeUp 0.35s ease forwards;
        }

        textarea:focus { outline: none; }

        @media (max-width: 600px) {
          .term-stats { flex-wrap: wrap; gap: 12px; }
        }
      `}</style>

      {/* Back row */}
      <div className="back-row">
        <button
          className="term-btn"
          style={{ color: "var(--color-text-dim)", borderColor: "var(--color-border)" }}
          onClick={() => navigate("/results", { state: { result, description } })}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--color-text-dim)"; (e.currentTarget as HTMLButtonElement).style.color = "var(--color-text)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--color-border)"; (e.currentTarget as HTMLButtonElement).style.color = "var(--color-text-dim)"; }}
        >
          ← Back to report
        </button>
        <button
          className="term-btn"
          style={{ color: "var(--color-text-dim)", borderColor: "var(--color-border)" }}
          onClick={() => navigate("/")}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--color-text-dim)"; (e.currentTarget as HTMLButtonElement).style.color = "var(--color-text)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--color-border)"; (e.currentTarget as HTMLButtonElement).style.color = "var(--color-text-dim)"; }}
        >
          New analysis
        </button>
      </div>

      {/* Terminal frame */}
      <div className="term-outer" style={{ animation: "fadeUp 0.4s ease 0.05s both" }}>
        <div className="term-topbar">
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--color-text)" }}>AI Challenge Lab</span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--color-text-dim)" }}>
            {report.productName || "Your Product"}
          </span>
        </div>

        <div className="term-inner">
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--color-text-dim)", margin: "0 0 22px" }}>
            Test how well AI understands your product.
          </p>

          {/* AI Readiness */}
          <div className="term-readiness">
            <p className="term-section-label">AI Readiness</p>
            <p className="term-score" style={{ color: readColor }}>
              {report.readiness}{" "}
              <span style={{ fontSize: 16, color: "var(--color-text-dim)" }}>/ 100</span>
            </p>
            <div style={{ height: 3, background: "#1e2230", borderRadius: 1, marginBottom: 14 }}>
              <div
                style={{
                  height: "100%", width: `${readBar}%`, background: readColor,
                  borderRadius: 1, boxShadow: `0 0 10px ${readColor}50`,
                  transition: "width 1.1s cubic-bezier(0.4,0,0.2,1)",
                }}
              />
            </div>
            <div className="term-stats">
              <span style={{ color: "#4ade80" }}>{report.passed} {STATUS_SYMBOL.PASSED} Passed</span>
              <span style={{ color: "#f59e0b" }}>{report.partial} {STATUS_SYMBOL.PARTIAL} Partial</span>
              <span style={{ color: "#f87171" }}>{report.failed} {STATUS_SYMBOL.FAILED} Failed</span>
            </div>
          </div>

          {/* Filters */}
          <p className="term-section-label">Consumer Challenges</p>
          <div className="term-filters">
            {FILTERS.map((f) => (
              <button
                key={f}
                className={`term-filter${filter === f ? " active" : ""}`}
                onClick={() => setFilter(f)}
              >
                [ {f} ]
              </button>
            ))}
          </div>

          {/* Cards */}
          <div className="term-cards">
            {visible.map((c, i) => (
              <ChallengeCard
                key={c.id}
                c={c}
                index={i}
                expanded={expandedId === c.id}
                onToggle={() => toggleExpand(c.id)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Submit bar */}
      <div
        style={{
          maxWidth: 780,
          margin: "24px auto 0",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          animation: "fadeUp 0.4s ease 0.3s both",
        }}
      >
        <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--color-text-dim)", margin: 0 }}>
          Answer as many challenges as you like, then submit to generate a refined description.
        </p>
        <button
          className="term-btn"
          onClick={() => navigate("/refine", { state: { result, description } })}
          style={{
            color: "#fff",
            borderColor: "var(--color-accent)",
            background: "var(--color-accent)",
            padding: "10px 28px",
            fontSize: 13,
            flexShrink: 0,
            letterSpacing: "0.06em",
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "0.85"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "1"; }}
          onMouseDown={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(0.97)"; }}
          onMouseUp={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)"; }}
        >
          [ Submit & Refine → ]
        </button>
      </div>
    </div>
  );
}
