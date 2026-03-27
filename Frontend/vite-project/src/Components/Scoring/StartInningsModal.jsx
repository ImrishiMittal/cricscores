import { useState } from "react";
import styles from "./StartInningsModal.module.css";

function StartInningsModal({
  onStart,
  playerDB,
  matchTeamLock = {},
  currentBattingTeam,
  firstBattingTeam,
  secondBattingTeam,
  currentInnings,
}) {
  const [striker, setStriker] = useState("");
  const [strikerJersey, setStrikerJersey] = useState("");
  const [strikerExisting, setStrikerExisting] = useState(null);
  const [strikerSuggestions, setStrikerSuggestions] = useState([]);
  const [showStrikerSuggestions, setShowStrikerSuggestions] = useState(false);

  const [nonStriker, setNonStriker] = useState("");
  const [nonStrikerJersey, setNonStrikerJersey] = useState("");
  const [nonStrikerExisting, setNonStrikerExisting] = useState(null);
  const [nonStrikerSuggestions, setNonStrikerSuggestions] = useState([]);
  const [showNonStrikerSuggestions, setShowNonStrikerSuggestions] = useState(false);

  const [bowler, setBowler] = useState("");
  const [bowlerJersey, setBowlerJersey] = useState("");
  const [bowlerExisting, setBowlerExisting] = useState(null);
  const [bowlerSuggestions, setBowlerSuggestions] = useState([]);
  const [showBowlerSuggestions, setShowBowlerSuggestions] = useState(false);

  const [error, setError] = useState("");

  const bowlingTeam = currentInnings === 1 ? secondBattingTeam : firstBattingTeam;

  const getTeamLockError = (jersey, expectedTeam) => {
    if (!jersey?.trim() || !matchTeamLock) return null;
    const locked = matchTeamLock[String(jersey.trim())];
    if (locked && locked !== expectedTeam) {
      return `Jersey #${jersey.trim()} belongs to ${locked} — cannot play for ${expectedTeam}`;
    }
    return null;
  };

  /* ── STRIKER ── */
  const handleStrikerJerseyChange = (val) => {
    setStrikerJersey(val);
    setError("");
    setStrikerExisting(null);
    setShowStrikerSuggestions(false);
    const lockErr = getTeamLockError(val, currentBattingTeam);
    if (lockErr) { setError(lockErr); return; }
    if (val.trim() && playerDB) {
      const found = playerDB.getPlayer(val.trim());
      if (found) { setStrikerExisting(found); setStriker(found.name); }
    }
  };

  const handleStrikerNameChange = (val) => {
    setStriker(val);
    setError("");
    setStrikerExisting(null);
    if (val.trim() && playerDB) {
      const suggestions = playerDB.searchPlayersByName(val);
      setStrikerSuggestions(suggestions);
      setShowStrikerSuggestions(suggestions.length > 0);
    } else {
      setStrikerSuggestions([]);
      setShowStrikerSuggestions(false);
    }
  };

  const handleSelectStriker = (player) => {
    setStriker(player.name);
    setStrikerJersey(player.jersey);
    setStrikerExisting(player);
    setShowStrikerSuggestions(false);
  };

  /* ── NON-STRIKER ── */
  const handleNonStrikerJerseyChange = (val) => {
    setNonStrikerJersey(val);
    setError("");
    setNonStrikerExisting(null);
    setShowNonStrikerSuggestions(false);
    const lockErr = getTeamLockError(val, currentBattingTeam);
    if (lockErr) { setError(lockErr); return; }
    if (val.trim() && playerDB) {
      const found = playerDB.getPlayer(val.trim());
      if (found) { setNonStrikerExisting(found); setNonStriker(found.name); }
    }
  };

  const handleNonStrikerNameChange = (val) => {
    setNonStriker(val);
    setError("");
    setNonStrikerExisting(null);
    if (val.trim() && playerDB) {
      const suggestions = playerDB.searchPlayersByName(val);
      setNonStrikerSuggestions(suggestions);
      setShowNonStrikerSuggestions(suggestions.length > 0);
    } else {
      setNonStrikerSuggestions([]);
      setShowNonStrikerSuggestions(false);
    }
  };

  const handleSelectNonStriker = (player) => {
    setNonStriker(player.name);
    setNonStrikerJersey(player.jersey);
    setNonStrikerExisting(player);
    setShowNonStrikerSuggestions(false);
  };

  /* ── BOWLER ── */
  const handleBowlerJerseyChange = (val) => {
    setBowlerJersey(val);
    setError("");
    setBowlerExisting(null);
    setShowBowlerSuggestions(false);
    const lockErr = getTeamLockError(val, bowlingTeam);
    if (lockErr) { setError(lockErr); return; }
    if (val.trim() && playerDB) {
      const found = playerDB.getPlayer(val.trim());
      if (found) { setBowlerExisting(found); setBowler(found.name); }
    }
  };

  const handleBowlerNameChange = (val) => {
    setBowler(val);
    setError("");
    setBowlerExisting(null);
    if (val.trim() && playerDB) {
      const suggestions = playerDB.searchPlayersByName(val);
      setBowlerSuggestions(suggestions);
      setShowBowlerSuggestions(suggestions.length > 0);
    } else {
      setBowlerSuggestions([]);
      setShowBowlerSuggestions(false);
    }
  };

  const handleSelectBowler = (player) => {
    setBowler(player.name);
    setBowlerJersey(player.jersey);
    setBowlerExisting(player);
    setShowBowlerSuggestions(false);
  };

  /* ── SUBMIT ── */
  const hasLockError =
    !!getTeamLockError(strikerJersey, currentBattingTeam) ||
    !!getTeamLockError(nonStrikerJersey, currentBattingTeam) ||
    !!getTeamLockError(bowlerJersey, bowlingTeam);

  const isDuplicateNonStriker =
    nonStrikerJersey.trim() && nonStrikerJersey.trim() === strikerJersey.trim();

  const isDuplicateBowler =
    bowlerJersey.trim() &&
    (bowlerJersey.trim() === strikerJersey.trim() ||
      bowlerJersey.trim() === nonStrikerJersey.trim());

  const handleStart = () => {
    if (!striker.trim()) { setError("⚠️ Please enter striker name"); return; }
    if (!strikerJersey.trim()) { setError("⚠️ Please enter striker jersey number"); return; }
    if (!nonStriker.trim()) { setError("⚠️ Please enter non-striker name"); return; }
    if (!nonStrikerJersey.trim()) { setError("⚠️ Please enter non-striker jersey number"); return; }
    if (!bowler.trim()) { setError("⚠️ Please enter bowler name"); return; }
    if (!bowlerJersey.trim()) { setError("⚠️ Please enter bowler jersey number"); return; }

    const jerseys = [strikerJersey.trim(), nonStrikerJersey.trim(), bowlerJersey.trim()];
    if (new Set(jerseys).size !== 3) {
      if (strikerJersey.trim() === nonStrikerJersey.trim())
        setError("⚠️ Striker and Non-Striker cannot have the same jersey number");
      else if (strikerJersey.trim() === bowlerJersey.trim())
        setError("⚠️ Striker and Bowler cannot have the same jersey number");
      else
        setError("⚠️ Non-Striker and Bowler cannot have the same jersey number");
      return;
    }

    onStart(
      { name: striker.trim(), jersey: strikerJersey.trim() },
      { name: nonStriker.trim(), jersey: nonStrikerJersey.trim() },
      { name: bowler.trim(), jersey: bowlerJersey.trim() }
    );
  };

  const handleKeyPress = (e) => { if (e.key === "Enter") handleStart(); };

  const dismissAll = () => {
    setShowStrikerSuggestions(false);
    setShowNonStrikerSuggestions(false);
    setShowBowlerSuggestions(false);
  };

  /* ── SUGGESTION DROPDOWN (shared renderer) ── */
  const renderBattingSuggestions = (suggestions, onSelect, isBowler = false) =>
    suggestions.length > 0 && (
      <div className={styles.suggestionsDropdown}>
        {suggestions.map((player) => (
          <div
            key={player.jersey}
            className={styles.suggestionItem}
            onMouseDown={(e) => { e.preventDefault(); onSelect(player); }}
          >
            <div className={styles.suggestionMain}>
              <span className={styles.suggestionJersey}>#{player.jersey}</span>
              <span className={styles.suggestionName}>{player.name}</span>
            </div>
            <div className={styles.suggestionStats}>
              {isBowler
                ? `🎳 ${player.wickets}W • 📊 ${player.matches || 0} matches • Eco: ${player.ballsBowled > 0 ? (player.runsGiven / (player.ballsBowled / 6)).toFixed(2) : "0.00"}`
                : `🏏 ${player.runs}R (${player.balls}B) • 🎳 ${player.wickets}W • 📊 ${player.matches || 0} matches`}
            </div>
          </div>
        ))}
      </div>
    );

  return (
    <div className={styles.overlay} onClick={dismissAll}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.title}>🏏 Start Innings</h2>
        <p className={styles.subtitle}>Enter jersey number or start typing name</p>

        {/* ── STRIKER ── */}
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
          <div className={styles.inputContainer} style={{ position: "relative" }}>
            <input
              className={styles.input}
              placeholder="Striker name (type for suggestions)"
              value={striker}
              onChange={(e) => handleStrikerNameChange(e.target.value)}
              onFocus={() => strikerSuggestions.length > 0 && setShowStrikerSuggestions(true)}
              onKeyPress={handleKeyPress}
            />
            {showStrikerSuggestions && renderBattingSuggestions(strikerSuggestions, handleSelectStriker)}
          </div>
        </div>

        {/* ── NON-STRIKER ── */}
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
          {isDuplicateNonStriker && (
            <div className={styles.duplicateWarning}>⚠️ Same jersey as Striker</div>
          )}
          {nonStrikerExisting && !isDuplicateNonStriker && (
            <div className={styles.existingPlayer}>
              ✅ Found: <strong>{nonStrikerExisting.name}</strong> — {nonStrikerExisting.runs}R, {nonStrikerExisting.wickets}W
            </div>
          )}
          <div className={styles.inputContainer} style={{ position: "relative" }}>
            <input
              className={styles.input}
              placeholder="Non-striker name (type for suggestions)"
              value={nonStriker}
              onChange={(e) => handleNonStrikerNameChange(e.target.value)}
              onFocus={() => nonStrikerSuggestions.length > 0 && setShowNonStrikerSuggestions(true)}
              onKeyPress={handleKeyPress}
            />
            {showNonStrikerSuggestions && renderBattingSuggestions(nonStrikerSuggestions, handleSelectNonStriker)}
          </div>
        </div>

        {/* ── BOWLER ── */}
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
          {isDuplicateBowler && (
            <div className={styles.duplicateWarning}>
              ⚠️ Same jersey as {bowlerJersey.trim() === strikerJersey.trim() ? "Striker" : "Non-Striker"}
            </div>
          )}
          {bowlerExisting && !isDuplicateBowler && (
            <div className={styles.existingPlayer}>
              ✅ Found: <strong>{bowlerExisting.name}</strong> — {bowlerExisting.wickets}W, Eco:{" "}
              {bowlerExisting.ballsBowled > 0
                ? (bowlerExisting.runsGiven / (bowlerExisting.ballsBowled / 6)).toFixed(2)
                : "0.00"}
            </div>
          )}
          <div className={styles.inputContainer} style={{ position: "relative" }}>
            <input
              className={styles.input}
              placeholder="Bowler name (type for suggestions)"
              value={bowler}
              onChange={(e) => handleBowlerNameChange(e.target.value)}
              onFocus={() => bowlerSuggestions.length > 0 && setShowBowlerSuggestions(true)}
              onKeyPress={handleKeyPress}
            />
            {showBowlerSuggestions && renderBattingSuggestions(bowlerSuggestions, handleSelectBowler, true)}
          </div>
        </div>

        {error && <p className={styles.errorText}>{error}</p>}

        <div className={styles.buttonRow}>
          <button
            className={styles.startBtn}
            onClick={handleStart}
            disabled={
              !striker.trim() || !nonStriker.trim() || !bowler.trim() ||
              !strikerJersey.trim() || !nonStrikerJersey.trim() || !bowlerJersey.trim() ||
              hasLockError ||
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
