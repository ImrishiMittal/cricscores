import styles from "./scoring.module.css";

function OverBalls({ history }) {
  if (!history || history.length === 0) {
    return null;
  }

  // ✅ FIX: Combine consecutive RUN + WICKET balls (for runouts with runs)
  const combineBalls = (balls) => {
    const combined = [];
    let i = 0;

    while (i < balls.length) {
      const current = balls[i];
      const next = balls[i + 1];

      // Check if current is RUN and next is WICKET (runout scenario)
      if (
        current &&
        next &&
        (current.runs !== undefined || current.type === "RUN") &&
        (next.type === "W" || next.type === "WICKET")
      ) {
        // Combine them: "1+W", "2+W", etc.
        combined.push({
          ...current,
          type: "RUN_WICKET",
          isWicket: true,
        });
        i += 2; // Skip both balls
      } else {
        combined.push(current);
        i += 1;
      }
    }

    return combined;
  };

  const combinedHistory = combineBalls(history);

  return (
    <div className={styles.overBalls}>
      {combinedHistory.map((ball, idx) => {
        let label = "";
        let dataType = "";

        const ballType = ball.type || ball.event;

        // Handle combined run + wicket events
        if (ballType === "RUN_WICKET" || ball.isWicket) {
          label = `${ball.runs}+W`;
          dataType = "RUN_WICKET";
        }
        // Handle wickets
        else if (ballType === "W" || ballType === "WICKET") {
          label = "W";
          dataType = "W";
        }
        // Handle wide
        else if (ballType === "WD" || ballType === "WIDE") {
          label = ball.runs > 0 ? `${ball.runs}WD` : "WD";
          dataType = "WD";
        }
        // Handle no ball
        else if (ballType === "NB" || ballType === "NO_BALL") {
          label = ball.runs > 0 ? `${ball.runs}NB` : "NB";
          dataType = "NB";
        }
        // Handle free hit
        else if (ballType === "FH" || ballType === "FREE_HIT") {
          label = "FH";
          dataType = "FH";
        }
        // Handle bye
        else if (ballType === "BYE") {
          label = `B${ball.runs || ""}`;
          dataType = "BYE";
        }
        // Handle regular runs
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
