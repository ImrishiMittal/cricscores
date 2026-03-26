import { useState } from 'react';
import styles from './FielderInputModal.module.css';

function FielderInputModal({ wicketType, onConfirm, onCancel }) {
  const [fielderName, setFielderName] = useState('');

  const handleSubmit = () => {
    if ((wicketType === 'runout' || wicketType === 'caught' || wicketType === 'stumped') && !fielderName.trim()) {
      alert('Please enter fielder name');
      return;
    }

    onConfirm({
      fielder: fielderName.trim(),
      // ✅ REMOVED: newBatsman — this is now handled by NewBatsmanModal separately
    });
  };

  const needsFielder = wicketType === 'runout' || wicketType === 'caught' || wicketType === 'stumped';

  return (
    <div className={styles.overlay} onClick={onCancel}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.title}>Wicket Details</h2>

        {needsFielder && (
          <div className={styles.inputGroup}>
            <label className={styles.label}>
              {wicketType === 'runout' ? 'Fielder Name' : wicketType === 'caught' ? 'Catcher Name' : 'Wicket Keeper Name'}
            </label>
            <input
              type="text"
              className={styles.input}
              value={fielderName}
              onChange={(e) => setFielderName(e.target.value)}
              placeholder="Enter name"
              autoFocus
            />
          </div>
        )}

        {/* ✅ REMOVED: New Batsman input — NewBatsmanModal handles this after confirm */}

        <div className={styles.buttonRow}>
          <button className={styles.cancelBtn} onClick={onCancel}>
            Cancel
          </button>
          <button className={styles.confirmBtn} onClick={handleSubmit}>
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

export default FielderInputModal;