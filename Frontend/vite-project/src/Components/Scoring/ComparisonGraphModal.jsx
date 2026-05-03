import { useEffect, useRef } from "react";
import ComparisonGraph from "./ComparisonGraph";

export default function ComparisonGraphModal({ onClose, ...graphProps }) {
  const containerRef = useRef(null);

  useEffect(() => {
    // Request landscape orientation lock if supported
    if (screen.orientation?.lock) {
      screen.orientation.lock("landscape").catch(() => {});
    }
    return () => {
      if (screen.orientation?.unlock) {
        screen.orientation.unlock();
      }
    };
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.95)",
        zIndex: 9500,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <div style={{
        display: "flex", justifyContent: "space-between",
        alignItems: "center", padding: "12px 16px",
        borderBottom: "1px solid #1e293b", flexShrink: 0,
      }}>
        <span style={{ color: "#e2e8f0", fontWeight: 700, fontSize: "15px" }}>
          📊 Run Rate Comparison
        </span>
        <button
          onClick={onClose}
          style={{
            background: "transparent", border: "1px solid #374151",
            borderRadius: "6px", color: "#9ca3af",
            fontSize: "16px", cursor: "pointer", padding: "2px 10px",
          }}
        >
          ✕
        </button>
      </div>

      {/* Graph fills remaining space */}
      <div
        ref={containerRef}
        style={{ flex: 1, padding: "12px", overflow: "hidden", display: "flex", alignItems: "center" }}
      >
        <ComparisonGraph {...graphProps} onClose={onClose} />
      </div>

      {/* Hint for mobile users */}
      <div style={{
        textAlign: "center", color: "#4b5563",
        fontSize: "11px", padding: "6px", flexShrink: 0,
      }}>
        Tip: Rotate phone to landscape for best view
      </div>
    </div>
  );
}