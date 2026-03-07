import styles from "./scoring.module.css";

function OverBalls({ history }) {
  if (!history || history.length === 0) {
    return null;
  }

  return (
    <div className={styles.overBalls}>
      {history.map((ball, idx) => {
        let label = "";
        let dataType = "";

        const ballType = ball.type || ball.event;

        if (ballType === "W" || ballType === "WICKET") {
          label = "W";
          dataType = "W";
        }
        else if (ballType === "HW") {                   // ✅ NEW: hit wicket
          label = "HW";
          dataType = "W";
        }
        else if (ballType === "WD" || ballType === "WIDE") {
          label = ball.runs > 0 ? `${ball.runs}WD` : "WD";
          dataType = "WD";
        }
        else if (ballType === "NB" || ballType === "NO_BALL") {
          label = ball.runs > 0 ? `${ball.runs}NB` : "NB";
          dataType = "NB";
        }
        else if (ballType === "FH" || ballType === "FREE_HIT") {
          label = "FH";
          dataType = "FH";
        }
        else if (ballType === "BYE") {
          label = `B${ball.runs || ""}`;
          dataType = "BYE";
        }
        else if (ballType === "LB") {                   // ✅ already handled in engine
          label = `LB${ball.runs || ""}`;
          dataType = "BYE";
        }
        else if (ball.isWicket) {
          const runs = ball.runs ?? 0;
          label = runs > 0 ? `${runs}+W` : "W";
          dataType = "RUN_WICKET";
        }
        else if (ballType === "RUN" || ball.runs !== undefined) {
          const runs = ball.runs ?? 0;
          label = runs;
          dataType = runs === 0 ? "0" : runs === 4 ? "4" : runs === 6 ? "6" : "RUN";
        }
        else {
          label = "•";
          dataType = "DOT";
        }

        return (
          <div
            key={idx}
            className={styles.ball}
            data-type={dataType}
          >
            {label}
          </div>
        );
      })}
    </div>
  );
}

export default OverBalls;
