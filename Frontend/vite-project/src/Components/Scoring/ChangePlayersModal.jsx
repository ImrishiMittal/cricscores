import { useState, useEffect } from 'react';
import styles from './ChangePlayersModal.module.css';

function ChangePlayersModal({ 
  matchData, 
  currentInnings,
  players,
  allPlayers,
  bowlers,
  onConfirm, 
  onClose 
}) {
  const [selectedTeam, setSelectedTeam] = useState('');
  const [newPlayerCount, setNewPlayerCount] = useState('');
  const [error, setError] = useState('');
  const [warning, setWarning] = useState('');
  const [validationInfo, setValidationInfo] = useState(null);

  // Determine batting and bowling teams based on current innings
  const battingTeam = currentInnings === 1 ? matchData.teamA : matchData.teamB;
  const bowlingTeam = currentInnings === 1 ? matchData.teamB : matchData.teamA;
  
  const battingTeamPlayers = currentInnings === 1 ? matchData.teamAPlayers : matchData.teamBPlayers;
  const bowlingTeamPlayers = currentInnings === 1 ? matchData.teamBPlayers : matchData.teamAPlayers;

  // Calculate validation constraints
  useEffect(() => {
    if (!selectedTeam) return;

    const isBattingTeam = selectedTeam === 'batting';
    const currentTeamSize = isBattingTeam ? battingTeamPlayers : bowlingTeamPlayers;

    if (isBattingTeam) {
      // Batting team validation
      const allBatsmen = [...(allPlayers || []), ...players];
      const playersWhoBatted = allBatsmen.filter(p => p.balls > 0 || p.dismissal).length;
      
      setValidationInfo({
        currentSize: Number(currentTeamSize),
        minAllowed: playersWhoBatted,
        maxAllowed: 11,
        playersInvolved: playersWhoBatted,
        reason: `${playersWhoBatted} batsmen have already played`
      });
    } else {
      // Bowling team validation
      const bowlersUsed = bowlers.length;
      const maxOversPerBowler = matchData.maxOversPerBowler;
      const totalOvers = Number(matchData.overs);
      
      let minRequired = bowlersUsed;
      
      // If max overs per bowler is set, calculate minimum team size needed
      if (maxOversPerBowler && maxOversPerBowler > 0) {
        minRequired = Math.ceil(totalOvers / maxOversPerBowler);
        
        // Also can't be less than bowlers already used
        minRequired = Math.max(minRequired, bowlersUsed);
      }
      
      setValidationInfo({
        currentSize: Number(currentTeamSize),
        minAllowed: minRequired,
        maxAllowed: 11,
        playersInvolved: bowlersUsed,
        reason: maxOversPerBowler 
          ? `${bowlersUsed} bowlers used, need ${minRequired} for ${maxOversPerBowler} overs/bowler limit`
          : `${bowlersUsed} bowlers have already bowled`
      });
    }
  }, [selectedTeam, battingTeamPlayers, bowlingTeamPlayers, players, allPlayers, bowlers, matchData]);

  const handleConfirm = () => {
    if (!selectedTeam) {
      setError('Please select a team');
      return;
    }

    const count = Number(newPlayerCount);
    
    if (!newPlayerCount || count < 1) {
      setError('Please enter a valid number');
      return;
    }

    if (count > validationInfo.maxAllowed) {
      setError(`Maximum ${validationInfo.maxAllowed} players allowed`);
      return;
    }

    if (count < validationInfo.minAllowed) {
      setError(`Minimum ${validationInfo.minAllowed} players required (${validationInfo.reason})`);
      return;
    }

    // All validations passed
    onConfirm({
      team: selectedTeam === 'batting' ? battingTeam : bowlingTeam,
      isBattingTeam: selectedTeam === 'batting',
      newCount: count,
      oldCount: validationInfo.currentSize
    });
  };

  const handlePlayerCountChange = (value) => {
    setNewPlayerCount(value);
    setError('');
    
    const count = Number(value);
    if (!validationInfo || !value) {
      setWarning('');
      return;
    }

    if (count > validationInfo.currentSize) {
      setWarning(`Increasing team size from ${validationInfo.currentSize} to ${count}`);
    } else if (count < validationInfo.currentSize) {
      setWarning(`Decreasing team size from ${validationInfo.currentSize} to ${count}`);
    } else {
      setWarning('');
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.title}>👥 Change Number of Players</h2>

        {/* Team Selection */}
        <div className={styles.section}>
          <p className={styles.sectionLabel}>Select Team:</p>
          <div className={styles.teamButtons}>
            <button
              className={`${styles.teamBtn} ${selectedTeam === 'batting' ? styles.active : ''}`}
              onClick={() => {
                setSelectedTeam('batting');
                setNewPlayerCount('');
                setError('');
                setWarning('');
              }}
            >
              🏏 {battingTeam}
              <span className={styles.teamSubtext}>
                (Batting - Current: {battingTeamPlayers})
              </span>
            </button>
            
            <button
              className={`${styles.teamBtn} ${selectedTeam === 'bowling' ? styles.active : ''}`}
              onClick={() => {
                setSelectedTeam('bowling');
                setNewPlayerCount('');
                setError('');
                setWarning('');
              }}
            >
              ⚡ {bowlingTeam}
              <span className={styles.teamSubtext}>
                (Bowling - Current: {bowlingTeamPlayers})
              </span>
            </button>
          </div>
        </div>

        {/* Validation Info */}
        {selectedTeam && validationInfo && (
          <div className={styles.infoBox}>
            <p className={styles.infoTitle}>Constraints:</p>
            <ul className={styles.infoList}>
              <li>✅ Current team size: <strong>{validationInfo.currentSize}</strong></li>
              <li>🔻 Minimum allowed: <strong>{validationInfo.minAllowed}</strong></li>
              <li>🔺 Maximum allowed: <strong>{validationInfo.maxAllowed}</strong></li>
              <li>👤 Players involved: <strong>{validationInfo.playersInvolved}</strong></li>
            </ul>
            <p className={styles.reasonText}>{validationInfo.reason}</p>
          </div>
        )}

        {/* New Player Count Input */}
        {selectedTeam && (
          <div className={styles.inputSection}>
            <label className={styles.label}>New Number of Players:</label>
            <input
              type="number"
              min={validationInfo?.minAllowed}
              max="11"
              className={`${styles.input} ${error ? styles.inputError : ''}`}
              value={newPlayerCount}
              onChange={(e) => handlePlayerCountChange(e.target.value)}
              placeholder={`${validationInfo?.minAllowed} - 11`}
              autoFocus
            />
          </div>
        )}

        {/* Warning Message */}
        {warning && (
          <div className={styles.warningBox}>
            ⚠️ {warning}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className={styles.errorBox}>
            ❌ {error}
          </div>
        )}

        {/* Buttons */}
        <div className={styles.buttonRow}>
          <button className={styles.cancelBtn} onClick={onClose}>
            Cancel
          </button>
          <button 
            className={styles.confirmBtn} 
            onClick={handleConfirm}
            disabled={!selectedTeam || !newPlayerCount}
          >
            Confirm Change
          </button>
        </div>
      </div>
    </div>
  );
}

export default ChangePlayersModal;
