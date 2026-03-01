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

// ⚠️ NOTE: This compares playerName (displayName) against matchData.teamACaptain / teamBCaptain.
// These captain values come from MatchSetupPage where the user typed the name during setup.
// As long as the captain is not renamed mid-match, this works correctly.
// If you later support renaming, store captainPlayerId in matchData instead of captainName,
// and look up displayName at render time.
