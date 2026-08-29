import { useState, useRef } from "react";
import { useNavigate } from "react-router";
import { analyzeDescription } from "../analysis";
import { analyzeProduct } from "../services/api";

export default function Home() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const navigate = useNavigate();

  // Parse product title dynamically from JSON-LD input
  const getProductTitle = (): string => {
    if (!input.trim()) return "product story?";
    try {
      const parsed = JSON.parse(input);

      // Handle Schema.org Graph arrays (@graph)
      const data = parsed["@graph"] ? parsed["@graph"][0] : parsed;

      // Extract product name or title from standard schema properties
      const title = data.name || data.title || data.headline;
      if (title && typeof title === "string") {
        return title;
      }
    } catch {
      // If parsing fails (plain text or incomplete JSON), fallback
    }
    return "product story?";
  };

  const handleAnalyze = async () => {
    if (!input.trim() || loading) return;
    setLoading(true);

    try {
      const data = await analyzeProduct(input);

      // Navigate to results page with backend response
      navigate("/results", { 
        state: { 
          result: { ...(data.result as object), productId: data.product_id },
          description: input 
        } 
      });
    } catch (error) {
      console.error(error);
      alert("Error processing JSON input.");
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleAnalyze();
  };

  const processFile = (file: File) => {
    if (
      !file.name.endsWith(".jsonld") &&
      !file.name.endsWith(".json") &&
      file.type !== "application/json" &&
      file.type !== "application/ld+json"
    ) {
      alert("Please upload a valid .json or .jsonld file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = JSON.parse(text);
        setInput(JSON.stringify(parsed, null, 2));
      } catch {
        setInput(e.target?.result as string);
      }
    };
    reader.readAsText(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const wordCount = input.trim().split(/\s+/).filter(Boolean).length;
  const dynamicTitle = getProductTitle();

  return (
    <div
      className="flex flex-col items-center justify-center flex-1 px-6 py-12"
      style={{ maxWidth: 660, margin: "0 auto", width: "100%" }}
    >
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse-dot {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50%       { opacity: 1;   transform: scale(1);   }
        }
        .dot-1 { animation: pulse-dot 1.2s ease-in-out infinite 0s;   }
        .dot-2 { animation: pulse-dot 1.2s ease-in-out infinite 0.2s; }
        .dot-3 { animation: pulse-dot 1.2s ease-in-out infinite 0.4s; }
        textarea:focus { outline: none; }
      `}</style>

      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".jsonld,.json,application/json,application/ld+json"
        style={{ display: "none" }}
      />

      {/* Headline */}
      <div
        className="text-center mb-12"
        style={{ animation: "fadeUp 0.5s ease forwards" }}
      >
        <p
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            color: "var(--color-accent)",
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            marginBottom: 16,
          }}
        >
          Product Intelligence
        </p>
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(36px, 6vw, 58px)",
            color: "var(--color-text)",
            lineHeight: 1.1,
            marginBottom: 18,
          }}
        >
          How good is your
          <br />
          <em style={{ color: "var(--color-accent)" }}>{dynamicTitle}</em>
        </h1>
        <p
          style={{
            fontSize: 15,
            color: "var(--color-text-dim)",
            lineHeight: 1.75,
            maxWidth: 400,
            margin: "0 auto",
          }}
        >
          Paste any product description or upload a JSON-LD file below. We'll score its clarity,
          completeness, persuasiveness, SEO strength, and LLM discoverability — instantly.
        </p>
      </div>

      {/* Input card with Drag & Drop */}
      <div
        className="chat-card"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={{
          width: "100%",
          background: "var(--color-surface)",
          border: `1px solid ${isDragging ? "var(--color-accent)" : "var(--color-border)"}`,
          borderRadius: 16,
          marginBottom: 20,
          animation: "fadeUp 0.5s ease 0.1s both",
          transition: "border-color 0.2s, background 0.2s",
        }}
        onFocusCapture={(e) =>
          ((e.currentTarget as HTMLDivElement).style.borderColor =
            "var(--color-accent)")
        }
        onBlurCapture={(e) =>
          ((e.currentTarget as HTMLDivElement).style.borderColor =
            "var(--color-border)")
        }
      >
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Paste your product description or JSON-LD here, or drop a file…"
          rows={7}
          style={{
            width: "100%",
            background: "transparent",
            resize: "none",
            padding: "20px 20px 12px",
            fontSize: 14,
            lineHeight: 1.75,
            color: "var(--color-text)",
            fontFamily: "var(--font-body)",
            border: "none",
          }}
        />
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 16px 16px",
            borderTop: "1px solid var(--color-border)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 11,
                color: "var(--color-muted)",
              }}
            >
              {wordCount} words · ⌘↵ to analyze
            </span>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              style={{
                background: "transparent",
                border: "none",
                color: "var(--color-accent)",
                fontFamily: "var(--font-mono)",
                fontSize: 11,
                cursor: "pointer",
                padding: 0,
                textDecoration: "underline",
              }}
            >
              Upload JSON-LD
            </button>
          </div>
          <button
            onClick={handleAnalyze}
            disabled={!input.trim() || loading}
            style={{
              background:
                input.trim() && !loading
                  ? "var(--color-accent)"
                  : "var(--color-surface-2)",
              color:
                input.trim() && !loading ? "#fff" : "var(--color-muted)",
              border: "none",
              borderRadius: 10,
              padding: "9px 22px",
              fontFamily: "var(--font-body)",
              fontSize: 13,
              fontWeight: 500,
              cursor: input.trim() && !loading ? "pointer" : "default",
              transition: "background 0.2s, transform 0.1s",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
            onMouseDown={(e) => {
              if (input.trim() && !loading)
                (e.currentTarget as HTMLButtonElement).style.transform =
                  "scale(0.97)";
            }}
            onMouseUp={(e) => {
              (e.currentTarget as HTMLButtonElement).style.transform =
                "scale(1)";
            }}
          >
            {loading ? (
              <>
                <span
                  style={{
                    display: "flex",
                    gap: 3,
                    alignItems: "center",
                  }}
                >
                  <span
                    className="dot-1"
                    style={{
                      width: 5,
                      height: 5,
                      borderRadius: "50%",
                      background: "var(--color-muted)",
                      display: "inline-block",
                    }}
                  />
                  <span
                    className="dot-2"
                    style={{
                      width: 5,
                      height: 5,
                      borderRadius: "50%",
                      background: "var(--color-muted)",
                      display: "inline-block",
                    }}
                  />
                  <span
                    className="dot-3"
                    style={{
                      width: 5,
                      height: 5,
                      borderRadius: "50%",
                      background: "var(--color-muted)",
                      display: "inline-block",
                    }}
                  />
                </span>
                Analyzing
              </>
            ) : (
              "Analyze →"
            )}
          </button>
        </div>
      </div>

      {/* Metric tags */}
      <div
        style={{ animation: "fadeUp 0.5s ease 0.2s both" }}
        className="flex flex-wrap gap-3 justify-center"
      >
        {[
          { label: "Clarity", color: "#7c6aff" },
          { label: "Completeness", color: "#22d3ee" },
          { label: "Persuasion", color: "#f472b6" },
          { label: "SEO", color: "#34d399" },
          { label: "LLM Fit", color: "#fb923c" },
        ].map(({ label, color }) => (
          <div
            key={label}
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              color,
              border: `1px solid ${color}30`,
              borderRadius: 20,
              padding: "4px 13px",
            }}
          >
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}
