import { useState } from "react";
import styles from "./PlayerDatabaseModal.module.css";

function PlayerDatabaseModal({ playerDB, onClose }) {
  const [search, setSearch] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null); // jersey number

  const allPlayers = playerDB.getAllPlayers();

  const filtered = allPlayers.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      String(p.jersey).includes(search)
  );

  const handleDelete = (jersey) => {
    playerDB.deletePlayer(jersey);
    setConfirmDelete(null);
  };

  const formatEconomy = (runsGiven, ballsBowled) => {
    if (!ballsBowled || ballsBowled === 0) return "—";
    return (runsGiven / (ballsBowled / 6)).toFixed(2);
  };

  const formatSR = (runs, balls) => {
    if (!balls || balls === 0) return "—";
    return ((runs / balls) * 100).toFixed(1);
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>

        <div className={styles.header}>
          <h2 className={styles.title}>👥 Player Database</h2>
          <button className={styles.closeIcon} onClick={onClose}>✕</button>
        </div>

        <p className={styles.subtitle}>
          {allPlayers.length} players registered · Jersey = permanent ID
        </p>

        <input
          className={styles.searchInput}
          placeholder="Search by name or jersey..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {filtered.length === 0 && (
          <div className={styles.noData}>
            {allPlayers.length === 0
              ? "No players registered yet. Players are added automatically when you enter them in a match."
              : "No players match your search."}
          </div>
        )}

        <div className={styles.playerList}>
          {filtered.map((player) => (
            <div key={player.jersey} className={styles.playerCard}>

              <div className={styles.jerseyBadge}>#{player.jersey}</div>

              <div className={styles.playerInfo}>
                <div className={styles.playerName}>{player.name}</div>

                {/* Batting stats */}
                <div className={styles.playerStats}>
                  <span>🏏 {player.runs}R ({player.balls}B)</span>
                  <span>SR: {formatSR(player.runs, player.balls)}</span>
                  <span>4s: {player.fours || 0}</span>
                  <span>6s: {player.sixes || 0}</span>
                </div>

                {/* Bowling stats */}
                <div className={styles.playerStats}>
                  <span>🎳 {player.wickets}W</span>
                  <span>Eco: {formatEconomy(player.runsGiven, player.ballsBowled)}</span>
                  <span>Matches: {player.matches || 0}</span>
                </div>

                {/* Fielding stats */}
                <div className={styles.playerStats}>
                  <span>🤲 {player.catches || 0} ct</span>
                  <span>🏃 {player.runouts || 0} ro</span>
                  <span>🧤 {player.stumpings || 0} st</span>
                </div>
              </div>

              <button
                className={styles.deleteBtn}
                title={`Delete ${player.name}`}
                onClick={() => setConfirmDelete(player.jersey)}
              >
                🗑️
              </button>

            </div>
          ))}
        </div>

        {/* ── Confirm delete overlay ── */}
        {confirmDelete !== null && (
          <div className={styles.confirmOverlay}>
            <div className={styles.confirmBox}>
              <div style={{ fontSize: "28px", marginBottom: "8px" }}>🗑️</div>
              <p className={styles.confirmText}>
                Delete player{" "}
                <strong>
                  #{confirmDelete} — {playerDB.getPlayer(confirmDelete)?.name}
                </strong>
                ?
                <br />
                <span style={{ color: "#888", fontSize: "13px" }}>
                  This frees jersey #{confirmDelete} for reuse. Career stats will be lost.
                </span>
              </p>
              <div className={styles.confirmButtons}>
                <button
                  className={styles.cancelBtn}
                  onClick={() => setConfirmDelete(null)}
                >
                  Cancel
                </button>
                <button
                  className={styles.confirmDeleteBtn}
                  onClick={() => handleDelete(confirmDelete)}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        <button className={styles.closeBtn} onClick={onClose}>Close</button>
      </div>
    </div>
  );
}

export default PlayerDatabaseModal;
