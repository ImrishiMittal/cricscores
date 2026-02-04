import styles from "./scoring.module.css";

function OverBalls({ history }) {
  return (
    <div className={styles.overBalls}>
      {history.map((ball, i) => {
        let label = "";

        if (ball.runs !== undefined) label = ball.runs;
        else if (ball.type === "NB") label = "NB";
        else if (ball.type === "WD") label = "WD";
        else if (ball.type === "W") label = "W";
        else if (ball.type === "FH") label = "FH";

        return (
          <div key={i} className={`${styles.ball} ${styles[label] || ""}`}>
            {label}
          </div>
        );
      })}
    </div>
  );
}

export default OverBalls;

