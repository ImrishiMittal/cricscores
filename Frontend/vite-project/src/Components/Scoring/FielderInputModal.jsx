import { useState } from "react";
import styles from "./FielderInputModal.module.css";

function FielderInputModal({
  wicketType,
  onConfirm,
  onCancel,
  playerDB,
  matchTeamLock = {},
  currentBattingTeam,
}) {
  const [fielderName, setFielderName] = useState("");
  const [fielderJersey, setFielderJersey] = useState("");
  const [existingFielder, setExistingFielder] = useState(null);
  const [teamLockError, setTeamLockError] = useState("");

  // ✅ Fielder is from the BOWLING team (opposite of batting team)
  // so we check that the jersey does NOT belong to the batting team
  const getTeamLockError = (jerseyVal) => {
    if (!jerseyVal?.trim() || !matchTeamLock) return null;
    const locked = matchTeamLock[String(jerseyVal.trim())];
    if (locked && locked === currentBattingTeam) {
      return `Jersey #${jerseyVal.trim()} belongs to ${locked} — fielders must be from the bowling team`;
    }
    return null;
  };

  const handleJerseyChange = (val) => {
    setFielderJersey(val);
    setExistingFielder(null);
    setTeamLockError("");

    const lockErr = getTeamLockError(val);
    if (lockErr) {
      setTeamLockError(lockErr);
      return;
    }

    if (val.trim() && playerDB) {
      const found = playerDB.getPlayer(val.trim());
      if (found) {
        setExistingFielder(found);
        setFielderName(found.name);
      }
    }
  };

  const handleSubmit = () => {
    if (
      (wicketType === "runout" ||
        wicketType === "caught" ||
        wicketType === "stumped") &&
      !fielderName.trim()
    ) {
      alert("Please enter fielder name");
      return;
    }
    if (teamLockError) return;

    onConfirm({
      fielder: fielderName.trim(),
      fielderJersey: fielderJersey.trim() || null,
    });
  };

  const needsFielder =
    wicketType === "runout" ||
    wicketType === "caught" ||
    wicketType === "stumped";

  const fielderLabel =
    wicketType === "runout"
      ? "Fielder"
      : wicketType === "caught"
      ? "Catcher"
      : "Wicket Keeper";

  return (
    <div className={styles.overlay} onClick={onCancel}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.title}>Wicket Details</h2>

        {needsFielder && (
          <>
            <div className={styles.inputGroup}>
              <label className={styles.label}>
                {fielderLabel} Jersey (optional)
              </label>
              <input
                type="number"
                className={styles.input}
                value={fielderJersey}
                onChange={(e) => handleJerseyChange(e.target.value)}
                placeholder="Jersey number"
                autoFocus
              />
            </div>

            {/* Team lock error */}
            {teamLockError && (
              <div style={{
                background: "rgba(239,68,68,0.1)",
                border: "1px solid #ef4444",
                borderRadius: "8px",
                padding: "8px 12px",
                marginBottom: "8px",
                fontSize: "13px",
                color: "#ef4444",
              }}>
                🚫 {teamLockError}
              </div>
            )}

            {/* Existing fielder found */}
            {existingFielder && !teamLockError && (
              <div style={{
                background: "rgba(34,197,94,0.1)",
                border: "1px solid #22c55e",
                borderRadius: "8px",
                padding: "8px 12px",
                marginBottom: "8px",
                fontSize: "13px",
                color: "#22c55e",
              }}>
                ✅ Found: <strong>{existingFielder.name}</strong>
              </div>
            )}

            <div className={styles.inputGroup}>
              <label className={styles.label}>{fielderLabel} Name</label>
              <input
                type="text"
                className={styles.input}
                value={fielderName}
                onChange={(e) => setFielderName(e.target.value)}
                placeholder="Enter name"
                autoFocus={!fielderJersey}
              />
            </div>
          </>
        )}

        <div className={styles.buttonRow}>
          <button className={styles.cancelBtn} onClick={onCancel}>
            Cancel
          </button>
          <button
            className={styles.confirmBtn}
            onClick={handleSubmit}
            disabled={!!teamLockError}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

export default FielderInputModal;