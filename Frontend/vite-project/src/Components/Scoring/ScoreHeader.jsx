import { useState, useEffect, useRef } from "react";
import styles from "./ScoreHeader.module.css";

function ScoreHeader({
  innings,
  teamName,
  score,
  wickets,
  overs,
  balls,
  totalOvers,
  target,
  toss,
  isSuperOver,
  superOverNumber,
  isTestMatch,
  testDays,
  oversPerDay,
  totalOversBowled,
}) {
  const [popup, setPopup] = useState(null); // { type: "day" | "innings", message }
  const prevDayRef = useRef(null);
  const prevInningsRef = useRef(null);

  // ── Day / Innings change detection ──────────────────────────────────────
  useEffect(() => {
    if (!isTestMatch) return;

    const opd = oversPerDay || 90;
    const currentDay = Math.min(
      Math.floor((totalOversBowled || 0) / opd) + 1,
      testDays || 5
    );

    // Innings changed
    if (prevInningsRef.current !== null && prevInningsRef.current !== innings) {
      setPopup({
        type: "innings",
        message: `🏏 Innings ${prevInningsRef.current} Over!\nInnings ${innings} begins.`,
      });
      setTimeout(() => setPopup(null), 3500);
    }
    // Day changed (only if innings didn't also change)
    else if (prevDayRef.current !== null && prevDayRef.current !== currentDay) {
      setPopup({
        type: "day",
        message: `🌅 Day ${prevDayRef.current} Over!\nDay ${currentDay} begins.`,
      });
      setTimeout(() => setPopup(null), 3500);
    }

    prevDayRef.current = currentDay;
    prevInningsRef.current = innings;
  }, [innings, totalOversBowled, isTestMatch, oversPerDay, testDays]);

  const calculatePredictedScore = () => {
    if (innings !== 1) return null;
    const ballsBowled = overs * 6 + balls;
    if (ballsBowled === 0) return 0;
    const currentRunRate = score / (ballsBowled / 6);
    return Math.round(currentRunRate * Number(totalOvers));
  };

  const calculateRunsRequired = () => {
    if (innings !== 2 || !target) return null;
    const runsNeeded = Math.max(0, target - score);
    const totalBalls = Number(totalOvers) * 6;
    const ballsBowled = overs * 6 + balls;
    const ballsRemaining = Math.max(0, totalBalls - ballsBowled);
    return { runs: runsNeeded, balls: ballsRemaining };
  };

  const predictedScore = calculatePredictedScore();
  const runsRequired = calculateRunsRequired();

  // Test box computed values
  const opd = oversPerDay || 90;
  const currentDay = isTestMatch
    ? Math.min(Math.floor((totalOversBowled || 0) / opd) + 1, testDays || 5)
    : null;
  const oversToday = isTestMatch
    ? Math.floor((totalOversBowled || 0) % opd)
    : null;

  return (
    <div className={styles.container}>
      {/* ── Day / Innings end popup ─────────────────────────────────────── */}
      {popup && (
        <div
          style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 9999,
            background: popup.type === "day" ? "#0f2a0f" : "#1a1a2e",
            border: `2px solid ${popup.type === "day" ? "#22c55e" : "#3b82f6"}`,
            borderRadius: "16px",
            padding: "28px 32px",
            textAlign: "center",
            minWidth: "240px",
            boxShadow: "0 8px 32px rgba(0,0,0,0.7)",
          }}
        >
          <div style={{ fontSize: "36px", marginBottom: "10px" }}>
            {popup.type === "day" ? "🌅" : "🏏"}
          </div>
          {popup.message.split("\n").map((line, i) => (
            <p
              key={i}
              style={{
                margin: "4px 0",
                color: i === 0 ? "#e5e7eb" : "#9ca3af",
                fontSize: i === 0 ? "16px" : "13px",
                fontWeight: i === 0 ? "700" : "400",
              }}
            >
              {line}
            </p>
          ))}
        </div>
      )}

      <div className={styles.content}>
        {isSuperOver && (
          <div className={styles.superOverBadge}>
            ⚡ SUPER OVER {superOverNumber}
          </div>
        )}

        <div className={styles.topRow}>
          {/* LEFT: Test day box OR normal total overs */}
          {isTestMatch ? (
            <div
              className={styles.totalOversBox}
              style={{ padding: "6px 10px", minWidth: "unset", display: "flex", flexDirection: "row", alignItems: "center", gap: "6px" }}
            >
              {/* Day badge */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <span style={{ fontSize: "8px", color: "#22c55e", fontWeight: "700", letterSpacing: "0.5px", textTransform: "uppercase" }}>
                  DAY
                </span>
                <span style={{ fontSize: "16px", color: "#22c55e", fontWeight: "900", lineHeight: 1 }}>
                  {currentDay}/{testDays || 5}
                </span>
              </div>

              {/* Divider */}
              <div style={{ width: "1px", height: "30px", background: "#374151" }} />

              {/* Innings + overs */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <span style={{ fontSize: "11px", color: "#ffffff", fontWeight: "700", lineHeight: 1 }}>
                  INN {innings}
                </span>
                <span style={{ fontSize: "8px", color: "#9ca3af", marginTop: "3px" }}>
                  {oversToday}/{opd} ovs
                </span>
              </div>
            </div>
          ) : (
            <div className={styles.totalOversBox}>
              <span className={styles.totalOversLabel}>TOTAL OVERS</span>
              <span className={styles.totalOversValue}>{totalOvers}</span>
            </div>
          )}

          {/* CENTER */}
          <div className={styles.topSection}>
            <p className={styles.label}>INNINGS {innings}</p>
            <p className={styles.toss}>TOSS : {toss}</p>
            <h2 className={styles.teamName}>{teamName}</h2>
            <div className={styles.scoreDisplay}>
              <span className={styles.score}>{score}</span>
              <span className={styles.wickets}>/{wickets}</span>
            </div>
          </div>

          {/* RIGHT: Predicted or Required */}
          {innings === 1 && predictedScore !== null && (
            <div className={styles.predictedBox}>
              <span className={styles.predictedLabel}>PREDICTED</span>
              <span className={styles.predictedScore}>{predictedScore}</span>
            </div>
          )}
          {innings === 2 && runsRequired && (
            <div className={styles.requiredBox}>
              <span className={styles.requiredLabel}>NEED</span>
              <span className={styles.requiredValue}>{runsRequired.runs}</span>
              <span className={styles.requiredBalls}>
                from {runsRequired.balls} balls
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ScoreHeader;
