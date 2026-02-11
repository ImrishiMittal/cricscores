import { useState } from 'react';
import styles from './FielderInputModal.module.css';

function FielderInputModal({ wicketType, onConfirm, onCancel }) {
  const [fielderName, setFielderName] = useState('');
  const [newBatsmanName, setNewBatsmanName] = useState('');

  const handleSubmit = () => {
    if (!newBatsmanName.trim()) {
      alert('Please enter new batsman name');
      return;
    }

    if ((wicketType === 'runout' || wicketType === 'caught' || wicketType === 'stumped') && !fielderName.trim()) {
      alert('Please enter fielder name');
      return;
    }

    onConfirm({
      fielder: fielderName.trim(),
      newBatsman: newBatsmanName.trim()
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

        <div className={styles.inputGroup}>
          <label className={styles.label}>New Batsman</label>
          <input
            type="text"
            className={styles.input}
            value={newBatsmanName}
            onChange={(e) => setNewBatsmanName(e.target.value)}
            placeholder="Enter batsman name"
            autoFocus={!needsFielder}
          />
        </div>

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