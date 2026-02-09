import { useState } from "react";
import styles from "./NewBatsmanModal.module.css";

function NewBatsmanModal({ onConfirm }) {
  const [batsmanName, setBatsmanName] = useState("");
  const [error, setError] = useState("");

  const handleConfirm = () => {
    // ✅ FIX #1: Validation - fields cannot be empty
    if (!batsmanName.trim()) {
      setError("⚠️ Please enter batsman name");
      return;
    }

    if (batsmanName.trim().length < 2) {
      setError("⚠️ Name must be at least 2 characters");
      return;
    }

    // Clear error and proceed
    setError("");
    onConfirm(batsmanName.trim());
    setBatsmanName("");
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && batsmanName.trim()) {
      handleConfirm();
    }
  };

  return (
    <div className={styles.overlay} onClick={(e) => {
      if (e.target === e.currentTarget) return; // Prevent closing on content click
    }}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.title}>🏏 New Batsman</h2>

        <div className={styles.inputContainer}>
          <input
            className={`${styles.input} ${error ? styles.errorInput : ""}`}
            placeholder="Enter batsman name"
            value={batsmanName}
            onChange={(e) => {
              setBatsmanName(e.target.value);
              setError(""); // Clear error on change
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