import { useState } from "react";
import styles from "./FielderInputModal.module.css";

function FielderInputModal({ wicketType, onConfirm, onCancel, playerDB }) {
  const [fielderName, setFielderName] = useState("");
  const [fielderJersey, setFielderJersey] = useState("");
  const [newBatsmanName, setNewBatsmanName] = useState("");
  const [newBatsmanJersey, setNewBatsmanJersey] = useState("");
  const [error, setError] = useState("");
  
  const [fielderExisting, setFielderExisting] = useState(null);
  const [batsmanExisting, setBatsmanExisting] = useState(null);
  
  // ✅ NEW: Name autocomplete
  const [fielderSuggestions, setFielderSuggestions] = useState([]);
  const [showFielderSuggestions, setShowFielderSuggestions] = useState(false);
  const [batsmanSuggestions, setBatsmanSuggestions] = useState([]);
  const [showBatsmanSuggestions, setShowBatsmanSuggestions] = useState(false);

  const requiresFielder = ["caught", "stumped", "runout"].includes(wicketType);

  // ✅ Fielder jersey lookup
  const handleFielderJerseyChange = (val) => {
    setFielderJersey(val);
    setError("");
    setFielderExisting(null);
    setShowFielderSuggestions(false);

    if (val.trim() && playerDB) {
      const found = playerDB.getPlayer(val.trim());
      if (found) {
        setFielderExisting(found);
        setFielderName(found.name);
      }
    }
  };

  // ✅ Fielder name autocomplete
  const handleFielderNameChange = (val) => {
    setFielderName(val);
    setError("");
    setFielderExisting(null);

    if (val.trim() && playerDB) {
      const suggestions = playerDB.searchPlayersByName(val);
      setFielderSuggestions(suggestions);
      setShowFielderSuggestions(suggestions.length > 0);
    } else {
      setFielderSuggestions([]);
      setShowFielderSuggestions(false);
    }
  };

  const handleSelectFielderSuggestion = (player) => {
    setFielderName(player.name);
    setFielderJersey(player.jersey);
    setFielderExisting(player);
    setShowFielderSuggestions(false);
  };

  // ✅ Batsman jersey lookup
  const handleBatsmanJerseyChange = (val) => {
    setNewBatsmanJersey(val);
    setError("");
    setBatsmanExisting(null);
    setShowBatsmanSuggestions(false);

    if (val.trim() && playerDB) {
      const found = playerDB.getPlayer(val.trim());
      if (found) {
        setBatsmanExisting(found);
        setNewBatsmanName(found.name);
      }
    }
  };

  // ✅ Batsman name autocomplete
  const handleBatsmanNameChange = (val) => {
    setNewBatsmanName(val);
    setError("");
    setBatsmanExisting(null);

    if (val.trim() && playerDB) {
      const suggestions = playerDB.searchPlayersByName(val);
      setBatsmanSuggestions(suggestions);
      setShowBatsmanSuggestions(suggestions.length > 0);
    } else {
      setBatsmanSuggestions([]);
      setShowBatsmanSuggestions(false);
    }
  };

  const handleSelectBatsmanSuggestion = (player) => {
    setNewBatsmanName(player.name);
    setNewBatsmanJersey(player.jersey);
    setBatsmanExisting(player);
    setShowBatsmanSuggestions(false);
  };

  const handleConfirm = () => {
    if (requiresFielder && !fielderName.trim()) {
      setError("⚠️ Please enter fielder name");
      return;
    }
    if (requiresFielder && !fielderJersey.trim()) {
      setError("⚠️ Please enter fielder jersey");
      return;
    }
    if (!newBatsmanName.trim()) {
      setError("⚠️ Please enter new batsman name");
      return;
    }
    if (!newBatsmanJersey.trim()) {
      setError("⚠️ Please enter new batsman jersey");
      return;
    }

    onConfirm({
      fielder: fielderName.trim(),
      fielderJersey: fielderJersey.trim(),
      newBatsman: newBatsmanName.trim(),
      newBatsmanJersey: newBatsmanJersey.trim(),
    });
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") handleConfirm();
  };

  // ✅ Helper to show fielding stats
  const renderFieldingStats = (player) => {
    if (!player) return null;
    return (
      <div className={styles.fieldingStats}>
        <span>📊 {player.matches || 0} matches</span>
        <span>🤲 {player.catches || 0} catches</span>
        <span>🏃 {player.runouts || 0} run-outs</span>
        <span>🧤 {player.stumpings || 0} stumpings</span>
      </div>
    );
  };

  return (
    <div className={styles.overlay} onClick={() => {
      setShowFielderSuggestions(false);
      setShowBatsmanSuggestions(false);
    }}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.title}>
          {wicketType === "caught" && "🤲 Caught"}
          {wicketType === "stumped" && "🧤 Stumped"}
          {wicketType === "runout" && "🏃 Run Out"}
        </h2>

        {/* ✅ FIELDER DETAILS (for caught/stumped/runout) */}
        {requiresFielder && (
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>
              {wicketType === "stumped" ? "Wicket Keeper" : "Fielder"}
            </h3>

            <div className={styles.inputContainer}>
              <input
                className={styles.input}
                placeholder="Jersey number"
                value={fielderJersey}
                onChange={(e) => handleFielderJerseyChange(e.target.value)}
                type="number"
                autoFocus
              />
            </div>

            {fielderExisting && (
              <div className={styles.existingPlayerBanner}>
                ✅ <strong>{fielderExisting.name}</strong>
                {renderFieldingStats(fielderExisting)}
              </div>
            )}

            <div className={styles.inputContainer} style={{ position: "relative" }}>
              <input
                className={styles.input}
                placeholder="Fielder name"
                value={fielderName}
                onChange={(e) => handleFielderNameChange(e.target.value)}
                onKeyPress={handleKeyPress}
                onFocus={() => {
                  if (fielderSuggestions.length > 0) setShowFielderSuggestions(true);
                }}
              />

              {showFielderSuggestions && fielderSuggestions.length > 0 && (
                <div className={styles.suggestionsDropdown}>
                  {fielderSuggestions.map((player) => (
                    <div
                      key={player.jersey}
                      className={styles.suggestionItem}
                      onClick={() => handleSelectFielderSuggestion(player)}
                    >
                      <div className={styles.suggestionMain}>
                        <span className={styles.suggestionJersey}>#{player.jersey}</span>
                        <span className={styles.suggestionName}>{player.name}</span>
                      </div>
                      <div className={styles.suggestionStats}>
                        {player.matches || 0}M • {player.catches || 0}C • {player.runouts || 0}RO • {player.stumpings || 0}ST
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ✅ NEW BATSMAN */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>New Batsman</h3>

          <div className={styles.inputContainer}>
            <input
              className={styles.input}
              placeholder="Jersey number"
              value={newBatsmanJersey}
              onChange={(e) => handleBatsmanJerseyChange(e.target.value)}
              type="number"
              autoFocus={!requiresFielder}
            />
          </div>

          {batsmanExisting && (
            <div className={styles.existingPlayerBanner}>
              ✅ <strong>{batsmanExisting.name}</strong> — {batsmanExisting.runs}R ({batsmanExisting.balls}B), {batsmanExisting.wickets}W
            </div>
          )}

          <div className={styles.inputContainer} style={{ position: "relative" }}>
            <input
              className={`${styles.input} ${error ? styles.errorInput : ""}`}
              placeholder="Batsman name"
              value={newBatsmanName}
              onChange={(e) => handleBatsmanNameChange(e.target.value)}
              onKeyPress={handleKeyPress}
              onFocus={() => {
                if (batsmanSuggestions.length > 0) setShowBatsmanSuggestions(true);
              }}
            />

            {showBatsmanSuggestions && batsmanSuggestions.length > 0 && (
              <div className={styles.suggestionsDropdown}>
                {batsmanSuggestions.map((player) => (
                  <div
                    key={player.jersey}
                    className={styles.suggestionItem}
                    onClick={() => handleSelectBatsmanSuggestion(player)}
                  >
                    <div className={styles.suggestionMain}>
                      <span className={styles.suggestionJersey}>#{player.jersey}</span>
                      <span className={styles.suggestionName}>{player.name}</span>
                    </div>
                    <div className={styles.suggestionStats}>
                      🏏 {player.runs}R ({player.balls}B) • 🎳 {player.wickets}W • {player.matches}M
                    </div>
                  </div>
                ))}
              </div>
            )}

            {error && <p className={styles.errorText}>{error}</p>}
          </div>
        </div>

        <div className={styles.buttonRow}>
          <button className={styles.cancelBtn} onClick={onCancel}>
            Cancel
          </button>
          <button className={styles.confirmBtn} onClick={handleConfirm}>
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

export default FielderInputModal;
