import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./StatsPage.module.css";

// ─────────────────────────────────────────────────────────────────────────────
// ROOT CAUSE OF THE BUG:
//
// ScoringPage stores captain stats under the jersey key:
//   localStorage["cricket_player_database"]["9980"] = { captainMatches: 69 }
//
// BUT it also stores the same player under a session playerId key:
//   localStorage["cricket_player_database"]["player_1234"] = { jersey: 9980, matches: 69 }
//
// So there are TWO entries for Rishi. Object.values() returns both.
// The captaincy fields live on the jersey-keyed entry.
// The individual player profile page reads by jersey directly — so it sees
// the right entry. But StatsPage was iterating ALL entries, and if it
// happened to use the session-key entry (no captainMatches), it showed 0.
//
// FIX: group every entry by jersey number and MERGE them before display.
// ─────────────────────────────────────────────────────────────────────────────

function safeNum(v) {
  const n = Number(v);
  return isNaN(n) ? 0 : n;
}

function loadAndMergePlayerDB() {
  const raw = localStorage.getItem("cricket_player_database");
  if (!raw) return [];

  let data;
  try { data = JSON.parse(raw); } catch { return []; }

  // Group all entries that share the same jersey number
  const byJersey = {}; // jerseyString → merged object

  for (const [storageKey, entry] of Object.entries(data)) {
    if (!entry || typeof entry !== "object") continue;

    // The canonical jersey for this entry:
    // prefer the `jersey` field on the object; fall back to the storage key
    // itself if it looks like a plain number (i.e. it IS the jersey key).
    const jerseyKey = entry.jersey != null
      ? String(entry.jersey)
      : (/^\d+$/.test(storageKey) ? storageKey : null);

    // Entries without any jersey linkage (pure session keys with no jersey
    // field) cannot be merged — keep them separately under their storage key.
    const key = jerseyKey ?? storageKey;

    const coerced = {
      ...entry,
      jersey:         entry.jersey ?? (jerseyKey ? Number(jerseyKey) : undefined),
      matches:        safeNum(entry.matches),
      runs:           safeNum(entry.runs),
      balls:          safeNum(entry.balls),
      fours:          safeNum(entry.fours),
      sixes:          safeNum(entry.sixes),
      wickets:        safeNum(entry.wickets),
      innings:        safeNum(entry.innings),
      notOuts:        safeNum(entry.notOuts),
      captainMatches: safeNum(entry.captainMatches),
      captainWins:    safeNum(entry.captainWins),
      captainLosses:  safeNum(entry.captainLosses),
      captainTies:    safeNum(entry.captainTies),
      captainNR:      safeNum(entry.captainNR),
      bowlingInnings: safeNum(entry.bowlingInnings),
      ballsBowled:    safeNum(entry.ballsBowled),
      runsGiven:      safeNum(entry.runsGiven),
      dismissals:     safeNum(entry.dismissals),
      maidens:        safeNum(entry.maidens),
      catches:        safeNum(entry.catches),
      stumpings:      safeNum(entry.stumpings),
      runouts:        safeNum(entry.runouts),
      highestScore:   safeNum(entry.highestScore),
    };

    if (!byJersey[key]) {
      byJersey[key] = { ...coerced, _storageKey: storageKey };
    } else {
      // Merge: sum all numeric stats, take the best name, keep max highestScore
      const ex = byJersey[key];
      const name =
        (ex.name && ex.name !== "Unknown" && ex.name.trim()) ? ex.name :
        (coerced.name && coerced.name !== "Unknown" && coerced.name.trim()) ? coerced.name :
        ex.name || "";

      byJersey[key] = {
        ...ex,
        name,
        jersey: coerced.jersey ?? ex.jersey,

        matches:        ex.matches        + coerced.matches,
        runs:           ex.runs           + coerced.runs,
        balls:          ex.balls          + coerced.balls,
        fours:          ex.fours          + coerced.fours,
        sixes:          ex.sixes          + coerced.sixes,
        wickets:        ex.wickets        + coerced.wickets,
        innings:        ex.innings        + coerced.innings,
        notOuts:        ex.notOuts        + coerced.notOuts,
        captainMatches: ex.captainMatches + coerced.captainMatches,
        captainWins:    ex.captainWins    + coerced.captainWins,
        captainLosses:  ex.captainLosses  + coerced.captainLosses,
        captainTies:    ex.captainTies    + coerced.captainTies,
        captainNR:      ex.captainNR      + coerced.captainNR,
        bowlingInnings: ex.bowlingInnings + coerced.bowlingInnings,
        ballsBowled:    ex.ballsBowled    + coerced.ballsBowled,
        runsGiven:      ex.runsGiven      + coerced.runsGiven,
        dismissals:     ex.dismissals     + coerced.dismissals,
        maidens:        ex.maidens        + coerced.maidens,
        catches:        ex.catches        + coerced.catches,
        stumpings:      ex.stumpings      + coerced.stumpings,
        runouts:        ex.runouts        + coerced.runouts,
        highestScore:   Math.max(ex.highestScore, coerced.highestScore),
      };
    }
  }

  // Only return entries that have a real name
  return Object.values(byJersey).filter(
    p => p.name && p.name.trim() && p.name !== "Unknown"
  );
}

// ─────────────────────────────────────────────────────────────────────────────

function StatsPage() {
  const [tab, setTab]                     = useState("players");
  const [players, setPlayers]             = useState([]);
  const [teams, setTeams]                 = useState([]);
  const [captains, setCaptains]           = useState([]);
  const [searchQuery, setSearchQuery]     = useState("");
  const [suggestions, setSuggestions]     = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(-1);
  const searchRef = useRef(null);
  const navigate  = useNavigate();

  // Re-read & re-merge every time the active tab changes
  const loadData = useCallback(() => {
    const merged = loadAndMergePlayerDB();

    const sorted = [...merged].sort((a, b) => a.name.localeCompare(b.name));
    setPlayers(sorted);

    const caps = merged
      .filter(p => p.captainMatches > 0)
      .sort((a, b) => b.captainMatches - a.captainMatches);
    setCaptains(caps);

    const teamRaw  = localStorage.getItem("cricket_team_stats");
    const teamData = teamRaw ? JSON.parse(teamRaw) : {};
    const teamList = Object.entries(teamData)
      .map(([name, s]) => ({
        name,
        matches: safeNum(s.matches),
        wins:    safeNum(s.wins),
        losses:  safeNum(s.losses),
        ties:    safeNum(s.ties),
        nr:      safeNum(s.nr),
      }))
      .sort((a, b) => b.matches - a.matches);
    setTeams(teamList);
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
                    <span className={styles.suggestionMeta}>{p.matches}m · {p.runs}r</span>
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
                    <td className={styles.tdNum}>{p.captainMatches}</td>
                    <td className={`${styles.tdNum} ${styles.win}`}>{p.captainWins}</td>
                    <td className={styles.tdNum}>{p.captainLosses}</td>
                    <td className={styles.tdNum}>{p.captainTies}</td>
                    <td className={styles.tdNum}>{p.captainNR}</td>
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
