import styles from "../Scoring/scoring.module.css";

/**
 * RunControls
 * Uses the existing scoring.module.css classes throughout —
 * same classes that were already working before.
 * RETIRED HURT is added as a matching eventBtn in its own row.
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
          <button
            key={r}
            className={styles.runBtn}
            onClick={() => onRun(r)}
          >
            {r}
          </button>
        ))}
      </div>

      {/* ── Action buttons: BYE  WIDE  NO BALL  WICKET  SWAP  UNDO ── */}
      <div className={styles.eventRow}>
        <button className={`${styles.eventBtn} ${styles.bye}`} onClick={handleBye}>
          BYE
        </button>
        <button className={`${styles.eventBtn} ${styles.wide}`} onClick={onWide}>
          WIDE
        </button>
        <button className={`${styles.eventBtn} ${styles.noBall}`} onClick={onNoBall}>
          NO BALL
        </button>
        <button className={`${styles.eventBtn} ${styles.wicket}`} onClick={onWicket}>
          WICKET
        </button>
        <button className={`${styles.eventBtn} ${styles.swap}`} onClick={onSwapStrike}>
          SWAP
        </button>
        <button className={`${styles.eventBtn} ${styles.undo}`} onClick={onUndo}>
          UNDO
        </button>
      </div>

      {/* ── RETIRED HURT: same eventBtn height/shape, purple colour ── */}
      {onRetiredHurt && (
        <div className={styles.eventRow}>
          <button
            className={`${styles.eventBtn} ${styles.retiredHurt}`}
            onClick={onRetiredHurt}
          >
            🏥 RETIRED HURT
          </button>
        </div>
      )}
    </div>
  );
}

export default RunControls;

