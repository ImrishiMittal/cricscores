import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./StatsPage.module.css";

function StatsPage() {
  const [tab, setTab] = useState("players");
  const [players, setPlayers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(-1);
  const searchRef = useRef(null);
  const navigate = useNavigate();
  const [teams, setTeams] = useState([]);
  const [captains, setCaptains] = useState([]);

  useEffect(() => {
    const raw = localStorage.getItem("cricket_player_database");
    const data = raw ? JSON.parse(raw) : {};
    const sorted = Object.values(data).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
    setPlayers(sorted);

    const teamRaw = localStorage.getItem("cricket_team_stats");
    const teamData = teamRaw ? JSON.parse(teamRaw) : {};
    const teamsSorted = Object.entries(teamData)
      .map(([name, stats]) => ({ name, ...stats }))
      .sort((a, b) => b.matches - a.matches);
    setTeams(teamsSorted);

    const captainsSorted = sorted
      .filter((p) => (p.captainMatches || 0) > 0)
      .sort((a, b) => b.captainMatches - a.captainMatches);
    setCaptains(captainsSorted);
  }, []);

  // ─── Search & Suggestion Logic ───────────────────────────────────
  useEffect(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      setSuggestions([]);
      setShowSuggestions(false);
      setActiveSuggestion(-1);
      return;
    }

    const matched = players.filter((p) => {
      const nameMatch = p.name.toLowerCase().startsWith(query);
      const jerseyMatch = String(p.jersey).startsWith(query);
      return nameMatch || jerseyMatch;
    });

    // Sort: exact matches first, then alphabetical
    matched.sort((a, b) => {
      const aNameExact = a.name.toLowerCase() === query;
      const bNameExact = b.name.toLowerCase() === query;
      const aJerseyExact = String(a.jersey) === query;
      const bJerseyExact = String(b.jersey) === query;
      if (aNameExact || aJerseyExact) return -1;
      if (bNameExact || bJerseyExact) return 1;
      return a.name.localeCompare(b.name);
    });

    setSuggestions(matched.slice(0, 6));
    setShowSuggestions(matched.length > 0);
    setActiveSuggestion(-1);
  }, [searchQuery, players]);

  // ─── Click outside to close suggestions ─────────────────────────
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleSuggestionClick = (player) => {
    setSearchQuery("");
    setShowSuggestions(false);
    navigate(`/player/${player.jersey}`);
  };

  const handleKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveSuggestion((prev) =>
        prev < suggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveSuggestion((prev) => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeSuggestion >= 0) {
        handleSuggestionClick(suggestions[activeSuggestion]);
      } else if (suggestions.length === 1) {
        handleSuggestionClick(suggestions[0]);
      }
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  };

  // ─── Filtered list for main player list ─────────────────────────
  const filteredPlayers =
    searchQuery.trim() === ""
      ? players
      : players.filter((p) => {
          const q = searchQuery.trim().toLowerCase();
          return (
            p.name.toLowerCase().includes(q) ||
            String(p.jersey).includes(q)
          );
        });

  // ─── Highlight matching text ─────────────────────────────────────
  const highlightMatch = (text, query) => {
    if (!query) return text;
    const index = text.toLowerCase().indexOf(query.toLowerCase());
    if (index === -1) return text;
    return (
      <>
        {text.slice(0, index)}
        <span className={styles.highlight}>{text.slice(index, index + query.length)}</span>
        {text.slice(index + query.length)}
      </>
    );
  };

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
        <>
          {/* ─── Search Bar ───────────────────────────────────── */}
          <div className={styles.searchWrapper} ref={searchRef}>
            <div className={styles.searchBox}>
              <span className={styles.searchIcon}>🔍</span>
              <input
                className={styles.searchInput}
                type="text"
                placeholder="Search by name or jersey number..."
                value={searchQuery}
                onChange={handleSearchChange}
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

            {/* ─── Suggestions Dropdown ─────────────────────── */}
            {showSuggestions && suggestions.length > 0 && (
              <div className={styles.suggestionsBox}>
                {suggestions.map((p, i) => (
                  <div
                    key={p.jersey}
                    className={`${styles.suggestionItem} ${
                      i === activeSuggestion ? styles.activeSuggestion : ""
                    }`}
                    onMouseDown={() => handleSuggestionClick(p)}
                    onMouseEnter={() => setActiveSuggestion(i)}
                  >
                    <span className={styles.suggestionJersey}>
                      #{highlightMatch(String(p.jersey), searchQuery)}
                    </span>
                    <span className={styles.suggestionName}>
                      {highlightMatch(p.name, searchQuery)}
                    </span>
                    <span className={styles.suggestionMeta}>
                      {p.matches || 0} matches · {p.runs || 0} runs
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ─── Player List ──────────────────────────────────── */}
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
                <div
                  key={p.jersey}
                  className={styles.playerItem}
                  onClick={() => navigate(`/player/${p.jersey}`)}
                >
                  {p.jersey} - {p.name}
                </div>
              ))
            )}
          </div>
        </>
      )}

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
                {captains.map((p) => {
                  const winPct = p.captainMatches > 0
                    ? ((p.captainWins / p.captainMatches) * 100).toFixed(1)
                    : "0.0";
                  return (
                    <tr
                      key={p.jersey}
                      className={styles.tr}
                      onClick={() => navigate(`/player/${p.jersey}`)}
                    >
                      <td className={styles.td}>
                        <span className={styles.jerseyBadge}>#{p.jersey}</span>
                        {p.name}
                      </td>
                      <td className={styles.tdNum}>{p.captainMatches}</td>
                      <td className={`${styles.tdNum} ${styles.win}`}>{p.captainWins}</td>
                      <td className={styles.tdNum}>{p.captainLosses}</td>
                      <td className={styles.tdNum}>{p.captainTies || 0}</td>
                      <td className={styles.tdNum}>{p.captainNR || 0}</td>
                      <td className={`${styles.tdNum} ${styles.highlight}`}>{winPct}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

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
                </tr>
              </thead>
              <tbody>
                {teams.map((team) => {
                  const winPct = team.matches > 0
                    ? ((team.wins / team.matches) * 100).toFixed(1)
                    : "0.0";
                  return (
                    <tr key={team.name} className={styles.tr}>
                      <td className={styles.td}>{team.name}</td>
                      <td className={styles.tdNum}>{team.matches}</td>
                      <td className={`${styles.tdNum} ${styles.win}`}>{team.wins}</td>
                      <td className={styles.tdNum}>{team.losses}</td>
                      <td className={styles.tdNum}>{team.ties || 0}</td>
                      <td className={styles.tdNum}>{team.nr || 0}</td>
                      <td className={`${styles.tdNum} ${styles.highlight}`}>{winPct}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

export default StatsPage;
