import { useState } from 'react';
import styles from './FielderInputModal.module.css';

function FielderInputModal({ wicketType, onConfirm, onCancel, playerDB }) {
  const [fielderName, setFielderName] = useState('');
  const [fielderJersey, setFielderJersey] = useState('');
  const [existingFielder, setExistingFielder] = useState(null);

  const handleJerseyChange = (val) => {
    setFielderJersey(val);
    setExistingFielder(null);
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
      (wicketType === 'runout' || wicketType === 'caught' || wicketType === 'stumped') &&
      !fielderName.trim()
    ) {
      alert('Please enter fielder name');
      return;
    }

    onConfirm({
      fielder: fielderName.trim(),
      fielderJersey: fielderJersey.trim() || null,
    });
  };

  const needsFielder =
    wicketType === 'runout' || wicketType === 'caught' || wicketType === 'stumped';

  const fielderLabel =
    wicketType === 'runout'
      ? 'Fielder'
      : wicketType === 'caught'
      ? 'Catcher'
      : 'Wicket Keeper';

  return (
    <div className={styles.overlay} onClick={onCancel}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.title}>Wicket Details</h2>

        {needsFielder && (
          <>
            <div className={styles.inputGroup}>
              <label className={styles.label}>{fielderLabel} Jersey (optional)</label>
              <input
                type="number"
                className={styles.input}
                value={fielderJersey}
                onChange={(e) => handleJerseyChange(e.target.value)}
                placeholder="Jersey number"
                autoFocus
              />
            </div>

            {existingFielder && (
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
          <button className={styles.cancelBtn} onClick={onCancel}>Cancel</button>
          <button className={styles.confirmBtn} onClick={handleSubmit}>Confirm</button>
        </div>
      </div>
    </div>
  );
}

export default FielderInputModal;