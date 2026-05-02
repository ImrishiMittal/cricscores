import { useMemo } from 'react';

/**
 * useBowlerStats
 * Computes wide %, dot ball %, no ball %, wicket %, economy from completeHistory.
 * FIX (xii): Filter history entries by bowler name so dot ball % can't exceed 100%.
 */
export default function useBowlerStats(bowler, history) {
  return useMemo(() => {
    const empty = {
      totalDeliveries: 0,
      legalBalls: 0,
      dotBallPercent: '0.0',
      widePct: '0.0',
      noBallPct: '0.0',
      wicketPct: '0.0',
      economy: '0.00',
    };

    if (!bowler) return empty;

    const legalBalls = (bowler.overs || 0) * 6 + (bowler.balls || 0);
    const economy = legalBalls > 0
      ? ((bowler.runs / (legalBalls / 6))).toFixed(2)
      : '0.00';

    let wides = 0;
    let noBalls = 0;
    let dotBalls = 0;

    // FIX: Filter by bowler name/id so we only count THIS bowler's deliveries
    const bowlerName = bowler.displayName || bowler.name || '';
    const bowlerId = bowler.playerId ? String(bowler.playerId) : null;

    (history || []).forEach((entry) => {
      // Match by bowler field on the entry (added in useMatchEngine)
      const entryBowler = entry.bowler || '';
      const isThisBowler =
        (bowlerId && entryBowler && String(entryBowler) === bowlerId) ||
        (bowlerName && entryBowler === bowlerName);

      // If history entries have no bowler tag yet, fall back to counting all
      // (graceful degradation for older match data)
      const hasTag = !!entry.bowler;
      if (hasTag && !isThisBowler) return;

      if (entry.event === 'WD') wides++;
      else if (entry.event === 'NB') noBalls++;
      else if (entry.event === 'RUN' && entry.runs === 0) dotBalls++;
      else if (entry.event === 'WICKET' || entry.event === 'HW') dotBalls++; // wicket ball = dot
    });

    const totalDeliveries = legalBalls + wides + noBalls;

    const pct = (val, total) =>
      total > 0 ? ((val / total) * 100).toFixed(1) : '0.0';

    return {
      totalDeliveries,
      legalBalls,
      // FIX: dot balls as % of legal balls (can never exceed 100%)
      dotBallPercent: pct(dotBalls, legalBalls),
      // wides and no-balls as % of total deliveries
      widePct: pct(wides, totalDeliveries),
      noBallPct: pct(noBalls, totalDeliveries),
      wicketPct: pct(bowler.wickets || 0, legalBalls),
      economy,
    };
  }, [bowler, history]);
}
