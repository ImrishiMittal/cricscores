import { useState } from "react";
import styles from "./FielderInputModal.module.css";

function FielderInputModal({
  wicketType,
  onConfirm,
  onCancel,
  playerDB,
  batterJerseys = new Set(),   // Batters this innings — cannot field at all
  currentBowlerJersey,          // Current bowler — cannot STUMP (but CAN catch/runout)
}) {
  const [fielderName, setFielderName] = useState("");
  const [fielderJersey, setFielderJersey] = useState("");
  const [fielderExisting, setFielderExisting] = useState(null);
  const [fielderSuggestions, setFielderSuggestions] = useState([]);
  const [showFielderSuggestions, setShowFielderSuggestions] = useState(false);

  const requiresFielder = ["caught", "stumped", "runout"].includes(wicketType);

  // ✅ RULES:
  // Rule 1: Batters this innings CANNOT field (they're on the batting side)
  // Rule 2: Current bowler CANNOT be wicketkeeper for a STUMPING only
  //         (they can catch, they can be involved in runouts)
  // Bowlers from earlier in the innings CAN field freely.
  const getFielderError = (jerseyVal) => {
    if (!jerseyVal?.trim()) return null;
    const j = String(jerseyVal.trim());

    // ✅ Rule 1: Batter cannot field
    if (batterJerseys.has(j)) {
      return `Jersey #${j} is batting this innings — cannot field`;
    }

    // ✅ Rule 2: Bowler can't be keeper for stumping only
    if (wicketType === "stumped" && j === String(currentBowlerJersey)) {
      return `The bowler cannot also be the wicket-keeper (invalid stumping)`;
    }

    return null;
  };

  const handleFielderJerseyChange = (val) => {
    setFielderJersey(val);
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

  const handleFielderNameChange = (val) => {
    setFielderName(val);
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

  const fielderError = fielderJersey.trim() ? getFielderError(fielderJersey) : null;

  const handleConfirm = () => {
    if (requiresFielder && !fielderName.trim()) {
      alert("Please enter fielder name");
      return;
    }
    if (requiresFielder && !fielderJersey.trim()) {
      alert("Please enter fielder jersey");
      return;
    }
    if (fielderError) {
      alert(fielderError);
      return;
    }
    onConfirm({
      fielder: fielderName.trim(),
      fielderJersey: fielderJersey.trim() || null,
    });
  };

  const handleKeyPress = (e) => { if (e.key === "Enter") handleConfirm(); };

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

  const fielderLabel =
    wicketType === "runout" ? "Fielder"
    : wicketType === "caught" ? "Catcher"
    : "Wicket Keeper";

  return (
    <div className={styles.overlay} onClick={() => setShowFielderSuggestions(false)}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.title}>
          {wicketType === "caught" && "🤲 Caught"}
          {wicketType === "stumped" && "🧤 Stumped"}
          {wicketType === "runout" && "🏃 Run Out"}
        </h2>

        {requiresFielder && (
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>{fielderLabel}</h3>

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

            {fielderError && (
              <div style={{
                background: "rgba(239,68,68,0.1)", border: "1px solid #ef4444",
                borderRadius: "8px", padding: "8px 12px", marginBottom: "8px",
                fontSize: "13px", color: "#ef4444",
              }}>
                🚫 {fielderError}
              </div>
            )}

            {fielderExisting && !fielderError && (
              <div style={{
                background: "rgba(34,197,94,0.1)", border: "1px solid #22c55e",
                borderRadius: "8px", padding: "8px 12px", marginBottom: "8px",
                fontSize: "13px", color: "#22c55e",
              }}>
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
                onFocus={() => fielderSuggestions.length > 0 && setShowFielderSuggestions(true)}
              />

              {showFielderSuggestions && fielderSuggestions.length > 0 && (
                <div className={styles.suggestionsDropdown}>
                  {fielderSuggestions.map((player) => {
                    const isBatter = batterJerseys.has(String(player.jersey));
                    const isCurrentBowlerStumping =
                      wicketType === "stumped" &&
                      String(player.jersey) === String(currentBowlerJersey);
                    const isInvalid = isBatter || isCurrentBowlerStumping;

                    return (
                      <div
                        key={player.jersey}
                        className={styles.suggestionItem}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          if (!isInvalid) handleSelectFielderSuggestion(player);
                        }}
                        style={{ opacity: isInvalid ? 0.4 : 1, cursor: isInvalid ? "not-allowed" : "pointer" }}
                      >
                        <div className={styles.suggestionMain}>
                          <span className={styles.suggestionJersey}>#{player.jersey}</span>
                          <span className={styles.suggestionName}>{player.name}</span>
                          {isBatter && (
                            <span style={{ fontSize: "10px", color: "#ef4444", marginLeft: "4px" }}>🏏 batter</span>
                          )}
                          {isCurrentBowlerStumping && (
                            <span style={{ fontSize: "10px", color: "#f59e0b", marginLeft: "4px" }}>🎳 bowler</span>
                          )}
                        </div>
                        <div className={styles.suggestionStats}>
                          {player.matches || 0}M • {player.catches || 0}C • {player.runouts || 0}RO • {player.stumpings || 0}ST
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        <div className={styles.buttonRow}>
          <button className={styles.cancelBtn} onClick={onCancel}>Cancel</button>
          <button
            className={styles.confirmBtn}
            onClick={handleConfirm}
            disabled={requiresFielder && (!fielderName.trim() || !fielderJersey.trim() || !!fielderError)}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

export default FielderInputModal;
