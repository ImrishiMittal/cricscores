import { useState } from "react";
import styles from "./TabbedInningsHistory.module.css";

function groupByOvers(history) {
  const overs = {};
  (history || []).forEach((ball) => {
    const overNo = ball.over + 1;
    if (!overs[overNo]) overs[overNo] = [];
    overs[overNo].push(ball);
  });
  return overs;
}

function combineBalls(balls) {
  const combined = [];
  let i = 0;
  while (i < balls.length) {
    const current = balls[i];
    const next = balls[i + 1];
    if (
      current && next &&
      current.event === "RUN" &&
      next.event === "WICKET" &&
      current.ball === next.ball
    ) {
      combined.push({ ...current, event: "RUN_WICKET", runs: current.runs });
      i += 2;
    } else {
      combined.push(current);
      i += 1;
    }
  }
  return combined;
}

function getLabel(ball) {
  if (ball.event === "RUN_WICKET") return `${ball.runs}W`;
  if (ball.event === "RUNOUT") return ball.runs > 0 ? `${ball.runs}W` : "0W";
  if (ball.event === "RUN") return ball.runs;
  if (ball.event === "WD") return "WD";
  if (ball.event === "NB") return ball.runs > 0 ? `${ball.runs}NB` : "NB";
  if (ball.event === "WICKET") return "W";
  if (ball.event === "HW") return "W";
  if (ball.event === "FREE_HIT") return "FH";
  if (ball.event === "BYE") return `B${ball.runs}`;
  if (ball.event === "LB") return `LB${ball.runs}`;
  return "•";
}

function getBallType(ball) {
  if (ball.event === "RUNOUT") return "RUN_WICKET";
  if (ball.event === "RUN_WICKET") return "RUN_WICKET";
  if (ball.event === "RUN") return ball.runs.toString();
  if (ball.event === "WD") return "WD";
  if (ball.event === "NB") return "NB";
  if (ball.event === "WICKET") return "W";
  if (ball.event === "HW") return "W";
  if (ball.event === "FREE_HIT") return "FH";
  if (ball.event === "BYE") return "BYE";
  if (ball.event === "LB") return "BYE";
  return "DOT";
}

function HistoryView({ history }) {
  const overs = groupByOvers(history || []);
  if (Object.keys(overs).length === 0) {
    return (
      <p style={{ color: "#9ca3af", padding: "16px", textAlign: "center" }}>
        No balls recorded yet.
      </p>
    );
  }
  return Object.entries(overs).map(([overNo, balls]) => {
    const runs = balls.reduce((t, b) => t + (b.runs || 0), 0);
    const wickets = balls.filter(
      (b) => b.event === "WICKET" || b.event === "RUNOUT" || b.event === "HW"
    ).length;
    const bowlerName = balls[0]?.bowler || balls[0]?.bowlerName || "";
    const combinedBalls = combineBalls(balls);
    return (
      <div key={overNo} className={styles.overBlock}>
        <div className={styles.overHeader}>
          <span>Over {overNo}{bowlerName ? ` — ${bowlerName}` : ""}</span>
          <span>{runs} Runs{wickets > 0 ? ` • ${wickets} Wkt` : ""}</span>
        </div>
        <div className={styles.ballRow}>
          {combinedBalls.map((ball, i) => (
            <div
              key={i}
              className={styles.ballHistory}
              data-type={getBallType(ball)}
            >
              {getLabel(ball)}
            </div>
          ))}
        </div>
      </div>
    );
  });
}

export default function TabbedInningsHistory({
  innings1History,
  innings2History,
  innings3History,
  innings4History,
  currentInnings,
  firstBattingTeam,
  secondBattingTeam,
  onClose,
}) {
  const team1 = firstBattingTeam || "Team A";
  const team2 = secondBattingTeam || "Team B";

  const allTabs = [
    { label: `INN 1 · ${team1}`, data: innings1History },
    { label: `INN 2 · ${team2}`, data: innings2History },
    innings3History?.length > 0
      ? { label: `INN 3 · ${team1}`, data: innings3History }
      : null,
    innings4History?.length > 0
      ? { label: `INN 4 · ${team2}`, data: innings4History }
      : null,
  ].filter(Boolean);

  const defaultTab = Math.min(
    Math.max(0, (currentInnings || 1) - 1),
    allTabs.length - 1
  );
  const [activeTab, setActiveTab] = useState(defaultTab);

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.inningsModalBox}>
        <div className={styles.modalHeader}>
          <h2>Innings History</h2>
          <button className={styles.modalHeaderCloseBtn} onClick={onClose}>✕</button>
        </div>

        {/* Tab bar */}
        <div style={{
          display: "flex",
          gap: "6px",
          padding: "8px 12px",
          borderBottom: "1px solid #1f2937",
          overflowX: "auto",
          flexShrink: 0,
        }}>
          {allTabs.map((tab, i) => (
            <button
              key={i}
              onClick={() => setActiveTab(i)}
              style={{
                padding: "5px 10px",
                borderRadius: "6px",
                border: "none",
                fontSize: "11px",
                fontWeight: "600",
                cursor: "pointer",
                whiteSpace: "nowrap",
                background: activeTab === i ? "#22c55e" : "#1f2937",
                color: activeTab === i ? "#000" : "#9ca3af",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className={styles.inningsContent}>
          <HistoryView history={allTabs[activeTab]?.data || []} />
        </div>
      </div>
    </div>
  );
}