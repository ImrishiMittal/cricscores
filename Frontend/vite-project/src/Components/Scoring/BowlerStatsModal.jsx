import React from 'react';
import styles from './BatsmanCard.module.css'; // reuse exact same CSS as PlayerStatsModal

/**
 * BowlerStatsModal
 * Shown when user taps the bowler name in InfoStrip.
 * Offers Rename + Bowler Stats (wide %, dot ball %, no ball %, wicket %, economy).
 *
 * Props:
 *   bowler  — bowler object { playerId, displayName, overs, balls, runs, wickets }
 *   stats   — result of useBowlerStats(bowler, history)
 *   onRename(playerId, displayName) — open rename modal
 *   onClose()
 */
function BowlerStatsModal({ bowler, stats, onRename, onClose }) {
  if (!bowler) return null;

  const oversDisplay = `${bowler.overs || 0}.${bowler.balls || 0}`;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <h2 className={styles.modalTitle}>BOWLER</h2>
        <div className={styles.playerName}>{bowler.displayName}</div>

        {/* Main stats line */}
        <div className={styles.mainStats}>
          {bowler.runs || 0} runs · {bowler.wickets || 0} wkts · {oversDisplay} ov
        </div>

        {/* Economy */}
        <div className={styles.strikeRate}>
          Economy: <span className={styles.srValue}>{stats.economy}</span>
        </div>

        <div className={styles.divider} />

        {/* Ball analysis header */}
        <div className={styles.ballAnalysis}>
          Delivery Analysis · {stats.legalBalls} legal balls
        </div>

        {/* Dot Ball % */}
        <div className={styles.statRow}>
          <span className={styles.statIcon}>⚫</span>
          <span className={styles.statLabel}>Dot Ball %</span>
          <span className={styles.statBar}>
            <span
              className={styles.statFill}
              style={{
                width: `${Math.min(parseFloat(stats.dotBallPercent), 100)}%`,
                backgroundColor: '#95a5a6',
              }}
            />
          </span>
          <span className={styles.statValue}>{stats.dotBallPercent}%</span>
        </div>

        {/* Wide % */}
        <div className={styles.statRow}>
          <span className={styles.statIcon}>↔️</span>
          <span className={styles.statLabel}>Wide %</span>
          <span className={styles.statBar}>
            <span
              className={styles.statFill}
              style={{
                width: `${Math.min(parseFloat(stats.widePct), 100)}%`,
                backgroundColor: '#f39c12',
              }}
            />
          </span>
          <span className={styles.statValue}>{stats.widePct}%</span>
        </div>

        {/* No Ball % */}
        <div className={styles.statRow}>
          <span className={styles.statIcon}>🚫</span>
          <span className={styles.statLabel}>No Ball %</span>
          <span className={styles.statBar}>
            <span
              className={styles.statFill}
              style={{
                width: `${Math.min(parseFloat(stats.noBallPct), 100)}%`,
                backgroundColor: '#e74c3c',
              }}
            />
          </span>
          <span className={styles.statValue}>{stats.noBallPct}%</span>
        </div>

        {/* Wicket % */}
        <div className={styles.statRow}>
          <span className={styles.statIcon}>🏏</span>
          <span className={styles.statLabel}>Wicket %</span>
          <span className={styles.statBar}>
            <span
              className={styles.statFill}
              style={{
                width: `${Math.min(parseFloat(stats.wicketPct), 100)}%`,
                backgroundColor: '#2ecc71',
              }}
            />
          </span>
          <span className={styles.statValue}>{stats.wicketPct}%</span>
        </div>

        {/* Buttons */}
        <div className={styles.buttonRow}>
          <button
            className={styles.renameBtn}
            onClick={() => {
              onClose();
              onRename(bowler.playerId, bowler.displayName);
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

export default BowlerStatsModal;
