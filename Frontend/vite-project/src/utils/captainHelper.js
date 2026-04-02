export const addCaptainTag = (playerJersey, matchData, currentTeam) => {
  if (!matchData || !currentTeam || !playerJersey) return false;

  const jersey = String(playerJersey);

  const isTeamACaptain =
    currentTeam === matchData.teamA &&
    matchData.teamACaptain?.jersey &&
    jersey === String(matchData.teamACaptain.jersey);

  const isTeamBCaptain =
    currentTeam === matchData.teamB &&
    matchData.teamBCaptain?.jersey &&
    jersey === String(matchData.teamBCaptain.jersey);

  return Boolean(isTeamACaptain || isTeamBCaptain);
};

// Usage:
//   const isCaptain = addCaptainTag(player.jersey, matchData, currentTeam);
//   const displayName = isCaptain ? `${player.displayName} (C)` : player.displayName;
//
// matchData.teamACaptain and matchData.teamBCaptain are { jersey, name } objects
// set by the CaptainSearch component in MatchSetupPage.
// Comparison is always by jersey (unique identifier), never by name.
