import { useState } from "react";
import styles from "./FullScorecard.module.css";

function FullScorecard({
  matchData,
  mainMatchData,
  superOverData,
  firstBattingTeam,
  secondBattingTeam,
  onClose,
  // ← Phase 3 additions (undefined / false in limited-overs — no effect)
  isTestMatch,
  followOnEnforced,
  winner,
}) {
  const [activePhase, setActivePhase] = useState("main");

  const formatOvers = (o, b) => {
    if (o === undefined || b === undefined) return "0.0";
    return `${o}.${b}`;
  };

  const formatExtras = (extras) => {
    if (!extras || extras.total === 0) return null;

    const parts = [];
    if (extras.wides > 0) parts.push(`W ${extras.wides}`);
    if (extras.noBalls > 0) parts.push(`NB ${extras.noBalls}`);
    if (extras.byes > 0) parts.push(`B ${extras.byes}`);
    if (extras.legByes > 0) parts.push(`LB ${extras.legByes}`);

    return `Extras: ${extras.total} (${parts.join(", ")})`;
  };

  // ─── Which team bats each Test innings? ───────────────────────────────────────
  // Normal:     inn1=A  inn2=B  inn3=A  inn4=B
  // Follow-on:  inn1=A  inn2=B  inn3=B  inn4=A  (B bats again immediately)
  const testInningsTeam = (n) => {
    if (followOnEnforced) {
      if (n === 1) return firstBattingTeam;
      if (n === 2) return secondBattingTeam;
      if (n === 3) return secondBattingTeam; // follow-on: same team bats again
      if (n === 4) return firstBattingTeam;
    } else {
      if (n === 1) return firstBattingTeam;
      if (n === 2) return secondBattingTeam;
      if (n === 3) return firstBattingTeam;
      if (n === 4) return secondBattingTeam;
    }
    return "";
  };

  // ─── Single innings card — identical to original for limited-overs ────────────
  const renderInningsCard = (
    inningsData,
    inningsNumber,
    phaseLabel,
    teamName,
    // Phase 3 optional extras — unused in limited-overs path
    isFollowOn,
    chaseTarget
  ) => {
    if (!inningsData) {
      return (
        <div className={styles.inningsCard}>
          <div className={styles.inningsHeader}>
            <h3>
              {phaseLabel} — Innings {inningsNumber}
            </h3>
          </div>
          <p className={styles.noData}>No data available</p>
        </div>
      );
    }

    const battedPlayers = inningsData.battingStats || [];
    const bowlers = inningsData.bowlingStats || [];

    return (
      <div className={styles.inningsCard}>
        <div className={styles.inningsHeader}>
          <h3>
            {phaseLabel} — Innings {inningsNumber}
            {teamName && (
              <span className={styles.teamLabel}> ({teamName})</span>
            )}
            {isFollowOn && (
              <span
                style={{
                  marginLeft: "8px",
                  background: "#7f1d1d",
                  color: "#fca5a5",
                  fontSize: "11px",
                  fontWeight: "700",
                  padding: "2px 7px",
                  borderRadius: "4px",
                  letterSpacing: "0.5px",
                  verticalAlign: "middle",
                }}
              >
                FOLLOW-ON
              </span>
            )}
          </h3>

          <div className={styles.scoreDisplay}>
            <span className={styles.score}>{inningsData.score ?? "—"}</span>
            <span className={styles.wickets}>
              /{inningsData.wickets ?? "—"}
            </span>
            <span className={styles.overs}>
              ({formatOvers(inningsData.overs, inningsData.balls)})
            </span>
          </div>

          {/* Target banner — only shown for Test innings 4 chase */}
          {chaseTarget != null && (
            <div
              style={{
                marginTop: "4px",
                fontSize: "13px",
                color: "#86efac",
                fontWeight: "600",
              }}
            >
              Target: {chaseTarget} runs
            </div>
          )}

          {inningsData.extras && inningsData.extras.total > 0 && (
            <div className={styles.extras}>
              {formatExtras(inningsData.extras)}
            </div>
          )}
        </div>

        {/* ================= BATTING ================= */}

        <div className={styles.section}>
          <h4 className={styles.sectionTitle}>🏏 BATTING</h4>

          <div className={styles.table}>
            <div className={`${styles.tableRow} ${styles.tableHeader}`}>
              <div className={styles.playerCol}>BATSMAN</div>
              <div className={styles.statCol}>R</div>
              <div className={styles.statCol}>B</div>
              <div className={styles.statCol}>SR</div>
              <div className={styles.statCol}>4s</div>
              <div className={styles.statCol}>6s</div>
            </div>

            {battedPlayers.length === 0 && (
              <div className={styles.noData}>No batting data</div>
            )}

            {battedPlayers.map((player, idx) => {
              const sr =
                player.balls > 0
                  ? ((player.runs / player.balls) * 100).toFixed(1)
                  : "0.0";

              const name = player.displayName || player.name || "—";

              return (
                <div key={idx} className={styles.tableRow}>
                  <div className={styles.playerCol}>
                    <div className={styles.playerName}>{name}</div>

                    {player.dismissal ? (
                      <div className={styles.dismissal}>{player.dismissal}</div>
                    ) : player.balls > 0 ? (
                      <div className={styles.notOut}>not out</div>
                    ) : null}
                  </div>

                  <div className={styles.statCol}>{player.runs}</div>

                  <div className={styles.statCol}>{player.balls}</div>

                  <div className={styles.statCol}>{sr}</div>

                  <div className={styles.statCol}>{player.fours || 0}</div>

                  <div className={styles.statCol}>{player.sixes || 0}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ================= BOWLING ================= */}

        <div className={styles.section}>
          <h4 className={styles.sectionTitle}>⚡ BOWLING</h4>

          <div className={styles.table}>
            <div className={`${styles.tableRow} ${styles.tableHeader}`}>
              <div className={styles.playerCol}>BOWLER</div>
              <div className={styles.statCol}>O</div>
              <div className={styles.statCol}>R</div>
              <div className={styles.statCol}>W</div>
              <div className={styles.statCol}>ECO</div>
            </div>

            {bowlers.map((bowler, idx) => {
              const ballsBowled = bowler.ballsBowled || bowler.balls || 0;
              const runsGiven = bowler.runsGiven || bowler.runs || 0;
              const fullOvers = Math.floor(ballsBowled / 6);
              const remBalls = ballsBowled % 6;
              const oversToShow =
                bowler.oversDisplay ||
                (remBalls > 0 ? `${fullOvers}.${remBalls}` : `${fullOvers}.0`);
              const eco =
                ballsBowled > 0
                  ? ((runsGiven / ballsBowled) * 6).toFixed(2)
                  : "0.00";

              return (
                <div key={idx} className={styles.tableRow}>
                  <div className={styles.playerCol}>
                    {bowler.displayName || bowler.playerName || bowler.name}
                  </div>
                  <div className={styles.statCol}>{oversToShow}</div>
                  <div className={styles.statCol}>{runsGiven}</div>
                  <div className={styles.statCol}>{bowler.wickets}</div>
                  <div className={styles.statCol}>{eco}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // ─── Main match content ───────────────────────────────────────────────────────
  const renderPhaseContent = () => {
    if (activePhase === "main") {
      const inn1 = mainMatchData?.innings1Data || null;
      const inn2 = mainMatchData?.innings2Data || null;
  
      if (!isTestMatch) {
        return (
          <div className={styles.phaseContent}>
            {renderInningsCard(inn1, 1, "Main Match", firstBattingTeam)}
            {renderInningsCard(inn2, 2, "Main Match", secondBattingTeam)}
          </div>
        );
      }
  
      const inn3 = mainMatchData?.innings3Data || null;
      const inn4 = mainMatchData?.innings4Data || null;
      const inn4Target = mainMatchData?.testTarget ?? null;
  
      return (
        <div className={styles.phaseContent}>
          {/* Draw banner — Test match only */}
          {winner === "DRAW" && (
            <div style={{
              background: "#1e3a5f",
              border: "1px solid #2563eb",
              borderRadius: "10px",
              padding: "12px 16px",
              marginBottom: "16px",
              textAlign: "center",
              color: "#93c5fd",
              fontWeight: "600",
              fontSize: "15px",
            }}>
              🤝 Match Drawn
            </div>
          )}
          {renderInningsCard(inn1, 1, "1st Innings", testInningsTeam(1))}
          {renderInningsCard(inn2, 2, "2nd Innings", testInningsTeam(2))}
          {renderInningsCard(
            inn3, 3, "3rd Innings", testInningsTeam(3),
            !!followOnEnforced
          )}
          {renderInningsCard(
            inn4, 4, "4th Innings", testInningsTeam(4),
            false,
            inn4Target
          )}
        </div>
      );
    }
  
    // ── Super over tab ────────────────────────────────────────────────────────
    const soNumber = parseInt(activePhase.replace("so", ""), 10);
    const soData = superOverData?.find((so) => so.number === soNumber);
  
    if (!soData)
      return <p className={styles.noData}>No data</p>;
  
    return (
      <div className={styles.phaseContent}>
        {renderInningsCard(soData.innings1Data, 1, `Super Over ${soNumber}`)}
        {renderInningsCard(soData.innings2Data, 2, `Super Over ${soNumber}`)}
      </div>
    );
  };

  const tabs = [{ id: "main", label: "Main Match" }];

  if (superOverData) {
    superOverData.forEach((so) => {
      tabs.push({
        id: `so${so.number}`,
        label: `Super Over ${so.number}`,
      });
    });
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>📊 Full Scorecard</h2>

          <button className={styles.closeIcon} onClick={onClose}>
            ✕
          </button>
        </div>

        <div className={styles.tabContainer}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`${styles.tab} ${
                activePhase === tab.id ? styles.activeTab : ""
              }`}
              onClick={() => setActivePhase(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className={styles.scrollContent}>{renderPhaseContent()}</div>

        <button className={styles.closeBtn} onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}

export default FullScorecard;
