import styles from "./BatsmenRow.module.css";

function BatsmenRow({
  striker,
  nonStriker,
  partnershipRuns,
  partnershipBalls,
  matchData,
  currentTeam,
}) {
  // ✅ FIX #3: Calculate strike rate for both batsmen
  const calculateStrikeRate = (runs, balls) => {
    if (balls === 0) return "0.0";
    return ((runs / balls) * 100).toFixed(1);
  };

  const strikerStrikeRate = calculateStrikeRate(striker?.runs || 0, striker?.balls || 0);
  const nonStrikerStrikeRate = calculateStrikeRate(nonStriker?.runs || 0, nonStriker?.balls || 0);

  return (
    <div className={styles.container}>
      {/* STRIKER */}
      <div className={styles.batsmanCard}>
        <div className={styles.header}>
          <h3 className={styles.name}>
            {striker?.name} <span className={styles.badge}>*</span>
          </h3>
        </div>

        <div className={styles.stats}>
          <div className={styles.scoreRow}>
            <span className={styles.score}>{striker?.runs || 0}</span>
            <span className={styles.balls}>({striker?.balls || 0})</span>
            {/* ✅ Strike rate displayed smaller */}
            <span className={styles.strikeRate}>{strikerStrikeRate}</span>
          </div>
        </div>

        <div className={styles.partnership}>
          <p className={styles.partnershipText}>
            Partnership: <span className={styles.partValue}>{partnershipRuns}({partnershipBalls})</span>
          </p>
        </div>
      </div>

      {/* NON-STRIKER */}
      <div className={styles.batsmanCard}>
        <div className={styles.header}>
          <h3 className={styles.name}>
            {nonStriker?.name} <span className={styles.badge}>(C)</span>
          </h3>
        </div>

        <div className={styles.stats}>
          <div className={styles.scoreRow}>
            <span className={styles.score}>{nonStriker?.runs || 0}</span>
            <span className={styles.balls}>({nonStriker?.balls || 0})</span>
            {/* ✅ Strike rate displayed smaller */}
            <span className={styles.strikeRate}>{nonStrikerStrikeRate}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BatsmenRow;
