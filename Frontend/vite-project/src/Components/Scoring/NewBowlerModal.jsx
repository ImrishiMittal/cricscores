import { useState } from "react";
import styles from "./NewBatsmanModal.module.css"; // reusing styles

function NewBowlerModal({
  onConfirm,
  playerDB,
  activeBowlers = [],
  batterJerseys = new Set(),
}) {
  const [name, setName] = useState("");
  const [jersey, setJersey] = useState("");
  const [error, setError] = useState("");
  const [existingPlayer, setExistingPlayer] = useState(null);
  const [teamLockError, setTeamLockError] = useState("");
  const [nameSuggestions, setNameSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // ✅ Check if jersey belongs to a batter this innings
  const getBatterLockError = (jerseyVal) => {
    if (!jerseyVal?.trim()) return null;
    if (batterJerseys.has(String(jerseyVal.trim()))) {
      return `Jersey #${jerseyVal.trim()} is a batter this innings — cannot bowl`;
    }
    return null;
  };

  const handleJerseyChange = (val) => {
    setJersey(val);
    setError("");
    setExistingPlayer(null);
    setTeamLockError("");
    setShowSuggestions(false);

    const lockErr = getBatterLockError(val);
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
    const lockErr = getBatterLockError(player.jersey);
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
  activeBowlers.some(
    (b) => String(b?.jersey ?? b?.playerId ?? "") === String(jersey.trim())
  );

  const handleConfirm = () => {
    if (!name.trim()) {
      setError("⚠️ Please enter bowler name");
      return;
    }
    if (!jersey.trim()) {
      setError("⚠️ Please enter jersey number");
      return;
    }
    if (isDuplicateJersey) {
      setError("⚠️ This bowler is already bowling");
      return;
    }
    if (teamLockError) {
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
        <h2 className={styles.title}>🎳 New Bowler</h2>

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

        {/* Batter lock error */}
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
            ⚠️ Jersey #{jersey} is already bowling
          </div>
        )}

        {/* Existing player info */}
        {existingPlayer && !isDuplicateJersey && !teamLockError && (
          <div className={styles.existingPlayerBanner}>
            ✅ Found: <strong>{existingPlayer.name}</strong> — {existingPlayer.runs}R ({existingPlayer.balls}B), {existingPlayer.wickets}W
          </div>
        )}

        {/* Name field with autocomplete */}
        <div className={styles.inputContainer} style={{ position: "relative" }}>
          <input
            className={`${styles.input} ${error ? styles.errorInput : ""}`}
            placeholder="Bowler name (start typing...)"
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
                    {/* Show batter tag in suggestions */}
                    {batterJerseys.has(String(player.jersey)) && (
                      <span style={{ fontSize: "10px", color: "#ef4444", marginLeft: "4px" }}>🏏 batter</span>
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
              !!teamLockError
            }
          >
            {existingPlayer ? "Use Existing Bowler" : "Add New Bowler"}
          </button>
        </div>

        <p className={styles.hint}>Type name for suggestions • Jersey is permanent ID</p>
      </div>
    </div>
  );
}

export default NewBowlerModal;
