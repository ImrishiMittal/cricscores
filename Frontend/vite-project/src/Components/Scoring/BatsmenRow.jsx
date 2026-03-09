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
  onRenameClick,    // existing — still used (from RenameModal path if needed)
  onStatsClick,     // ✅ NEW: opens PlayerStatsModal
}) {
  const strikerSR = striker.balls > 0
    ? ((striker.runs / striker.balls) * 100).toFixed(1)
    : "0.0";

  const nonStrikerSR = nonStriker.balls > 0
    ? ((nonStriker.runs / nonStriker.balls) * 100).toFixed(1)
    : "0.0";

  // ✅ Tap name → open stats popup (which contains rename button inside)
  const handleTap = (player) => {
    onStatsClick?.(player);
  };

  return (
    <div className={styles.batsmenRow}>
      <div className={styles.batsmenSection}>

        <div className={styles.batsmanBlock}>
          <div
            className={styles.batsmanName}
            onClick={() => handleTap(striker)}
            title="Tap for stats"
            style={{ cursor: "pointer" }}
          >
            {addCaptainTag(striker.displayName, matchData, currentTeam)} *
            <span style={{ fontSize: "10px", opacity: 0.5, marginLeft: "4px" }}>📊</span>
          </div>
          <div className={styles.batsmanScore}>
            {striker.runs}({striker.balls})
          </div>
          <div className={styles.batsmanSR}>
            SR {strikerSR}
          </div>
        </div>

        <div className={styles.batsmanBlock}>
          <div
            className={styles.batsmanName}
            onClick={() => handleTap(nonStriker)}
            title="Tap for stats"
            style={{ cursor: "pointer" }}
          >
            {addCaptainTag(nonStriker.displayName, matchData, currentTeam)}
            <span style={{ fontSize: "10px", opacity: 0.5, marginLeft: "4px" }}>📊</span>
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
