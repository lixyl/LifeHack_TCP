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
  const initialData = (location.state ?? {}) as {
    result: AnalysisResult;
    description: string;
  };

  const [currentDescription, setCurrentDescription] = useState(
    initialData.description || ""
  );
  const currentResult = initialData.result;

  const [answers, setAnswers] = useState<Record<string | number, string>>({});
  const [customText, setCustomText] = useState<Record<string | number, string>>({});
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (!initialData.result) navigate("/", { replace: true });
  }, [initialData.result, navigate]);

  const questions = currentResult?.questions ?? [];
  const categories = currentResult?.categories ?? [];

  const [radarData, setRadarData] = useState(
    categories.map((c) => ({ subject: c.label, value: 0 }))
  );

  useEffect(() => {
    if (!currentResult) return;
    const t = setTimeout(() => {
      setRadarData(
        categories.map((c) => ({ subject: c.label, value: c.score }))
      );
    }, 300);
    return () => clearTimeout(t);
  }, [currentResult, categories]);

  // Update the preview only. Scores stay fixed until the completed JSON is
  // submitted to the evaluator.
  const updateRefinedState = (
    newAnswers: Record<string | number, string>,
    newCustomText: Record<string | number, string>
  ) => {
    let appendedDetails = "\n\nAdditional Details:";
    let answeredCount = 0;

    questions.forEach((q, idx) => {
      const qKey = q.id || idx;
      const selected = newAnswers[qKey];
      if (selected) {
        answeredCount++;
        let val = selected;
        if (selected === "other" || selected.toLowerCase().includes("other")) {
          val = newCustomText[qKey] || "Other";
        }
        appendedDetails += `\n- ${q.question}: ${val}`;
      }
    });

    const baseDescription = initialData.description || "";
    setCurrentDescription(
      answeredCount > 0 ? `${baseDescription}${appendedDetails}` : baseDescription
    );

  };

  const handleSelectOption = (questionKey: string | number, optionVal: string) => {
    const updatedAnswers = { ...answers, [questionKey]: optionVal };
    setAnswers(updatedAnswers);
    updateRefinedState(updatedAnswers, customText);
  };

  const handleInputChange = (questionKey: string | number, value: string) => {
    const updatedAnswers = { ...answers, [questionKey]: value };
    setAnswers(updatedAnswers);
    updateRefinedState(updatedAnswers, customText);
  };

  const handleCustomTextChange = (questionKey: string | number, text: string) => {
    const updatedCustom = { ...customText, [questionKey]: text };
    setCustomText(updatedCustom);
    updateRefinedState(answers, updatedCustom);
  };

  const serializeQuestionAnswers = () => {
    const pairs = questions.flatMap((question, index) => {
      const questionKey = question.id || index;
      const selected = answers[questionKey]?.trim();

      if (!selected) return [];

      const isOther =
        selected === "other" || selected.toLowerCase().includes("other");
      const option = question.options?.find(
        ({ value, label }) => value === selected || label === selected
      );

      let answer = isOther
        ? customText[questionKey]?.trim()
        : option?.label ?? selected;

      if (!answer) return [];

      if (question.answer_type === "number" && question.numeric_config?.unit) {
        answer = `${answer} ${question.numeric_config.unit}`;
      }

      return [{ question: question.question, answer }];
    });

    return {
      serialized: JSON.stringify(pairs),
      selectedOptionCount: pairs.length,
    };
  };

  const handleGenerateOutput = async () => {
    if (isGenerating) return;

    setIsGenerating(true);
    const { serialized: clarificationAnswers, selectedOptionCount } =
      serializeQuestionAnswers();

    try {
      const response = await fetch(
        "http://localhost:8000/api/generate-description",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            json_input: initialData.description,
            clarification_answers: clarificationAnswers,
          }),
        }
      );
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.detail || "Description generation failed");
      }
      if (typeof data.generated_json !== "string") {
        throw new Error("The description API returned an invalid response");
      }
      navigate("/output", {
        state: {
          original: initialData.description,
          originalResult: initialData.result,
          refined: data.generated_json,
          questionAnswerString: data.generated_json,
          selectedOptionCount,
        },
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Description generation failed";
      console.error("Description generation error:", error);
      alert(message);
    } finally {
      setIsGenerating(false);
    }
  };

  if (!currentResult) return null;

  const preview =
    currentDescription && currentDescription.length > 180
      ? currentDescription.slice(0, 180).trimEnd() + "…"
      : currentDescription || "Product spec provided.";

  const overallScore = currentResult.overall;
  const grade = currentResult.grade;
  const summaryText = currentResult.summary;

  const llmScore = currentResult.scores?.LLM_Fit ?? 75;
  const llmVerdict = currentResult.llmVerdict;
  const llmRationale = currentResult.llmRationale;

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "40px 24px" }}>
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
        {/* Header */}
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

        {/* Radar Chart */}
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
                <PolarGrid gridType="polygon" stroke="#1e2230" strokeWidth={1} />
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

        {/* Score Bars */}
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

        {/* Narrative Summary */}
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

        {/* LLM Discoverability */}
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

        {/* Clarification Questions */}
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
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                        {q.options.map((opt, i) => {
                          const optionTarget = opt.value || opt.label;
                          const isSelected = selectedValue === optionTarget || selectedValue === opt.label;
                          return (
                            <button
                              key={i}
                              type="button"
                              onClick={() => handleSelectOption(qKey, optionTarget)}
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

                      {(selectedValue === "other" || selectedValue.toLowerCase().includes("other")) && (
                        <input
                          type="text"
                          placeholder="Please specify..."
                          value={customText[qKey] || ""}
                          onChange={(e) => handleCustomTextChange(qKey, e.target.value)}
                          style={{
                            fontFamily: "var(--font-body)",
                            fontSize: 13,
                            color: "var(--color-text)",
                            background: "var(--color-surface-2)",
                            border: "1px solid var(--color-accent)",
                            borderRadius: 8,
                            padding: "8px 12px",
                            outline: "none",
                            width: "100%",
                            maxWidth: 400,
                          }}
                        />
                      )}
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

        {/* Action Button */}
        <div
          className="col-full"
          style={{
            animation: "fadeUp 0.4s ease 0.3s both",
            display: "flex",
            justifyContent: "flex-end",
            marginTop: 10,
          }}
        >
          <button
            onClick={handleGenerateOutput}
            disabled={isGenerating}
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 13,
              background: "var(--color-accent)",
              color: "#fff",
              border: "none",
              borderRadius: 10,
              padding: "12px 28px",
              cursor: isGenerating ? "wait" : "pointer",
              opacity: isGenerating ? 0.65 : 1,
              letterSpacing: "0.04em",
              transition: "opacity 0.15s, transform 0.1s",
            }}
          >
            {isGenerating ? "Generating…" : "See Final Output →"}
          </button>
        </div>
      </div>
    </div>
  );
}
