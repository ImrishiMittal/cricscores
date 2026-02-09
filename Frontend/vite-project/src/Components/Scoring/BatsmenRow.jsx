import { addCaptainTag } from "../../utils/captainHelper";
import styles from "./BatsmenRow.module.css";

function BatsmenRow({
  striker,
  nonStriker,
  partnershipRuns,
  partnershipBalls,
  matchData,
  currentTeam,
}) {
  const calculateStrikeRate = (runs, balls) => {
    if (balls === 0) return "0.0";
    return ((runs / balls) * 100).toFixed(1);
  };

  const strikerDisplay = addCaptainTag(striker?.name, matchData, currentTeam);
  const nonStrikerDisplay = addCaptainTag(nonStriker?.name, matchData, currentTeam);

  const strikerStrikeRate = calculateStrikeRate(striker?.runs || 0, striker?.balls || 0);
  const nonStrikerStrikeRate = calculateStrikeRate(nonStriker?.runs || 0, nonStriker?.balls || 0);

  return (
    <div className={styles.container}>
      {/* STRIKER */}
      <div className={styles.batsmanCard}>
        <div className={styles.header}>
          <h3 className={styles.name}>
            {strikerDisplay} <span className={styles.strikeBadge}>*</span>
          </h3>
        </div>

        <div className={styles.scoreRow}>
          <span className={styles.score}>{striker?.runs || 0}</span>
          <span className={styles.balls}>({striker?.balls || 0})</span>
          <span className={styles.strikeRate}>{strikerStrikeRate}</span>
        </div>
      </div>

      {/* NON-STRIKER */}
      <div className={styles.batsmanCard}>
        <div className={styles.header}>
          <h3 className={styles.name}>{nonStrikerDisplay}</h3>
        </div>

        <div className={styles.scoreRow}>
          <span className={styles.score}>{nonStriker?.runs || 0}</span>
          <span className={styles.balls}>({nonStriker?.balls || 0})</span>
          <span className={styles.strikeRate}>{nonStrikerStrikeRate}</span>
        </div>
      </div>

      {/* ✅ Partnership outside both boxes */}
      <div className={styles.partnershipRow}>
        <p className={styles.partnershipText}>
          PARTNERSHIP: <span className={styles.partValue}>{partnershipRuns}({partnershipBalls})*</span>
        </p>
      </div>
    </div>
  );
}

export default BatsmenRow;
