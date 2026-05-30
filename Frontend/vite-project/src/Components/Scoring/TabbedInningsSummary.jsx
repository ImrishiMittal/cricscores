import { useState } from "react";
import styles from "./TabbedInningsSummary.module.css";

function TabbedInningsSummary({
  innings1Data,
  innings2Data,
  innings3Data,
  players,
  allPlayers,
  bowlers,
  score,
  wickets,
  overs,
  balls,
  currentInnings,
  liveExtras,
  innings1Score,
  innings2Score,
  innings3Score,
  firstBattingTeam,
  secondBattingTeam,
  onClose,
}) {
  const [activeTab, setActiveTab] = useState(
    currentInnings === 4
      ? "innings4"
      : currentInnings === 3
      ? "innings3"
      : currentInnings === 2
      ? "innings2"
      : "innings1"
  );

  const formatOvers = (oversNum, ballsNum) => {
    if (oversNum === undefined || ballsNum === undefined) return "0.0";
    return `${oversNum}.${ballsNum}`;
  };

  const t1 = firstBattingTeam || "Team A";
  const t2 = secondBattingTeam || "Team B";

  const tabs = [
    { key: "innings1", label: `INN 1 · ${t1}` },
    ...(currentInnings >= 2
      ? [{ key: "innings2", label: `INN 2 · ${t2}` }]
      : []),
    ...(currentInnings >= 3
      ? [{ key: "innings3", label: `INN 3 · ${t1}` }]
      : []),
    ...(currentInnings >= 4
      ? [{ key: "innings4", label: `INN 4 · ${t2}` }]
      : []),
  ];

  const getData = (tab) => {
    const isLive = (n) => currentInnings === n;

    if (tab === "innings1") {
      if (isLive(1)) {
        const raw = [...players, ...(allPlayers || [])];
        const seen = new Set();
        const battedPlayers = raw
          .filter((p) => {
            const k = p.playerId || p.displayName;
            if (seen.has(k)) return false;
            seen.add(k);
            return true;
          })
          .filter((p) => p.balls > 0 || p.dismissal)
          .sort((a, b) => (a.battingOrder ?? 999) - (b.battingOrder ?? 999));
        return {
          score,
          wickets,
          overs,
          balls,
          extras: liveExtras,
          battedPlayers,
          bowlers,
          isCompleted: false,
        };
      }
      if (innings1Data || innings1Score)
        return {
          score:
            innings1Score?.score ??
            innings1Data?.score ??
            innings1Data?.totalRuns ??
            0,
          wickets:
            innings1Score?.wickets ??
            innings1Data?.wickets ??
            innings1Data?.totalWickets ??
            0,
          overs: innings1Score?.overs ?? innings1Data?.overs ?? 0,
          balls: innings1Score?.balls ?? innings1Data?.balls ?? 0,
          extras: innings1Data?.extras ?? innings1Data?.innings1Extras ?? null,
          battedPlayers: innings1Data?.battingStats || [],
          bowlers: innings1Data?.bowlingStats || [],
          isCompleted: true,
        };
      return null;
    }

    if (tab === "innings2") {
      if (isLive(2)) {
        const raw = [...players, ...(allPlayers || [])];
        const seen = new Set();
        const battedPlayers = raw
          .filter((p) => {
            const k = p.playerId || p.displayName;
            if (seen.has(k)) return false;
            seen.add(k);
            return true;
          })
          .filter((p) => p.balls > 0 || p.dismissal)
          .sort((a, b) => (a.battingOrder ?? 999) - (b.battingOrder ?? 999));
        return {
          score,
          wickets,
          overs,
          balls,
          extras: liveExtras,
          battedPlayers,
          bowlers,
          isCompleted: false,
        };
      }
      if (innings2Data || innings2Score)
        return {
          score:
            innings2Score?.score ??
            innings2Data?.score ??
            innings2Data?.totalRuns ??
            0,
          wickets:
            innings2Score?.wickets ??
            innings2Data?.wickets ??
            innings2Data?.totalWickets ??
            0,
          overs: innings2Score?.overs ?? innings2Data?.overs ?? 0,
          balls: innings2Score?.balls ?? innings2Data?.balls ?? 0,
          extras: innings2Data?.extras ?? null,
          battedPlayers: innings2Data?.battingStats || [],
          bowlers: innings2Data?.bowlingStats || [],
          isCompleted: true,
        };
      return null;
    }

    // innings 3 & 4 — only live data available (no separate data ref yet)
    if (tab === "innings3") {
      if (isLive(3)) {
        const raw = [...players, ...(allPlayers || [])];
        const seen = new Set();
        const battedPlayers = raw
          .filter((p) => {
            const k = p.playerId || p.displayName;
            if (seen.has(k)) return false;
            seen.add(k);
            return true;
          })
          .filter((p) => p.balls > 0 || p.dismissal)
          .sort((a, b) => (a.battingOrder ?? 999) - (b.battingOrder ?? 999));
        return {
          score,
          wickets,
          overs,
          balls,
          extras: liveExtras,
          battedPlayers,
          bowlers,
          isCompleted: false,
        };
      }
      // Completed innings 3 — use innings3Data or fall back to innings3Score
      if (innings3Data || innings3Score)
        return {
          score: innings3Score?.score ?? innings3Data?.score ?? 0,
          wickets: innings3Score?.wickets ?? innings3Data?.wickets ?? 0,
          overs: innings3Score?.overs ?? innings3Data?.overs ?? 0,
          balls: innings3Score?.balls ?? innings3Data?.balls ?? 0,
          extras: innings3Data?.extras ?? null,
          battedPlayers: innings3Data?.battingStats || [],
          bowlers: innings3Data?.bowlingStats || [],
          isCompleted: true,
        };
      return null;
    }

    if (tab === "innings4") {
      if (isLive(4)) {
        const raw = [...players, ...(allPlayers || [])];
        const seen = new Set();
        const battedPlayers = raw
          .filter((p) => {
            const k = p.playerId || p.displayName;
            if (seen.has(k)) return false;
            seen.add(k);
            return true;
          })
          .filter((p) => p.balls > 0 || p.dismissal)
          .sort((a, b) => (a.battingOrder ?? 999) - (b.battingOrder ?? 999));
        return {
          score,
          wickets,
          overs,
          balls,
          extras: liveExtras,
          battedPlayers,
          bowlers,
          isCompleted: false,
        };
      }
      return null;
    }

    return null;
  };

  const data = getData(activeTab);

  // ✅ Helper: get player name correctly based on data source
  // - Completed innings data (from useInningsData) maps displayName → .name
  // - Live innings data (raw player objects) uses .displayName
  const getPlayerName = (player) =>
    data.isCompleted
      ? player.playerName || player.name || player.displayName || ""
      : player.displayName || player.name || "";
  const getBowlerName = (bowler) =>
    bowler.playerName || bowler.displayName || bowler.name || "";

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>📋 Innings Summary</h2>
          <button className={styles.closeIcon} onClick={onClose}>
            ✕
          </button>
        </div>

        {/* TABS */}
        {tabs.length > 1 && (
          <div className={styles.tabContainer}>
            {tabs.map((tab) => (
              <button
                key={tab.key}
                className={`${styles.tab} ${
                  activeTab === tab.key ? styles.activeTab : ""
                }`}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}
        {!data && (
          <p style={{ textAlign: "center", color: "#888", padding: "20px" }}>
            No data available for this innings
          </p>
        )}
        {data && (
          <>
            {/* Score Display */}
            <div className={styles.scoreBox}>
              <div className={styles.scoreMain}>
                <span className={styles.runs}>{data.score}</span>
                <span className={styles.wickets}>/{data.wickets}</span>
              </div>
              <div className={styles.oversText}>
                {formatOvers(data.overs, data.balls)} overs
              </div>
              {data.extras && data.extras.total > 0 && (
                <div
                  style={{ fontSize: "13px", color: "#aaa", marginTop: "4px" }}
                >
                  Extras: {data.extras.total}
                  {" ("}
                  {data.extras.wides > 0 && `W ${data.extras.wides}`}
                  {data.extras.wides > 0 &&
                    (data.extras.noBalls > 0 ||
                      data.extras.byes > 0 ||
                      data.extras.legByes > 0) &&
                    ", "}
                  {data.extras.noBalls > 0 && `NB ${data.extras.noBalls}`}
                  {data.extras.noBalls > 0 &&
                    (data.extras.byes > 0 || data.extras.legByes > 0) &&
                    ", "}
                  {data.extras.byes > 0 && `B ${data.extras.byes}`}
                  {data.extras.byes > 0 && data.extras.legByes > 0 && ", "}
                  {data.extras.legByes > 0 && `LB ${data.extras.legByes}`}
                  {")"}
                </div>
              )}
            </div>

            {/* Batting Summary */}
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>🏏 BATTING</h3>
              <div className={styles.table}>
                <div className={styles.tableHeader}>
                  <div className={styles.playerCol}>BATSMAN</div>
                  <div className={styles.statCol}>R</div>
                  <div className={styles.statCol}>B</div>
                  <div className={styles.statCol}>SR</div>
                  <div className={styles.statCol}>4s</div>
                  <div className={styles.statCol}>6s</div>
                </div>
                {data.battedPlayers.length === 0 && (
                  <div className={styles.noData}>No batting data available</div>
                )}
                {data.battedPlayers.map((player, idx) => {
                  const strikeRate =
                    player.balls > 0
                      ? ((player.runs / player.balls) * 100).toFixed(1)
                      : "0.0";

                  return (
                    <div
                      key={player.playerId || idx}
                      className={styles.tableRow}
                    >
                      <div className={styles.playerCol}>
                        <div className={styles.playerName}>
                          {getPlayerName(player)}
                        </div>{" "}
                        {/* ✅ was player.name */}
                        {player.dismissal && (
                          <div className={styles.dismissal}>
                            {player.dismissal}
                          </div>
                        )}
                        {!player.dismissal && player.balls > 0 && (
                          <div className={styles.notOut}>not out</div>
                        )}
                      </div>
                      <div className={styles.statCol}>{player.runs}</div>
                      <div className={styles.statCol}>{player.balls}</div>
                      <div className={styles.statCol}>{strikeRate}</div>
                      <div className={styles.statCol}>{player.fours || 0}</div>
                      <div className={styles.statCol}>{player.sixes || 0}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bowling Summary */}
            {/* Bowling Summary */}
<div className={styles.section}>
  <h3 className={styles.sectionTitle}>⚡ BOWLING</h3>
  <div className={styles.table}>
    <div className={styles.tableHeader}>
      <div className={styles.playerCol}>BOWLER</div>
      <div className={styles.statCol}>O</div>
      <div className={styles.statCol}>R</div>
      <div className={styles.statCol}>W</div>
      <div className={styles.statCol}>ECO</div>
    </div>
    {data.bowlers.length === 0 && (
      <div className={styles.noData}>No bowling data available</div>
    )}
    {data.bowlers.map((bowler, idx) => {
      const ballsBowled =
        bowler.ballsBowled != null
          ? bowler.ballsBowled
          : (bowler.overs ?? 0) * 6 + (bowler.balls ?? 0);
      const runsGiven = bowler.runsGiven ?? bowler.runs ?? 0;
      const oversNum = Math.floor(ballsBowled / 6);
      const ballsRem = ballsBowled % 6;
      const oversDecimal = ballsBowled / 6;
      const economy =
        oversDecimal > 0
          ? (runsGiven / oversDecimal).toFixed(2)
          : "0.00";

      return (
        <div key={bowler.playerId || idx} className={styles.tableRow}>
          <div className={styles.playerCol}>{getBowlerName(bowler)}</div>
          <div className={styles.statCol}>{oversNum}.{ballsRem}</div>
          <div className={styles.statCol}>{runsGiven}</div>
          <div className={styles.statCol}>{bowler.wickets ?? 0}</div>
          <div className={styles.statCol}>{economy}</div>
        </div>
      );
    })}
  </div>
</div>
          </>
        )}
        <button className={styles.closeBtn} onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}

export default TabbedInningsSummary;
