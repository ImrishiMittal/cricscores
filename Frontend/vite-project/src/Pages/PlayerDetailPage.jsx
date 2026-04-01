import { useParams } from "react-router-dom";
import usePlayerDatabase from "../hooks/usePlayerDatabase";
import styles from "./PlayerDetailPage.module.css";

function PlayerDetailPage() {
  const { jersey } = useParams();
  const { getPlayer } = usePlayerDatabase();

  const player = getPlayer(jersey);

  if (!player) {
    return <div style={{ padding: "20px" }}>No Player Found</div>;
  }

  const totalRuns = player.runs || 0;
  const balls = player.balls || 0;

  const strikeRate = balls > 0 ? ((totalRuns / balls) * 100).toFixed(2) : 0;

  // NEW
  const dismissals = player.innings - (player.notOuts || 0);
  const avg = dismissals > 0 ? (totalRuns / dismissals).toFixed(2) : totalRuns > 0 ? "N/O" : "0.00";

  const overs = player.ballsBowled
    ? `${Math.floor(player.ballsBowled / 6)}.${player.ballsBowled % 6}`
    : "0.0";

  const economy =
    player.ballsBowled > 0
      ? (player.runsGiven / (player.ballsBowled / 6)).toFixed(2)
      : 0;

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>
          #{player.jersey} — {player.name}
        </h1>
      </div>

      <div className={styles.card}>
        <h2 className={styles.sectionTitle}>🏏 Batting</h2>
        <p>Matches: {player.matches || 0}</p>
        <p>Innings: {player.innings || 0}</p>
        <p className={styles.stat}>Runs: {player.runs}</p>
        <p className={styles.stat}>Balls: {player.balls}</p>
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

      <div className={styles.card}>
        <h2 className={styles.sectionTitle}>🎯 Bowling</h2>
        <p>Bowling Innings: {player.bowlingInnings || 0}</p>
        <p className={styles.stat}>Wickets: {player.wickets}</p>
        <p className={styles.stat}>Economy: {economy}</p>
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
      </div>

      <div className={styles.card}>
        <h2 className={styles.sectionTitle}>🧤 Fielding</h2>
        <p className={styles.stat}>Catches: {player.catches}</p>
      </div>
    </div>
  );
}

export default PlayerDetailPage;
