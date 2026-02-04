import styles from "./scoring.module.css";

function OverBalls({ history }) {
  return (
    <div className={styles.overBalls}>
      {history.slice(-6).map((ball, i) => {
        let display;

        if (ball.type === "W") display = "W";
        else display = ball.runs;

        return (
          <div
            key={i}
            className={`${styles.ball} ${ball.type === "W" ? styles.wicketBall : ""}`}
          >
            {display}
          </div>
        );
      })}
    </div>
  );
}

export default OverBalls;
