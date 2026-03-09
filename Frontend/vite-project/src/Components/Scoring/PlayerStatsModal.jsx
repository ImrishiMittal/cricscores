import React from 'react';
import styles from './BatsmanCard.module.css';

/**
 * PlayerStatsModal - Shows advanced stats for a batsman
 * @param {Object} player - Player object with displayName, runs, balls
 * @param {Object} stats - Stats from usePlayerStats hook
 * @param {Function} onRename - Handler to open rename modal
 * @param {Function} onClose - Handler to close stats modal
 */
function PlayerStatsModal({ player, stats, onRename, onClose }) {
  if (!player) return null;

  const strikeRate = player.balls > 0 ? ((player.runs / player.balls) * 100).toFixed(1) : '0.0';

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.modalTitle}>BATSMAN</h2>
        
        <div className={styles.playerName}>{player.displayName}</div>
        
        <div className={styles.mainStats}>
          {player.runs} ({player.balls} balls)
        </div>
        
        <div className={styles.strikeRate}>
          Strike Rate: <span className={styles.srValue}>{strikeRate}</span>
        </div>

        <div className={styles.divider} />

        <div className={styles.ballAnalysis}>
          Ball Analysis · {stats.totalBalls} legal balls
        </div>

        <div className={styles.statRow}>
          <span className={styles.statIcon}>💥</span>
          <span className={styles.statLabel}>Boundary %</span>
          <span className={styles.statBar}>
            <span 
              className={styles.statFill} 
              style={{ 
                width: `${Math.min(stats.boundaryPercent, 100)}%`,
                backgroundColor: '#e74c3c'
              }}
            />
          </span>
          <span className={styles.statValue}>{stats.boundaryPercent}%</span>
        </div>

        <div className={styles.statRow}>
          <span className={styles.statIcon}>⚫</span>
          <span className={styles.statLabel}>Dot Ball %</span>
          <span className={styles.statBar}>
            <span 
              className={styles.statFill} 
              style={{ 
                width: `${Math.min(stats.dotBallPercent, 100)}%`,
                backgroundColor: '#95a5a6'
              }}
            />
          </span>
          <span className={styles.statValue}>{stats.dotBallPercent}%</span>
        </div>

        <div className={styles.statRow}>
          <span className={styles.statIcon}>🔄</span>
          <span className={styles.statLabel}>Rotation %</span>
          <span className={styles.statBar}>
            <span 
              className={styles.statFill} 
              style={{ 
                width: `${Math.min(stats.rotationPercent, 100)}%`,
                backgroundColor: '#3498db'
              }}
            />
          </span>
          <span className={styles.statValue}>{stats.rotationPercent}%</span>
        </div>

        <div className={styles.buttonRow}>
          <button 
            className={styles.renameBtn}
            onClick={() => {
              onClose();
              onRename(player.playerId, player.displayName);
            }}
          >
            Rename
          </button>
          <button className={styles.closeBtn} onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default PlayerStatsModal;
