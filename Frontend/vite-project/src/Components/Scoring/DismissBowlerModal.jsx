import { useState } from "react";
import styles from "./NewBowlerModal.module.css";

/**
 * DismissBowlerModal
 * Step 1 — confirmation that the current bowler is being dismissed.
 * Step 2 — enter the replacement bowler's name.
 * The over CONTINUES — only the bowler attribution changes.
 */
function DismissBowlerModal({ dismissedBowlerName, existingBowlers = [], onConfirm, onClose }) {
  const [step, setStep] = useState(1); // 1 = confirm, 2 = enter new bowler
  const [newBowlerName, setNewBowlerName] = useState("");
  const [error, setError] = useState("");

  const existingMatch = existingBowlers.find(
    (b) =>
      b.name.toLowerCase() === newBowlerName.trim().toLowerCase() &&
      b.name.toLowerCase() !== dismissedBowlerName.toLowerCase()
  );

  const handleConfirmDismiss = () => {
    setStep(2);
  };

  const handleConfirmNewBowler = () => {
    const trimmed = newBowlerName.trim();
    if (!trimmed) {
      setError("⚠️ Please enter bowler name");
      return;
    }
    if (trimmed.length < 2) {
      setError("⚠️ Name must be at least 2 characters");
      return;
    }
    if (trimmed.toLowerCase() === dismissedBowlerName.toLowerCase()) {
      setError("⚠️ Cannot bring back the dismissed bowler");
      return;
    }
    setError("");
    onConfirm(trimmed);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && newBowlerName.trim()) handleConfirmNewBowler();
  };

  // ── Step 1: Confirm dismissal ──────────────────────────────────────────────
  if (step === 1) {
    return (
      <div className={styles.overlay}>
        <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
          <h2 className={styles.title}>🚫 Dismiss Bowler</h2>
          <p style={{ textAlign: "center", color: "#ccc", marginBottom: "12px" }}>
            Are you sure you want to dismiss{" "}
            <strong style={{ color: "#fff" }}>{dismissedBowlerName}</strong>?
          </p>
          <p style={{ textAlign: "center", color: "#aaa", fontSize: "13px", marginBottom: "20px" }}>
            They will not be allowed to bowl again this match.
            <br />
            The current over will continue with a new bowler.
          </p>
          <div className={styles.buttonRow}>
            <button className={styles.confirmBtn} style={{ background: "#888" }} onClick={onClose}>
              Cancel
            </button>
            <button className={styles.confirmBtn} style={{ background: "#e74c3c" }} onClick={handleConfirmDismiss}>
              Yes, Dismiss
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Step 2: Enter new bowler name ─────────────────────────────────────────
  return (
    <div className={styles.overlay}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.title}>🎯 New Bowler (Continuing Over)</h2>
        <p style={{ textAlign: "center", color: "#aaa", fontSize: "13px", marginBottom: "12px" }}>
          Enter the bowler who will continue this over
        </p>

        <div className={styles.inputContainer}>
          <input
            className={`${styles.input} ${error ? styles.errorInput : ""}`}
            placeholder="Enter bowler name"
            value={newBowlerName}
            onChange={(e) => {
              setNewBowlerName(e.target.value);
              setError("");
            }}
            onKeyPress={handleKeyPress}
            autoFocus
          />

          {existingMatch && (
            <div
              className={styles.suggestionBox}
              onClick={() => onConfirm(existingMatch.name)}
            >
              <div className={styles.suggestionHeader}><b>Existing Bowler</b></div>
              <div className={styles.suggestionName}>{existingMatch.name}</div>
              <div className={styles.suggestionStats}>
                {existingMatch.overs} overs | {existingMatch.runs} runs |{" "}
                {existingMatch.wickets} wkts
              </div>
            </div>
          )}

          {error && <p className={styles.errorText}>{error}</p>}
        </div>

        <div className={styles.buttonRow}>
          <button
            className={styles.confirmBtn}
            onClick={handleConfirmNewBowler}
            disabled={!newBowlerName.trim()}
          >
            Confirm
          </button>
        </div>
        <p className={styles.hint}>Press Enter to confirm</p>
      </div>
    </div>
  );
}

export default DismissBowlerModal;
