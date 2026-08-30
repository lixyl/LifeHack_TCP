import { useLayoutEffect } from "react";
import { Outlet, useLocation } from "react-router";

function ScrollToTop() {
  const { pathname } = useLocation();

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

export default function Root() {
  return (
    <div
      style={{
        minHeight: "100%",
        background: "var(--color-bg)",
        fontFamily: "var(--font-body)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <ScrollToTop />
      {/* Header */}
      <header
        style={{
          borderBottom: "1px solid var(--color-border)",
          padding: "18px 32px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 26,
              height: 26,
              background: "var(--color-accent)",
              borderRadius: 7,
            }}
          />
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 13,
              color: "var(--color-text)",
              letterSpacing: "0.08em",
            }}
          >
            LENNUT
          </span>
        </div>
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            color: "var(--color-accent)",
            border: "1px solid var(--color-accent)",
            borderRadius: 20,
            padding: "4px 12px",
            letterSpacing: "0.08em",
          }}
        >
          BETA
        </div>
      </header>

      {/* Page content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <Outlet />
      </div>

      <footer
        style={{
          padding: "14px 32px",
          borderTop: "1px solid var(--color-border)",
          flexShrink: 0,
        }}
      >
        <p
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            color: "var(--color-muted)",
            textAlign: "center",
            margin: 0,
          }}
        >
          LENNUT · Brand Content Intelligence · v0.1
        </p>
      </footer>
    </div>
  );
}
