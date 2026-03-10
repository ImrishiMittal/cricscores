import styles from "../Scoring/scoring.module.css";

/**
 * RunControls
 * Uses the existing scoring.module.css classes throughout.
 * RETIRED HURT, DISMISS BOWLER, NO RESULT added as extra rows.
 */
function RunControls({
  onRun,
  onWide,
  onNoBall,
  onBye,
  onWicket,
  onSwapStrike,
  onUndo,
  onRetiredHurt,
  isWicketPending,
  onDismissBowler,
  onNoResult,
}) {
  const handleBye = () => {
    const r = parseInt(prompt("Bye runs:"), 10);
    if (!isNaN(r) && r >= 0) onBye(r);
  };

  return (
    <div>
      {/* ── Run buttons: 0–6 ── */}
      <div className={styles.runRow}>
        {[0, 1, 2, 3, 4, 5, 6].map((r) => (
          <button key={r} className={styles.runBtn} onClick={() => onRun(r)}>
            {r}
          </button>
        ))}
      </div>

      {/* ── Action buttons ── */}
      <div className={styles.eventRow}>
        <button
          className={`${styles.eventBtn} ${styles.bye}`}
          onClick={handleBye}
        >
          BYE
        </button>
        <button
          className={`${styles.eventBtn} ${styles.wide}`}
          onClick={onWide}
        >
          WIDE
        </button>
        <button
          className={`${styles.eventBtn} ${styles.noBall}`}
          onClick={onNoBall}
        >
          NO BALL
        </button>
        <button
          className={`${styles.eventBtn} ${styles.wicket}`}
          onClick={onWicket}
        >
          WICKET
        </button>
        <button
          className={`${styles.eventBtn} ${styles.swap}`}
          onClick={onSwapStrike}
        >
          SWAP
        </button>
        <button
          className={`${styles.eventBtn} ${styles.undo}`}
          onClick={onUndo}
        >
          UNDO
        </button>
      </div>

      {/* ── RETIRED HURT ── */}
      {onRetiredHurt && (
        <div className={styles.eventRow}>
          <button
            className={`${styles.eventBtn} ${styles.retiredHurt}`}
            onClick={onRetiredHurt}
            disabled={isWicketPending}
            style={{
              opacity: isWicketPending ? 0.4 : 1,
              cursor: isWicketPending ? "not-allowed" : "pointer",
            }}
          >
            🏥 RETIRED HURT
          </button>

          {/* ── DISMISS BOWLER ── */}
          {onDismissBowler && (
            <button
              className={`${styles.eventBtn}`}
              style={{
                background: "#e74c3c",
                color: "#fff",
                fontWeight: "bold",
              }}
              onClick={onDismissBowler}
            >
              🚫 DISMISS BOWLER
            </button>
          )}

          {/* ── NO RESULT ── */}
          {onNoResult && (
            <button
              className={`${styles.eventBtn}`}
              style={{
                background: "#8e44ad",
                color: "#fff",
                fontWeight: "bold",
              }}
              onClick={onNoResult}
            >
              🌧️ NO RESULT
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default RunControls;
