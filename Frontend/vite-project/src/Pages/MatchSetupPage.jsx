import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import styles from "./MatchSetupPage.module.css";
import BrandTitle from "../Components/BrandTitle";
import CaptainSearch from "../Components/Scoring/CaptainSearch";
import usePlayerDatabase from "../hooks/usePlayerDatabase";
import * as teamApi from "../api/teamApi";
import * as playerApi from "../api/playerApi";
import * as squadApi from "../api/squadApi"; 

// ─── Team name autocomplete (unchanged) ───────────────────────────────────────
function TeamAutocomplete({ placeholder, value, onChange, allTeams = [], locked }) {
  const [suggestions, setSuggestions] = useState([]);
  const [show, setShow] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setShow(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleChange = (e) => {
    const val = e.target.value;
    onChange(val);
    if (val.trim().length === 0) { setSuggestions([]); setShow(false); return; }
    const matches = allTeams
      .filter((name) => name.toLowerCase().startsWith(val.trim().toLowerCase()))
      .slice(0, 5);
    setSuggestions(matches);
    setShow(matches.length > 0);
  };

  if (locked) {
    return (
      <div style={{
        background: "#0d1117", border: "1px solid #1f2937", borderRadius: "8px",
        padding: "12px 14px", color: "#4ade80", fontSize: "14px", fontWeight: "600",
        display: "flex", alignItems: "center", gap: "8px",
      }}>
        🏏 {value}
        <span style={{ marginLeft: "auto", fontSize: "11px", color: "#374151", fontWeight: "400" }}>
          Tournament team
        </span>
      </div>
    );
  }

  return (
    <div ref={ref} style={{ position: "relative", width: "100%" }}>
      <input
        className={styles.input}
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        onFocus={() => { if (suggestions.length > 0) setShow(true); }}
        autoComplete="off"
      />
      {show && suggestions.length > 0 && (
        <div style={{
          position: "absolute", top: "100%", left: 0, right: 0,
          background: "#1a1a1a", border: "1px solid #22c55e",
          borderRadius: "8px", zIndex: 100, overflow: "hidden",
        }}>
          {suggestions.map((name) => (
            <div
              key={name}
              onMouseDown={() => { onChange(name); setShow(false); setSuggestions([]); }}
              style={{
                padding: "10px 14px", cursor: "pointer", color: "#e5e7eb",
                fontSize: "14px", borderBottom: "1px solid #2a2a2a",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#0f2a0f")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              🏏 {name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TournamentCaptainInput({ label, value, onChange }) {
  const [jersey, setJersey] = useState(value?.jersey || "");
  const [name, setName] = useState(value?.name || "");
  const [lookupStatus, setLookupStatus] = useState("");
  const [nameSuggestions, setNameSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const lookupTimer = useRef(null);
  const wrapperRef = useRef(null);
  const playerDB = usePlayerDatabase(); // ← add this import at top of file

  const emit = (j, n) => onChange(j || n ? { jersey: j, name: n } : null);

  // ── Jersey lookup (existing) ──────────────────────────────────────────────
  const handleJerseyChange = (e) => {
    const j = e.target.value;
    setJersey(j);
    setLookupStatus("");
    clearTimeout(lookupTimer.current);
  
    if (!j.trim()) {
      emit("", name);
      setNameSuggestions([]);
      setShowSuggestions(false);
      return;
    }
  
    // Show jersey-based suggestions immediately from cache
    const results = playerDB.searchPlayersByName
      ? Object.values(playerDB.getAllPlayers()).filter(p =>
          String(p.jersey).startsWith(j.trim())
        ).slice(0, 5)
      : [];
    setNameSuggestions(results);
    setShowSuggestions(results.length > 0);
  
    // Also do DB lookup to confirm existence
    lookupTimer.current = setTimeout(async () => {
      try {
        const player = await playerApi.getPlayerByJersey(j.trim());
        if (player?.name) {
          setName(player.name);
          setLookupStatus("found");
          setShowSuggestions(false);
          emit(j, player.name);
        } else {
          setLookupStatus("new");
          emit(j, name);
        }
      } catch {
        setLookupStatus("new");
        emit(j, name);
      }
    }, 400);
  
    emit(j, name);
  };

  // ── Name search with suggestions ──────────────────────────────────────────
  const handleNameChange = (e) => {
    const n = e.target.value;
    setName(n);
    setLookupStatus("");
    emit(jersey, n);

    if (n.trim().length < 1) {
      setNameSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    const results = playerDB.searchPlayersByName(n.trim());
    setNameSuggestions(results);
    setShowSuggestions(results.length > 0);
  };

  const handleSelectSuggestion = (player) => {
    setName(player.name);
    setJersey(String(player.jersey || ""));
    setLookupStatus("found");
    setShowSuggestions(false);
    setNameSuggestions([]);
    emit(String(player.jersey || ""), player.name);
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const baseInput = {
    background: "#111827", border: "1px solid #374151",
    color: "#f9fafb", padding: "10px 12px", borderRadius: "8px",
    fontSize: "14px", outline: "none", boxSizing: "border-box",
  };

  return (
    <div ref={wrapperRef} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      <span style={{ fontSize: "12px", color: "#6b7280" }}>{label}</span>
      <div style={{ display: "flex", gap: "8px", width: "100%", minWidth: 0 }}>
        <input
          type="text"
          placeholder="#"
          value={jersey}
          onChange={handleJerseyChange}
          style={{ ...baseInput, width: "70px", flexShrink: 0 }}
        />
        <div style={{ flex: 1, minWidth: 0, position: "relative" }}>
          <input
            type="text"
            placeholder="Captain name"
            value={name}
            onChange={handleNameChange}
            autoComplete="off"
            style={{
              ...baseInput,
              width: "100%",
              borderColor: lookupStatus === "found" ? "#16a34a"
                         : lookupStatus === "new"   ? "#2563eb"
                         : "#374151",
            }}
          />
          {/* Suggestions dropdown */}
          {showSuggestions && (
            <div style={{
              position: "absolute", top: "100%", left: 0, right: 0,
              background: "#1a1a1a", border: "1px solid #22c55e",
              borderRadius: "8px", zIndex: 200, overflow: "hidden", marginTop: "2px",
            }}>
              {nameSuggestions.map((p) => (
                <div
                  key={p.jersey}
                  onMouseDown={() => handleSelectSuggestion(p)}
                  style={{
                    padding: "9px 12px", cursor: "pointer",
                    borderBottom: "1px solid #2a2a2a",
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "#0f2a0f"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                >
                  <span style={{ color: "#e5e7eb", fontSize: "14px" }}>{p.name}</span>
                  <span style={{ color: "#6b7280", fontSize: "12px" }}>#{p.jersey}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      {lookupStatus === "found" && (
        <span style={{ fontSize: "11px", color: "#4ade80" }}>✓ Found in player database</span>
      )}
      {lookupStatus === "new" && (
        <span style={{ fontSize: "11px", color: "#60a5fa" }}>+ Will be created as new player</span>
      )}
    </div>
  );
}

// ─── Locked overs display pill ─────────────────────────────────────────────────
function LockedOvers({ overs, label = "Overs per innings" }) {
  return (
    <div style={{
      background: "#0d1117", border: "1px solid #1f2937", borderRadius: "8px",
      padding: "10px 14px", display: "flex", alignItems: "center", 
      justifyContent: "space-between", gap: "8px",
    }}>
      <span style={{ fontSize: "13px", color: "#6b7280", flexShrink: 0 }}>{label}</span>
      <span style={{
        background: "#14532d", color: "#4ade80", padding: "4px 10px",
        borderRadius: "20px", fontSize: "13px", fontWeight: "700",
        border: "1px solid #16a34a", whiteSpace: "nowrap",
      }}>
        🔒 {overs} ov
      </span>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────
function MatchSetupPage() {
  const navigate = useNavigate();
  const location = useLocation();

  // Detect if navigated from a tournament fixture
  const tournamentState = location.state?.fromTournament ? location.state : null;
  const fromTournament = !!tournamentState;

  // ---------------- BASIC INFO ----------------
  const [teamA, setTeamA] = useState(tournamentState?.prefillTeamA || "");
  const [teamB, setTeamB] = useState(tournamentState?.prefillTeamB || "");
  const [teamAPlayers, setTeamAPlayers] = useState("");
  const [teamBPlayers, setTeamBPlayers] = useState("");

  // Captain stored as { jersey, name } or null
  const [teamACaptain, setTeamACaptain] = useState(null);
  const [teamBCaptain, setTeamBCaptain] = useState(null);

  // Overs — pre-filled and locked from tournament
  const tournamentOvers = tournamentState?.overs || null;
  const [overs, setOvers] = useState(tournamentOvers ? String(tournamentOvers) : "");
  // ── Squad prefill state (tournament matches only) ──────────────────────────
  const [teamASquad, setTeamASquad] = useState(null);   
  const [teamBSquad, setTeamBSquad] = useState(null); 
  const [squadsLoading, setSquadsLoading] = useState(false); 

  // ---------------- TEST MATCH ----------------
  const isTournamentTest = fromTournament && tournamentState?.format === "Test";
  const [isTestMatch, setIsTestMatch] = useState(isTournamentTest);
  const [matchDays, setMatchDays] = useState(
    isTournamentTest ? String(tournamentState?.matchDays || 5) : ""
  );
  const [inningsPerTeam, setInningsPerTeam] = useState("2");
  const [oversPerDay, setOversPerDay] = useState(
    isTournamentTest ? String(tournamentState?.oversPerDay || 90) : ""
  );

  // ---------------- TOSS ----------------
  const [callChoice, setCallChoice] = useState("heads");
  const [callingTeam, setCallingTeam] = useState("teamA");
  const [tossResult, setTossResult] = useState(null);
  const [tossWinner, setTossWinner] = useState(null);
  const [battingFirst, setBattingFirst] = useState(null);
  const [batChoice, setBatChoice] = useState(null);

  // ---------------- MATCH RULES ----------------
  const [rules, setRules] = useState({
    wide: false, noBall: false, byes: false,
    wideRunAllowed: false, noBallRunAllowed: false, noBallFreeHit: false,
  });

  const [enableSuperOver, setEnableSuperOver] = useState(fromTournament ? true : false);
  const [lastManBatting, setLastManBatting] = useState(false);
  const [maxOversPerBowler, setMaxOversPerBowler] = useState("");
  const [showAdditionalSetup, setShowAdditionalSetup] = useState(false);
  const [teamNames, setTeamNames] = useState([]);

  useEffect(() => {
    teamApi
      .getTeams()
      .then((teams) => setTeamNames(teams.map((t) => t.name)))
      .catch(() => {
        try {
          const raw = localStorage.getItem("cricket_team_stats");
          if (raw) {
            const db = JSON.parse(raw);
            setTeamNames(Object.keys(db));
          }
        } catch (e) {}
      });
  }, []);


  // ── Fetch saved squads for prefill — TOURNAMENT MATCHES ONLY ──────────────
  // Regular (non-tournament) matches never touch the squad API; players are
  // always entered manually for those, same as today.
  useEffect(() => {
    if (!fromTournament) {
      setTeamASquad(null);
      setTeamBSquad(null);
      return;
    }
    if (!teamA && !teamB) return;

    let cancelled = false;
    setSquadsLoading(true);

    Promise.all([
      teamA
        ? squadApi.findSquadForTournamentTeam(teamA, tournamentState?.tournamentId)
        : Promise.resolve(null),
      teamB
        ? squadApi.findSquadForTournamentTeam(teamB, tournamentState?.tournamentId)
        : Promise.resolve(null),
    ])
      .then(([squadA, squadB]) => {
        if (cancelled) return;
        setTeamASquad(squadA);
        setTeamBSquad(squadB);
      })
      .catch(() => {
        if (cancelled) return;
        setTeamASquad(null);
        setTeamBSquad(null);
      })
      .finally(() => {
        if (!cancelled) setSquadsLoading(false);
      });

    return () => { cancelled = true; };
  }, [fromTournament, teamA, teamB, tournamentState?.tournamentId]);
  // ---------------- TOSS LOGIC ----------------
  const handleToss = () => {
    const result = Math.random() < 0.5 ? "heads" : "tails";
    setTossResult(result);
    const callerName = callingTeam === "teamA" ? teamA || "Team 1" : teamB || "Team 2";
    const otherTeamName = callingTeam === "teamA" ? teamB || "Team 2" : teamA || "Team 1";
    setTossWinner(result === callChoice ? callerName : otherTeamName);
  };

  // ---------------- START MATCH ----------------
  const startMatch = () => {
    const errors = [];
    if (!teamA.trim()) errors.push("Team A Name");
    if (!teamB.trim()) errors.push("Team B Name");
    if (!teamAPlayers) errors.push("Team A Number of Players");
    if (!teamBPlayers) errors.push("Team B Number of Players");
    if (!isTestMatch && !overs) errors.push("Number of Overs");
    if (isTestMatch && !matchDays) errors.push("Number of Days (Test Match)");
    if (!tossWinner) errors.push("Toss (flip the coin first)");
    if (tossWinner && !batChoice) errors.push("Bat / Bowl choice after toss");

    if (errors.length > 0) {
      alert(`⚠️ Please complete the following before starting:\n\n• ${errors.join("\n• ")}`);
      return;
    }

    const matchData = {
      teamA: teamA.trim(),
      teamB: teamB.trim(),
      teamAPlayers,
      teamBPlayers,
      teamACaptain: teamACaptain || null,
      teamBCaptain: teamBCaptain || null,
      overs,
      tossWinner,
      battingFirst,
      rules,
      isTestMatch,
      matchDays,
      inningsPerTeam,
      oversPerDay,
      lastManBatting,
      maxOversPerBowler: isTestMatch
        ? null
        : maxOversPerBowler !== "" && maxOversPerBowler !== null
        ? Number(maxOversPerBowler)
        : null,
      enableSuperOver,
      ...(fromTournament && {
        fromTournament: true,
        tournamentId: tournamentState.tournamentId,
        fixtureId: tournamentState.fixtureId,
        teamASquadPlayers: teamASquad?.players || null,
        teamBSquadPlayers: teamBSquad?.players || null,
      }),
    };

    localStorage.setItem("matchData", JSON.stringify(matchData));
    try { localStorage.removeItem("cricket_match_snapshot"); } catch (e) {}
    navigate("/scoring", { state: matchData });
  };

  // ─── Tournament banner ───────────────────────────────────────────────────────
  const TournamentBanner = fromTournament ? (
    <div style={{
      background: "#0d1f0d", border: "1px solid #16a34a", borderRadius: "10px",
      padding: "10px 14px", marginBottom: "6px",
      display: "flex", alignItems: "center", gap: "10px",
    }}>
      <span style={{ fontSize: "20px" }}>🏆</span>
      <div>
        <div style={{ fontSize: "13px", fontWeight: "700", color: "#4ade80" }}>
          Tournament Match
        </div>
        <div style={{ fontSize: "12px", color: "#6b7280" }}>
          Teams and format are fixed by the tournament. Only toss, captains, and squad size can be changed.
        </div>
      </div>
    </div>
  ) : null;

  return (
    <div className={styles.container}>
      <BrandTitle size="medium" />

      <div className={styles.card}>
        <h2 className={styles.sectionTitle}>Match Setup</h2>

        {TournamentBanner}
        {fromTournament && (teamA || teamB) && (
          <div style={{ fontSize: "12px", color: "#6b7280", margin: "-4px 0 4px" }}>
            {squadsLoading
              ? "Checking for saved squads…"
              : [
                  teamASquad ? `✅ ${teamA} squad loaded (${teamASquad.players.length} players)` : teamA ? `${teamA}: no saved squad` : null,
                  teamBSquad ? `✅ ${teamB} squad loaded (${teamBSquad.players.length} players)` : teamB ? `${teamB}: no saved squad` : null,
                ].filter(Boolean).join("  •  ")}
          </div>
        )}
        {/* TEAM INFO */}
        <TeamAutocomplete
          placeholder="Team A Name"
          value={teamA}
          onChange={setTeamA}
          allTeams={teamNames}
          locked={fromTournament}
        />
        <TeamAutocomplete
          placeholder="Team B Name"
          value={teamB}
          onChange={setTeamB}
          allTeams={teamNames}
          locked={fromTournament}
        />
        <input
          className={styles.input}
          placeholder="Team A Number of Players"
          type="number"
          value={teamAPlayers}
  autoComplete="off"
          onChange={(e) => setTeamAPlayers(e.target.value)}
        />
        <input
          className={styles.input}
          placeholder="Team B Number of Players"
          type="number"
          value={teamBPlayers}
  autoComplete="off"
          onChange={(e) => setTeamBPlayers(e.target.value)}
        />

        {/* CAPTAIN FIELDS */}
        {fromTournament ? (
          <>
            <TournamentCaptainInput
              label={`${teamA || "Team A"} Captain`}
              value={teamACaptain}
              onChange={setTeamACaptain}
            />
            <TournamentCaptainInput
              label={`${teamB || "Team B"} Captain`}
              value={teamBCaptain}
              onChange={setTeamBCaptain}
            />
          </>
        ) : (
          <>
            <CaptainSearch
              placeholder="Team A Captain (name or jersey)"
              value={teamACaptain}
              onSelect={setTeamACaptain}
            />
            <CaptainSearch
              placeholder="Team B Captain (name or jersey)"
              value={teamBCaptain}
              onSelect={setTeamBCaptain}
            />
          </>
        )}

        {/* OVERS — locked if from tournament, editable otherwise */}
        {fromTournament ? (
          isTournamentTest ? (
            <LockedOvers overs={`${matchDays}d × ${oversPerDay}`} label="Test match days × overs/day" />
          ) : (
            <LockedOvers overs={tournamentOvers} />
          )
        ) : (
          !isTestMatch && (
            <input
              className={styles.input}
              placeholder="Number of Overs"
              type="number"
              value={overs}
              onChange={(e) => setOvers(e.target.value)}
            />
          )
        )}

        {/* ── ADDITIONAL SETUP (hidden for Test tournament since days/overs already set) ── */}
        <div className={styles.additionalBox}>
          <div
            className={styles.additionalHeader}
            onClick={() => setShowAdditionalSetup(!showAdditionalSetup)}
          >
            <span>⚙ Additional Setup</span>
            <span>{showAdditionalSetup ? "▲" : "▼"}</span>
          </div>

          {showAdditionalSetup && (
            <div className={styles.additionalContent}>
              {/* Gully Mode */}
              <label className={styles.additionalOption}>
                <input
                  type="checkbox"
                  checked={lastManBatting}
                  onChange={(e) => setLastManBatting(e.target.checked)}
                />
                Gully Mode (Last Man Can Bat Alone)
              </label>

              {/* Super Over — only for limited overs, not Test */}
              {!isTestMatch && (
                <label className={styles.additionalOption}>
                  <input
                    type="checkbox"
                    checked={enableSuperOver}
                    onChange={(e) => setEnableSuperOver(e.target.checked)}
                  />
                  Super Over (On Tie)
                </label>
              )}

              {/* Max Overs Per Bowler */}
              {!isTestMatch && (
                <div className={styles.testField}>
                  <label>Max Overs Per Bowler (Per Innings)</label>
                  <input
                    type="number"
                    min="1"
                    value={maxOversPerBowler}
                    placeholder="No limit"
                    onChange={(e) => setMaxOversPerBowler(e.target.value)}
                  />
                </div>
              )}

              {/* Test Match toggle — hide if tournament already fixed the format */}
              {!fromTournament && (
                <label className={styles.additionalOption}>
                  <input
                    type="checkbox"
                    checked={isTestMatch}
                    onChange={(e) => {
                      setIsTestMatch(e.target.checked);
                      if (e.target.checked) {
                        setOvers("");
                        setEnableSuperOver(false);
                      }
                    }}
                  />
                  Test Match (No Over Limit)
                </label>
              )}

              {/* Test match day/over fields — only show if not locked by tournament */}
              {isTestMatch && !fromTournament && (
                <>
                  <label>Days</label>
                  <input
                    className={styles.input}
                    type="number" min="1" max="10"
                    value={matchDays}
                    onChange={(e) => setMatchDays(e.target.value)}
                    placeholder="e.g. 5"
                  />
                  <label>Overs per Day</label>
                  <input
                    className={styles.input}
                    type="number" min="10" max="120"
                    value={oversPerDay}
                    onChange={(e) => setOversPerDay(e.target.value)}
                    placeholder="e.g. 90"
                  />
                </>
              )}
            </div>
          )}
        </div>

        {/* TOSS CALL */}
        <div className={styles.tossCallRow}>
          <p>Captain Call</p>
          <select className={styles.select} onChange={(e) => setCallChoice(e.target.value)}>
            <option value="heads">Heads</option>
            <option value="tails">Tails</option>
          </select>
          <select className={styles.select} onChange={(e) => setCallingTeam(e.target.value)}>
            <option value="teamA">{teamA || "Team 1"} Calls</option>
            <option value="teamB">{teamB || "Team 2"} Calls</option>
          </select>
        </div>

        <button className={styles.tossBtn} onClick={handleToss}>
          Flip Coin for Toss
        </button>

        {tossResult && (
          <div className={styles.tossResult}>
            Coin landed: <strong>{tossResult.toUpperCase()}</strong>
            <br />
            Toss won by: <strong>{tossWinner}</strong>
          </div>
        )}

        {/* BAT/BOWL */}
        {tossWinner && (
          <div className={styles.choiceRow}>
            <p>{tossWinner} chooses:</p>
            <button
              className={`${styles.choiceBtn} ${batChoice === "bat" ? styles.activeChoice : ""}`}
              onClick={() => { setBatChoice("bat"); setBattingFirst(tossWinner); }}
            >
              Bat
            </button>
            <button
              className={`${styles.choiceBtn} ${batChoice === "bowl" ? styles.activeChoice : ""}`}
              onClick={() => {
                setBatChoice("bowl");
                setBattingFirst(tossWinner === teamA ? teamB : teamA);
              }}
            >
              Bowl
            </button>
          </div>
        )}

        {/* EXTRAS RULES */}
        <div className={styles.extrasRow}>
          <label>
            <input type="checkbox" checked={rules.wide}
              onChange={(e) => setRules({ ...rules, wide: e.target.checked })} /> Wide
          </label>
          <label>
            <input type="checkbox" checked={rules.noBall}
              onChange={(e) => setRules({ ...rules, noBall: e.target.checked })} /> No Ball
          </label>
          <label>
            <input type="checkbox" checked={rules.byes}
              onChange={(e) => setRules({ ...rules, byes: e.target.checked })} /> Byes
          </label>
        </div>

        {rules.wide && (
          <div className={styles.ruleBox}>
            <p>Wide Ball Rule</p>
            <label>
              <input type="radio" name="wideRun"
                onChange={() => setRules({ ...rules, wideRunAllowed: false })} /> Only 1 run penalty
            </label>
          </div>
        )}

        {rules.noBall && (
          <div className={styles.ruleBox}>
            <p>No Ball Rule</p>
            <label>
              <input type="checkbox" checked={rules.noBallFreeHit}
                onChange={(e) => setRules({ ...rules, noBallFreeHit: e.target.checked })} /> Free Hit
            </label>
            <label>
              <input type="checkbox" checked={rules.noBallRunAllowed}
                onChange={(e) => setRules({ ...rules, noBallRunAllowed: e.target.checked })} /> Run
            </label>
          </div>
        )}

        {(() => {
          const ready =
            teamA.trim() && teamB.trim() && teamAPlayers && teamBPlayers &&
            (isTestMatch ? matchDays : overs) && tossWinner && batChoice;
          return (
            <button
              className={styles.startBtn}
              onClick={startMatch}
              disabled={!ready}
              style={{ opacity: ready ? 1 : 0.45, cursor: ready ? "pointer" : "not-allowed" }}
            >
              Start Match
            </button>
          );
        })()}
      </div>
    </div>
  );
}

export default MatchSetupPage;
