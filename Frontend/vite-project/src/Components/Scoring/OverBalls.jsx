import styles from "./scoring.module.css";

// Original ball color logic — simple and clean
const getBallStyle = (entry) => {
  if (!entry) return {};
  const ev = entry.type; // ← was entry.event

  if (ev === "WD") {
    return { background: "#7c3aed", color: "#fff", border: "2px solid #a78bfa" };
  }
  if (ev === "NB") {
    return { background: "#b45309", color: "#fff", border: "2px solid #fbbf24" };
  }
  if (ev === "W" || ev === "HW" || ev === "WICKET") {
    return { background: "#dc2626", color: "#fff", border: "2px solid #f87171" };
  }
  if (ev === "BYE") {
    return { background: "#1a1a2e", color: "#a855f7", border: "2px solid #a855f7" };
  }
  if (ev === "LB") {
    return { background: "#1a1a2e", color: "#a855f7", border: "2px solid #a855f7" };
  }
  if (entry.runs === 4) {
    return { background: "#1a1a2e", color: "#00d9ff", border: "2px solid #00d9ff" };
  }
  if (entry.runs === 6) {
    return { background: "#1a1a2e", color: "#ff00ff", border: "2px solid #ff00ff" };
  }
  if (entry.runs === 0) {
    return { background: "#1a1a2e", color: "#555", border: "2px solid #444" };
  }
  return { background: "#1a1a2e", color: "#00ff88", border: "2px solid #00ff88" };
};

const getBallLabel = (entry) => {
  if (!entry) return "";
  const ev = entry.type;
  if (ev === "WD")   return "Wd";
  // Use stored label for NB (e.g. "4NB") if present, else "Nb"
  if (ev === "NB")   return entry.label || (entry.runs > 0 ? `${entry.runs}NB` : "Nb");
  if (ev === "W" || ev === "WICKET") return "W";
  if (ev === "HW")   return "W";
  if (ev === "BYE")  return `${entry.runs}b`;
  if (ev === "LB")   return `${entry.runs}lb`;
  if (entry.isWicket) return `${entry.runs}W`;
  return String(entry.runs ?? "");
};

export default function OverBalls({ history = [] }) {
  return (
    <div style={{ width: "100%", overflowX: "auto", padding: "8px 4px" }}>
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          flexWrap: "nowrap",
          gap: "8px",
          minWidth: "max-content",
        }}
      >
        {history.length === 0 ? (
          <span style={{ color: "#555", fontSize: "13px", whiteSpace: "nowrap" }}>
            No balls bowled yet
          </span>
        ) : (
          history.map((entry, i) => (
            <div
              key={i}
              style={{
                width: "38px",
                height: "38px",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: "bold",
                fontSize: "13px",
                flexShrink: 0,
                ...getBallStyle(entry),
              }}
            >
              {getBallLabel(entry)}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
