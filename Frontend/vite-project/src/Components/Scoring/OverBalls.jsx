import styles from "./scoring.module.css";

function OverBalls({ history }) {
  return (
    <div className={styles.overBalls}>
      {history.slice(-6).map((b, i) => (
        <div key={i} className={styles.ball}>{b.runs}</div>
      ))}
    </div>
  );
}

export default OverBalls;
