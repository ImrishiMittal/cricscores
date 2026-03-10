import React, { useEffect } from 'react';
import styles from './HatTrickBanner.module.css';

/**
 * HatTrickBanner - Celebration banner when bowler takes a hat-trick
 * @param {string} bowlerName - Name of bowler who took the hat-trick
 * @param {Function} onClose - Handler to close the banner
 */
function HatTrickBanner({ bowlerName, onClose }) {
  // Auto-close after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.banner} onClick={(e) => e.stopPropagation()}>
        <div className={styles.iconRow}>
          <span className={styles.icon}>🎉</span>
          <span className={styles.icon}>🎊</span>
          <span className={styles.icon}>🎉</span>
        </div>
        
        <h1 className={styles.title}>HAT-TRICK!</h1>
        
        <div className={styles.bowlerSection}>
          <div className={styles.label}>Bowler</div>
          <div className={styles.bowlerName}>{bowlerName}</div>
        </div>

        <div className={styles.wicketBalls}>
          <div className={styles.ball}>W</div>
          <div className={styles.ball}>W</div>
          <div className={styles.ball}>W</div>
        </div>

        <div className={styles.subtitle}>3 wickets in 3 consecutive balls!</div>

        <button className={styles.closeBtn} onClick={onClose}>
          Continue Match
        </button>
      </div>
    </div>
  );
}

export default HatTrickBanner;
