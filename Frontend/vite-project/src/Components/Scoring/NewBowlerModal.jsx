import { useState } from "react";
import styles from "./NewBowlerModal.module.css";

function NewBowlerModal({
  onConfirm,
  existingBowlers = [],
  playerDB,
  matchTeamLock = {},
  currentTeam,
}) {
  const [name, setName] = useState("");
  const [jersey, setJersey] = useState("");
  const [error, setError] = useState("");
  const [existingPlayer, setExistingPlayer] = useState(null);
  const [teamLockError, setTeamLockError] = useState("");
  const [nameSuggestions, setNameSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const getTeamLockError = (jerseyVal) => {
    if (!jerseyVal?.trim() || !matchTeamLock) return null;
    const locked = matchTeamLock[String(jerseyVal.trim())];
    if (locked && locked !== currentTeam) {
      return `Jersey #${jerseyVal.trim()} belongs to ${locked}`;
    }
    return null;
  };

  /* ── JERSEY LOOKUP ── */
  const handleJerseyChange = (val) => {
    setJersey(val);
    setError("");
    setExistingPlayer(null);
    setTeamLockError("");
    setShowSuggestions(false);

    const lockErr = getTeamLockError(val);
    if (lockErr) { setTeamLockError(lockErr); return; }

    if (val.trim() && playerDB) {
      const found = playerDB.getPlayer(val.trim());
      if (found) { setExistingPlayer(found); setName(found.name); }
    }
  };

  /* ── NAME AUTOCOMPLETE ── */
  const handleNameChange = (val) => {
    setName(val);
    setError("");
    setExistingPlayer(null);
    if (val.trim() && playerDB) {
      const suggestions = playerDB.searchPlayersByName(val);
      setNameSuggestions(suggestions);
      setShowSuggestions(suggestions.length > 0);
    } else {
      setNameSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSelectSuggestion = (player) => {
    setName(player.name);
    setJersey(player.jersey);
    setExistingPlayer(player);
    setShowSuggestions(false);
    setNameSuggestions([]);
  };

  const existingBowlerInInnings = existingBowlers.find(
    (b) => b.displayName.toLowerCase() === name.trim().toLowerCase()
  );

  /* ── CONFIRM ── */
  const handleConfirm = () => {
    if (!name.trim()) { setError("⚠️ Please enter bowler name"); return; }
    if (!jersey.trim()) { setError("⚠️ Please enter jersey number"); return; }
    if (teamLockError) return;
    setError("");
    onConfirm({ name: name.trim(), jersey: jersey.trim(), existingPlayer });
    setName(""); setJersey(""); setExistingPlayer(null); setTeamLockError("");
    setNameSuggestions([]); setShowSuggestions(false);
  };

  const handleKeyPress = (e) => { if (e.key === "Enter") handleConfirm(); };

  return (
    <div className={styles.overlay} onClick={() => setShowSuggestions(false)}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.title}>🎯 New Bowler</h2>

        {/* Jersey field */}
        <div className={styles.inputContainer}>
          <input
            className={styles.input}
            placeholder="Jersey number (e.g. 7)"
            value={jersey}
            onChange={(e) => handleJerseyChange(e.target.value)}
            onKeyPress={handleKeyPress}
            type="number"
            autoFocus
          />
        </div>

        {teamLockError && (
          <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid #ef4444", borderRadius: "8px", padding: "8px 12px", marginBottom: "8px", fontSize: "13px", color: "#ef4444" }}>
            🚫 {teamLockError}
          </div>
        )}

        {existingPlayer && !teamLockError && (
          <div style={{ background: "rgba(34,197,94,0.1)", border: "1px solid #22c55e", borderRadius: "8px", padding: "10px 14px", marginBottom: "12px", fontSize: "13px", color: "#22c55e" }}>
            ✅ Found: <strong>{existingPlayer.name}</strong> — 🎳 {existingPlayer.wickets}W • Eco:{" "}
            {existingPlayer.ballsBowled > 0
              ? (existingPlayer.runsGiven / (existingPlayer.ballsBowled / 6)).toFixed(2)
              : "0.00"} • 📊 {existingPlayer.matches || 0} matches
          </div>
        )}

        {existingBowlerInInnings && !existingPlayer && !teamLockError && (
          <div
            style={{ background: "rgba(59,130,246,0.1)", border: "1px solid #3b82f6", borderRadius: "8px", padding: "10px 14px", marginBottom: "12px", fontSize: "13px", color: "#3b82f6", cursor: "pointer" }}
            onClick={() => onConfirm({ name: existingBowlerInInnings.displayName, jersey: jersey.trim(), existingPlayer: null })}
          >
            🔄 Returning: <strong>{existingBowlerInInnings.displayName}</strong>{" "}
            — {existingBowlerInInnings.overs}.{existingBowlerInInnings.balls} ov | {existingBowlerInInnings.runs}R | {existingBowlerInInnings.wickets}W
          </div>
        )}

        {/* Name field with autocomplete */}
        <div className={styles.inputContainer} style={{ position: "relative" }}>
          <input
            className={`${styles.input} ${error ? styles.errorInput : ""}`}
            placeholder="Bowler name (type for suggestions)"
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            onKeyPress={handleKeyPress}
            onFocus={() => nameSuggestions.length > 0 && setShowSuggestions(true)}
          />

          {showSuggestions && nameSuggestions.length > 0 && (
            <div className={styles.suggestionsDropdown}>
              {nameSuggestions.map((player) => (
                <div
                  key={player.jersey}
                  className={styles.suggestionItem}
                  onMouseDown={(e) => { e.preventDefault(); handleSelectSuggestion(player); }}
                >
                  <div className={styles.suggestionMain}>
                    <span className={styles.suggestionJersey}>#{player.jersey}</span>
                    <span className={styles.suggestionName}>{player.name}</span>
                  </div>
                  <div className={styles.suggestionStats}>
                    🎳 {player.wickets}W • Eco: {player.ballsBowled > 0 ? (player.runsGiven / (player.ballsBowled / 6)).toFixed(2) : "0.00"} • 📊 {player.matches || 0} matches
                  </div>
                </div>
              ))}
            </div>
          )}

          {error && <p className={styles.errorText}>{error}</p>}
        </div>

        <div className={styles.buttonRow}>
          <button
            className={styles.confirmBtn}
            onClick={handleConfirm}
            disabled={!name.trim() || !jersey.trim() || !!teamLockError}
          >
            {existingPlayer ? "Use Existing Bowler" : "Add New Bowler"}
          </button>
        </div>

        <p className={styles.hint}>Jersey number is permanent ID</p>
      </div>
    </div>
  );
}

export default NewBowlerModal;
