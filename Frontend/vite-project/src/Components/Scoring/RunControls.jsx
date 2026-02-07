import styles from "./scoring.module.css";

function RunControls({
  onRun,
  onWide,
  onNoBall,
  onBye,
  onWicket,
  onSwapStrike,
  onUndo
}) {
  return (
    <>
      {/* ROW 1 — RUNS */}
      <div className={styles.runRow}>
  {[0,1,2,3,4,5,6].map(r => (
    <button key={r} className={styles.runBtn} onClick={() => onRun(r)}>
      {r}
    </button>
  ))}
</div>

<div className={styles.eventRow}>
  <button className={`${styles.eventBtn} ${styles.bye}`} onClick={onBye}>BYE</button>
  <button className={`${styles.eventBtn} ${styles.wide}`} onClick={onWide}>WIDE</button>
  <button className={`${styles.eventBtn} ${styles.noBall}`} onClick={onNoBall}>NO BALL</button>
  <button className={`${styles.eventBtn} ${styles.wicket}`} onClick={onWicket}>WICKET</button>
  <button className={`${styles.eventBtn} ${styles.swap}`} onClick={onSwapStrike}>
    SWAP
  </button>
  <button
  className={`${styles.eventBtn} ${styles.swap}`}
  onClick={onUndo}
>
  UNDO
</button>

</div>

    </>
  );
}

export default RunControls;

