import styles from "./ScoreHeader.module.css";

function ScoreHeader({
  innings,
  team,
  score,
  wickets,
  bowlers,
  currentBowlerIndex,
}) {
  // ✅ FIX #2: Get current bowler with stats
  const currentBowler = bowlers && bowlers[currentBowlerIndex];

  // Calculate bowler overs (proper cricket format: 0.1-0.6 = 1 over)
  const getBowlerOvers = (bowler) => {
    if (!bowler) return "0.0";
    const completeOvers = bowler.overs || 0;
    const ballsInCurrentOver = (bowler.balls || 0) % 6;
    return `${completeOvers}.${ballsInCurrentOver}`;
  };

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        {/* LEFT: TEAM & SCORE */}
        <div className={styles.scoreSection}>
          <p className={styles.label}>Innings {innings}</p>
          <h1 className={styles.team}>{team}</h1>
          <div className={styles.scoreDisplay}>
            <span className={styles.score}>{score}</span>
            <span className={styles.wickets}>/{wickets}</span>
          </div>
        </div>

        {/* RIGHT: BOWLER STATS */}
        <div className={styles.bowlerSection}>
          {currentBowler ? (
            <div className={styles.bowlerCard}>
              {/* ✅ FIX #2: Show bowler name with stats */}
              <p className={styles.bowlerLabel}>Current Bowler</p>
              
              <div className={styles.bowlerName}>
                {currentBowler.name}
              </div>

              {/* Bowler statistics inline */}
              <div className={styles.bowlerStats}>
                <div className={styles.statItem}>
                  <span className={styles.statLabel}>Runs/Wkts</span>
                  <span className={styles.statValue}>
                    {currentBowler.runs || 0}/{currentBowler.wickets || 0}
                  </span>
                </div>
                <div className={styles.statItem}>
                  <span className={styles.statLabel}>Overs</span>
                  <span className={styles.statValue}>
                    ({getBowlerOvers(currentBowler)})
                  </span>
                </div>
              </div>

              {/* Show if bowler has bowled before */}
              {currentBowlerIndex > 0 && (
                <p className={styles.bowledBefore}>
                  ↻ Returning bowler
                </p>
              )}
            </div>
          ) : (
            <div className={styles.emptyBowler}>
              <p>Select a bowler</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ScoreHeader;
