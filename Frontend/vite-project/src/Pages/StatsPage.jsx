import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./StatsPage.module.css";
import * as playerApi from "../api/playerApi";
import * as teamApi from "../api/teamApi";

function safeNum(v) {
  const n = Number(v);
  return isNaN(n) ? 0 : n;
}

function StatsPage() {
  const [tab, setTab]                         = useState("players");
  const [players, setPlayers]                 = useState([]);
  const [teams, setTeams]                     = useState([]);
  const [captains, setCaptains]               = useState([]);
  const [searchQuery, setSearchQuery]         = useState("");
  const [suggestions, setSuggestions]         = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(-1);
  const [loading, setLoading]                 = useState(false);
  const searchRef = useRef(null);
  const navigate  = useNavigate();

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // ── Players from MongoDB ──────────────────────────────────────
      const fetchedPlayers = await playerApi.getAllPlayers();
      const valid = fetchedPlayers.filter(
        p => p.name && p.name.trim() && p.name !== "Unknown"
      );
      const sorted = [...valid].sort((a, b) => a.name.localeCompare(b.name));
      setPlayers(sorted);

      const caps = valid
        .filter(p => safeNum(p.captainMatches) > 0)
        .sort((a, b) => safeNum(b.captainMatches) - safeNum(a.captainMatches));
      setCaptains(caps);

      // ── Teams from MongoDB ────────────────────────────────────────
      const fetchedTeams = await teamApi.getTeams();
      const teamList = fetchedTeams
        .map(t => ({
          name:    t.name,
          matches: safeNum(t.matches),
          wins:    safeNum(t.wins),
          losses:  safeNum(t.losses),
          ties:    safeNum(t.ties),
          nr:      safeNum(t.nr),
        }))
        .sort((a, b) => b.matches - a.matches);
      setTeams(teamList);

    } catch (err) {
      console.error("StatsPage: failed to load data", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [tab, loadData]);

  // Search suggestions
  useEffect(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      setSuggestions([]); setShowSuggestions(false); setActiveSuggestion(-1);
      return;
    }
    const matched = players
      .filter(p =>
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
    const h = e => {
      if (searchRef.current && !searchRef.current.contains(e.target))
        setShowSuggestions(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const goToPlayer = p => {
    setSearchQuery(""); setShowSuggestions(false);
    navigate(`/player/${p.jersey}`);
  };

  const handleKeyDown = e => {
    if (!showSuggestions || !suggestions.length) return;
    if (e.key === "ArrowDown")  { e.preventDefault(); setActiveSuggestion(v => Math.min(v + 1, suggestions.length - 1)); }
    else if (e.key === "ArrowUp")   { e.preventDefault(); setActiveSuggestion(v => Math.max(v - 1, 0)); }
    else if (e.key === "Enter") {
      e.preventDefault();
      if (activeSuggestion >= 0) goToPlayer(suggestions[activeSuggestion]);
      else if (suggestions.length === 1) goToPlayer(suggestions[0]);
    }
    else if (e.key === "Escape") setShowSuggestions(false);
  };

  const filteredPlayers = searchQuery.trim() === ""
    ? players
    : players.filter(p => {
        const q = searchQuery.trim().toLowerCase();
        return p.name.toLowerCase().includes(q) || String(p.jersey).includes(q);
      });

  const highlightMatch = (text, query) => {
    if (!query) return text;
    const i = text.toLowerCase().indexOf(query.toLowerCase());
    if (i === -1) return text;
    return (
      <>
        {text.slice(0, i)}
        <span className={styles.highlight}>{text.slice(i, i + query.length)}</span>
        {text.slice(i + query.length)}
      </>
    );
  };

  const winPct = (wins, total) =>
    total > 0 ? ((safeNum(wins) / safeNum(total)) * 100).toFixed(1) : "0.0";

  if (loading) return <div style={{ padding: "40px", color: "#888", textAlign: "center" }}>Loading...</div>;

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>📊 Records</h1>

      {/* Tabs */}
      <div className={styles.tabs}>
        {["teams", "captains", "players"].map(t => (
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
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
                autoComplete="off"
              />
              {searchQuery.length > 0 && (
                <button className={styles.clearBtn} onClick={() => { setSearchQuery(""); setShowSuggestions(false); }}>✕</button>
              )}
            </div>

            {showSuggestions && suggestions.length > 0 && (
              <div className={styles.suggestionsBox}>
                {suggestions.map((p, i) => (
                  <div
                    key={p.jersey}
                    className={`${styles.suggestionItem} ${i === activeSuggestion ? styles.activeSuggestion : ""}`}
                    onMouseDown={() => goToPlayer(p)}
                    onMouseEnter={() => setActiveSuggestion(i)}
                  >
                    <span className={styles.suggestionJersey}>#{highlightMatch(String(p.jersey), searchQuery)}</span>
                    <span className={styles.suggestionName}>{highlightMatch(p.name, searchQuery)}</span>
                    <span className={styles.suggestionMeta}>{safeNum(p.matches)}m · {safeNum(p.runs)}r</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className={styles.playerList}>
            {filteredPlayers.length === 0 && searchQuery.trim() !== "" ? (
              <p style={{ padding: "20px", color: "#888" }}>No players found for "{searchQuery}".</p>
            ) : filteredPlayers.length === 0 ? (
              <p style={{ padding: "20px", color: "#888" }}>No players found. Complete a match first.</p>
            ) : (
              filteredPlayers.map(p => (
                <div key={p.jersey} className={styles.playerItem} onClick={() => goToPlayer(p)}>
                  <span className={styles.jerseyBadge}>#{p.jersey}</span>
                  {p.name}
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
            <p style={{ padding: "20px", color: "#888" }}>No captaincy records yet. Set a captain in Match Setup first.</p>
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
                {captains.map(p => (
                  <tr key={p.jersey} className={styles.tr} onClick={() => goToPlayer(p)}>
                    <td className={styles.td}>
                      <span className={styles.jerseyBadge}>#{p.jersey}</span>
                      {p.name}
                    </td>
                    <td className={styles.tdNum}>{safeNum(p.captainMatches)}</td>
                    <td className={`${styles.tdNum} ${styles.win}`}>{safeNum(p.captainWins)}</td>
                    <td className={styles.tdNum}>{safeNum(p.captainLosses)}</td>
                    <td className={styles.tdNum}>{safeNum(p.captainTies)}</td>
                    <td className={styles.tdNum}>{safeNum(p.captainNR)}</td>
                    <td className={styles.tdNum}>
                      <span className={styles.highlight}>{winPct(p.captainWins, p.captainMatches)}%</span>
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
            <p style={{ padding: "20px", color: "#888" }}>No team records yet. Complete a match first.</p>
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
                {teams.map(team => (
                  <tr key={team.name} className={styles.tr}>
                    <td className={styles.td}>{team.name}</td>
                    <td className={styles.tdNum}>{team.matches}</td>
                    <td className={`${styles.tdNum} ${styles.win}`}>{team.wins}</td>
                    <td className={styles.tdNum}>{team.losses}</td>
                    <td className={styles.tdNum}>{team.ties}</td>
                    <td className={styles.tdNum}>{team.nr}</td>
                    <td className={styles.tdNum}>
                      <span className={styles.highlight}>{winPct(team.wins, team.matches)}%</span>
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