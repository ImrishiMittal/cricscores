import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./StatsPage.module.css";
import * as playerApi from "../api/playerApi";
import * as teamApi from "../api/teamApi";

function safeNum(v) {
  const n = Number(v);
  return isNaN(n) ? 0 : n;
}

// ── Confirm delete modal ──────────────────────────────────────────────────────
// Minimal SVG trash icon — fits dark glass aesthetic
function TrashIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "block" }}
    >
      <path
        d="M1 3.5h12M5 3.5V2.5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 .5.5v1M5.5 6v4.5M8.5 6v4.5M2.5 3.5l.75 7.25A1 1 0 0 0 4.24 11.5h5.52a1 1 0 0 0 .99-.75L11.5 3.5"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function DeleteModal({ label, onConfirm, onCancel, loading }) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.78)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
      }}
    >
      <div
        style={{
          background: "#0d1117",
          border: "1px solid #ef4444",
          borderRadius: "14px",
          padding: "28px 24px",
          maxWidth: "340px",
          width: "90%",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: "30px", marginBottom: "10px" }}>🗑️</div>
        <h3
          style={{
            color: "#e5e7eb",
            marginBottom: "8px",
            fontSize: "16px",
            margin: "0 0 10px",
          }}
        >
          Delete?
        </h3>
        <p
          style={{
            color: "#9ca3af",
            fontSize: "14px",
            marginBottom: "20px",
            lineHeight: 1.5,
          }}
        >
          <strong style={{ color: "#e5e7eb" }}>{label}</strong>
          <br />
          <span style={{ fontSize: "12px" }}>This cannot be undone.</span>
        </p>
        <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
          <button
            onClick={onCancel}
            disabled={loading}
            style={{
              background: "#374151",
              color: "#e5e7eb",
              padding: "9px 20px",
              borderRadius: "8px",
              border: "none",
              fontWeight: "600",
              fontSize: "14px",
              cursor: "pointer",
              opacity: loading ? 0.6 : 1,
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            style={{
              background: "#ef4444",
              color: "#fff",
              padding: "9px 20px",
              borderRadius: "8px",
              border: "none",
              fontWeight: "600",
              fontSize: "14px",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

function StatsPage() {
  const [tab, setTab] = useState("players");
  const [players, setPlayers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [captains, setCaptains] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(-1);
  const [loading, setLoading] = useState(false);

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState(null); // { type: "player"|"team", item }
  const [deleteLoading, setDeleteLoading] = useState(false);

  const searchRef = useRef(null);
  const navigate = useNavigate();

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const fetchedPlayers = await playerApi.getAllPlayers();
      const valid = fetchedPlayers.filter(
        (p) => p.name && p.name.trim() && p.name !== "Unknown"
      );
      const sorted = [...valid].sort((a, b) => a.name.localeCompare(b.name));
      setPlayers(sorted);

      const caps = valid
        .filter((p) => safeNum(p.captainMatches) > 0)
        .sort((a, b) => safeNum(b.captainMatches) - safeNum(a.captainMatches));
      setCaptains(caps);

      const fetchedTeams = await teamApi.getTeams();
      const teamList = fetchedTeams
        .map((t) => ({
          _id: t._id,
          name: t.name,
          matches: safeNum(t.matches),
          wins: safeNum(t.wins),
          losses: safeNum(t.losses),
          ties: safeNum(t.ties),
          nr: safeNum(t.nr),
        }))
        .sort((a, b) => b.matches - a.matches);
      setTeams(teamList);
    } catch (err) {
      console.error("StatsPage: failed to load data", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [tab, loadData]);

  // Search suggestions
  useEffect(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      setSuggestions([]);
      setShowSuggestions(false);
      setActiveSuggestion(-1);
      return;
    }
    const matched = players
      .filter(
        (p) =>
          p.name.toLowerCase().startsWith(query) ||
          String(p.jersey).startsWith(query)
      )
      .sort((a, b) => {
        const aE = a.name.toLowerCase() === query || String(a.jersey) === query;
        const bE = b.name.toLowerCase() === query || String(b.jersey) === query;
        return aE ? -1 : bE ? 1 : a.name.localeCompare(b.name);
      });
    setSuggestions(matched.slice(0, 6));
    setShowSuggestions(matched.length > 0);
    setActiveSuggestion(-1);
  }, [searchQuery, players]);

  // Click outside
  useEffect(() => {
    const h = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target))
        setShowSuggestions(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const goToPlayer = (p) => {
    setSearchQuery("");
    setShowSuggestions(false);
    navigate(`/player/${p.jersey}`);
  };

  const handleKeyDown = (e) => {
    if (!showSuggestions || !suggestions.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveSuggestion((v) => Math.min(v + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveSuggestion((v) => Math.max(v - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeSuggestion >= 0) goToPlayer(suggestions[activeSuggestion]);
      else if (suggestions.length === 1) goToPlayer(suggestions[0]);
    } else if (e.key === "Escape") setShowSuggestions(false);
  };

  const filteredPlayers =
    searchQuery.trim() === ""
      ? players
      : players.filter((p) => {
          const q = searchQuery.trim().toLowerCase();
          return (
            p.name.toLowerCase().includes(q) || String(p.jersey).includes(q)
          );
        });

  const highlightMatch = (text, query) => {
    if (!query) return text;
    const i = text.toLowerCase().indexOf(query.toLowerCase());
    if (i === -1) return text;
    return (
      <>
        {text.slice(0, i)}
        <span className={styles.highlight}>
          {text.slice(i, i + query.length)}
        </span>
        {text.slice(i + query.length)}
      </>
    );
  };

  const winPct = (wins, total) =>
    total > 0 ? ((safeNum(wins) / safeNum(total)) * 100).toFixed(1) : "0.0";

  // ── Delete handlers ───────────────────────────────────────────────────────
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      if (deleteTarget.type === "player") {
        await playerApi.deletePlayer(deleteTarget.item._id);
        setPlayers((prev) =>
          prev.filter((p) => p._id !== deleteTarget.item._id)
        );
        setCaptains((prev) =>
          prev.filter((p) => p._id !== deleteTarget.item._id)
        );
      } else if (deleteTarget.type === "team") {
        await teamApi.deleteTeam(deleteTarget.item._id);
        setTeams((prev) => prev.filter((t) => t._id !== deleteTarget.item._id));
      }
      setDeleteTarget(null);
    } catch (err) {
      alert(`❌ Failed to delete: ${err.message}`);
    } finally {
      setDeleteLoading(false);
    }
  };

  const deleteLabel = deleteTarget
    ? deleteTarget.type === "player"
      ? `Player: ${deleteTarget.item.name} (#${deleteTarget.item.jersey})`
      : `Team: ${deleteTarget.item.name}`
    : "";

  if (loading)
    return (
      <div style={{ padding: "40px", color: "#888", textAlign: "center" }}>
        Loading...
      </div>
    );

  return (
    <div className={styles.container}>
      {/* Delete modal */}
      {deleteTarget && (
        <DeleteModal
          label={deleteLabel}
          onConfirm={handleDeleteConfirm}
          onCancel={() => !deleteLoading && setDeleteTarget(null)}
          loading={deleteLoading}
        />
      )}

      <h1 className={styles.title}>📊 Records</h1>

      {/* Tabs */}
      <div className={styles.tabs}>
        {["teams", "captains", "players"].map((t) => (
          <button
            key={t}
            className={`${styles.tabBtn} ${tab === t ? styles.activeTab : ""}`}
            onClick={() => setTab(t)}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* ══ PLAYERS ══ */}
      {tab === "players" && (
        <>
          <div className={styles.searchWrapper} ref={searchRef}>
            <div className={styles.searchBox}>
              <span className={styles.searchIcon}>🔍</span>
              <input
                className={styles.searchInput}
                type="text"
                placeholder="Search by name or jersey number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => {
                  if (suggestions.length > 0) setShowSuggestions(true);
                }}
                autoComplete="off"
              />
              {searchQuery.length > 0 && (
                <button
                  className={styles.clearBtn}
                  onClick={() => {
                    setSearchQuery("");
                    setShowSuggestions(false);
                  }}
                >
                  ✕
                </button>
              )}
            </div>

            {showSuggestions && suggestions.length > 0 && (
              <div className={styles.suggestionsBox}>
                {suggestions.map((p, i) => (
                  <div
                    key={p.jersey}
                    className={`${styles.suggestionItem} ${
                      i === activeSuggestion ? styles.activeSuggestion : ""
                    }`}
                    onMouseDown={() => goToPlayer(p)}
                    onMouseEnter={() => setActiveSuggestion(i)}
                  >
                    <span className={styles.suggestionJersey}>
                      #{highlightMatch(String(p.jersey), searchQuery)}
                    </span>
                    <span className={styles.suggestionName}>
                      {highlightMatch(p.name, searchQuery)}
                    </span>
                    <span className={styles.suggestionMeta}>
                      {safeNum(p.matches)}m · {safeNum(p.runs)}r
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className={styles.playerList}>
            {filteredPlayers.length === 0 && searchQuery.trim() !== "" ? (
              <p style={{ padding: "20px", color: "#888" }}>
                No players found for "{searchQuery}".
              </p>
            ) : filteredPlayers.length === 0 ? (
              <p style={{ padding: "20px", color: "#888" }}>
                No players found. Complete a match first.
              </p>
            ) : (
              filteredPlayers.map((p) => (
                <div key={p.jersey} className={styles.playerItem}>
                  {/* Left: jersey + name — clickable */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      flex: 1,
                      cursor: "pointer",
                    }}
                    onClick={() => goToPlayer(p)}
                  >
                    <span className={styles.jerseyBadge}>#{p.jersey}</span>
                    {p.name}
                  </div>
                  {/* Delete button */}
                  <button
                    title={`Delete ${p.name}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteTarget({ type: "player", item: p });
                    }}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "#3d4a5a",
                      fontSize: "15px",
                      cursor: "pointer",
                      padding: "4px",
                      borderRadius: "5px",
                      flexShrink: 0,
                      lineHeight: 1,
                      transition: "color 0.15s, background 0.15s",
                      display: "flex",
                      alignItems: "center",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = "#ef4444";
                      e.currentTarget.style.background = "rgba(239,68,68,0.08)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = "#3d4a5a";
                      e.currentTarget.style.background = "transparent";
                    }}
                  >
                    <TrashIcon />
                  </button>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* ══ CAPTAINS ══ */}
      {tab === "captains" && (
        <div className={styles.tableWrapper}>
          {captains.length === 0 ? (
            <p style={{ padding: "20px", color: "#888" }}>
              No captaincy records yet. Set a captain in Match Setup first.
            </p>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.th}>Captain</th>
                  <th className={styles.th}>M</th>
                  <th className={styles.th}>W</th>
                  <th className={styles.th}>L</th>
                  <th className={styles.th}>T</th>
                  <th className={styles.th}>NR</th>
                  <th className={styles.th}>Win%</th>
                </tr>
              </thead>
              <tbody>
                {captains.map((p) => (
                  <tr
                    key={p.jersey}
                    className={styles.tr}
                    onClick={() => goToPlayer(p)}
                  >
                    <td className={styles.td}>
                      <span className={styles.jerseyBadge}>#{p.jersey}</span>
                      {p.name}
                    </td>
                    <td className={styles.tdNum}>
                      {safeNum(p.captainMatches)}
                    </td>
                    <td className={`${styles.tdNum} ${styles.win}`}>
                      {safeNum(p.captainWins)}
                    </td>
                    <td className={styles.tdNum}>{safeNum(p.captainLosses)}</td>
                    <td className={styles.tdNum}>{safeNum(p.captainTies)}</td>
                    <td className={styles.tdNum}>{safeNum(p.captainNR)}</td>
                    <td className={styles.tdNum}>
                      <span className={styles.highlight}>
                        {winPct(p.captainWins, p.captainMatches)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ══ TEAMS ══ */}
      {tab === "teams" && (
        <div className={styles.tableWrapper}>
          {teams.length === 0 ? (
            <p style={{ padding: "20px", color: "#888" }}>
              No team records yet. Complete a match first.
            </p>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.th}>Team</th>
                  <th className={styles.th}>M</th>
                  <th className={styles.th}>W</th>
                  <th className={styles.th}>L</th>
                  <th className={styles.th}>T</th>
                  <th className={styles.th}>NR</th>
                  <th className={styles.th}>Win%</th>
                  <th className={styles.th}></th>
                </tr>
              </thead>
              <tbody>
                {teams.map((team) => (
                  <tr key={team.name} className={styles.tr}>
                    <td className={styles.td}>{team.name}</td>
                    <td className={styles.tdNum}>{team.matches}</td>
                    <td className={`${styles.tdNum} ${styles.win}`}>
                      {team.wins}
                    </td>
                    <td className={styles.tdNum}>{team.losses}</td>
                    <td className={styles.tdNum}>{team.ties}</td>
                    <td className={styles.tdNum}>{team.nr}</td>
                    <td className={styles.tdNum}>
                      <span className={styles.highlight}>
                        {winPct(team.wins, team.matches)}%
                      </span>
                    </td>
                    <td className={styles.tdNum}>
                      <button
                        title={`Delete ${team.name}`}
                        onClick={() =>
                          setDeleteTarget({ type: "team", item: team })
                        }
                        style={{
                          background: "transparent",
                          border: "none",
                          color: "#3d4a5a",
                          cursor: "pointer",
                          padding: "4px",
                          borderRadius: "5px",
                          lineHeight: 1,
                          transition: "color 0.15s, background 0.15s",
                          display: "flex",
                          alignItems: "center",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = "#ef4444";
                          e.currentTarget.style.background =
                            "rgba(239,68,68,0.08)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = "#3d4a5a";
                          e.currentTarget.style.background = "transparent";
                        }}
                      >
                        <TrashIcon />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

export default StatsPage;
