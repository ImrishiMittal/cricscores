import styles from "./scoring.module.css";

function InfoStrip({
  overs,
  balls,
  bowler,
  score,
  target,
  innings,
  totalOvers,
  isFreeHit,
}) {
  const ballsBowled = overs * 6 + balls;  // ✅ This should work now
  const totalBalls = Number(totalOvers) * 6;
  const ballsRemaining = totalBalls - ballsBowled;

  const crr = ballsBowled > 0 ? (score / (ballsBowled / 6)).toFixed(2) : "0.00";

  const rrr =
    innings === 2 && ballsRemaining > 0
      ? ((target - score) / (ballsRemaining / 6)).toFixed(2)
      : null;

  return (
    <div className={styles.infoStrip}>
      <div>
        <span className={styles.label}>OVERS</span>
        <span className={styles.value}>
          {overs}.{balls}
        </span>
      </div>

      <div className={styles.divider}></div>

      <div>
        <span className={styles.label}>CRR</span>
        <span className={styles.value}>{crr}</span>
      </div>

      {innings === 2 && (
        <>
          <div className={styles.divider}></div>
          <div>
            <span className={styles.label}>TARGET</span>
            <span className={styles.value}>{target}</span>
          </div>

          <div className={styles.divider}></div>
          <div>
            <span className={styles.label}>RRR</span>
            <span className={styles.value}>{rrr || "0.00"}</span>
          </div>
        </>
      )}

      <div className={styles.divider}></div>

      <div>
        <span className={styles.label}>BOWLER</span>
        <span className={styles.value}>{bowler}</span>
      </div>

      {isFreeHit && (
        <>
          <div className={styles.divider}></div>
          <div className={styles.freeHitBox}>FREE HIT</div>
        </>
      )}
    </div>
  );
}

export default InfoStrip;


