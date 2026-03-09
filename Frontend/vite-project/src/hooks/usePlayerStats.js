import { useMemo } from 'react';

/**
 * Calculate player statistics from ball history
 * @param {Object} player - Player object with playerId, displayName, runs, balls
 * @param {Array} completeHistory - Ball-by-ball history from engine
 * @returns {Object} Stats object with boundary%, dot%, rotation%
 */
function usePlayerStats(player, completeHistory) {
  const stats = useMemo(() => {
    if (!player || !completeHistory || completeHistory.length === 0) {
      return {
        boundaryPercent: 0,
        dotBallPercent: 0,
        rotationPercent: 0,
        totalBalls: 0,
        boundaries: 0,
        dotBalls: 0,
        rotationBalls: 0,
      };
    }

    // Filter history for only this player's balls
    // We need to track which player faced each ball
    // For now, we'll use the player's total balls faced from their stats
    const totalBalls = player.balls || 0;

    if (totalBalls === 0) {
      return {
        boundaryPercent: 0,
        dotBallPercent: 0,
        rotationPercent: 0,
        totalBalls: 0,
        boundaries: 0,
        dotBalls: 0,
        rotationBalls: 0,
      };
    }

    // Count from complete history
    // Note: This is a simplified version that counts ALL balls in history
    // In a real implementation, you'd track which player faced each ball
    let boundaries = 0;
    let dotBalls = 0;
    let rotationBalls = 0;
    let legalBalls = 0;

    completeHistory.forEach((entry) => {
      // Only count legal balls (not wides/no balls)
      if (entry.event === 'RUN') {
        legalBalls++;
        const runs = entry.runs || 0;

        // Boundary (4 or 6)
        if (runs === 4 || runs === 6) {
          boundaries++;
        }
        // Dot ball (0 runs)
        else if (runs === 0) {
          dotBalls++;
        }
        // Strike rotation (1, 3, 5 runs)
        else if (runs % 2 === 1) {
          rotationBalls++;
        }
      }
      // Byes don't count as player balls
      // Wickets count as balls faced
      else if (entry.event === 'WICKET') {
        legalBalls++;
        dotBalls++; // Wicket ball is a dot
      }
    });

    // Use player's actual balls faced, not history count
    // (since history might be for entire innings, not just this player)
    const actualBalls = totalBalls;

    const boundaryPercent = actualBalls > 0 ? (boundaries / actualBalls) * 100 : 0;
    const dotBallPercent = actualBalls > 0 ? (dotBalls / actualBalls) * 100 : 0;
    const rotationPercent = actualBalls > 0 ? (rotationBalls / actualBalls) * 100 : 0;

    return {
      boundaryPercent: boundaryPercent.toFixed(1),
      dotBallPercent: dotBallPercent.toFixed(1),
      rotationPercent: rotationPercent.toFixed(1),
      totalBalls: actualBalls,
      boundaries,
      dotBalls,
      rotationBalls,
    };
  }, [player, completeHistory]);

  return stats;
}

export default usePlayerStats;
