import { useState } from 'react';
import styles from './WicketTypeModal.module.css';

function WicketTypeModal({ onSelect, onClose }) {
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.title}>Select Wicket Type</h2>
        
        <div className={styles.wicketGrid}>
          <button 
            className={`${styles.wicketBtn} ${styles.runout}`}
            onClick={() => onSelect('runout')}
          >
            🏃 Run Out
          </button>
          
          <button 
            className={`${styles.wicketBtn} ${styles.caught}`}
            onClick={() => onSelect('caught')}
          >
            🤲 Caught
          </button>
          
          <button 
            className={`${styles.wicketBtn} ${styles.bowled}`}
            onClick={() => onSelect('bowled')}
          >
            🎯 Bowled
          </button>
          
          <button 
            className={`${styles.wicketBtn} ${styles.lbw}`}
            onClick={() => onSelect('lbw')}
          >
            🦵 LBW
          </button>
          
          <button 
            className={`${styles.wicketBtn} ${styles.stumped}`}
            onClick={() => onSelect('stumped')}
          >
            🧤 Stumped
          </button>
        </div>

        <button className={styles.cancelBtn} onClick={onClose}>
          Cancel
        </button>
      </div>
    </div>
  );
}

export default WicketTypeModal;