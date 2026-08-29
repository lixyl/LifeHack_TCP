import { useLocation, useNavigate } from "react-router";
import { useEffect, useState } from "react";
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
} from "recharts";
import type { AnalysisResult } from "../analysis";

// Priority badge mapping
function PriorityBadge({ priority }: { priority: string }) {
  const isHigh = priority === "high";
  const isMed = priority === "medium";
  const color = isHigh ? "#f87171" : isMed ? "#f59e0b" : "#4ade80";

  return (
    <span
      style={{
        fontFamily: "var(--font-mono)",
        fontSize: 10,
        color,
        border: `1px solid ${color}50`,
        background: `${color}14`,
        borderRadius: 12,
        padding: "2px 8px",
        textTransform: "uppercase",
        letterSpacing: "0.05em",
      }}
    >
      {priority} priority
    </span>
  );
}

// ── Animated score bar ────────────────────────────────────────────────────────
function ScoreBar({
  label,
  score,
  color,
  delay = 0,
}: {
  label: string;
  score: number;
  color: string;
  delay?: number;
}) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setWidth(score), 200 + delay);
    return () => clearTimeout(t);
  }, [score, delay]);

  return (
    <div style={{ marginBottom: 18 }}>
      <div
        style={{
          display: "flex",
          justifySpaceBetween: "space-between",
          marginBottom: 7,
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-body)",
            fontSize: 13,
            color: "var(--color-text)",
          }}
        >
          {label}
        </span>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 13,
            color,
            fontWeight: 500,
          }}
        >
          {score}
        </span>
      </div>
      <div
        style={{
          height: 6,
          background: "var(--color-border)",
          borderRadius: 3,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${width}%`,
            background: color,
            borderRadius: 3,
            transition: `width 1s cubic-bezier(0.4,0,0.2,1) ${delay}ms`,
            boxShadow: `0 0 10px ${color}60`,
          }}
        />
      </div>
    </div>
  );
}

// ── Grade badge ───────────────────────────────────────────────────────────────
function GradeBadge({ grade, score }: { grade: string; score: number }) {
  const color =
    score >= 85
      ? "#4ade80"
      : score >= 70
      ? "#7c6aff"
      : score >= 55
      ? "#f59e0b"
      : "#f87171";

  return (
    <div
      style={{
        display: "inline-flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        width: 80,
        height: 80,
        borderRadius: 20,
        border: `2px solid ${color}`,
        background: `${color}12`,
      }}
    >
      <span
        style={{
          fontFamily: "var(--font-display)",
          fontSize: 38,
          color,
          lineHeight: 1,
        }}
      >
        {grade}
      </span>
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 10,
          color: "var(--color-text-dim)",
          marginTop: 2,
        }}
      >
        {score}/100
      </span>
    </div>
  );
}

// ── LLM indicator ─────────────────────────────────────────────────────────────
function LLMIndicator({
  score,
  verdict,
  rationale,
}: {
  score: number;
  verdict: string;
  rationale: string;
}) {
  const color =
    score >= 75 ? "#34d399" : score >= 50 ? "#fb923c" : "#f87171";

  return (
    <div
      style={{
        background: "var(--color-surface-2)",
        border: `1px solid ${color}40`,
        borderRadius: 14,
        padding: "18px 20px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 10,
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            color: "var(--color-text-dim)",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          }}
        >
          LLM Discoverability
        </span>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            color,
            border: `1px solid ${color}50`,
            borderRadius: 20,
            padding: "3px 10px",
          }}
        >
          {verdict}
        </span>
      </div>
      {/* Score track */}
      <div
        style={{
          height: 4,
          background: "var(--color-border)",
          borderRadius: 2,
          marginBottom: 12,
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${score}%`,
            background: `linear-gradient(90deg, ${color}80, ${color})`,
            borderRadius: 2,
            transition: "width 1.2s cubic-bezier(0.4,0,0.2,1) 300ms",
            boxShadow: `0 0 8px ${color}50`,
          }}
        />
      </div>
      <p
        style={{
          fontFamily: "var(--font-body)",
          fontSize: 13,
          color: "var(--color-text-dim)",
          lineHeight: 1.65,
          margin: 0,
        }}
      >
        {rationale}
      </p>
    </div>
  );
}

// ── Main Results page ─────────────────────────────────────────────────────────
export default function Results() {
  const location = useLocation();
  const navigate = useNavigate();
  const { result, description } = (location.state ?? {}) as {
    result: AnalysisResult;
    description: string;
  };

  // State to track user responses per question
  const [answers, setAnswers] = useState<Record<string | number, string>>({});

  // Redirect home if landed without data
  useEffect(() => {
    if (!result) navigate("/", { replace: true });
  }, [result, navigate]);

  const questions = result?.questions ?? [];
  const confidenceScore = Math.round((result?.category_confidence ?? 0.85) * 100);
  const categoryName = result?.product_category ?? "General Product";

  // Force exact 5 pentagon vertices for the radar chart
  const pentagonCategories = [
    { key: "context", label: "Context", color: "#7c6aff" },
    { key: "special_scenarios", label: "Scenarios", color: "#38bdf8" },
    { key: "personas", label: "Personas", color: "#f59e0b" },
    { key: "product_attribute", label: "Attributes", color: "#4ade80" },
    { key: "benefits", label: "Benefits", color: "#f87171" },
  ];

  const categories = pentagonCategories.map((cat) => {
    const count = questions.filter((q) => q.category === cat.key).length;
    return {
      label: cat.label,
      score: Math.min(100, Math.max(30, count * 35)),
      color: cat.color,
    };
  });

  const [radarData, setRadarData] = useState(
    categories.map((c) => ({ subject: c.label, value: 0 }))
  );

  useEffect(() => {
    if (!result) return;
    const t = setTimeout(() => {
      setRadarData(
        categories.map((c) => ({ subject: c.label, value: c.score }))
      );
    }, 300);
    return () => clearTimeout(t);
  }, [result]);

  if (!result) return null;

  // Handlers for user choices
  const handleSelectOption = (questionKey: string | number, optionLabel: string) => {
    setAnswers((prev) => ({ ...prev, [questionKey]: optionLabel }));
  };

  const handleInputChange = (questionKey: string | number, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionKey]: value }));
  };

  const exportToFile = () => {
    const lines = [
      `PRODUCT ANALYSIS RESPONSE REPORT`,
      `Category: ${categoryName}`,
      `Overall Score: ${result.overall ?? confidenceScore}`,
      `Date: ${new Date().toLocaleString()}`,
      `--------------------------------------------------\n`,
    ];

    questions.forEach((q, idx) => {
      const qKey = q.id || idx;
      const userAns = answers[qKey] || "[No answer provided]";
      lines.push(`Q${idx + 1}: ${q.question}`);
      lines.push(`Category: ${q.category} | Priority: ${q.priority}`);
      lines.push(`Answer: ${userAns}`);
      lines.push(``);
    });

    const fileContent = lines.join("\n");
    const blob = new Blob([fileContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `clarification_answers_${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const preview =
    description && description.length > 180
      ? description.slice(0, 180).trimEnd() + "…"
      : description || "Product spec provided.";

  const overallScore = result.overall ?? confidenceScore;
  const grade = result.grade ?? (overallScore >= 85 ? "A" : overallScore >= 70 ? "B" : "C");
  const summaryText = result.summary ?? `Analyzed category "${categoryName}" with ${questions.length} generated clarification points.`;

  const llmScore = result.llmScore ?? overallScore;
  const llmVerdict = result.llmVerdict ?? (llmScore >= 75 ? "High Clarity" : "Moderate Gap");
  const llmRationale = result.llmRationale ?? `The product definition has clear attributes for ${categoryName}, but needs clarification on scenario edge cases.`;

  return (
    <div
      style={{
        flex: 1,
        overflowY: "auto",
        padding: "40px 24px",
      }}
    >
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .results-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          max-width: 1000px;
          margin: 0 auto;
        }
        .col-left  { grid-column: 1; }
        .col-right { grid-column: 2; }
        .col-full  { grid-column: 1 / -1; }

        @media (max-width: 760px) {
          .results-grid { grid-template-columns: 1fr; }
          .col-left, .col-right, .col-full { grid-column: 1; }
        }

        .card {
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: 16px;
          padding: 24px;
        }
        .section-label {
          font-family: var(--font-mono);
          font-size: 10px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--color-text-dim);
          margin-bottom: 14px;
        }

        .recharts-polar-grid-concentric-polygon { fill: none; }
        .recharts-polar-angle-axis-tick-value {
          font-family: var(--font-mono) !important;
          font-size: 11px !important;
          fill: var(--color-text-dim) !important;
        }
      `}</style>

      <div className="results-grid">

        {/* ── Header ── */}
        <div
          className="col-full"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            animation: "fadeUp 0.4s ease forwards",
          }}
        >
          <div>
            <p className="section-label" style={{ marginBottom: 4 }}>
              Analysis complete
            </p>
            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(24px,4vw,36px)",
                color: "var(--color-text)",
                margin: 0,
                lineHeight: 1.15,
              }}
            >
              Product Report
            </h2>
          </div>
          <button
            onClick={() => navigate("/")}
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 12,
              color: "var(--color-text-dim)",
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: 10,
              padding: "8px 16px",
              cursor: "pointer",
              transition: "border-color 0.15s, color 0.15s",
            }}
          >
            ← New analysis
          </button>
        </div>

        {/* ── Pentagon radar ── */}
        <div
          className="col-left card"
          style={{ animation: "fadeUp 0.4s ease 0.1s both" }}
        >
          <p className="section-label">Attribute radar</p>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ResponsiveContainer width="100%" height={280}>
              <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="72%">
                <PolarGrid
                  gridType="polygon"
                  stroke="#1e2230"
                  strokeWidth={1}
                />
                <PolarAngleAxis
                  dataKey="subject"
                  tick={{ fontFamily: "var(--font-mono)", fontSize: 11, fill: "#7a80a0" }}
                />
                <Radar
                  name="Score"
                  dataKey="value"
                  stroke="#7c6aff"
                  strokeWidth={2}
                  fill="#7c6aff"
                  fillOpacity={0.18}
                  dot={{ r: 4, fill: "#7c6aff", strokeWidth: 0 }}
                  isAnimationActive={true}
                  animationDuration={1200}
                  animationEasing="ease-out"
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "8px 16px",
              marginTop: 4,
            }}
          >
            {categories.map((c) => (
              <div
                key={c.label}
                style={{ display: "flex", alignItems: "center", gap: 6 }}
              >
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: c.color,
                  }}
                />
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 10,
                    color: "var(--color-text-dim)",
                  }}
                >
                  {c.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Score bars ── */}
        <div
          className="col-right card"
          style={{ animation: "fadeUp 0.4s ease 0.15s both" }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              marginBottom: 24,
            }}
          >
            <div>
              <p className="section-label">Overall score</p>
              <GradeBadge grade={grade} score={overallScore} />
            </div>
            <div style={{ textAlign: "right", maxWidth: 160 }}>
              <p
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: 12,
                  color: "var(--color-text-dim)",
                  lineHeight: 1.55,
                  margin: 0,
                }}
              >
                {summaryText}
              </p>
            </div>
          </div>
          <p className="section-label">Metrics breakdown</p>
          {categories.map((c, i) => (
            <ScoreBar
              key={c.label}
              label={c.label}
              score={c.score}
              color={c.color}
              delay={i * 80}
            />
          ))}
        </div>

        {/* ── Narrative summary ── */}
        <div
          className="col-full card"
          style={{ animation: "fadeUp 0.4s ease 0.2s both" }}
        >
          <p className="section-label">Narrative summary</p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 20,
            }}
          >
            <div>
              <p
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 10,
                  color: "var(--color-accent)",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  marginBottom: 10,
                }}
              >
                Your input
              </p>
              <p
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: 13,
                  color: "var(--color-text-dim)",
                  lineHeight: 1.7,
                  margin: 0,
                  borderLeft: "2px solid var(--color-border)",
                  paddingLeft: 14,
                }}
              >
                {preview}
              </p>
            </div>
            <div>
              <p
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 10,
                  color: "var(--color-accent)",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  marginBottom: 10,
                }}
              >
                AI assessment
              </p>
              <p
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: 13,
                  color: "var(--color-text)",
                  lineHeight: 1.7,
                  margin: 0,
                }}
              >
                {summaryText}
              </p>
            </div>
          </div>
        </div>

        {/* ── LLM discoverability ── */}
        <div
          className="col-full"
          style={{ animation: "fadeUp 0.4s ease 0.25s both" }}
        >
          <LLMIndicator
            score={llmScore}
            verdict={llmVerdict}
            rationale={llmRationale}
          />
        </div>

        {/* ── Clarification Questions Section ── */}
        <div className="col-full" style={{ animation: "fadeUp 0.4s ease 0.28s both" }}>
          <p className="section-label" style={{ marginBottom: 16 }}>
            Clarification Questions ({questions.length})
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {questions.map((q, idx) => {
              const qKey = q.id || idx;
              const selectedValue = answers[qKey] || "";

              return (
                <div key={qKey} className="card" style={{ padding: "20px 24px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--color-text-dim)", textTransform: "uppercase" }}>
                      {q.category.replace("_", " ")}
                    </span>
                    <PriorityBadge priority={q.priority} />
                  </div>

                  <h4 style={{ fontFamily: "var(--font-body)", fontSize: 15, color: "var(--color-text)", margin: "0 0 6px 0" }}>
                    {q.question}
                  </h4>

                  <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--color-text-dim)", margin: "0 0 14px 0" }}>
                    <strong style={{ color: "var(--color-text)" }}>Why it matters: </strong>
                    {q.why_it_matters}
                  </p>

                  {q.answer_type === "multiple_choice" && q.options && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {q.options.map((opt, i) => {
                        const isSelected = selectedValue === opt.label;
                        return (
                          <button
                            key={i}
                            type="button"
                            onClick={() => handleSelectOption(qKey, opt.label)}
                            style={{
                              fontFamily: "var(--font-mono)",
                              fontSize: 11,
                              color: isSelected ? "#fff" : "var(--color-text-dim)",
                              background: isSelected ? "var(--color-accent)" : "var(--color-surface-2)",
                              border: isSelected ? "1px solid var(--color-accent)" : "1px solid var(--color-border)",
                              borderRadius: 8,
                              padding: "6px 12px",
                              cursor: "pointer",
                              transition: "all 0.15s ease",
                            }}
                          >
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {q.answer_type === "number" && q.numeric_config && (
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <input
                        type="number"
                        placeholder={`Enter value (${q.numeric_config.unit})`}
                        value={selectedValue}
                        onChange={(e) => handleInputChange(qKey, e.target.value)}
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: 12,
                          color: "var(--color-text)",
                          background: "var(--color-surface-2)",
                          border: "1px solid var(--color-border)",
                          borderRadius: 8,
                          padding: "6px 12px",
                          outline: "none",
                        }}
                      />
                      <span
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: 11,
                          color: "var(--color-accent)",
                        }}
                      >
                        Unit: <strong>{q.numeric_config.unit}</strong>
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── CTA: Challenge Lab & Save Answers ── */}
        <div
          className="col-full"
          style={{
            animation: "fadeUp 0.4s ease 0.3s both",
            display: "flex",
            justifyContent: "flex-end",
            gap: 12,
            marginTop: 10,
          }}
        >
          <button
            onClick={exportToFile}
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 13,
              background: "var(--color-surface-2)",
              color: "var(--color-text)",
              border: "1px solid var(--color-border)",
              borderRadius: 10,
              padding: "12px 20px",
              cursor: "pointer",
              letterSpacing: "0.04em",
              transition: "opacity 0.15s, transform 0.1s",
            }}
          >
            Save Selections (.txt)
          </button>
          <button
            onClick={() => navigate("/challenge", { state: { result, description, userAnswers: answers } })}
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 13,
              background: "var(--color-accent)",
              color: "#fff",
              border: "none",
              borderRadius: 10,
              padding: "12px 28px",
              cursor: "pointer",
              letterSpacing: "0.04em",
              transition: "opacity 0.15s, transform 0.1s",
            }}
          >
            Run AI Challenge Lab →
          </button>
        </div>
      </div>
    </div>
  );
}