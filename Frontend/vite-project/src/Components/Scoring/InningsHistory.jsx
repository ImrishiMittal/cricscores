import styles from "./scoring.module.css";

function groupByOvers(history) {
  const overs = {};

  history.forEach((ball) => {
    const overNo = ball.over + 1;

    if (!overs[overNo]) overs[overNo] = [];
    overs[overNo].push(ball);
  });

  return overs;
}

function getLabel(ball) {
  if (ball.event === "RUN") return ball.runs;
  if (ball.event === "WD") return "WD";
  if (ball.event === "NB") return "NB";
  if (ball.event === "WICKET") return "W";
  if (ball.event === "FREE_HIT") return "FH";
  if (ball.event === "BYE") return `B${ball.runs}`;
  return "•";
}

function getBallType(ball) {
  if (ball.event === "RUN") return ball.runs.toString();
  if (ball.event === "WD") return "WD";
  if (ball.event === "NB") return "NB";
  if (ball.event === "WICKET") return "W";
  if (ball.event === "FREE_HIT") return "FH";
  if (ball.event === "BYE") return "BYE";
  return "DOT";
}

export default function InningsHistory({ history, onClose }) {
  const overs = groupByOvers(history);

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.inningsModalBox}>
        <div className={styles.modalHeader}>
          <h2>Innings History</h2>
          <button className={styles.modalHeaderCloseBtn} onClick={onClose}>
            ✖
          </button>
        </div>

        <div className={styles.inningsContent}>
          {Object.keys(overs).length === 0 && <p>No balls recorded.</p>}

          {Object.entries(overs).map(([overNo, balls]) => {
            const runs = balls.reduce((t, b) => t + (b.runs || 0), 0);
            const wickets = balls.filter((b) => b.event === "WICKET").length;

            return (
              <div key={overNo} className={styles.overBlock}>
                <div className={styles.overHeader}>
                  <span>Over {overNo}</span>
                  <span>
                    {runs} Runs {wickets > 0 && `• ${wickets} Wkt`}
                  </span>
                </div>

                <div className={styles.ballRow}>
                  {balls.map((ball, i) => (
                    <div
                      key={i}
                      className={styles.ballHistory}
                      data-type={getBallType(ball)}
                    >
                      {getLabel(ball)}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
