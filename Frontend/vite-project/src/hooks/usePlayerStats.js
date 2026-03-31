import { useMemo } from "react";

function usePlayerStats(player, completeHistory) {
  const stats = useMemo(() => {
    const empty = {
      boundaryPercent: "0.0",
      dotBallPercent: "0.0",
      rotationPercent: "0.0",
      otherPercent: "0.0",
      totalBalls: 0,
      boundaries: 0,
      dotBalls: 0,
      rotationBalls: 0,
      otherBalls: 0,
    };

    if (!player || !completeHistory || completeHistory.length === 0)
      return empty;
    if (!player.balls || player.balls === 0) return empty;

    let boundaries = 0;
    let dotBalls = 0;
    let rotationBalls = 0;
    let otherBalls = 0;
    let totalBalls = 0;

    completeHistory.forEach((entry) => {
      // ✅ Match by strikerId first, fall back to strikerName
      const matchesById =
        entry.strikerId && entry.strikerId === player.playerId;
      const matchesByName =
        !entry.strikerId && entry.strikerName === player.displayName;
      if (!matchesById && !matchesByName) return;

      if (entry.event === "RUN") {
        totalBalls++;
        const runs = entry.runs || 0;
        if (runs === 4 || runs === 6) boundaries++;
        else if (runs === 0) dotBalls++;
        else if (runs % 2 === 1) rotationBalls++;
        else otherBalls++;
      } else if (entry.event === "WICKET" || entry.event === "HW") {
        totalBalls++;
        dotBalls++;
      }
    });

    if (totalBalls === 0) return empty;

    return {
      boundaryPercent: ((boundaries / totalBalls) * 100).toFixed(1),
      dotBallPercent: ((dotBalls / totalBalls) * 100).toFixed(1),
      rotationPercent: ((rotationBalls / totalBalls) * 100).toFixed(1),
      otherPercent: ((otherBalls / totalBalls) * 100).toFixed(1),
      totalBalls,
      boundaries,
      dotBalls,
      rotationBalls,
      otherBalls,
    };
  }, [player, completeHistory]);

  return stats;
}

export default usePlayerStats;
