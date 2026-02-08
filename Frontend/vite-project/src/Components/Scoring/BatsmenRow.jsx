import { addCaptainTag } from "../../utils/captainHelper";
import styles from "./scoring.module.css";

function BatsmenRow({ 
  striker, 
  nonStriker, 
  partnershipRuns, 
  partnershipBalls, 
  matchData,      // ✅ ADD THIS
  currentTeam     // ✅ ADD THIS
}) {
  const strikerDisplay = addCaptainTag(striker.name, matchData, currentTeam);
  const nonStrikerDisplay = addCaptainTag(nonStriker.name, matchData, currentTeam);

  return (
    <div className={styles.batsmenRow}>
      <div className={styles.batsmanBlock}>
        <div className={styles.batsmanName}>{strikerDisplay} *</div>
        <div className={styles.batsmanScore}>
          {striker.runs} ({striker.balls})
        </div>
      </div>

      <div className={styles.partnershipBox}>
        PARTNERSHIP: {partnershipRuns}({partnershipBalls})*
      </div>

      <div className={styles.batsmanBlock}>
        <div className={styles.batsmanName}>{nonStrikerDisplay}</div>
        <div className={styles.batsmanScore}>
          {nonStriker.runs} ({nonStriker.balls})
        </div>
      </div>
    </div>
  );
}

export default BatsmenRow;