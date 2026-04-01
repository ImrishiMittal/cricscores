import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import usePlayerDatabase from "../hooks/usePlayerDatabase";
import styles from "./StatsPage.module.css";

function StatsPage() {
  const [tab, setTab] = useState("players");
  const [players, setPlayers] = useState([]);
  const navigate = useNavigate();
  const { getAllPlayers } = usePlayerDatabase();

  // ✅ Read from localStorage on mount, not during render
  useEffect(() => {
    const raw = localStorage.getItem("cricket_player_database");
    console.log("RAW DB:", raw); // ← keep until confirmed working
    const data = raw ? JSON.parse(raw) : {};
    const sorted = Object.values(data).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
    setPlayers(sorted);
  }, []);

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>📊 Records</h1>

      <div className={styles.tabs}>
        <button
          className={`${styles.tabBtn} ${tab === "teams" ? styles.activeTab : ""}`}
          onClick={() => setTab("teams")}
        >
          Teams
        </button>
        <button
          className={`${styles.tabBtn} ${tab === "captains" ? styles.activeTab : ""}`}
          onClick={() => setTab("captains")}
        >
          Captains
        </button>
        <button
          className={`${styles.tabBtn} ${tab === "players" ? styles.activeTab : ""}`}
          onClick={() => setTab("players")}
        >
          Players
        </button>
      </div>

      {tab === "players" && (
        <div className={styles.playerList}>
          {players.length === 0 ? (
            <p style={{ padding: "20px", color: "#888" }}>
              No players found. Complete a match first.
            </p>
          ) : (
            players.map((p) => (
              <div
                key={p.jersey}
                className={styles.playerItem}
                onClick={() => navigate(`/player/${p.jersey}`)}
              >
                #{p.jersey} — {p.name}
              </div>
            ))
          )}
        </div>
      )}

      {tab === "teams" && <div>Team stats coming soon</div>}
      {tab === "captains" && <div>Captain stats coming soon</div>}
    </div>
  );
}

export default StatsPage;