import { addCaptainTag } from "../../utils/captainHelper";
import styles from "./scoring.module.css";

function InfoStrip({
  overs,
  balls,
  bowler,
  bowlers,
  currentBowlerIndex,
  score,
  target,
  innings,
  totalOvers,
  isFreeHit,
  matchData,
  currentTeam,
}) {
  const ballsBowled = overs * 6 + balls;
  const totalBalls = Number(totalOvers) * 6;
  const ballsRemaining = totalBalls - ballsBowled;

  const crr = ballsBowled > 0 ? (score / (ballsBowled / 6)).toFixed(2) : "0.00";

  const rrr =
    innings === 2 && ballsRemaining > 0
      ? ((target - score) / (ballsRemaining / 6)).toFixed(2)
      : null;

  // Get current bowler stats
  const currentBowler = bowlers && bowlers[currentBowlerIndex];
  
  // Calculate bowler economy
  const getBowlerEconomy = (bowler) => {
    if (!bowler) return "0.00";
    const totalOvers = bowler.overs + (bowler.balls / 6);
    if (totalOvers === 0) return "0.00";
    return (bowler.runs / totalOvers).toFixed(2);
  };

  const bowlingTeam =
  currentTeam === matchData.teamA
    ? matchData.teamB
    : matchData.teamA;

const bowlerDisplay = currentBowler
  ? `${addCaptainTag(currentBowler.name, matchData, bowlingTeam)} - ${currentBowler.runs || 0}/${currentBowler.wickets || 0} [${getBowlerEconomy(currentBowler)}]`
  : addCaptainTag(bowler, matchData, bowlingTeam);


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

      <div className={styles.bowlerInfo}>
        <span className={styles.label}>BOWLER</span>
        <span className={styles.bowlerValue}>{bowlerDisplay}</span>
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