import { useState } from "react";
import styles from "../Scoring/scoring.module.css";

// ─── RunControls ──────────────────────────────────────────────────────────────
// Wide/NoBall flow: click WIDE or NO BALL → banner appears → user taps
// any run button (0-6) to complete the delivery. No separate modal needed.
export default function RunControls({
  onRun,
  onWide,
  onNoBall,
  onBye,
  onLegBye,
  onWicket,
  onSwapStrike,
  onUndo,
  onRetiredHurt,
  isWicketPending,
  onDismissBowler,
  onNoResult,
}) {
  // null | "WIDE" | "NOBALL"
  const [pendingExtra, setPendingExtra] = useState(null);

  const handleRunBtn = (r) => {
    if (pendingExtra === "WIDE") {
      setPendingExtra(null);
      onWide(r);
    } else if (pendingExtra === "NOBALL") {
      setPendingExtra(null);
      onNoBall(r);
    } else {
      onRun(r);
    }
  };

  const cancelExtra = () => setPendingExtra(null);

  const handleBye = () => {
    const r = parseInt(prompt("Bye runs (0-6):"), 10);
    if (!isNaN(r) && r >= 0 && r <= 6) onBye(r);
  };

  const handleLegBye = () => {
    const r = parseInt(prompt("Leg Bye runs (0-6):"), 10);
    if (!isNaN(r) && r >= 0 && r <= 6) onLegBye(r);
  };

  const isExtraPending = pendingExtra !== null;

  const runBtnLabel = (r) => {
    if (pendingExtra === "WIDE")   return r === 0 ? "Wd" : `+${r}`;
    if (pendingExtra === "NOBALL") return r === 0 ? "NB" : `+${r}`;
    return r;
  };

  const runBtnStyle = (r) => {
    if (!isExtraPending) return {};
    if (pendingExtra === "WIDE") {
      return {
        background: r === 0 ? "#7c3aed" : "#4c1d95",
        borderColor: "#a78bfa",
        color: "#fff",
      };
    }
    if (pendingExtra === "NOBALL") {
      return {
        background: r === 0 ? "#b45309" : "#78350f",
        borderColor: "#fbbf24",
        color: "#fff",
      };
    }
    return {};
  };

  return (
    <div>
      {/* ── Pending extra banner ─────────────────────────────────────────── */}
      {isExtraPending && (
        <div
          style={{
            background: pendingExtra === "WIDE" ? "#3b0764" : "#451a03",
            border: `2px solid ${pendingExtra === "WIDE" ? "#a78bfa" : "#fbbf24"}`,
            borderRadius: "10px",
            padding: "10px 16px",
            marginBottom: "10px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
          }}
        >
          <span style={{ color: "#fff", fontWeight: "700", fontSize: "14px" }}>
            {pendingExtra === "WIDE"
              ? "⬤ WIDE — tap runs scored off it (0 = just wide)"
              : "⬤ NO BALL — tap runs scored off bat (0 = none)"}
          </span>
          <button
            onClick={cancelExtra}
            style={{
              background: "rgba(255,255,255,0.15)",
              border: "none",
              borderRadius: "6px",
              color: "#fff",
              padding: "4px 10px",
              fontWeight: "600",
              cursor: "pointer",
              fontSize: "13px",
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* ── Run buttons 0-6 ──────────────────────────────────────────────── */}
      <div className={styles.runRow}>
        {[0, 1, 2, 3, 4, 5, 6].map((r) => (
          <button
            key={r}
            className={styles.runBtn}
            onClick={() => handleRunBtn(r)}
            disabled={isWicketPending && !isExtraPending}
            style={{
              opacity: isWicketPending && !isExtraPending ? 0.4 : 1,
              transition: "all 0.15s ease",
              ...runBtnStyle(r),
            }}
          >
            {runBtnLabel(r)}
          </button>
        ))}
      </div>

      {/* ── Main event buttons ────────────────────────────────────────────── */}
      <div className={styles.eventRow}>
        <button
          className={`${styles.eventBtn} ${styles.wide}`}
          onClick={() => setPendingExtra("WIDE")}
          disabled={isWicketPending || isExtraPending}
          style={{ opacity: isWicketPending || isExtraPending ? 0.4 : 1 }}
        >
          WIDE
        </button>

        <button
          className={`${styles.eventBtn} ${styles.noBall}`}
          onClick={() => setPendingExtra("NOBALL")}
          disabled={isWicketPending || isExtraPending}
          style={{ opacity: isWicketPending || isExtraPending ? 0.4 : 1 }}
        >
          NO BALL
        </button>

        <button
          className={`${styles.eventBtn} ${styles.bye}`}
          onClick={handleBye}
          disabled={isWicketPending || isExtraPending}
          style={{ opacity: isWicketPending || isExtraPending ? 0.4 : 1 }}
        >
          BYE
        </button>

        <button
          className={`${styles.eventBtn} ${styles.legBye}`}
          onClick={handleLegBye}
          disabled={isWicketPending || isExtraPending}
          style={{ opacity: isWicketPending || isExtraPending ? 0.4 : 1 }}
        >
          LEG BYE
        </button>

        <button
          className={`${styles.eventBtn} ${styles.wicket}`}
          onClick={onWicket}
          disabled={isWicketPending || isExtraPending}
          style={{ opacity: isWicketPending || isExtraPending ? 0.4 : 1 }}
        >
          WICKET
        </button>

        <button
          className={`${styles.eventBtn} ${styles.swap}`}
          onClick={onSwapStrike}
          disabled={isExtraPending}
          style={{ opacity: isExtraPending ? 0.4 : 1 }}
        >
          SWAP
        </button>

        {/* UNDO doubles as CANCEL when an extra is pending */}
        <button
          className={`${styles.eventBtn} ${styles.undo}`}
          onClick={isExtraPending ? cancelExtra : onUndo}
        >
          {isExtraPending ? "CANCEL" : "UNDO"}
        </button>
      </div>

      {/* ── Secondary actions ─────────────────────────────────────────────── */}
      {(onRetiredHurt || onDismissBowler || onNoResult) && (
        <div className={styles.eventRow}>
          {onRetiredHurt && (
            <button
              className={`${styles.eventBtn} ${styles.retiredHurt}`}
              onClick={onRetiredHurt}
              disabled={isWicketPending || isExtraPending}
              style={{
                opacity: isWicketPending || isExtraPending ? 0.4 : 1,
                cursor: isWicketPending || isExtraPending ? "not-allowed" : "pointer",
              }}
            >
              RETIRED HURT
            </button>
          )}
          {onDismissBowler && (
            <button
              className={styles.eventBtn}
              style={{
                background: "#e74c3c",
                color: "#fff",
                fontWeight: "bold",
                opacity: isExtraPending ? 0.4 : 1,
              }}
              disabled={isExtraPending}
              onClick={onDismissBowler}
            >
              DISMISS BOWLER
            </button>
          )}
          {onNoResult && (
            <button
              className={styles.eventBtn}
              style={{
                background: "#8e44ad",
                color: "#fff",
                fontWeight: "bold",
                opacity: isExtraPending ? 0.4 : 1,
              }}
              disabled={isExtraPending}
              onClick={onNoResult}
            >
              NO RESULT
            </button>
          )}
        </div>
      )}
    </div>
  );
}
