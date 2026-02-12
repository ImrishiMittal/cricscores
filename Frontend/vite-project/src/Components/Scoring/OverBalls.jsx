import styles from "./scoring.module.css";

function OverBalls({ history }) {
  if (!history || history.length === 0) {
    return null;
  }

  const combinedBalls = [];
  let i = 0;

  while (i < history.length) {
    const current = history[i];
    const next = history[i + 1];

    // 🔥 Detect run + wicket on same ball (runout)
    if (
      current &&
      next &&
      current.runs !== undefined &&
      next.type === "W" &&
      current.ball === next.ball
    ) {
      combinedBalls.push({
        type: "RUN_W",
        runs: current.runs,
      });
      i += 2;
    } else {
      combinedBalls.push(current);
      i++;
    }
  }

  return (
    <div className={styles.overBalls}>
      {combinedBalls.map((ball, i) => {
        let label = "";

        if (ball.type === "RUN_W") label = `${ball.runs}+W`; // ✅ FIXED FORMAT
        else if (ball.runs !== undefined) label = ball.runs;
        else if (ball.type === "NB") label = "NB";
        else if (ball.type === "WD") label = "WD";
        else if (ball.type === "W") label = "W";
        else if (ball.type === "FH") label = "FH";
        else if (ball.type === "FH-W") label = "FH";

        return (
          <div
            key={i}
            className={styles.ball}
            data-type={ball.type || ball.event}
          >
            {label}
          </div>
        );
      })}
    </div>
  );
}

export default OverBalls;
