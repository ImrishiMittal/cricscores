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
  const avg = player.matches > 0 ? (totalRuns / player.matches).toFixed(2) : 0;

  const overs = (player.ballsBowled / 6).toFixed(1);

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
        <p className={styles.stat}>Runs: {player.runs}</p>
        <p className={styles.stat}>Balls: {player.balls}</p>
        <p className={styles.stat}>Strike Rate: {strikeRate}</p>
        <p className={styles.stat}>Average: {avg}</p>
        <p>30s: {player.thirties || 0}</p>
        <p>50s: {player.fifties || 0}</p>
        <p>100s: {player.hundreds || 0}</p>
        <p>Ducks: {player.ducks || 0}</p>
      </div>

      <div className={styles.card}>
        <h2 className={styles.sectionTitle}>🎯 Bowling</h2>
        <p className={styles.stat}>Wickets: {player.wickets}</p>
        <p className={styles.stat}>Economy: {economy}</p>
        <p className={styles.stat}>Overs: {overs}</p>
      </div>

      <div className={styles.card}>
        <h2 className={styles.sectionTitle}>🧤 Fielding</h2>
        <p className={styles.stat}>Catches: {player.catches}</p>
      </div>
    </div>
  );
}

export default PlayerDetailPage;
