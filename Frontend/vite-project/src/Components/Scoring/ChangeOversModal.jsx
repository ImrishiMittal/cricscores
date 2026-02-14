import { useState, useEffect } from 'react';
import styles from './ChangeOversModal.module.css';

function ChangeOversModal({ 
  matchData, 
  currentOvers,
  currentBalls,
  onConfirm, 
  onClose 
}) {
  const [newOvers, setNewOvers] = useState('');
  const [error, setError] = useState('');
  const [warning, setWarning] = useState('');
  const [validationInfo, setValidationInfo] = useState(null);

  // Calculate current overs in decimal format
  const currentOversDecimal = currentOvers + (currentBalls / 6);
  const totalOvers = Number(matchData.overs || 50);

  // Set validation info on mount
  useEffect(() => {
    setValidationInfo({
      currentTotal: totalOvers,
      currentBowled: currentOversDecimal.toFixed(2),
      minAllowed: Math.ceil(currentOversDecimal),
      maxAllowed: 50,
    });
  }, [totalOvers, currentOversDecimal]);

  const handleOversChange = (value) => {
    setNewOvers(value);
    setError('');

    if (!value) {
      setWarning('');
      return;
    }

    const overs = parseFloat(value);

    if (isNaN(overs)) {
      setWarning('');
      return;
    }

    if (overs === totalOvers) {
      setWarning('');
    } else if (overs > totalOvers) {
      setWarning(`Increasing total overs from ${totalOvers} to ${overs}`);
    } else if (overs < totalOvers) {
      setWarning(`Decreasing total overs from ${totalOvers} to ${overs}`);
    }
  };

  const handleConfirm = () => {
    if (!newOvers) {
      setError('Please enter a valid number');
      return;
    }

    const overs = parseFloat(newOvers);

    if (isNaN(overs)) {
      setError('Please enter a valid number');
      return;
    }

    if (overs <= 0) {
      setError('Overs must be greater than 0');
      return;
    }

    if (overs <= currentOversDecimal) {
      setError(`Cannot set overs ≤ ${currentOversDecimal.toFixed(2)} (already bowled)`);
      return;
    }

    if (overs > validationInfo.maxAllowed) {
      setError(`Maximum ${validationInfo.maxAllowed} overs allowed`);
      return;
    }

    onConfirm({
      newOvers: overs,
      oldOvers: totalOvers,
    });
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.title}>🏏 Change Total Overs</h2>

        {validationInfo && (
          <div className={styles.statusBox}>
            <div className={styles.statusRow}>
              <span className={styles.label}>Current Total:</span>
              <span className={styles.value}>{validationInfo.currentTotal} overs</span>
            </div>
            <div className={styles.statusRow}>
              <span className={styles.label}>Already Bowled:</span>
              <span className={styles.value}>{validationInfo.currentBowled} overs</span>
            </div>
          </div>
        )}

        {validationInfo && (
          <div className={styles.infoBox}>
            <p className={styles.infoTitle}>Constraints:</p>
            <ul className={styles.infoList}>
              <li>✅ Minimum allowed: <strong>{validationInfo.minAllowed}</strong></li>
              <li>🔺 Maximum allowed: <strong>{validationInfo.maxAllowed}</strong></li>
              <li>📍 Already bowled: <strong>{validationInfo.currentBowled}</strong></li>
            </ul>
            <p className={styles.reasonText}>
              New overs must be greater than {validationInfo.currentBowled} (already bowled)
            </p>
          </div>
        )}

        <div className={styles.inputSection}>
          <label className={styles.label}>New Total Overs:</label>
          <input
            type="number"
            min={validationInfo?.minAllowed}
            max="50"
            step="0.1"
            className={`${styles.input} ${error ? styles.inputError : ''}`}
            value={newOvers}
            onChange={(e) => handleOversChange(e.target.value)}
            placeholder={`${validationInfo?.minAllowed} - 50`}
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
            disabled={!newOvers}
          >
            Confirm Change
          </button>
        </div>
      </div>
    </div>
  );
}

export default ChangeOversModal;
