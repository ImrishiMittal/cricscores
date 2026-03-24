import React from 'react';
import styles from './SuperOverModal.module.css';

/**
 * SuperOverModal - Shown when match is tied and super over is enabled
 * @param {string} teamA - Team A name
 * @param {string} teamB - Team B name  
 * @param {string} battingFirst - Team batting first in super over
 * @param {number} superOverNumber - Which super over (1, 2, 3...)
 * @param {Function} onStart - Start super over
 * @param {Function} onSkip - Skip super over (declare tie)
 */
function SuperOverModal({ teamA, teamB, battingFirst, superOverNumber, onStart, onSkip }) {
  const battingSecond = battingFirst === teamA ? teamB : teamA;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.tieIcon}>🏏</div>
        
        <h1 className={styles.title}>
          {superOverNumber === 1 ? "MATCH TIED!" : `SUPER OVER ${superOverNumber - 1} TIED!`}
        </h1>
        
        <div className={styles.subtitle}>
          {superOverNumber === 1 
            ? "Match ended in a tie. Super Over to decide the winner!" 
            : "Still level! Another Super Over required!"}
        </div>

        <div className={styles.rules}>
          <h3>Super Over Rules</h3>
          <ul>
            <li>🎯 <strong>1 Over</strong> per team (6 balls)</li>
            <li>⚡ <strong>2 Wickets</strong> maximum per team</li>
            <li>🏏 <strong>{battingFirst}</strong> bats first</li>
            <li>🎳 <strong>{battingSecond}</strong> bats second</li>
            <li>🔄 If tied again, repeat Super Over</li>
          </ul>
        </div>

        <div className={styles.battingOrder}>
          <div className={styles.orderItem}>
            <span className={styles.badge}>1st</span>
            <span className={styles.teamName}>{battingFirst}</span>
          </div>
          <div className={styles.orderItem}>
            <span className={styles.badge}>2nd</span>
            <span className={styles.teamName}>{battingSecond}</span>
          </div>
        </div>

        <div className={styles.buttons}>
          <button className={styles.startBtn} onClick={onStart}>
            Start Super Over {superOverNumber}
          </button>
          <button className={styles.skipBtn} onClick={onSkip}>
            Skip (Declare Tie)
          </button>
        </div>
      </div>
    </div>
  );
}

export default SuperOverModal;
