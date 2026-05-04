import { useState } from "react";
import styles from "./NewBatsmanModal.module.css";

function RetiredHurtModal({ strikerName, onConfirm, onClose, playerDB }) {
  const [newName, setNewName] = useState("");
  const [jersey, setJersey] = useState("");
  const [error, setError] = useState("");
  const [existingPlayer, setExistingPlayer] = useState(null);
  const [suggestions, setSuggestions] = useState([]);

  const handleJerseyChange = (val) => {
    setJersey(val);
    setError("");
    setExistingPlayer(null);
    if (val.trim() && playerDB) {
      const found = playerDB.getPlayer(val.trim());
      if (found) {
        setExistingPlayer(found);
        setNewName(found.name);
        setSuggestions([]);
      }
    }
  };

  const handleNameChange = (val) => {
    setNewName(val);
    setError("");
    setExistingPlayer(null);
    if (val.trim().length >= 1 && playerDB) {
      const results = playerDB.searchPlayersByName(val.trim());
      setSuggestions(results);
    } else {
      setSuggestions([]);
    }
  };

  const handleSuggestionSelect = (player) => {
    setExistingPlayer(player);
    setNewName(player.name);
    setJersey(String(player.jersey || ""));
    setSuggestions([]);
  };

  const handleConfirm = () => {
    const trimmed = newName.trim();
    if (!trimmed) {
      setError("⚠️ Please enter the replacement batsman's name");
      return;
    }
    if (trimmed.length < 2) {
      setError("⚠️ Name must be at least 2 characters");
      return;
    }
    if (!jersey.trim()) {
      setError("⚠️ Please enter jersey number");
      return;
    }
    setError("");
    onConfirm({ name: trimmed, jersey: jersey.trim(), existingPlayer });
    setNewName("");
    setJersey("");
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") handleConfirm();
  };

  return (
    <div
      className={styles.overlay}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.title}>🏥 Retired Hurt</h2>
        <p
          style={{
            textAlign: "center",
            color: "#aaa",
            marginBottom: "12px",
            fontSize: "14px",
          }}
        >
          <strong style={{ color: "#4ade80" }}>{strikerName}</strong> is
          retiring hurt.
          <br />
          Enter the replacement batsman.
        </p>

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

        {existingPlayer && (
          <div
            style={{
              background: "rgba(34,197,94,0.1)",
              border: "1px solid #22c55e",
              borderRadius: "8px",
              padding: "10px 14px",
              marginBottom: "12px",
              fontSize: "13px",
              color: "#22c55e",
            }}
          >
            ✅ Found: <strong>{existingPlayer.name}</strong> — Career:{" "}
            {existingPlayer.runs}R, {existingPlayer.wickets}W
          </div>
        )}

        {/* Name field with suggestions */}
        <div className={styles.inputContainer} style={{ position: "relative" }}>
          <input
            className={`${styles.input} ${error ? styles.errorInput : ""}`}
            placeholder="Replacement batsman name"
            value={newName}
            onChange={(e) => handleNameChange(e.target.value)}
            onKeyPress={handleKeyPress}
          />
          {suggestions.length > 0 && (
            <div
              style={{
                position: "absolute",
                top: "100%",
                left: 0,
                right: 0,
                background: "#0f1a0f",
                border: "1px solid #22c55e",
                borderRadius: "8px",
                zIndex: 100,
                overflow: "hidden",
                boxShadow: "0 4px 16px rgba(0,0,0,0.6)",
              }}
            >
              {suggestions.map((p, i) => (
                <div
                  key={i}
                  onClick={() => handleSuggestionSelect(p)}
                  style={{
                    padding: "10px 14px",
                    cursor: "pointer",
                    fontSize: "13px",
                    color: "#e5e7eb",
                    borderBottom: i < suggestions.length - 1 ? "1px solid rgba(34,197,94,0.2)" : "none",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "rgba(34,197,94,0.15)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "transparent")
                  }
                >
                  <span>{p.name}</span>
                  <span style={{ color: "#9ca3af", fontSize: "12px" }}>
                    #{p.jersey}
                  </span>
                </div>
              ))}
            </div>
          )}
          {error && <p className={styles.errorText}>{error}</p>}
        </div>

        <div className={styles.buttonRow}>
          <button
            className={styles.confirmBtn}
            style={{ backgroundColor: "#6b7280", marginRight: "8px" }}
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className={styles.confirmBtn}
            onClick={handleConfirm}
            disabled={!newName.trim() || !jersey.trim()}
          >
            Confirm
          </button>
        </div>

        <p className={styles.hint}>
          {strikerName} can return to bat after any wicket falls, resuming their
          score.
        </p>
      </div>
    </div>
  );
}

export default RetiredHurtModal;
