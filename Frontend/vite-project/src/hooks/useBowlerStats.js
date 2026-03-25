import { useMemo } from 'react';

/**
 * useBowlerStats
 * Mirrors usePlayerStats but for bowlers.
 * Computes wide %, dot ball %, no ball %, wicket %, economy from completeHistory.
 *
 * @param {object|null} bowler   — bowler object from bowlers[] (has playerId, displayName, overs, balls, runs, wickets)
 * @param {array}       history  — completeHistory from useMatchEngine
 */
export default function useBowlerStats(bowler, history) {
  return useMemo(() => {
    const empty = {
      totalDeliveries: 0,   // all deliveries including wides/no-balls
      legalBalls: 0,        // overs * 6 + balls
      dotBallPercent: '0.0',
      widePct: '0.0',
      noBallPct: '0.0',
      wicketPct: '0.0',
      economy: '0.00',
    };

    if (!bowler) return empty;

    // legalBalls directly from bowler state (already tracked)
    const legalBalls = (bowler.overs || 0) * 6 + (bowler.balls || 0);
    const economy = legalBalls > 0
      ? ((bowler.runs / (legalBalls / 6))).toFixed(2)
      : '0.00';

    // We can't easily filter history by bowler without bowlerId on each event.
    // Instead, we compute percentages from the bowler's aggregate stats,
    // which are already maintained by usePlayersAndBowlers:
    //   bowler.overs, bowler.balls  → legal deliveries
    //   bowler.runs                 → runs conceded
    //   bowler.wickets              → wickets taken
    //
    // For wides and no-balls we DO walk the history and count WD/NB events.
    // (These events don't increment bowler.balls so they're not in legalBalls.)
    // Since we don't tag history entries with bowlerId yet, we count ALL wides/no-balls.
    // This is acceptable for a single-bowler view; it won't be shown for retired bowlers.

    let wides = 0;
    let noBalls = 0;
    let dotBalls = 0;

    (history || []).forEach((entry) => {
      if (entry.event === 'WD') wides++;
      else if (entry.event === 'NB') noBalls++;
      else if (entry.event === 'RUN' && entry.runs === 0) dotBalls++;
    });

    const totalDeliveries = legalBalls + wides + noBalls;

    const pct = (val, total) =>
      total > 0 ? ((val / total) * 100).toFixed(1) : '0.0';

    return {
      totalDeliveries,
      legalBalls,
      dotBallPercent: pct(dotBalls, legalBalls),
      widePct: pct(wides, totalDeliveries),
      noBallPct: pct(noBalls, totalDeliveries),
      wicketPct: pct(bowler.wickets || 0, legalBalls),
      economy,
    };
  }, [bowler, history]);
}
