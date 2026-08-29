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
          justifyContent: "space-between",
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

  // Redirect home if landed without data
  useEffect(() => {
    if (!result) navigate("/", { replace: true });
  }, [result, navigate]);

  const [radarData, setRadarData] = useState(
    result?.categories.map((c) => ({ subject: c.label, value: 0 })) ?? []
  );

  useEffect(() => {
    if (!result) return;
    const t = setTimeout(() => {
      setRadarData(
        result.categories.map((c) => ({ subject: c.label, value: c.score }))
      );
    }, 300);
    return () => clearTimeout(t);
  }, [result]);

  if (!result) return null;

  const preview =
    description.length > 180
      ? description.slice(0, 180).trimEnd() + "…"
      : description;

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

        /* recharts pentagon styling */
        .recharts-polar-grid-concentric-polygon { fill: none; }
        .recharts-polar-angle-axis-tick-value {
          font-family: var(--font-mono) !important;
          font-size: 11px !important;
          fill: var(--color-text-dim) !important;
        }
      `}</style>

      <div className="results-grid">

        {/* ── Back + title ── */}
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
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor =
                "var(--color-accent)";
              (e.currentTarget as HTMLButtonElement).style.color =
                "var(--color-accent)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor =
                "var(--color-border)";
              (e.currentTarget as HTMLButtonElement).style.color =
                "var(--color-text-dim)";
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
          {/* Legend dots */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "8px 16px",
              marginTop: 4,
            }}
          >
            {result.categories.map((c) => (
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
              <GradeBadge grade={result.grade} score={result.overall} />
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
                {result.summary}
              </p>
            </div>
          </div>
          <p className="section-label">Metrics breakdown</p>
          {result.categories.map((c, i) => (
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
            {/* Input preview */}
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
            {/* AI verdict */}
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
                {result.summary}
              </p>
              <div
                style={{
                  marginTop: 14,
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 8,
                }}
              >
                {result.categories.map((c) => (
                  <span
                    key={c.label}
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 10,
                      color: c.color,
                      background: `${c.color}14`,
                      borderRadius: 20,
                      padding: "3px 10px",
                    }}
                  >
                    {c.label}: {c.score}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── LLM discoverability ── */}
        <div
          className="col-full"
          style={{ animation: "fadeUp 0.4s ease 0.25s both" }}
        >
          <LLMIndicator
            score={result.llmScore}
            verdict={result.llmVerdict}
            rationale={result.llmRationale}
          />
        </div>

        {/* ── CTA: Challenge Lab ── */}
        <div
          className="col-full"
          style={{
            animation: "fadeUp 0.4s ease 0.3s both",
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <button
            onClick={() => navigate("/challenge", { state: { result, description } })}
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
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "0.85"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "1"; }}
            onMouseDown={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(0.97)"; }}
            onMouseUp={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)"; }}
          >
            Run AI Challenge Lab →
          </button>
        </div>
      </div>
    </div>
  );
}
