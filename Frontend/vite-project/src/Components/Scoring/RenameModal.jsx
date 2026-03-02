import { useState } from "react";
import styles from "./NewBatsmanModal.module.css"; // reuse same styles

/**
 * RenameModal
 * Shown when user taps a batsman name on the scoring screen.
 * Allows changing displayName without affecting stats or history.
 *
 * Props:
 *   playerId      — stable ID of the player being renamed
 *   currentName   — current displayName (pre-fills the input)
 *   onConfirm(playerId, newName) — called on save
 *   onClose()     — called on cancel
 */
function RenameModal({ playerId, currentName, onConfirm, onClose }) {
  const [name, setName] = useState(currentName || "");
  const [error, setError] = useState("");

  const handleConfirm = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError("⚠️ Name cannot be empty");
      return;
    }
    if (trimmed.length < 2) {
      setError("⚠️ Name must be at least 2 characters");
      return;
    }
    if (trimmed === currentName) {
      onClose(); // no change — just close
      return;
    }
    setError("");
    onConfirm(playerId, trimmed);
    onClose();
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") handleConfirm();
    if (e.key === "Escape") onClose();
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.title}>✏️ Rename Player</h2>

        <p style={{
          textAlign: "center",
          color: "#aaa",
          fontSize: "13px",
          marginBottom: "12px",
        }}>
          Stats and history will stay intact
        </p>

        <div className={styles.inputContainer}>
          <input
            className={`${styles.input} ${error ? styles.errorInput : ""}`}
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError("");
            }}
            onKeyDown={handleKeyPress}
            autoFocus
            placeholder="Enter new name"
          />
          {error && <p className={styles.errorText}>{error}</p>}
        </div>

        <div className={styles.buttonRow}>
          <button
            className={styles.confirmBtn}
            style={{ background: "#555", marginRight: "8px" }}
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className={styles.confirmBtn}
            onClick={handleConfirm}
            disabled={!name.trim()}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

export default RenameModal;
