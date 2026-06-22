import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import BrandTitle from "../Components/BrandTitle";
import * as teamApi from "../api/teamApi";
import * as squadApi from "../api/squadApi";
import usePlayerDatabase from "../hooks/usePlayerDatabase"; // ← add

const ROLES = [
  { value: "batsman", label: "Batsman" },
  { value: "bowler", label: "Bowler" },
  { value: "allrounder", label: "All-rounder" },
  { value: "wk", label: "Wicketkeeper" },
];

const roleBadgeColor = {
  batsman: { bg: "#1e3a5f", fg: "#60a5fa" },
  bowler: { bg: "#7f1d1d", fg: "#f87171" },
  allrounder: { bg: "#14532d", fg: "#4ade80" },
  wk: { bg: "#3f2d5c", fg: "#c084fc" },
};

// ── LoyaltyErrorDisplay — defined OUTSIDE SquadManagerPage ───────────────────
const LoyaltyErrorDisplay = ({ error, clashes }) => {
  if (!error) return null;
  return (
    <div style={{
      background: "#2a0a0a",
      border: "1px solid #ef4444",
      borderRadius: "10px",
      padding: "12px 14px",
      marginBottom: "12px",
    }}>
      <div style={{ color: "#ef4444", fontSize: "13px", fontWeight: "600", marginBottom: clashes?.length ? "8px" : 0 }}>
        {error}
      </div>
      {clashes?.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {clashes.map((c, i) => (
            <div key={i} style={{
              background: "#1a0a0a",
              borderRadius: "6px",
              padding: "7px 10px",
              fontSize: "12px",
              color: "#fca5a5",
            }}>
              <strong>#{c.jersey} {c.playerName}</strong> is already in <strong>{c.conflictTeam}</strong>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default function SquadManagerPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const playerDB = usePlayerDatabase();
  const tournamentContext = location.state || {};
  const contextTeams = tournamentContext.teams || [];
  const contextTournamentId = tournamentContext.tournamentId || null;

  // When we land here with a fixed team list from a tournament (e.g. right after
  // "Create Tournament" → "Create Squads Now"), every legal team name is already
  // known. Match lookup later (MatchSetupPage → findSquadForTournamentTeam) can
  // only ever search by names from that same fixed list — fixtures are generated
  // from tournament.teams, and team pickers are locked for tournament matches.
  // A squad saved under any other name would be created but never findable by
  // a real fixture, so the "custom team name" escape hatch is disabled whenever
  // we have that fixed list to work with.
  const hasFixedTeamList = contextTeams.length > 0;

  const [teamNames, setTeamNames] = useState(contextTeams);
  const [selectedTeam, setSelectedTeam] = useState("");
  const [customTeamName, setCustomTeamName] = useState("");
  const [usingCustomTeam, setUsingCustomTeam] = useState(false);

  const [existingSquad, setExistingSquad] = useState(null); // the loaded Squad doc, or null if none yet
  const [players, setPlayers] = useState([]); // working copy being edited
  const [loadingSquad, setLoadingSquad] = useState(false);

  const [newJersey, setNewJersey] = useState("");
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState("batsman");
  const [newJerseyMatch, setNewJerseyMatch] = useState(null);
  const [newNameSuggestions, setNewNameSuggestions] = useState([]);
  const [showNewNameSuggestions, setShowNewNameSuggestions] = useState(false);
  const addPlayerRef = useRef(null);

  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState("");
  const [clashes, setClashes] = useState([]);

  const activeTeamName = usingCustomTeam ? customTeamName.trim() : selectedTeam;

  // True only when the squad we loaded is actually scoped to THIS tournament.
  // If it's false but existingSquad is non-null, what's loaded is the team's
  // default squad shown as a convenient starting template — saving must
  // create a new tournament-scoped squad rather than overwrite the default.
  const isExistingSquadForThisTournament =
    !!existingSquad &&
    String(existingSquad.tournamentId || "") === String(contextTournamentId || "");

  // ── Load team names for the dropdown ───────────────────────────────────────
  useEffect(() => {
    if (contextTeams.length > 0) {
      setTeamNames(contextTeams);
      return;
    }
    teamApi
      .getTeams()
      .then((teams) => setTeamNames(teams.map((t) => t.name)))
      .catch(() => {
        try {
          const raw = localStorage.getItem("cricket_team_stats");
          if (raw) setTeamNames(Object.keys(JSON.parse(raw)));
        } catch (e) {}
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // If a fixed team list shows up (e.g. context arrives after mount) while the
  // custom-name path is active, snap back to the picker — a custom name is
  // never valid once we know the real roster.
  useEffect(() => {
    if (hasFixedTeamList && usingCustomTeam) {
      setUsingCustomTeam(false);
      setCustomTeamName("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasFixedTeamList]);

  // ── Whenever the active team changes, load its saved squad (if any) ───────
  useEffect(() => {
    if (!activeTeamName) {
      setExistingSquad(null);
      setPlayers([]);
      return;
    }

    let cancelled = false;
    setLoadingSquad(true);
    setError("");
    setSavedMessage("");

    squadApi
      .findSquadForTournamentTeam(activeTeamName, contextTournamentId)
      .then((squad) => {
        if (cancelled) return;
        setExistingSquad(squad);
        setPlayers(squad?.players ? [...squad.players] : []);
      })
      .catch(() => {
        if (cancelled) return;
        setExistingSquad(null);
        setPlayers([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingSquad(false);
      });

    return () => {
      cancelled = true;
    };
  }, [activeTeamName, contextTournamentId]);

  // ── Jersey lookup — autofill name if this jersey already exists in the DB ──
  const handleNewJerseyChange = (val) => {
    setNewJersey(val);
    setError("");
    setNewJerseyMatch(null);
    if (val.trim()) {
      const found = playerDB.getPlayer(val.trim());
      if (found) {
        setNewJerseyMatch(found);
        setNewName(found.name);
        setShowNewNameSuggestions(false);
      }
    }
  };

  // ── Name search — show matching players as suggestions ──────────────────
  const handleNewNameChange = (val) => {
    setNewName(val);
    setError("");
    setNewJerseyMatch(null);
    if (val.trim()) {
      const results = playerDB.searchPlayersByName(val.trim());
      setNewNameSuggestions(results);
      setShowNewNameSuggestions(results.length > 0);
    } else {
      setNewNameSuggestions([]);
      setShowNewNameSuggestions(false);
    }
  };

  const handleSelectNewSuggestion = (player) => {
    setNewJersey(String(player.jersey));
    setNewName(player.name);
    setNewJerseyMatch(player);
    setShowNewNameSuggestions(false);
    setNewNameSuggestions([]);
  };

  // Close suggestions on outside click
  useEffect(() => {
    const handler = (e) => {
      if (addPlayerRef.current && !addPlayerRef.current.contains(e.target)) {
        setShowNewNameSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Add a player to the working list ───────────────────────────────────────
  const handleAddPlayer = () => {
    const jersey = newJersey.trim();
    const name = newName.trim();

    if (!jersey) {
      setError("⚠️ Enter a jersey number");
      return;
    }
    if (!name) {
      setError("⚠️ Enter a player name");
      return;
    }
    if (players.some((p) => String(p.jersey) === jersey)) {
      setError(`⚠️ Jersey #${jersey} is already in this squad`);
      return;
    }

    setError("");
    setPlayers((prev) => [...prev, { jersey, name, role: newRole }]);
    setNewJersey("");
    setNewName("");
    setNewRole("batsman");
    setNewJerseyMatch(null);          // ← add
    setNewNameSuggestions([]);        // ← add
    setShowNewNameSuggestions(false); // ← add
  };

  const handleRemovePlayer = (jersey) => {
    setPlayers((prev) => prev.filter((p) => String(p.jersey) !== String(jersey)));
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") handleAddPlayer();
  };

  // ── Save (create or update) ────────────────────────────────────────────────
  const handleSave = async () => {
    if (!activeTeamName) {
      setError("⚠️ Pick or enter a team name first");
      return;
    }
    if (players.length === 0) {
      setError("⚠️ Add at least one player before saving");
      return;
    }

    setSaving(true);
    setError("");
    setClashes([]);
    setSavedMessage("");

    try {
      if (isExistingSquadForThisTournament) {
        // A squad already exists for this exact team + tournament — update it.
        const updated = await squadApi.updateSquad(existingSquad._id, {
          teamName: activeTeamName,
          players,
        });
        setExistingSquad(updated);
      } else {
        // Either no squad exists yet, or what's loaded is just the team's
        // default squad shown as a template — create a new squad scoped to
        // this tournament (or to "default" if opened outside a tournament).
        const created = await squadApi.createSquad({
          teamName: activeTeamName,
          tournamentId: contextTournamentId,
          players,
        });
        setExistingSquad(created);
      }
      setSavedMessage(
        contextTournamentId
          ? `✅ Squad saved for ${activeTeamName} in this tournament (${players.length} players)`
          : `✅ Squad saved for ${activeTeamName} (${players.length} players)`
      );
      if (!teamNames.includes(activeTeamName)) {
        setTeamNames((prev) => [...prev, activeTeamName]);
      }
    } catch (err) {
      setError(err.message || "Failed to save squad");
      setClashes(err.clashes || []);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSquad = async () => {
    if (!existingSquad?._id || !isExistingSquadForThisTournament) return;
    if (!window.confirm(`Delete the saved squad for ${activeTeamName}?`)) return;

    try {
      await squadApi.deleteSquad(existingSquad._id);
      setExistingSquad(null);
      setPlayers([]);
      setSavedMessage("🗑 Squad deleted");
    } catch (err) {
      setError(err.message || "Failed to delete squad");
    }
  };

  const inputStyle = {
    background: "#111827",
    border: "1px solid #374151",
    color: "#f9fafb",
    padding: "10px 12px",
    borderRadius: "8px",
    fontSize: "14px",
    outline: "none",
    boxSizing: "border-box",
    width: "100%",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0a0a0a",
        color: "#e5e7eb",
        padding: "20px 16px",
        paddingBottom: "40px",
      }}
    >
      <BrandTitle size="small" />

      <div style={{ marginTop: "10px", marginBottom: "18px" }}>
        <h2
          style={{
            fontSize: "20px",
            fontWeight: "700",
            color: "#f9fafb",
            margin: "0 0 4px",
          }}
        >
          👥 Squad Manager
        </h2>
        <div style={{ fontSize: "13px", color: "#6b7280" }}>
          {contextTournamentId
            ? "Save each team's roster for this tournament — matches will auto-fill these players when you start scoring."
            : "Save a team's roster once — tournament matches will auto-fill these players when you start scoring."}
        </div>
      </div>

      {/* ── TEAM SELECTOR ── */}
      <div
        style={{
          background: "#111827",
          border: "1px solid #1f2937",
          borderRadius: "12px",
          padding: "16px",
          marginBottom: "16px",
        }}
      >
        <div style={{ fontSize: "13px", color: "#9ca3af", marginBottom: "10px", fontWeight: "600" }}>
          Select a team
        </div>

        {!usingCustomTeam ? (
          <>
            <select
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value)}
              style={{ ...inputStyle, marginBottom: "8px" }}
            >
              <option value="">— Choose a team —</option>
              {teamNames.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            {hasFixedTeamList ? (
              <div style={{ fontSize: "11px", color: "#6b7280" }}>
                This tournament has a fixed list of {contextTeams.length} team
                {contextTeams.length === 1 ? "" : "s"} — pick one above. Squads
                saved under any other name wouldn't be matched to a fixture.
              </div>
            ) : (
              <button
                onClick={() => {
                  setUsingCustomTeam(true);
                  setSelectedTeam("");
                }}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#60a5fa",
                  fontSize: "13px",
                  cursor: "pointer",
                  padding: 0,
                }}
              >
                + Use a new team name instead
              </button>
            )}
          </>
        ) : (
          <>
            <input
              style={{ ...inputStyle, marginBottom: "8px" }}
              placeholder="New team name"
              value={customTeamName}
              onChange={(e) => setCustomTeamName(e.target.value)}
              autoComplete="off"
            />
            <button
              onClick={() => {
                setUsingCustomTeam(false);
                setCustomTeamName("");
              }}
              style={{
                background: "transparent",
                border: "none",
                color: "#60a5fa",
                fontSize: "13px",
                cursor: "pointer",
                padding: 0,
              }}
            >
              ← Pick from existing teams instead
            </button>
          </>
        )}
      </div>

      {activeTeamName && (
        <>
          {/* ── EXISTING SQUAD STATUS ── */}
          <div
            style={{
              fontSize: "12px",
              color: "#6b7280",
              marginBottom: "12px",
            }}
          >
            {loadingSquad
              ? "Loading saved squad…"
              : isExistingSquadForThisTournament
              ? `Editing existing squad for ${activeTeamName} in this tournament (${existingSquad.players.length} players saved)`
              : existingSquad
              ? `No squad saved for ${activeTeamName} in this tournament yet — showing their default squad as a starting point (${existingSquad.players.length} players). Saving will create a tournament-specific squad.`
              : `No squad saved yet for ${activeTeamName} — add players below`}
          </div>

          {/* ── PLAYER LIST ── */}
          {players.length > 0 && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "8px",
                marginBottom: "16px",
              }}
            >
              {players.map((p) => {
                const badge = roleBadgeColor[p.role] || roleBadgeColor.batsman;
                return (
                  <div
                    key={p.jersey}
                    style={{
                      background: "#111827",
                      border: "1px solid #1f2937",
                      borderRadius: "10px",
                      padding: "10px 14px",
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                    }}
                  >
                    <span
                      style={{
                        background: "#0d1117",
                        border: "1px solid #374151",
                        color: "#9ca3af",
                        borderRadius: "6px",
                        padding: "3px 8px",
                        fontSize: "12px",
                        fontWeight: "700",
                        flexShrink: 0,
                      }}
                    >
                      #{p.jersey}
                    </span>
                    <span
                      style={{
                        flex: 1,
                        color: "#f9fafb",
                        fontSize: "14px",
                        fontWeight: "600",
                        minWidth: 0,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {p.name}
                    </span>
                    <span
                      style={{
                        background: badge.bg,
                        color: badge.fg,
                        borderRadius: "20px",
                        padding: "3px 10px",
                        fontSize: "11px",
                        fontWeight: "600",
                        flexShrink: 0,
                      }}
                    >
                      {ROLES.find((r) => r.value === p.role)?.label || p.role}
                    </span>
                    <button
                      onClick={() => handleRemovePlayer(p.jersey)}
                      style={{
                        background: "transparent",
                        border: "none",
                        color: "#ef4444",
                        cursor: "pointer",
                        fontSize: "16px",
                        flexShrink: 0,
                        padding: "0 2px",
                      }}
                    >
                      ✕
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── ADD PLAYER ROW ── */}
          <div
            ref={addPlayerRef}
            style={{
              background: "#111827",
              border: "1px solid #1f2937",
              borderRadius: "12px",
              padding: "16px",
              marginBottom: "16px",
            }}
          >
            <div style={{ fontSize: "13px", color: "#9ca3af", marginBottom: "10px", fontWeight: "600" }}>
              Add player
            </div>
            <div style={{ display: "flex", gap: "8px", marginBottom: "6px" }}>
              <input
                style={{ ...inputStyle, width: "70px", flexShrink: 0 }}
                placeholder="#"
                type="number"
                value={newJersey}
                onChange={(e) => handleNewJerseyChange(e.target.value)}
                onKeyPress={handleKeyPress}
              />
              <div style={{ flex: 1, position: "relative" }}>
                <input
                  style={{
                    ...inputStyle,
                    borderColor: newJerseyMatch ? "#16a34a" : "#374151",
                  }}
                  placeholder="Player name (type for suggestions)"
                  value={newName}
                  onChange={(e) => handleNewNameChange(e.target.value)}
                  onFocus={() =>
                    newNameSuggestions.length > 0 && setShowNewNameSuggestions(true)
                  }
                  onKeyPress={handleKeyPress}
                  autoComplete="off"
                />
                {showNewNameSuggestions && (
                  <div
                    style={{
                      position: "absolute",
                      top: "100%",
                      left: 0,
                      right: 0,
                      background: "#1a1a1a",
                      border: "1px solid #22c55e",
                      borderRadius: "8px",
                      zIndex: 100,
                      overflow: "hidden",
                      marginTop: "2px",
                    }}
                  >
                    {newNameSuggestions.map((p) => (
                      <div
                        key={p.jersey}
                        onMouseDown={() => handleSelectNewSuggestion(p)}
                        style={{
                          padding: "9px 12px",
                          cursor: "pointer",
                          borderBottom: "1px solid #2a2a2a",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "#0f2a0f")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      >
                        <span style={{ color: "#e5e7eb", fontSize: "14px" }}>{p.name}</span>
                        <span style={{ color: "#6b7280", fontSize: "12px" }}>#{p.jersey}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            {newJerseyMatch && (
              <div style={{ fontSize: "11px", color: "#4ade80", marginBottom: "10px" }}>
                ✅ Found: <strong>{newJerseyMatch.name}</strong> — {newJerseyMatch.runs || 0}R,{" "}
                {newJerseyMatch.wickets || 0}W
              </div>
            )}
            {!newJerseyMatch && (newJersey.trim() || newName.trim()) && (
              <div style={{ fontSize: "11px", color: "#60a5fa", marginBottom: "10px" }}>
                + Will be added as a new player
              </div>
            )}
            <div style={{ display: "flex", gap: "8px" }}>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                style={{ ...inputStyle, flex: 1 }}
              >
                {ROLES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
              <button
                onClick={handleAddPlayer}
                style={{
                  background: "#1e3a5f",
                  color: "#60a5fa",
                  padding: "10px 18px",
                  borderRadius: "8px",
                  border: "1px solid #2563eb",
                  fontWeight: "700",
                  fontSize: "14px",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                + Add
              </button>
            </div>
          </div>

          {/* ── ERROR / LOYALTY CLASH DISPLAY ── */}
          <LoyaltyErrorDisplay error={error} clashes={clashes} />

          {savedMessage && (
            <p style={{ color: "#4ade80", fontSize: "13px", marginBottom: "12px" }}>
              {savedMessage}
            </p>
          )}

          {/* ── SAVE / DELETE ── */}
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={handleSave}
              disabled={saving || players.length === 0}
              style={{
                flex: 1,
                background: saving || players.length === 0 ? "#374151" : "#16a34a",
                color: "#fff",
                padding: "12px",
                borderRadius: "8px",
                border: "none",
                fontWeight: "700",
                fontSize: "14px",
                cursor: saving || players.length === 0 ? "not-allowed" : "pointer",
              }}
            >
              {saving
                ? "Saving..."
                : isExistingSquadForThisTournament
                ? "💾 Update Squad"
                : "💾 Save Squad"}
            </button>
            {isExistingSquadForThisTournament && (
              <button
                onClick={handleDeleteSquad}
                style={{
                  background: "transparent",
                  border: "1px solid #7f1d1d",
                  color: "#f87171",
                  padding: "12px 18px",
                  borderRadius: "8px",
                  fontWeight: "600",
                  fontSize: "14px",
                  cursor: "pointer",
                }}
              >
                🗑 Delete
              </button>
            )}
          </div>
        </>
      )}

      <button
        onClick={() => navigate("/home")}
        style={{
          marginTop: "28px",
          background: "transparent",
          border: "1px solid #374151",
          color: "#6b7280",
          padding: "10px",
          borderRadius: "8px",
          cursor: "pointer",
          fontSize: "14px",
          width: "100%",
        }}
      >
        ← Back to Home
      </button>
    </div>
  );
}
