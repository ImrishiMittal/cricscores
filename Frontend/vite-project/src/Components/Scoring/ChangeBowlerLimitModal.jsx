import { useState, useEffect } from 'react';
import styles from './ChangeBowlerLimitModal.module.css';

function ChangeBowlerLimitModal({ 
  matchData, 
  onConfirm, 
  onClose 
}) {
  const [newLimit, setNewLimit] = useState('');
  const [error, setError] = useState('');
  const [warning, setWarning] = useState('');
  const [validationInfo, setValidationInfo] = useState(null);

  const totalOvers = Number(matchData.overs || 50);
  const currentLimit = matchData.maxOversPerBowler || 0;

  // Set validation info on mount
  useEffect(() => {
    setValidationInfo({
      totalOvers: totalOvers,
      currentLimit: currentLimit || 'Not set',
      minAllowed: 1,
    });
  }, [totalOvers, currentLimit]);

  const handleLimitChange = (value) => {
    setNewLimit(value);
    setError('');

    if (!value) {
      setWarning('');
      return;
    }

    const limit = parseInt(value);

    if (isNaN(limit)) {
      setWarning('');
      return;
    }

    // Show warnings
    if (currentLimit === 0 || !currentLimit) {
      if (limit > 0) {
        setWarning(`Setting bowler limit to ${limit} overs (was unlimited)`);
      }
    } else {
      if (limit > currentLimit) {
        setWarning(`Increasing limit from ${currentLimit} to ${limit} overs`);
      } else if (limit < currentLimit) {
        setWarning(`Decreasing limit from ${currentLimit} to ${limit} overs`);
      } else {
        setWarning('');
      }
    }
  };

  const handleConfirm = () => {
    if (!newLimit) {
      setError('Please enter a valid number');
      return;
    }

    const limit = parseInt(newLimit);

    if (isNaN(limit)) {
      setError('Please enter a valid number');
      return;
    }

    if (limit <= 0) {
      setError('Limit must be greater than 0');
      return;
    }

    onConfirm({
      newLimit: limit,
      oldLimit: currentLimit || 'Not set',
    });
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.title}>🎯 Change Bowler Over Limit</h2>

        {validationInfo && (
          <div className={styles.statusBox}>
            <div className={styles.statusRow}>
              <span className={styles.label}>Total Overs:</span>
              <span className={styles.value}>{validationInfo.totalOvers} overs</span>
            </div>
            <div className={styles.statusRow}>
              <span className={styles.label}>Current Limit:</span>
              <span className={styles.value}>
                {validationInfo.currentLimit}
                {validationInfo.currentLimit !== 'Not set' && ' overs'}
              </span>
            </div>
          </div>
        )}

        {validationInfo && (
          <div className={styles.infoBox}>
          <p className={styles.infoTitle}>Constraints:</p>
          <ul className={styles.infoList}>
            <li>✅ Minimum allowed: <strong>{validationInfo.minAllowed}</strong></li>
          </ul>
        </div>
        )}

        <div className={styles.inputSection}>
          <label className={styles.label}>New Bowler Over Limit:</label>
          <input
            type="number"
            min="1"
            step="1"
            className={`${styles.input} ${error ? styles.inputError : ''}`}
            value={newLimit}
            onChange={(e) => handleLimitChange(e.target.value)}
            placeholder="Enter over limit"
            autoFocus
          />
        </div>

        {warning && (
          <div className={styles.warningBox}>
            ⚠️ {warning}
          </div>
        )}

        {error && (
          <div className={styles.errorBox}>
            ❌ {error}
          </div>
        )}

        <div className={styles.buttonRow}>
          <button className={styles.cancelBtn} onClick={onClose}>
            Cancel
          </button>
          <button 
            className={styles.confirmBtn} 
            onClick={handleConfirm}
            disabled={!newLimit}
          >
            Confirm Change
          </button>
        </div>
      </div>
    </div>
  );
}

export default ChangeBowlerLimitModal;
