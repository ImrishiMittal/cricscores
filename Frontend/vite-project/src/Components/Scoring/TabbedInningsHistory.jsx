import { useState } from 'react';
import styles from './TabbedInningsHistory.module.css';

function groupByOvers(history) {
  const overs = {};
  history.forEach((ball) => {
    const overNo = ball.over + 1;
    if (!overs[overNo]) overs[overNo] = [];
    overs[overNo].push(ball);
  });
  return overs;
}

function combineBalls(balls) {
  const combined = [];
  let i = 0;
  while (i < balls.length) {
    const current = balls[i];
    const next = balls[i + 1];
    if (
      current && 
      next && 
      current.event === "RUN" && 
      next.event === "WICKET" &&
      current.ball === next.ball
    ) {
      combined.push({
        ...current,
        event: "RUN_WICKET",
        runs: current.runs,
      });
      i += 2;
    } else {
      combined.push(current);
      i += 1;
    }
  }
  return combined;
}

function getLabel(ball) {
  if (ball.event === "RUN_WICKET") return `${ball.runs}W`;
  if (ball.event === "RUN") return ball.runs;
  if (ball.event === "WD") return "WD";
  if (ball.event === "NB") return "NB";
  if (ball.event === "WICKET") return "W";
  if (ball.event === "FREE_HIT") return "FH";
  if (ball.event === "BYE") return `B${ball.runs}`;
  return "•";
}

function getBallType(ball) {
  if (ball.event === "RUN_WICKET") return "RUN_WICKET";
  if (ball.event === "RUN") return ball.runs.toString();
  if (ball.event === "WD") return "WD";
  if (ball.event === "NB") return "NB";
  if (ball.event === "WICKET") return "W";
  if (ball.event === "FREE_HIT") return "FH";
  if (ball.event === "BYE") return "BYE";
  return "DOT";
}

function TabbedInningsHistory({ 
  innings1History,
  innings2History,
  currentInnings,
  onClose 
}) {
  // ✅ Default to current innings tab
  const [activeTab, setActiveTab] = useState(currentInnings === 2 ? 'innings2' : 'innings1');

  // Get history for active tab
  const getHistory = (tab) => {
    if (tab === 'innings1') return innings1History || [];
    if (tab === 'innings2') return innings2History || [];
    return [];
  };

  const history = getHistory(activeTab);
  const overs = groupByOvers(history);

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.inningsModalBox}>
        <div className={styles.modalHeader}>
          <h2>Innings History</h2>
          <button className={styles.modalHeaderCloseBtn} onClick={onClose}>
            ✕
          </button>
        </div>

        {/* ✅ TABS */}
        {currentInnings === 2 && innings1History && innings2History && (
          <div className={styles.tabContainer}>
            <button
              className={`${styles.tab} ${activeTab === 'innings1' ? styles.activeTab : ''}`}
              onClick={() => setActiveTab('innings1')}
            >
              Innings 1
            </button>
            <button
              className={`${styles.tab} ${activeTab === 'innings2' ? styles.activeTab : ''}`}
              onClick={() => setActiveTab('innings2')}
            >
              Innings 2
            </button>
          </div>
        )}

        <div className={styles.inningsContent}>
          {Object.keys(overs).length === 0 && <p>No balls recorded.</p>}

          {Object.entries(overs).map(([overNo, balls]) => {
            const runs = balls.reduce((t, b) => t + (b.runs || 0), 0);
            const wickets = balls.filter((b) => b.event === "WICKET").length;
            const combinedBalls = combineBalls(balls);

            return (
              <div key={overNo} className={styles.overBlock}>
                <div className={styles.overHeader}>
                  <span>Over {overNo}</span>
                  <span>
                    {runs} Runs {wickets > 0 && `• ${wickets} Wkt`}
                  </span>
                </div>

                <div className={styles.ballRow}>
                  {combinedBalls.map((ball, i) => (
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

export default TabbedInningsHistory;
