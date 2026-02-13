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

        // Handle combined run + wicket events
        if (ball.event === "RUN_WICKET" || (ball.event === "RUN" && ball.isWicket)) {
          label = `${ball.runs}+W`;
          dataType = "RUN_WICKET";
        } 
        // Handle regular run events OR balls with just a 'runs' property
        else if (ball.event === "RUN" || (ball.runs !== undefined && !ball.event)) {
          const runs = ball.runs ?? 0;
          label = runs;
          dataType = runs === 0 ? "0" : runs === 4 ? "4" : runs === 6 ? "6" : "RUN";
        } 
        else if (ball.event === "WICKET") {
          label = "W";
          dataType = "W";
        } 
        else if (ball.event === "WD") {
          label = "WD";
          dataType = "WD";
        } 
        else if (ball.event === "NB") {
          label = "NB";
          dataType = "NB";
        } 
        else if (ball.event === "BYE") {
          label = `B${ball.runs || ""}`;
          dataType = "BYE";
        } 
        else if (ball.event === "FREE_HIT") {
          label = "FH";
          dataType = "FH";
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