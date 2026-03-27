import { useState } from "react";
import styles from "./NewBatsmanModal.module.css";

function NewBatsmanModal({
  onConfirm,
  retiredPlayers = [],
  onReturnRetired,
  playerDB,
  activePlayers = [],
  matchTeamLock = {},
  currentTeam,
}) {
  const [name, setName] = useState("");
  const [jersey, setJersey] = useState("");
  const [error, setError] = useState("");
  const [existingPlayer, setExistingPlayer] = useState(null);
  const [teamLockError, setTeamLockError] = useState("");

  // ✅ DEFINED FIRST — before any usage
  const getTeamLockError = (jerseyVal) => {
    if (!jerseyVal?.trim() || !matchTeamLock) return null;
    const locked = matchTeamLock[String(jerseyVal.trim())];
    if (locked && locked !== currentTeam) {
      return `Jersey #${jerseyVal.trim()} belongs to ${locked}`;
    }
    return null;
  };

  const handleJerseyChange = (val) => {
    setJersey(val);
    setError("");
    setExistingPlayer(null);
    setTeamLockError("");

    const lockErr = getTeamLockError(val);
    if (lockErr) {
      setTeamLockError(lockErr);
      return;
    }

    if (val.trim() && playerDB) {
      const found = playerDB.getPlayer(val.trim());
      if (found) {
        setExistingPlayer(found);
        setName(found.name);
      }
    }
  };

  const isDuplicateJersey =
    jersey.trim() &&
    activePlayers.some((p) => p?.playerId === String(jersey.trim()));

  const handleConfirm = () => {
    if (!name.trim()) {
      setError("⚠️ Please enter player name");
      return;
    }
    if (!jersey.trim()) {
      setError("⚠️ Please enter jersey number");
      return;
    }
    if (isDuplicateJersey) {
      setError("⚠️ This jersey number is already in use by the non-striker");
      return;
    }
    if (teamLockError) {
      return;
    }

    onConfirm({ name: name.trim(), jersey: jersey.trim(), existingPlayer });
    setName("");
    setJersey("");
    setExistingPlayer(null);
    setTeamLockError("");
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") handleConfirm();
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.title}>🏏 New Batsman</h2>

        {/* Retired players quick-return */}
        {retiredPlayers.length > 0 && (
          <div style={{ marginBottom: "16px" }}>
            <p style={{
              color: "#f1c40f",
              fontSize: "13px",
              textAlign: "center",
              marginBottom: "8px",
              fontWeight: "600",
            }}>
              🏥 Retired Hurt — tap to return:
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {retiredPlayers.map((player) => (
                <button
                  key={player.playerId}
                  onClick={() => onReturnRetired(player.displayName)}
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
                  <span>{player.displayName}</span>
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

        {/* Duplicate jersey warning */}
        {isDuplicateJersey && !teamLockError && (
          <div style={{
            background: "rgba(239,68,68,0.1)",
            border: "1px solid #ef4444",
            borderRadius: "8px",
            padding: "8px 12px",
            marginBottom: "8px",
            fontSize: "13px",
            color: "#ef4444",
          }}>
            ⚠️ Jersey #{jersey} is already in use by the non-striker
          </div>
        )}

        {/* Existing player info */}
        {existingPlayer && !isDuplicateJersey && !teamLockError && (
          <div style={{
            background: "rgba(34,197,94,0.1)",
            border: "1px solid #22c55e",
            borderRadius: "8px",
            padding: "10px 14px",
            marginBottom: "12px",
            fontSize: "13px",
            color: "#22c55e",
          }}>
            ✅ Found: <strong>{existingPlayer.name}</strong> — Career:{" "}
            {existingPlayer.runs}R, {existingPlayer.wickets}W
          </div>
        )}

        <div className={styles.inputContainer}>
          <input
            className={`${styles.input} ${error ? styles.errorInput : ""}`}
            placeholder="Player name"
            value={name}
            onChange={(e) => { setName(e.target.value); setError(""); }}
            onKeyPress={handleKeyPress}
          />
          {error && <p className={styles.errorText}>{error}</p>}
        </div>

        <div className={styles.buttonRow}>
          <button
            className={styles.confirmBtn}
            onClick={handleConfirm}
            disabled={
              !name.trim() ||
              !jersey.trim() ||
              !!isDuplicateJersey ||
              !!teamLockError
            }
          >
            {existingPlayer ? "Use Existing Player" : "Add New Player"}
          </button>
        </div>

        <p className={styles.hint}>Jersey number is permanent ID</p>
      </div>
    </div>
  );
}

export default NewBatsmanModal;