// src/utils/captainHelper.js

export function addCaptainTag(playerName, matchData, currentBattingTeam) {
    if (!playerName || !matchData) return playerName;
    
    // Determine which team is currently batting
    const firstBattingTeam = matchData.battingFirst || matchData.teamA;
    const isBattingTeamA = currentBattingTeam === matchData.teamA;
    
    const battingCaptain = isBattingTeamA ? matchData.teamACaptain : matchData.teamBCaptain;
    
    // For bowler (opposite team)
    const bowlingCaptain = isBattingTeamA ? matchData.teamBCaptain : matchData.teamACaptain;
    
    // Check if player is either captain
    if (playerName === battingCaptain || playerName === bowlingCaptain) {
      return `${playerName} (C)`;
    }
    
    return playerName;
  }