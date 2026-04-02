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
  onRenameClick,
  onStatsClick,
}) {
  const strikerSR =
    striker.balls > 0
      ? ((striker.runs / striker.balls) * 100).toFixed(1)
      : "0.0";

  const nonStrikerSR =
    nonStriker.balls > 0
      ? ((nonStriker.runs / nonStriker.balls) * 100).toFixed(1)
      : "0.0";

  const handleTap = (player) => {
    onStatsClick?.(player);
  };

  const strikerIsC = addCaptainTag(striker?.playerId, matchData, currentTeam);
  const nonStrikerIsC = addCaptainTag(
    nonStriker?.playerId,
    matchData,
    currentTeam
  );
  console.log("striker playerId:", striker?.playerId);
  console.log("teamACaptain:", matchData?.teamACaptain);
  console.log("teamBCaptain:", matchData?.teamBCaptain);
  console.log("currentTeam:", currentTeam);
  console.log("matchData.teamA:", matchData?.teamA);
  console.log("matchData.teamB:", matchData?.teamB);

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
            {striker.displayName}
            {strikerIsC ? " (C)" : ""} *
            <span style={{ fontSize: "10px", opacity: 0.5, marginLeft: "4px" }}>
              📊
            </span>
          </div>
          <div className={styles.batsmanScore}>
            {striker.runs}({striker.balls})
          </div>
          <div className={styles.batsmanSR}>SR {strikerSR}</div>
        </div>

        <div className={styles.batsmanBlock}>
          <div
            className={styles.batsmanName}
            onClick={() => handleTap(nonStriker)}
            title="Tap for stats"
            style={{ cursor: "pointer" }}
          >
            {nonStriker.displayName}
            {nonStrikerIsC ? " (C)" : ""}
            <span style={{ fontSize: "10px", opacity: 0.5, marginLeft: "4px" }}>
              📊
            </span>
          </div>
          <div className={styles.batsmanScore}>
            {nonStriker.runs}({nonStriker.balls})
          </div>
          <div className={styles.batsmanSR}>SR {nonStrikerSR}</div>
        </div>
      </div>

      <div className={styles.partnershipBox}>
        PARTNERSHIP: {partnershipRuns} ({partnershipBalls})
      </div>
    </div>
  );
}

export default BatsmenRow;
