import { useState } from "react";
import styles from "./StartInningsModal.module.css";

function StartInningsModal({ onStart, playerDB }) {
  const [striker, setStriker] = useState("");
  const [strikerJersey, setStrikerJersey] = useState("");
  const [strikerExisting, setStrikerExisting] = useState(null);

  const [nonStriker, setNonStriker] = useState("");
  const [nonStrikerJersey, setNonStrikerJersey] = useState("");
  const [nonStrikerExisting, setNonStrikerExisting] = useState(null);

  const [bowler, setBowler] = useState("");
  const [bowlerJersey, setBowlerJersey] = useState("");
  const [bowlerExisting, setBowlerExisting] = useState(null);

  const [error, setError] = useState("");

  const handleStrikerJerseyChange = (val) => {
    setStrikerJersey(val);
    setError("");
    setStrikerExisting(null);
    if (val.trim() && playerDB) {
      const found = playerDB.getPlayer(val.trim());
      if (found) {
        setStrikerExisting(found);
        setStriker(found.name);
      }
    }
  };

  const handleNonStrikerJerseyChange = (val) => {
    setNonStrikerJersey(val);
    setError("");
    setNonStrikerExisting(null);
    if (val.trim() && playerDB) {
      const found = playerDB.getPlayer(val.trim());
      if (found) {
        setNonStrikerExisting(found);
        setNonStriker(found.name);
      }
    }
  };

  const handleBowlerJerseyChange = (val) => {
    setBowlerJersey(val);
    setError("");
    setBowlerExisting(null);
    if (val.trim() && playerDB) {
      const found = playerDB.getPlayer(val.trim());
      if (found) {
        setBowlerExisting(found);
        setBowler(found.name);
      }
    }
  };

  const handleStart = () => {
    if (!striker.trim()) { setError("⚠️ Please enter striker name"); return; }
    if (!strikerJersey.trim()) { setError("⚠️ Please enter striker jersey number"); return; }
    if (!nonStriker.trim()) { setError("⚠️ Please enter non-striker name"); return; }
    if (!nonStrikerJersey.trim()) { setError("⚠️ Please enter non-striker jersey number"); return; }
    if (!bowler.trim()) { setError("⚠️ Please enter bowler name"); return; }
    if (!bowlerJersey.trim()) { setError("⚠️ Please enter bowler jersey number"); return; }

    // ✅ FIX BUG 3: Validate no duplicate jerseys across all three
    const jerseys = [
      strikerJersey.trim(),
      nonStrikerJersey.trim(),
      bowlerJersey.trim(),
    ];
    const uniqueJerseys = new Set(jerseys);
    if (uniqueJerseys.size !== jerseys.length) {
      if (strikerJersey.trim() === nonStrikerJersey.trim()) {
        setError("⚠️ Striker and Non-Striker cannot have the same jersey number");
      } else if (strikerJersey.trim() === bowlerJersey.trim()) {
        setError("⚠️ Striker and Bowler cannot have the same jersey number");
      } else {
        setError("⚠️ Non-Striker and Bowler cannot have the same jersey number");
      }
      return;
    }

    onStart(
      { name: striker.trim(), jersey: strikerJersey.trim() },
      { name: nonStriker.trim(), jersey: nonStrikerJersey.trim() },
      { name: bowler.trim(), jersey: bowlerJersey.trim() }
    );
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") handleStart();
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.title}>🏏 Start Innings</h2>
        <p className={styles.subtitle}>Enter jersey numbers to auto-fill from database</p>

        {/* STRIKER */}
        <div className={styles.playerSection}>
          <h3 className={styles.label}>Striker (On Strike)</h3>
          <div className={styles.inputContainer}>
            <input
              className={styles.input}
              placeholder="Jersey number (e.g. 18)"
              value={strikerJersey}
              onChange={(e) => handleStrikerJerseyChange(e.target.value)}
              type="number"
              autoFocus
            />
          </div>
          {strikerExisting && (
            <div className={styles.existingPlayer}>
              ✅ Found: <strong>{strikerExisting.name}</strong> — {strikerExisting.runs}R, {strikerExisting.wickets}W
            </div>
          )}
          <div className={styles.inputContainer}>
            <input
              className={styles.input}
              placeholder="Striker name"
              value={striker}
              onChange={(e) => { setStriker(e.target.value); setError(""); }}
              onKeyPress={handleKeyPress}
            />
          </div>
        </div>

        {/* NON-STRIKER */}
        <div className={styles.playerSection}>
          <h3 className={styles.label}>Non-Striker</h3>
          <div className={styles.inputContainer}>
            <input
              className={styles.input}
              placeholder="Jersey number (e.g. 7)"
              value={nonStrikerJersey}
              onChange={(e) => handleNonStrikerJerseyChange(e.target.value)}
              type="number"
            />
          </div>
          {/* ✅ FIX BUG 3: Live duplicate warning */}
          {nonStrikerJersey.trim() && nonStrikerJersey.trim() === strikerJersey.trim() && (
            <div className={styles.duplicateWarning}>
              ⚠️ Same jersey as Striker
            </div>
          )}
          {nonStrikerExisting && (
            <div className={styles.existingPlayer}>
              ✅ Found: <strong>{nonStrikerExisting.name}</strong> — {nonStrikerExisting.runs}R, {nonStrikerExisting.wickets}W
            </div>
          )}
          <div className={styles.inputContainer}>
            <input
              className={styles.input}
              placeholder="Non-striker name"
              value={nonStriker}
              onChange={(e) => { setNonStriker(e.target.value); setError(""); }}
              onKeyPress={handleKeyPress}
            />
          </div>
        </div>

        {/* BOWLER */}
        <div className={styles.playerSection}>
          <h3 className={styles.label}>Opening Bowler</h3>
          <div className={styles.inputContainer}>
            <input
              className={styles.input}
              placeholder="Jersey number (e.g. 99)"
              value={bowlerJersey}
              onChange={(e) => handleBowlerJerseyChange(e.target.value)}
              type="number"
            />
          </div>
          {/* ✅ FIX BUG 3: Live duplicate warning for bowler */}
          {bowlerJersey.trim() && (
            bowlerJersey.trim() === strikerJersey.trim() ||
            bowlerJersey.trim() === nonStrikerJersey.trim()
          ) && (
            <div className={styles.duplicateWarning}>
              ⚠️ Same jersey as {bowlerJersey.trim() === strikerJersey.trim() ? "Striker" : "Non-Striker"}
            </div>
          )}
          {bowlerExisting && (
            <div className={styles.existingPlayer}>
              ✅ Found: <strong>{bowlerExisting.name}</strong> — {bowlerExisting.wickets}W, Eco:{" "}
              {bowlerExisting.ballsBowled > 0
                ? (bowlerExisting.runsGiven / (bowlerExisting.ballsBowled / 6)).toFixed(2)
                : "0.00"}
            </div>
          )}
          <div className={styles.inputContainer}>
            <input
              className={styles.input}
              placeholder="Bowler name"
              value={bowler}
              onChange={(e) => { setBowler(e.target.value); setError(""); }}
              onKeyPress={handleKeyPress}
            />
          </div>
        </div>

        {error && <p className={styles.errorText}>{error}</p>}

        <div className={styles.buttonRow}>
          <button
            className={styles.startBtn}
            onClick={handleStart}
            disabled={
              !striker.trim() ||
              !nonStriker.trim() ||
              !bowler.trim() ||
              !strikerJersey.trim() ||
              !nonStrikerJersey.trim() ||
              !bowlerJersey.trim() ||
              // ✅ FIX BUG 3: Disable button if any duplicate jerseys
              new Set([strikerJersey.trim(), nonStrikerJersey.trim(), bowlerJersey.trim()]).size !== 3
            }
          >
            Start Innings
          </button>
        </div>

        <p className={styles.hint}>Jersey numbers are permanent player IDs</p>
      </div>
    </div>
  );
}

export default StartInningsModal;
