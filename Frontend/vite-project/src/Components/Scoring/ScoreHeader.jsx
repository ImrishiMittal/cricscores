import styles from "./ScoreHeader.module.css";

function ScoreHeader({
  innings,
  teamName,
  score,
  wickets,
  overs,
  balls,
  totalOvers,
  target,
  toss,
  isSuperOver,
  superOverNumber,
}) {
  const calculatePredictedScore = () => {
    if (innings !== 1) return null;
    const ballsBowled = overs * 6 + balls;
    if (ballsBowled === 0) return 0;
    const currentRunRate = score / (ballsBowled / 6);
    const predictedScore = Math.round(currentRunRate * Number(totalOvers));
    return predictedScore;
  };

  const calculateRunsRequired = () => {
    if (innings !== 2 || !target) return null;
    // ✅ FIX: Prevent negative RRR
    const runsNeeded = Math.max(0, target - score);
    const totalBalls = Number(totalOvers) * 6;
    const ballsBowled = overs * 6 + balls;
    const ballsRemaining = Math.max(0, totalBalls - ballsBowled);
    return {
      runs: runsNeeded,
      balls: ballsRemaining,
    };
  };

  const predictedScore = calculatePredictedScore();
  const runsRequired = calculateRunsRequired();

  return (
    <div className={styles.container}>
      <div className={styles.content}>

        {/* ✅ Super Over badge placed ABOVE topRow */}
        {isSuperOver && (
          <div className={styles.superOverBadge}>
            ⚡ SUPER OVER {superOverNumber}
          </div>
        )}

        <div className={styles.topRow}>
          {/* LEFT: Total Overs (absolute positioned) */}
          <div className={styles.totalOversBox}>
            <span className={styles.totalOversLabel}>TOTAL OVERS</span>
            <span className={styles.totalOversValue}>{totalOvers}</span>
          </div>

          {/* CENTER: Team name, toss, and score */}
          <div className={styles.topSection}>
            <p className={styles.label}>INNINGS {innings}</p>
            <p className={styles.toss}>TOSS : {toss}</p>
            <h2 className={styles.teamName}>{teamName}</h2>

            <div className={styles.scoreDisplay}>
              <span className={styles.score}>{score}</span>
              <span className={styles.wickets}>/{wickets}</span>
            </div>
          </div>

          {/* RIGHT: Predicted / Required (absolute positioned) */}
          {innings === 1 && predictedScore !== null && (
            <div className={styles.predictedBox}>
              <span className={styles.predictedLabel}>PREDICTED</span>
              <span className={styles.predictedScore}>{predictedScore}</span>
            </div>
          )}

          {innings === 2 && runsRequired && (
            <div className={styles.requiredBox}>
              <span className={styles.requiredLabel}>NEED</span>
              <span className={styles.requiredValue}>{runsRequired.runs}</span>
              <span className={styles.requiredBalls}>
                from {runsRequired.balls} balls
              </span>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

export default ScoreHeader;
