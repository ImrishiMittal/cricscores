import { addCaptainTag } from "../../utils/captainHelper";
import styles from "./BatsmenRow.module.css";

function BatsmenRow({
  striker,
  nonStriker,
  partnershipRuns,
  partnershipBalls,
  matchData,
  currentTeam,
})
 {
  const calculateStrikeRate = (runs, balls) =>
    balls === 0 ? "0.0" : ((runs / balls) * 100).toFixed(1);

  const strikerDisplay = addCaptainTag(striker?.name, matchData, currentTeam);
  const nonStrikerDisplay = addCaptainTag(nonStriker?.name, matchData, currentTeam);

  return (
    <div className={styles.container}>
  
      {striker && (
        <div className={`${styles.batsmanCard} ${styles.striker}`}>
          <div className={styles.header}>
            <h3 className={styles.name}>
              {strikerDisplay} <span className={styles.strikeBadge}>*</span>
            </h3>
          </div>
          <div className={styles.stats}>
            <span>{striker.runs}</span>
            <span>({striker.balls})</span>
            <span className={styles.sr}>
              SR {calculateStrikeRate(striker.runs, striker.balls)}
            </span>
          </div>
        </div>
      )}
  
      {nonStriker && (
        <div className={styles.batsmanCard}>
          <div className={styles.header}>
            <h3 className={styles.name}>{nonStrikerDisplay}</h3>
          </div>
          <div className={styles.stats}>
            <span>{nonStriker.runs}</span>
            <span>({nonStriker.balls})</span>
            <span className={styles.sr}>
              SR {calculateStrikeRate(nonStriker.runs, nonStriker.balls)}
            </span>
          </div>
        </div>
      )}
  
      <div className={styles.partnershipRow}>
        PARTNERSHIP: {partnershipRuns} ({partnershipBalls})
      </div>
  
    </div>
  );
  }

export default BatsmenRow;

