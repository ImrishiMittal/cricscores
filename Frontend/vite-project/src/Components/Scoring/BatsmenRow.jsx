import { addCaptainTag } from "../../utils/captainHelper";
import styles from "./scoring.module.css";

function BatsmenRow({
  striker,
  nonStriker,
  partnershipRuns,
  partnershipBalls,
  matchData,
  currentTeam,
  wickets,
}) {
  // Calculate strike rates
  const strikerSR = striker.balls > 0 
    ? ((striker.runs / striker.balls) * 100).toFixed(1) 
    : "0.0";
  
  const nonStrikerSR = nonStriker.balls > 0 
    ? ((nonStriker.runs / nonStriker.balls) * 100).toFixed(1) 
    : "0.0";

  return (
    <div className={styles.batsmenRow}>
      <div className={styles.batsmenSection}>
        <div className={styles.batsmanBlock}>
          <div className={styles.batsmanName}>
            {addCaptainTag(striker.displayName, matchData, currentTeam)} *
          </div>
          <div className={styles.batsmanScore}>
            {striker.runs}({striker.balls})
          </div>
          <div className={styles.batsmanSR}>
            SR {strikerSR}
          </div>
        </div>

        <div className={styles.batsmanBlock}>
          <div className={styles.batsmanName}>
            {addCaptainTag(nonStriker.displayName, matchData, currentTeam)}
          </div>
          <div className={styles.batsmanScore}>
            {nonStriker.runs}({nonStriker.balls})
          </div>
          <div className={styles.batsmanSR}>
            SR {nonStrikerSR}
          </div>
        </div>
      </div>

      <div className={styles.partnershipBox}>
        PARTNERSHIP: {partnershipRuns} ({partnershipBalls})
      </div>
    </div>
  );
}

export default BatsmenRow;