import { useState } from "react";
import styles from "./NewBowlerModal.module.css";

function NewBowlerModal({ onConfirm, existingBowlers = [] }) {
  const [bowlerName, setBowlerName] = useState("");
  const existingBowler = existingBowlers.find(
    (b) => b.name.toLowerCase() === bowlerName.trim().toLowerCase()
  );

  const [error, setError] = useState("");

  const handleConfirm = () => {
    // ✅ FIX #1: Validation - fields cannot be empty
    if (!bowlerName.trim()) {
      setError("⚠️ Please enter bowler name");
      return;
    }

    if (bowlerName.trim().length < 2) {
      setError("⚠️ Name must be at least 2 characters");
      return;
    }

    // Clear error and proceed
    setError("");
    onConfirm(bowlerName.trim());
    setBowlerName("");
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && bowlerName.trim()) {
      handleConfirm();
    }
  };

  return (
    <div
      className={styles.overlay}
      onClick={(e) => {
        if (e.target === e.currentTarget) return;
      }}
    >
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.title}>🎯 New Bowler</h2>

        <div className={styles.inputContainer}>
          <input
            className={`${styles.input} ${error ? styles.errorInput : ""}`}
            placeholder="Enter bowler name"
            value={bowlerName}
            onChange={(e) => {
              setBowlerName(e.target.value);
              setError("");
            }}
            onKeyPress={handleKeyPress}
            autoFocus
          />
          {existingBowler && (
            <div
              className={styles.suggestionBox}
              onClick={() => onConfirm(existingBowler.name)}
            >
              <div className={styles.suggestionHeader}> <b>Existing Bowler</b></div>

              <div className={styles.suggestionName}>{existingBowler.name}</div>

              <div className={styles.suggestionStats}>
                {existingBowler.overs} overs | {existingBowler.runs} runs | {' '} 
                {existingBowler.wickets} wkts
              </div>
            </div>
          )}

          {error && <p className={styles.errorText}>{error}</p>}
        </div>

        <div className={styles.buttonRow}>
          <button
            className={styles.confirmBtn}
            onClick={handleConfirm}
            disabled={!bowlerName.trim()}
          >
            Confirm
          </button>
        </div>

        <p className={styles.hint}>Press Enter to confirm</p>
      </div>
    </div>
  );
}

export default NewBowlerModal;
