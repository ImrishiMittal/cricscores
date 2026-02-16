export const addCaptainTag = (playerName, matchData, currentTeam) => {
  if (!matchData || !currentTeam) return playerName;

  const isTeamACaptain =
    currentTeam === matchData.teamA &&
    playerName === matchData.teamACaptain;

  const isTeamBCaptain =
    currentTeam === matchData.teamB &&
    playerName === matchData.teamBCaptain;

  return isTeamACaptain || isTeamBCaptain
    ? `${playerName} (C)`
    : playerName;
};

