import { useState } from "react";
import styles from "./NewBatsmanModal.module.css"; // reuse same styles

/**
 * RetiredHurtModal
 *
 * Shown when the user clicks "RETIRED HURT".
 * Displays who is retiring and asks for the replacement batsman's name.
 * No ball is bowled — this is purely a player substitution event.
 *
 * Props:
 *   strikerName  — name of the batsman who is retiring
 *   onConfirm(newBatsmanName) — called with the replacement's name
 *   onClose      — called if user cancels
 */
function RetiredHurtModal({ strikerName, onConfirm, onClose }) {
  const [newName, setNewName] = useState("");
  const [error, setError] = useState("");

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
    setError("");
    onConfirm(trimmed);
    setNewName("");
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

        <p style={{ textAlign: "center", color: "#aaa", marginBottom: "12px", fontSize: "14px" }}>
          <strong style={{ color: "#4ade80" }}>{strikerName}</strong> is retiring hurt.
          <br />
          Enter the replacement batsman's name.
        </p>

        <div className={styles.inputContainer}>
          <input
            className={`${styles.input} ${error ? styles.errorInput : ""}`}
            placeholder="Replacement batsman name"
            value={newName}
            onChange={(e) => {
              setNewName(e.target.value);
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
            style={{ backgroundColor: "#6b7280", marginRight: "8px" }}
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className={styles.confirmBtn}
            onClick={handleConfirm}
            disabled={!newName.trim()}
          >
            Confirm
          </button>
        </div>

        <p className={styles.hint}>
          {strikerName} can return to bat after any wicket falls, resuming their score.
        </p>
      </div>
    </div>
  );
}

export default RetiredHurtModal;
