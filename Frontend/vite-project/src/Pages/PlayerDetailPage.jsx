import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import usePlayerDatabase from "../hooks/usePlayerDatabase";
import styles from "./PlayerDetailPage.module.css";
import * as playerApi from "../api/playerApi";
const TABS = ["Batting", "Bowling", "Fielding", "Captaincy"];

function StatRow({ label, value, highlight, note }) {
  return (
    <p
      className={
        highlight ? `${styles.statRow} ${styles.highlight}` : styles.statRow
      }
    >
      <span className={styles.statLabel}>{label}</span>
      <span className={styles.statValue}>
        {value}
        {note && <span className={styles.statNote}>{note}</span>}
      </span>
    </p>
  );
}

function PlayerDetailPage() {
  const { jersey } = useParams();
  const { getPlayer, migratePlayer, getAllPlayers, createOrGetPlayer } = usePlayerDatabase(); // ✅ add getAllPlayers
  const [activeTab, setActiveTab] = useState(0);
  const [editingJersey, setEditingJersey] = useState(false);
  const [newJersey, setNewJersey] = useState("");
  const [jerseyError, setJerseyError] = useState("");

  useEffect(() => {
    migratePlayer(jersey);
  }, [jersey]);

  const player = getPlayer(jersey);

  const handleJerseyEdit = async () => {
    const trimmed = newJersey.trim();
    if (!trimmed) { setJerseyError("Jersey number required"); return; }

    const all = getAllPlayers();
    const conflict = all.find(
      (p) => String(p.jersey) === trimmed && String(p.jersey) !== String(jersey)
    );
    if (conflict) {
      setJerseyError(`#${trimmed} is already taken by ${conflict.name}`);
      return;
    }

    try {
      // Use the playerApi directly — import it at top of file
      await playerApi.updatePlayer(player._id, { jersey: trimmed });
      // Re-cache with new jersey
      await createOrGetPlayer(trimmed, player.name);
      setEditingJersey(false);
      setJerseyError("");
      window.location.reload();
    } catch (err) {
      setJerseyError("Failed to update jersey");
    }
  };

  if (!player) {
    return <div className={styles.empty}>No Player Found</div>;
  }

  const totalRuns = player.runs || 0;
  const balls = player.balls || 0;
  const innings = player.innings || 0;
  const strikeRate =
    balls > 0 ? ((totalRuns / balls) * 100).toFixed(2) : "0.00";
  const dismissals = player.dismissals || 0;

  const derivedNotOuts = Math.max(0, innings - dismissals);
  const notOuts = Math.max(player.notOuts || 0, derivedNotOuts);

  const avg =
    dismissals > 0
      ? (totalRuns / dismissals).toFixed(2)
      : totalRuns > 0
      ? "N/O"
      : "0.00";

  const highestScore = player.highestScore || 0;
  const highestScoreDisplay =
    highestScore > 0 ? highestScore : totalRuns > 0 ? "—" : 0;
  const highestScoreIsStale = highestScore === 0 && totalRuns > 0;

  const overs = player.ballsBowled
    ? `${Math.floor(player.ballsBowled / 6)}.${player.ballsBowled % 6}`
    : "0.0";

  const economy =
    player.ballsBowled > 0
      ? (player.runsGiven / (player.ballsBowled / 6)).toFixed(2)
      : "0.00";

  const bowlingAvg =
    player.wickets > 0
      ? ((player.runsGiven || 0) / player.wickets).toFixed(2)
      : "—";

  return (
    <div className={styles.container}>
      {/* ─── NAME CARD ─────────────────────────────────────── */}
<div className={styles.card}>
  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
    <h1 className={styles.title}>
      <span className={styles.jersey}>#{player.jersey}</span>
      {player.name}
    </h1>
    {/* ✅ Small icon button, no text, sits inside the card */}
    {!editingJersey && (
      <button
        onClick={() => { setNewJersey(player.jersey || ""); setEditingJersey(true); }}
        title="Edit Jersey Number"
        style={{
          background: "transparent",
          border: "none",
          color: "#4b5563",
          fontSize: "14px",
          cursor: "pointer",
          padding: "4px",
          lineHeight: 1,
          flexShrink: 0,
        }}
      >
        <b>Edit J No.</b>
      </button>
    )}
  </div>

  {/* Edit form appears inside the card, below the name */}
  {editingJersey && (
    <div style={{ display: "flex", gap: "8px", alignItems: "center", marginTop: "10px", flexWrap: "wrap" }}>
      <span style={{ color: "#9ca3af", fontSize: "13px" }}>#</span>
      <input
        value={newJersey}
        onChange={(e) => { setNewJersey(e.target.value); setJerseyError(""); }}
        placeholder="New jersey #"
        style={{
          background: "#111",
          border: "1px solid #22c55e",
          color: "#fff",
          borderRadius: "6px",
          padding: "4px 8px",
          width: "80px",
          fontSize: "13px",
        }}
      />
      <button
        onClick={handleJerseyEdit}
        style={{
          background: "#22c55e", color: "#000", border: "none",
          borderRadius: "6px", padding: "4px 12px",
          fontWeight: 600, fontSize: "13px", cursor: "pointer",
        }}
      >
        Save
      </button>
      <button
        onClick={() => { setEditingJersey(false); setJerseyError(""); }}
        style={{
          background: "#374151", color: "#e5e7eb", border: "none",
          borderRadius: "6px", padding: "4px 12px",
          fontSize: "13px", cursor: "pointer",
        }}
      >
        Cancel
      </button>
      {jerseyError && <span style={{ color: "#ef4444", fontSize: "12px" }}>{jerseyError}</span>}
    </div>
  )}
</div>    
      {/* ─── TABS ──────────────────────────────────────────── */}
      <div className={styles.tabBar}>
        {TABS.map((tab, i) => (
          <button
            key={tab}
            className={
              i === activeTab ? `${styles.tab} ${styles.tabActive}` : styles.tab
            }
            onClick={() => setActiveTab(i)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ─── BATTING ──────────────────────────────────────── */}
      {activeTab === 0 && (
        <div className={styles.card}>
          <h2 className={styles.sectionTitle}>🏏 Batting</h2>
          <StatRow label="Matches" value={player.matches || 0} />
          <StatRow label="Innings" value={innings} />
          <StatRow label="Not Outs" value={notOuts} />
          <StatRow
            label="Highest Score"
            value={highestScoreDisplay}
            highlight
            note={highestScoreIsStale ? "(older matches)" : null}
          />
          <StatRow label="Runs" value={totalRuns} highlight />
          <StatRow label="Balls" value={balls} />
          <StatRow label="Strike Rate" value={strikeRate} highlight />
          <StatRow label="Average" value={avg} highlight />
          <StatRow label="Dot Balls" value={player.dotBalls || 0} />
          <StatRow label="Ducks" value={player.ducks || 0} />
          <StatRow label="1s" value={player.ones || 0} />
          <StatRow label="2s" value={player.twos || 0} />
          <StatRow label="3s" value={player.threes || 0} />
          <StatRow label="4s" value={player.fours || 0} />
          <StatRow label="6s" value={player.sixes || 0} />
          <StatRow label="30s" value={player.thirties || 0} />
          <StatRow label="50s" value={player.fifties || 0} />
          <StatRow label="100s" value={player.hundreds || 0} />
        </div>
      )}

      {/* ─── BOWLING ──────────────────────────────────────── */}
      {activeTab === 1 && (
        <div className={styles.card}>
          <h2 className={styles.sectionTitle}>🎯 Bowling</h2>
          <StatRow label="Bowling Innings" value={player.bowlingInnings || 0} />
          <StatRow label="Wickets" value={player.wickets || 0} highlight />
          <StatRow label="Economy" value={economy} highlight />
          <StatRow label="Average" value={bowlingAvg} highlight />
          <StatRow label="Overs" value={overs} highlight />
          <StatRow
            label="Best Bowling"
            value={
              (player.bestBowlingWickets || 0) === 0
                ? "—"
                : `${player.bestBowlingWickets}/${player.bestBowlingRuns}`
            }
          />
          <StatRow
            label="Dot Balls Bowled"
            value={player.dotBallsBowled || 0}
          />
          <StatRow label="Wides" value={player.wides || 0} />
          <StatRow label="No Balls" value={player.noBalls || 0} />
          <StatRow label="Maiden Overs" value={player.maidens || 0} />
          <StatRow label="3-Wicket Hauls" value={player.threeWickets || 0} />
          <StatRow label="5-Wicket Hauls" value={player.fiveWickets || 0} />
          <StatRow label="10-Wicket Hauls" value={player.tenWickets || 0} />
        </div>
      )}

      {/* ─── FIELDING ─────────────────────────────────────── */}
      {activeTab === 2 && (
        <div className={styles.card}>
          <h2 className={styles.sectionTitle}>🧤 Fielding</h2>
          <StatRow label="Catches" value={player.catches || 0} highlight />
          <StatRow label="Run Outs" value={player.runouts || 0} highlight />
          <StatRow label="Stumpings" value={player.stumpings || 0} highlight />
        </div>
      )}

      {activeTab === 3 && (
        <div className={styles.card}>
          <h2 className={styles.sectionTitle}>🧢 Captaincy</h2>
          {(player.captainMatches || 0) === 0 ? (
            <p className={styles.statRow}>No captaincy record yet.</p>
          ) : (
            <>
              <StatRow
                label="Matches as Captain"
                value={player.captainMatches || 0}
              />

              {/* ADD WIN % RIGHT HERE ↓ */}
              <StatRow
                label="Win %"
                value={`${(
                  ((player.captainWins || 0) / player.captainMatches) *
                  100
                ).toFixed(1)}%`}
                highlight
              />

              <StatRow label="Wins" value={player.captainWins || 0} highlight />
              <StatRow label="Losses" value={player.captainLosses || 0} />
              <StatRow label="Ties" value={player.captainTies || 0} />
              <StatRow label="No Result" value={player.captainNR || 0} />
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default PlayerDetailPage;
