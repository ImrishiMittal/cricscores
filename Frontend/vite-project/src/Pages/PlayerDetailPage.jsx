import { useParams } from "react-router-dom";
import { useEffect } from "react";
import usePlayerDatabase from "../hooks/usePlayerDatabase";
import styles from "./PlayerDetailPage.module.css";

function PlayerDetailPage() {
  const { jersey } = useParams();
  const { getPlayer, migratePlayer } = usePlayerDatabase();

  // Run one-time migration to fix stale notOuts for this player's old records
  useEffect(() => {
    migratePlayer(jersey);
  }, [jersey]);

  const player = getPlayer(jersey);

  if (!player) {
    return <div style={{ padding: "20px" }}>No Player Found</div>;
  }

  const totalRuns = player.runs || 0;
  const balls = player.balls || 0;
  const innings = player.innings || 0;

  const strikeRate = balls > 0 ? ((totalRuns / balls) * 100).toFixed(2) : 0;

  const dismissals = player.dismissals || 0;

  // ✅ Not Outs: use stored value, but also derive innings - dismissals as a floor.
  // This auto-corrects old data where notOuts was never written correctly.
  const derivedNotOuts = Math.max(0, innings - dismissals);
  const notOuts = Math.max(player.notOuts || 0, derivedNotOuts);

  const avg =
    dismissals > 0
      ? (totalRuns / dismissals).toFixed(2)
      : totalRuns > 0
      ? "N/O"
      : "0.00";

  // ✅ Highest Score: show stored value if it exists.
  // For old matches where it was never saved, show "—" with a note
  // rather than a misleading "0". New matches will populate it correctly.
  const highestScore = player.highestScore || 0;
  const highestScoreDisplay = highestScore > 0 ? highestScore : totalRuns > 0 ? "—" : 0;
  const highestScoreIsStale = highestScore === 0 && totalRuns > 0;

  const overs = player.ballsBowled
    ? `${Math.floor(player.ballsBowled / 6)}.${player.ballsBowled % 6}`
    : "0.0";

  const economy =
    player.ballsBowled > 0
      ? (player.runsGiven / (player.ballsBowled / 6)).toFixed(2)
      : 0;

  const bowlingAvg =
    player.wickets > 0
      ? ((player.runsGiven || 0) / player.wickets).toFixed(2)
      : "—";

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>
          #{player.jersey} — {player.name}
        </h1>
      </div>

      {/* ─── BATTING ─────────────────────────────────────── */}
      <div className={styles.card}>
        <h2 className={styles.sectionTitle}>🏏 Batting</h2>
        <p>Matches: {player.matches || 0}</p>
        <p>Innings: {innings}</p>
        <p>Not Outs: {notOuts}</p>
        <p className={styles.stat}>
          Highest Score:{" "}
          {highestScoreDisplay}
          {highestScoreIsStale && (
            <span style={{ fontSize: "11px", color: "#999", marginLeft: 6 }}>
              (not tracked in older matches)
            </span>
          )}
        </p>
        <p className={styles.stat}>Runs: {totalRuns}</p>
        <p className={styles.stat}>Balls: {balls}</p>
        <p className={styles.stat}>Strike Rate: {strikeRate}</p>
        <p className={styles.stat}>Average: {avg}</p>
        <p>Dot Balls: {player.dotBalls || 0}</p>
        <p>Ducks: {player.ducks || 0}</p>
        <p>1s: {player.ones || 0}</p>
        <p>2s: {player.twos || 0}</p>
        <p>3s: {player.threes || 0}</p>
        <p>4s: {player.fours || 0}</p>
        <p>6s: {player.sixes || 0}</p>
        <p>30s: {player.thirties || 0}</p>
        <p>50s: {player.fifties || 0}</p>
        <p>100s: {player.hundreds || 0}</p>
      </div>

      {/* ─── BOWLING ─────────────────────────────────────── */}
      <div className={styles.card}>
        <h2 className={styles.sectionTitle}>🎯 Bowling</h2>
        <p>Bowling Innings: {player.bowlingInnings || 0}</p>
        <p className={styles.stat}>Wickets: {player.wickets || 0}</p>
        <p className={styles.stat}>Economy: {economy}</p>
        <p className={styles.stat}>Average: {bowlingAvg}</p>
        <p className={styles.stat}>Overs: {overs}</p>
        <p>
          Best Bowling:{" "}
          {(player.bestBowlingWickets || 0) === 0
            ? "—"
            : `${player.bestBowlingWickets}/${player.bestBowlingRuns}`}
        </p>
        <p>Dot Balls Bowled: {player.dotBallsBowled || 0}</p>
        <p>Wides: {player.wides || 0}</p>
        <p>No Balls: {player.noBalls || 0}</p>
        <p>Maiden Overs: {player.maidens || 0}</p>
        <p>3-Wicket Hauls: {player.threeWickets || 0}</p>
        <p>5-Wicket Hauls: {player.fiveWickets || 0}</p>
        <p>10-Wicket Hauls: {player.tenWickets || 0}</p>
      </div>

      {/* ─── FIELDING ────────────────────────────────────── */}
      <div className={styles.card}>
        <h2 className={styles.sectionTitle}>🧤 Fielding</h2>
        <p className={styles.stat}>Catches: {player.catches || 0}</p>
        <p className={styles.stat}>Run Outs: {player.runouts || 0}</p>
        <p className={styles.stat}>Stumpings: {player.stumpings || 0}</p>
      </div>
    </div>
  );
}

export default PlayerDetailPage;
