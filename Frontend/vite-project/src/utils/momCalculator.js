/**
 * 🏆 MAN OF THE MATCH CALCULATOR
 * Calculates match impact scores for all players
 */

export function calculateManOfTheMatch(innings1Data, innings2Data, winner, matchData) {
    const allPlayers = [];
  
    // Process Team 1 (batting + bowling)
    if (innings1Data) {
      // Batting stats from innings 1
      innings1Data.battingStats?.forEach(player => {
        allPlayers.push({
          name: player.name,
          team: matchData.teamA || "Team 1",
          battingScore: calculateBattingImpact(player),
          bowlingScore: 0, // They bowled in innings 2
          totalScore: 0,
        });
      });
  
      // Bowling stats from innings 1 (they bowled for Team 2)
      innings1Data.bowlingStats?.forEach(bowler => {
        const existing = allPlayers.find(p => p.name === bowler.name);
        if (existing) {
          existing.bowlingScore = calculateBowlingImpact(bowler);
        } else {
          allPlayers.push({
            name: bowler.name,
            team: matchData.teamB || "Team 2",
            battingScore: 0,
            bowlingScore: calculateBowlingImpact(bowler),
            totalScore: 0,
          });
        }
      });
    }
  
    // Process Team 2 (batting + bowling)
    if (innings2Data) {
      // Batting stats from innings 2
      innings2Data.battingStats?.forEach(player => {
        const existing = allPlayers.find(p => p.name === player.name);
        if (existing) {
          existing.battingScore = calculateBattingImpact(player);
        } else {
          allPlayers.push({
            name: player.name,
            team: matchData.teamB || "Team 2",
            battingScore: calculateBattingImpact(player),
            bowlingScore: 0,
            totalScore: 0,
          });
        }
      });
  
      // Bowling stats from innings 2 (they bowled for Team 1)
      innings2Data.bowlingStats?.forEach(bowler => {
        const existing = allPlayers.find(p => p.name === bowler.name);
        if (existing) {
          existing.bowlingScore = calculateBowlingImpact(bowler);
        } else {
          allPlayers.push({
            name: bowler.name,
            team: matchData.teamA || "Team 1",
            battingScore: 0,
            bowlingScore: calculateBowlingImpact(bowler),
            totalScore: 0,
          });
        }
      });
    }
  
    // Add context bonuses
    allPlayers.forEach(player => {
      let contextBonus = 0;
  
      // Winning team bonus
      if (player.team === winner) {
        contextBonus += 10;
      }
  
      // Highest scorer bonus
      const allBatsmen = allPlayers.filter(p => p.battingScore > 0);
      if (allBatsmen.length > 0) {
        const maxBattingScore = Math.max(...allBatsmen.map(p => p.battingScore));
        if (player.battingScore === maxBattingScore && maxBattingScore > 0) {
          contextBonus += 10;
        }
      }
  
      // Most wickets bonus
      const allBowlers = allPlayers.filter(p => p.bowlingScore > 0);
      if (allBowlers.length > 0) {
        const maxBowlingScore = Math.max(...allBowlers.map(p => p.bowlingScore));
        if (player.bowlingScore === maxBowlingScore && maxBowlingScore > 0) {
          contextBonus += 10;
        }
      }
  
      player.totalScore = player.battingScore + player.bowlingScore + contextBonus;
    });
  
    // Sort by total score
    allPlayers.sort((a, b) => b.totalScore - a.totalScore);
  
    return allPlayers[0] || null; // Return Man of the Match
  }
  
  /**
   * 🔥 BATTING IMPACT CALCULATION
   */
  function calculateBattingImpact(player) {
    let score = 0;
  
    const runs = player.runs || 0;
    const balls = player.balls || 0;
    const strikeRate = balls > 0 ? (runs / balls) * 100 : 0;
  
    // Base: +1 per run
    score += runs;
  
    // Strike rate bonuses
    if (strikeRate >= 150) {
      score += 15;
    } else if (strikeRate >= 120) {
      score += 8;
    }
  
    // Milestone bonuses
    if (runs >= 50) {
      score += 25;
    } else if (runs >= 30) {
      score += 10;
    }
  
    // Boundary bonus (4+ boundaries)
    const estimatedBoundaries = Math.floor(runs / 5); // Rough estimate
    if (estimatedBoundaries >= 4) {
      score += 5;
    }
  
    return score;
  }
  
  /**
   * 💥 BOWLING IMPACT CALCULATION
   */
  function calculateBowlingImpact(bowler) {
    let score = 0;
  
    const wickets = bowler.wickets || 0;
    const runs = bowler.runs || 0;
    const overs = bowler.overs || 0;
    const balls = bowler.balls || 0;
  
    const totalOvers = overs + (balls / 6);
    const economy = totalOvers > 0 ? runs / totalOvers : 0;
  
    // Wickets: +25 each
    score += wickets * 25;
  
    // Economy bonuses
    if (economy < 5) {
      score += 15;
    } else if (economy <= 7) {
      score += 8;
    }
  
    // Wicket haul bonus
    if (wickets >= 3) {
      score += 20;
    }
  
    // Maiden over bonus (0 runs in complete over)
    if (runs === 0 && overs >= 1) {
      score += 10;
    }
  
    return score;
  }