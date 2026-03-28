import { useState } from "react";
import styles from "./NewBatsmanModal.module.css";

function RetiredHurtModal({ strikerName, onConfirm, onClose, playerDB }) {
  const [newName, setNewName] = useState("");
  const [jersey, setJersey] = useState("");
  const [error, setError] = useState("");
  const [existingPlayer, setExistingPlayer] = useState(null);

  const handleJerseyChange = (val) => {
    setJersey(val);
    setError("");
    setExistingPlayer(null);
    if (val.trim() && playerDB) {
      const found = playerDB.getPlayer(val.trim());
      if (found) {
        setExistingPlayer(found);
        setNewName(found.name);
      }
    }
  };

  const handleConfirm = () => {
    const trimmed = newName.trim();
    if (!trimmed) { setError("⚠️ Please enter the replacement batsman's name"); return; }
    if (trimmed.length < 2) { setError("⚠️ Name must be at least 2 characters"); return; }
    if (!jersey.trim()) { setError("⚠️ Please enter jersey number"); return; }
    setError("");
    onConfirm({ name: trimmed, jersey: jersey.trim(), existingPlayer });
    setNewName("");
    setJersey("");
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") handleConfirm();
  };

  return (
    <div className={styles.overlay} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.title}>🏥 Retired Hurt</h2>
        <p style={{ textAlign: "center", color: "#aaa", marginBottom: "12px", fontSize: "14px" }}>
          <strong style={{ color: "#4ade80" }}>{strikerName}</strong> is retiring hurt.
          <br />Enter the replacement batsman.
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
          <div style={{
            background: "rgba(34,197,94,0.1)", border: "1px solid #22c55e",
            borderRadius: "8px", padding: "10px 14px", marginBottom: "12px",
            fontSize: "13px", color: "#22c55e",
          }}>
            ✅ Found: <strong>{existingPlayer.name}</strong> — Career: {existingPlayer.runs}R, {existingPlayer.wickets}W
          </div>
        )}

        <div className={styles.inputContainer}>
          <input
            className={`${styles.input} ${error ? styles.errorInput : ""}`}
            placeholder="Replacement batsman name"
            value={newName}
            onChange={(e) => { setNewName(e.target.value); setError(""); }}
            onKeyPress={handleKeyPress}
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
            disabled={!newName.trim() || !jersey.trim()}
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