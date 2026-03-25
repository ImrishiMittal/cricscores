import styles from "./InningsSummary.module.css";

function InningsSummary({
  players,
  allPlayers,
  bowlers,
  score,
  wickets,
  overs,
  balls,
  onClose,
}) {
  const formatOvers = (overs, balls) => `${overs}.${balls}`;

  // combine dismissed + current
  const allBatsmen = [...(allPlayers || []), ...players];

  // only those who played
  const battedPlayers = allBatsmen.filter(
    (p) => p.balls > 0 || p.dismissal
  );

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className={styles.header}>
          <h2 className={styles.title}>
            📋 Innings Summary
          </h2>

          <button
            className={styles.closeIcon}
            onClick={onClose}
          >
            ✖
          </button>
        </div>

        {/* SCORE */}
        <div className={styles.scoreBox}>
          <div className={styles.scoreMain}>
            <span className={styles.runs}>
              {score}
            </span>

            <span className={styles.wickets}>
              /{wickets}
            </span>
          </div>

          <div className={styles.oversText}>
            {formatOvers(overs, balls)} overs
          </div>
        </div>

        {/* ================= BATTTING ================= */}

        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>
            🏏 BATTING
          </h3>

          <div className={styles.table}>
            {/* HEADER */}
            <div className={styles.tableHeader}>
              <div className={styles.playerCol}>
                BATSMAN
              </div>

              <div className={styles.statCol}>
                R
              </div>

              <div className={styles.statCol}>
                B
              </div>

              <div className={styles.statCol}>
                SR
              </div>

              <div className={styles.statCol}>
                4s
              </div>

              <div className={styles.statCol}>
                6s
              </div>
            </div>

            {battedPlayers.length === 0 && (
              <div className={styles.noData}>
                No batting data available
              </div>
            )}

            {battedPlayers.map((player, idx) => {
              const strikeRate =
                player.balls > 0
                  ? (
                      (player.runs /
                        player.balls) *
                      100
                    ).toFixed(1)
                  : "0.0";

              return (
                <div
                  key={player.playerId || idx}
                  className={styles.tableRow}
                >
                  {/* NAME */}
                  <div
                    className={styles.playerCol}
                  >
                    <div
                      className={
                        styles.playerName
                      }
                    >
                      {player.displayName}
                    </div>

                    {player.dismissal && (
                      <div
                        className={
                          styles.dismissal
                        }
                      >
                        {player.dismissal}
                      </div>
                    )}

                    {!player.dismissal &&
                      player.balls > 0 && (
                        <div
                          className={
                            styles.notOut
                          }
                        >
                          not out
                        </div>
                      )}
                  </div>

                  {/* STATS */}
                  <div className={styles.statCol}>
                    {player.runs}
                  </div>

                  <div className={styles.statCol}>
                    {player.balls}
                  </div>

                  <div className={styles.statCol}>
                    {strikeRate}
                  </div>

                  <div className={styles.statCol}>
                    {player.fours || 0}
                  </div>

                  <div className={styles.statCol}>
                    {player.sixes || 0}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ================= BOWLING ================= */}

        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>
            ⚡ BOWLING
          </h3>

          <div className={styles.table}>
            <div className={styles.tableHeader}>
              <div className={styles.playerCol}>
                BOWLER
              </div>

              <div className={styles.statCol}>
                O
              </div>

              <div className={styles.statCol}>
                R
              </div>

              <div className={styles.statCol}>
                W
              </div>

              <div className={styles.statCol}>
                ECO
              </div>
            </div>

            {bowlers.length === 0 && (
              <div className={styles.noData}>
                No bowling data available
              </div>
            )}

            {bowlers.map((bowler, idx) => {
              const totalOvers =
                bowler.overs +
                bowler.balls / 6;

              const economy =
                totalOvers > 0
                  ? (
                      bowler.runs /
                      totalOvers
                    ).toFixed(2)
                  : "0.00";

              return (
                <div
                  key={bowler.playerId || idx}
                  className={styles.tableRow}
                >
                  <div
                    className={
                      styles.playerCol
                    }
                  >
                    {bowler.displayName}
                  </div>

                  <div
                    className={
                      styles.statCol
                    }
                  >
                    {bowler.overs}.
                    {bowler.balls}
                  </div>

                  <div
                    className={
                      styles.statCol
                    }
                  >
                    {bowler.runs}
                  </div>

                  <div
                    className={
                      styles.statCol
                    }
                  >
                    {bowler.wickets}
                  </div>

                  <div
                    className={
                      styles.statCol
                    }
                  >
                    {economy}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <button
          className={styles.closeBtn}
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </div>
  );
}

export default InningsSummary;