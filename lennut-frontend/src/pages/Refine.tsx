import { useLocation, useNavigate } from "react-router";
import { useEffect, useRef, useState } from "react";
import type { AnalysisResult } from "../analysis";
import {
  buildInitialMessage,
  buildAIResponse,
  generateRefinedDescription,
  scoreImprovement,
} from "../refineEngine";

type Message = {
  id: number;
  role: "ai" | "user";
  text: string;
};

// ── Typing indicator (side of screen) ─────────────────────────────────────────
function ThinkingBeacon() {
  return (
    <div
      style={{
        position: "fixed",
        right: 28,
        top: "50%",
        transform: "translateY(-50%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 6,
        zIndex: 20,
        animation: "fadeIn 0.2s ease forwards",
      }}
    >
      <div className="beacon-dot d1" />
      <div className="beacon-dot d2" />
      <div className="beacon-dot d3" />
    </div>
  );
}

// ── Single chat bubble ─────────────────────────────────────────────────────────
function Bubble({ msg }: { msg: Message }) {
  const isAI = msg.role === "ai";

  // Render **bold** markdown
  const parts = msg.text.split(/\*\*(.*?)\*\*/g);
  const rendered = parts.map((p, i) =>
    i % 2 === 1
      ? <strong key={i} style={{ color: "var(--color-text)", fontWeight: 600 }}>{p}</strong>
      : p
  );

  return (
    <div
      style={{
        display: "flex",
        justifyContent: isAI ? "flex-start" : "flex-end",
        animation: "fadeUp 0.3s ease forwards",
        marginBottom: 14,
      }}
    >
      {isAI && (
        <div
          style={{
            width: 28, height: 28, borderRadius: 8,
            background: "var(--color-accent)", flexShrink: 0,
            marginRight: 10, marginTop: 2,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 12, color: "#fff", fontFamily: "var(--font-mono)",
          }}
        >
          ◈
        </div>
      )}
      <div
        style={{
          maxWidth: "72%",
          background: isAI ? "var(--color-surface)" : "var(--color-surface-2)",
          border: `1px solid ${isAI ? "var(--color-border)" : "var(--color-accent)30"}`,
          borderRadius: isAI ? "4px 14px 14px 4px" : "14px 4px 4px 14px",
          padding: "12px 16px",
          fontFamily: "var(--font-mono)",
          fontSize: 13,
          color: "var(--color-text-dim)",
          lineHeight: 1.65,
          whiteSpace: "pre-wrap",
        }}
      >
        {rendered}
      </div>
    </div>
  );
}

// ── Typing bubble ──────────────────────────────────────────────────────────────
function TypingBubble() {
  return (
    <div style={{ display: "flex", alignItems: "center", marginBottom: 14, animation: "fadeUp 0.2s ease forwards" }}>
      <div
        style={{
          width: 28, height: 28, borderRadius: 8,
          background: "var(--color-accent)", flexShrink: 0,
          marginRight: 10,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 12, color: "#fff", fontFamily: "var(--font-mono)",
        }}
      >
        ◈
      </div>
      <div
        style={{
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: "4px 14px 14px 4px",
          padding: "14px 18px",
          display: "flex", gap: 5, alignItems: "center",
        }}
      >
        <span className="tdot td1" />
        <span className="tdot td2" />
        <span className="tdot td3" />
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function Refine() {
  const location = useLocation();
  const navigate = useNavigate();
  const { result, description } = (location.state ?? {}) as {
    result: AnalysisResult;
    description: string;
  };

  useEffect(() => {
    if (!result) navigate("/", { replace: true });
  }, [result, navigate]);

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [turn, setTurn] = useState(0);
  const [instructions, setInstructions] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Seed initial AI message
  useEffect(() => {
    if (!result) return;
    const init = buildInitialMessage(description, result);
    const t = setTimeout(() => {
      setMessages([{ id: 0, role: "ai", text: init }]);
    }, 600);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, thinking]);

  function sendMessage() {
    const text = input.trim();
    if (!text || thinking) return;

    const userMsg: Message = { id: Date.now(), role: "user", text };
    setMessages((prev) => [...prev, userMsg]);
    setInstructions((prev) => (prev ? prev + " " + text : text));
    setInput("");
    setThinking(true);

    setTimeout(() => {
      const nextTurn = turn + 1;
      setTurn(nextTurn);
      const aiText = buildAIResponse(text, description, result, nextTurn);
      setMessages((prev) => [...prev, { id: Date.now() + 1, role: "ai", text: aiText }]);
      setThinking(false);
    }, 1800 + Math.random() * 600);
  }

  function handleFinalize() {
    if (thinking) return;
    setThinking(true);
    setTimeout(() => {
      const refined = generateRefinedDescription(description, result, instructions);
      const refinedResult = scoreImprovement(result, refined);
      navigate("/output", {
        state: { original: description, originalResult: result, refined, refinedResult },
      });
    }, 2400);
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) sendMessage();
  }

  if (!result) return null;

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", position: "relative" }}>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes beaconPulse {
          0%, 100% { opacity: 0.15; transform: scaleY(0.5); }
          50%       { opacity: 1;    transform: scaleY(1.2); }
        }
        @keyframes dotBounce {
          0%, 60%, 100% { transform: translateY(0);    opacity: 0.35; }
          30%            { transform: translateY(-4px); opacity: 1; }
        }

        .beacon-dot {
          width: 4px;
          height: 22px;
          background: var(--color-accent);
          border-radius: 2px;
          animation: beaconPulse 1.1s ease-in-out infinite;
        }
        .d1 { animation-delay: 0s;    height: 14px; }
        .d2 { animation-delay: 0.18s; height: 24px; }
        .d3 { animation-delay: 0.36s; height: 14px; }

        .tdot {
          display: inline-block;
          width: 6px; height: 6px;
          border-radius: 50%;
          background: var(--color-muted);
          animation: dotBounce 1.2s ease-in-out infinite;
        }
        .td1 { animation-delay: 0s;    }
        .td2 { animation-delay: 0.18s; }
        .td3 { animation-delay: 0.36s; }

        textarea:focus { outline: none; }
      `}</style>

      {thinking && <ThinkingBeacon />}

      {/* Top bar */}
      <div style={{ borderBottom: "1px solid var(--color-border)", padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            onClick={() => navigate("/challenge", { state: { result, description } })}
            style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--color-text-dim)", background: "none", border: "none", cursor: "pointer", padding: 0 }}
          >
            ← Challenge Lab
          </button>
          <span style={{ color: "var(--color-border)" }}>|</span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--color-text-dim)" }}>
            Refine Description
          </span>
        </div>
        <button
          onClick={handleFinalize}
          disabled={thinking}
          style={{
            fontFamily: "var(--font-mono)", fontSize: 12,
            background: thinking ? "var(--color-surface-2)" : "var(--color-accent)",
            color: thinking ? "var(--color-muted)" : "#fff",
            border: "none", borderRadius: 8,
            padding: "8px 20px", cursor: thinking ? "default" : "pointer",
            transition: "background 0.2s, opacity 0.2s",
            display: "flex", alignItems: "center", gap: 8,
          }}
          onMouseEnter={(e) => { if (!thinking) (e.currentTarget as HTMLButtonElement).style.opacity = "0.85"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "1"; }}
        >
          {thinking ? (
            <><span className="tdot td1" style={{ width: 4, height: 4 }} /><span className="tdot td2" style={{ width: 4, height: 4 }} /><span className="tdot td3" style={{ width: 4, height: 4 }} /></>
          ) : "Finalize →"}
        </button>
      </div>

      {/* Messages */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "28px 24px",
          display: "flex",
          flexDirection: "column",
          maxWidth: 720,
          width: "100%",
          margin: "0 auto",
          boxSizing: "border-box",
        }}
      >
        {messages.map((m) => <Bubble key={m.id} msg={m} />)}
        {thinking && <TypingBubble />}
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div
        style={{
          borderTop: "1px solid var(--color-border)",
          padding: "16px 24px",
          flexShrink: 0,
          maxWidth: 720,
          width: "100%",
          margin: "0 auto",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: 12,
            transition: "border-color 0.2s",
          }}
          onFocusCapture={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = "var(--color-accent)"; }}
          onBlurCapture={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = "var(--color-border)"; }}
        >
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            disabled={thinking}
            placeholder={'Add instructions… (e.g. "focus on wet weather performance", "keep it under 80 words")'}
            rows={3}
            style={{
              width: "100%",
              background: "transparent",
              border: "none",
              resize: "none",
              padding: "14px 16px 8px",
              fontFamily: "var(--font-mono)",
              fontSize: 13,
              color: "var(--color-text)",
              lineHeight: 1.6,
              boxSizing: "border-box",
            }}
          />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px 12px" }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--color-muted)" }}>
              ⌘↵ to send · or hit Finalize to generate
            </span>
            <button
              onClick={sendMessage}
              disabled={!input.trim() || thinking}
              style={{
                fontFamily: "var(--font-mono)", fontSize: 12,
                background: input.trim() && !thinking ? "var(--color-surface-2)" : "transparent",
                color: input.trim() && !thinking ? "var(--color-text)" : "var(--color-muted)",
                border: `1px solid ${input.trim() && !thinking ? "var(--color-border)" : "transparent"}`,
                borderRadius: 8, padding: "6px 16px",
                cursor: input.trim() && !thinking ? "pointer" : "default",
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => { if (input.trim() && !thinking) (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--color-accent)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = input.trim() && !thinking ? "var(--color-border)" : "transparent"; }}
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
