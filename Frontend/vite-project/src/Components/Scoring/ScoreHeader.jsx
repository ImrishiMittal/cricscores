import styles from "./scoring.module.css";

function ScoreHeader({ team, score, wickets }) {
  return (
    <div className={styles.scoreCard}>
      <h2 className={styles.teamName}>{team}</h2>
      <h1 className={styles.bigScore}>{score}/{wickets}</h1>
    </div>
  );
}

export default ScoreHeader;
