import { useState } from "react";
import styles from "./NewBatsmanModal.module.css";

/**
 * NewBatsmanModal
 *
 * Shown after a wicket falls.
 * If there are retired-hurt players available, they are shown as quick-return buttons.
 * The user can either pick a retired player (who resumes their exact score)
 * or type a new batsman's name.
 *
 * Props:
 *   onConfirm(name)           — called with new batsman name (fresh player)
 *   retiredPlayers            — array of { playerId, displayName, runs, balls } retired players
 *   onReturnRetired(name)     — called when user selects a retired player to return
 */
function NewBatsmanModal({ onConfirm, retiredPlayers = [], onReturnRetired }) {
  const [batsmanName, setBatsmanName] = useState("");
  const [error, setError] = useState("");

  const handleConfirm = () => {
    if (!batsmanName.trim()) {
      setError("⚠️ Please enter batsman name");
      return;
    }
    if (batsmanName.trim().length < 2) {
      setError("⚠️ Name must be at least 2 characters");
      return;
    }
    setError("");
    onConfirm(batsmanName.trim());
    setBatsmanName("");
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && batsmanName.trim()) {
      handleConfirm();
    }
  };

  const handleReturnRetired = (player) => {
    if (onReturnRetired) {
      onReturnRetired(player.displayName); // ✅ was player.name
    }
  };

  return (
    <div className={styles.overlay} onClick={(e) => {
      if (e.target === e.currentTarget) return;
    }}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.title}>🏏 New Batsman</h2>

        {/* ✅ RETIRED HURT: Show retired players as quick-return options */}
        {retiredPlayers.length > 0 && (
          <div style={{ marginBottom: "16px" }}>
            <p style={{
              fontSize: "12px",
              color: "#f59e0b",
              textAlign: "center",
              marginBottom: "8px",
              fontWeight: "600",
            }}>
              🏥 Retired Hurt — tap to return:
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {retiredPlayers.map((player) => (
                <button
                  key={player.playerId}  // ✅ was player.name
                  onClick={() => handleReturnRetired(player)}
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
                  <span>{player.displayName}</span>  {/* ✅ was player.name */}
                  <span style={{ fontSize: "12px", color: "#fcd34d" }}>
                    resumes at {player.runs}({player.balls})
                  </span>
                </button>
              ))}
            </div>
            <p style={{
              fontSize: "11px",
              color: "#6b7280",
              textAlign: "center",
              margin: "8px 0 4px",
            }}>
              — or enter a new batsman below —
            </p>
          </div>
        )}

        <div className={styles.inputContainer}>
          <input
            className={`${styles.input} ${error ? styles.errorInput : ""}`}
            placeholder="Enter batsman name"
            value={batsmanName}
            onChange={(e) => {
              setBatsmanName(e.target.value);
              setError("");
            }}
            onKeyPress={handleKeyPress}
            autoFocus
          />
          {error && <p className={styles.errorText}>{error}</p>}
        </div>

        <div className={styles.buttonRow}>
          <button
            className={styles.confirmBtn}
            onClick={handleConfirm}
            disabled={!batsmanName.trim()}
          >
            Confirm
          </button>
        </div>

        <p className={styles.hint}>Press Enter to confirm</p>
      </div>
    </div>
  );
}

export default NewBatsmanModal;

