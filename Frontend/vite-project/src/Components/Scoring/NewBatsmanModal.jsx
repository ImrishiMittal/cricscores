import { useState } from "react";
import styles from "./NewBatsmanModal.module.css";

function NewBatsmanModal({
  onConfirm,
  retiredPlayers = [],
  onReturnRetired,
  playerDB,
  activePlayers = [],
  bowlerJerseys = new Set(),
  dismissedPlayers = new Set(),
  currentBowlerJersey = null,   // ← ADD THIS
}) {
  const [name, setName] = useState("");
  const [jersey, setJersey] = useState("");
  const [error, setError] = useState("");
  const [existingPlayer, setExistingPlayer] = useState(null);
  const [teamLockError, setTeamLockError] = useState("");
  const [nameSuggestions, setNameSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // ✅ Check if jersey belongs to a bowler this innings
  const getBowlerLockError = (jerseyVal) => {
    if (!jerseyVal?.trim()) return null;
    if (bowlerJerseys.has(String(jerseyVal.trim()))) {
      return `Jersey #${jerseyVal.trim()} is a bowler this innings — cannot bat`;
    }
    if (currentBowlerJersey && String(jerseyVal.trim()) === String(currentBowlerJersey)) {
      return `Jersey #${jerseyVal.trim()} is currently bowling — cannot bat`;
    }
    return null;
  };

  const handleJerseyChange = (val) => {
    setJersey(val);
    setError("");
    setExistingPlayer(null);
    setTeamLockError("");
    setShowSuggestions(false);

    const lockErr = getBowlerLockError(val);
    if (lockErr) {
      setTeamLockError(lockErr);
      return;
    }

    if (val.trim() && playerDB) {
      const found = playerDB.getPlayer(val.trim());
      if (found) {
        setExistingPlayer(found);
        setName(found.name);
      }
    }
  };

  // ✅ Name autocomplete
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
    // ✅ Check bowler lock before auto-filling
    const lockErr = getBowlerLockError(player.jersey);
    if (lockErr) {
      setTeamLockError(lockErr);
      setName("");
      setJersey("");
      setShowSuggestions(false);
      return;
    }

    setName(player.name);
    setJersey(player.jersey);
    setExistingPlayer(player);
    setShowSuggestions(false);
    setNameSuggestions([]);
  };

  const isDuplicateJersey =
  jersey.trim() &&
  activePlayers.some(
    (p) => String(p?.jersey ?? p?.playerId ?? "") === String(jersey.trim())
  );

  const isDismissed =
    jersey.trim() &&
    dismissedPlayers.has(String(jersey.trim()));

  const handleConfirm = () => {
    if (!name.trim()) {
      setError("⚠️ Please enter player name");
      return;
    }
    if (!jersey.trim()) {
      setError("⚠️ Please enter jersey number");
      return;
    }
    if (isDuplicateJersey) {
      setError("⚠️ This jersey number is already on field");
      return;
    }
    if (teamLockError) {
      return;
    }
    if (isDismissed) {
      setError("⚠️ This player is already out — cannot bat again");
      return;
    }

    onConfirm({ name: name.trim(), jersey: jersey.trim(), existingPlayer });
    setName("");
    setJersey("");
    setExistingPlayer(null);
    setTeamLockError("");
    setNameSuggestions([]);
    setShowSuggestions(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") handleConfirm();
  };

  return (
    <div className={styles.overlay} onClick={() => setShowSuggestions(false)}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.title}>🏏 New Batsman</h2>

        {/* Retired players quick-return */}
        {retiredPlayers.length > 0 && (
          <div style={{ marginBottom: "16px" }}>
            <p style={{ color: "#f1c40f", fontSize: "13px", textAlign: "center", marginBottom: "8px", fontWeight: "600" }}>
              🏥 Retired Hurt — tap to return:
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {retiredPlayers.map((player) => (
                <button
                  key={player.playerId}
                  onClick={() => onReturnRetired(player.displayName)}
                  style={{
                    background: "linear-gradient(135deg, #78350f, #92400e)",
                    border: "1px solid #f59e0b",
                    borderRadius: "8px",
                    padding: "10px 14px",
                    color: "#fef3c7",
                    cursor: "pointer",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    fontSize: "14px",
                    fontWeight: "600",
                  }}
                >
                  <span>{player.displayName}</span>
                  <span style={{ fontSize: "12px", color: "#fcd34d" }}>
                    resumes at {player.runs}({player.balls})
                  </span>
                </button>
              ))}
            </div>
            <p style={{ fontSize: "11px", color: "#6b7280", textAlign: "center", margin: "8px 0 4px" }}>
              — or enter a new batsman below —
            </p>
          </div>
        )}

        {/* Jersey field */}
        <div className={styles.inputContainer}>
          <input
            className={styles.input}
            placeholder="Jersey number (e.g. 18)"
            value={jersey}
            onChange={(e) => handleJerseyChange(e.target.value)}
            onKeyPress={handleKeyPress}
            type="number"
            autoFocus
          />
        </div>

        {/* Team lock error */}
        {teamLockError && (
          <div style={{
            background: "rgba(239,68,68,0.1)",
            border: "1px solid #ef4444",
            borderRadius: "8px",
            padding: "8px 12px",
            marginBottom: "8px",
            fontSize: "13px",
            color: "#ef4444",
          }}>
            🚫 {teamLockError}
          </div>
        )}

        {/* Duplicate jersey warning */}
        {isDuplicateJersey && !teamLockError && (
          <div style={{
            background: "rgba(239,68,68,0.1)",
            border: "1px solid #ef4444",
            borderRadius: "8px",
            padding: "8px 12px",
            marginBottom: "8px",
            fontSize: "13px",
            color: "#ef4444",
          }}>
            ⚠️ Jersey #{jersey} is already on field
          </div>
        )}

        {/* Already out warning */}
        {isDismissed && !isDuplicateJersey && !teamLockError && (
          <div style={{
            background: "rgba(239,68,68,0.1)",
            border: "1px solid #ef4444",
            borderRadius: "8px",
            padding: "8px 12px",
            marginBottom: "8px",
            fontSize: "13px",
            color: "#ef4444",
          }}>
            🚫 Jersey #{jersey} is already out — cannot bat again
          </div>
        )}

        {/* Existing player info */}
        {existingPlayer && !isDuplicateJersey && !teamLockError && !isDismissed && (
          <div className={styles.existingPlayerBanner}>
            ✅ Found: <strong>{existingPlayer.name}</strong> — {existingPlayer.runs}R ({existingPlayer.balls}B), {existingPlayer.wickets}W
          </div>
        )}

        {/* Name field with autocomplete */}
        <div className={styles.inputContainer} style={{ position: "relative" }}>
          <input
            className={`${styles.input} ${error ? styles.errorInput : ""}`}
            placeholder="Player name (start typing...)"
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            onKeyPress={handleKeyPress}
            onFocus={() => {
              if (nameSuggestions.length > 0) setShowSuggestions(true);
            }}
          />
          
          {/* Autocomplete suggestions dropdown */}
          {showSuggestions && nameSuggestions.length > 0 && (
            <div className={styles.suggestionsDropdown}>
              {nameSuggestions.map((player) => (
                <div
                  key={player.jersey}
                  className={styles.suggestionItem}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleSelectSuggestion(player);
                  }}
                >
                  <div className={styles.suggestionMain}>
                    <span className={styles.suggestionJersey}>#{player.jersey}</span>
                    <span className={styles.suggestionName}>{player.name}</span>
                    {/* ✅ Show bowler tag in suggestions */}
                    {bowlerJerseys.has(String(player.jersey)) && (
                      <span style={{ fontSize: "10px", color: "#ef4444", marginLeft: "4px" }}>🎳 bowler</span>
                    )}
                  </div>
                  <div className={styles.suggestionStats}>
                    🏏 {player.runs}R ({player.balls}B) • 🎳 {player.wickets}W • {player.matches || 0} matches
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
            disabled={
              !name.trim() ||
              !jersey.trim() ||
              !!isDuplicateJersey ||
              !!teamLockError ||
              !!isDismissed
            }
          >
            {existingPlayer ? "Use Existing Player" : "Add New Player"}
          </button>
        </div>

        <p className={styles.hint}>Type name for suggestions • Jersey is permanent ID</p>
      </div>
    </div>
  );
}

export default NewBatsmanModal;
