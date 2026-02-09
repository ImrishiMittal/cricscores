import styles from "./ScoreHeader.module.css";

function ScoreHeader({
  innings,
  team,
  score,
  wickets,
  overs,
  balls,
  totalOvers,
}) {
  // ✅ Calculate Predicted Score (only for 1st innings)
  const calculatePredictedScore = () => {
    if (innings !== 1) return null;
    
    const ballsBowled = overs * 6 + balls;
    if (ballsBowled === 0) return 0;
    
    const currentRunRate = score / (ballsBowled / 6);
    const predictedScore = Math.round(currentRunRate * Number(totalOvers));
    
    return predictedScore;
  };

  const predictedScore = calculatePredictedScore();

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        {/* Team name and innings */}
        <div className={styles.topSection}>
          <p className={styles.label}>INNINGS {innings}</p>
          <h1 className={styles.team}>{team}</h1>
        </div>

        {/* Centered score */}
        <div className={styles.scoreDisplay}>
          <span className={styles.score}>{score}</span>
          <span className={styles.wickets}>/{wickets}</span>
        </div>

        {/* ✅ Predicted Score - Top Right Corner (1st innings only) */}
        {innings === 1 && (
          <div className={styles.predictedBox}>
            <span className={styles.predictedLabel}>PREDICTED SCORE</span>
            <span className={styles.predictedScore}>{predictedScore}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default ScoreHeader;
