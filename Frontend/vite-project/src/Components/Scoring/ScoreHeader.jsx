import styles from "./ScoreHeader.module.css";

function ScoreHeader({
  innings,
  team,
  score,
  wickets,
}) {
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
      </div>
    </div>
  );
}

export default ScoreHeader;
