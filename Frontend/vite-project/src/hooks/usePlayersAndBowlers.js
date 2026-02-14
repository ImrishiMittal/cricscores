import { useState } from "react";

export default function usePlayersAndBowlers(matchData) {
  /* ================= PLAYERS ================= */
  const [players, setPlayers] = useState([]);
  const [allPlayers, setAllPlayers] = useState([]); // ✅ NEW: Track all batsmen who have played
  const [strikerIndex, setStrikerIndex] = useState(0);
  const [nonStrikerIndex, setNonStrikerIndex] = useState(1);
  const [isWicketPending, setIsWicketPending] = useState(false);
  const [outBatsman, setOutBatsman] = useState(null);

  /* ================= BOWLERS ================= */
  const [bowlers, setBowlers] = useState([]);
  const [currentBowlerIndex, setCurrentBowlerIndex] = useState(0);
  const [isNewBowlerPending, setIsNewBowlerPending] = useState(false);
  const [previousBowlerIndex, setPreviousBowlerIndex] = useState(null);
  const [bowlerError, setBowlerError] = useState(null);

  /* ================= START INNINGS ================= */
  const startInnings = (strikerName, nonStrikerName, bowlerName) => {
    setPlayers([
      { name: strikerName, runs: 0, balls: 0, dismissal: null },
      { name: nonStrikerName, runs: 0, balls: 0, dismissal: null },
    ]);

    // ✅ Reset allPlayers for new innings
    setAllPlayers([]);

    setBowlers([{ name: bowlerName, overs: 0, balls: 0, runs: 0, wickets: 0 }]);
    setStrikerIndex(0);
    setNonStrikerIndex(1);
    setPreviousBowlerIndex(null);
  };

  /* ================= SWAP STRIKE ================= */
  const swapStrike = () => {
    setStrikerIndex((prev) => {
      setNonStrikerIndex(prev);
      return prev === 0 ? 1 : 0;
    });
  };

  /* ================= UPDATE BATSMAN RUN ================= */
  const addRunsToStriker = (runs) => {
    setPlayers((prev) => {
      const updated = [...prev];
      // ✅ Safety check: ensure strikerIndex is valid and player exists
      if (strikerIndex >= 0 && strikerIndex < updated.length && updated[strikerIndex]) {
        updated[strikerIndex].runs += runs;
        updated[strikerIndex].balls += 1;
      }
      return updated;
    });
  };

  /* ================= UPDATE BOWLER STATS ================= */
  const addRunsToBowler = (runs) => {
    setBowlers((prev) => {
      const updated = [...prev];
      const currentBowler = updated[currentBowlerIndex];
      if (currentBowler) {
        currentBowler.runs += runs;
      }
      return updated;
    });
  };

  const addBallToBowler = () => {
    setBowlers((prev) => {
      const updated = [...prev];
      const currentBowler = updated[currentBowlerIndex];

      if (!currentBowler) return prev;

      currentBowler.balls += 1;
      if (currentBowler.balls === 6) {
        currentBowler.overs += 1;
        currentBowler.balls = 0;
      }

      return updated;
    });
  };

  const addWicketToBowler = () => {
    setBowlers((prev) => {
      const updated = [...prev];
      const currentBowler = updated[currentBowlerIndex];

      if (!currentBowler) return prev;

      currentBowler.wickets += 1;
      currentBowler.balls += 1;
      if (currentBowler.balls === 6) {
        currentBowler.overs += 1;
        currentBowler.balls = 0;
      }

      return updated;
    });
  };

  /* ================= WICKET FLOW ================= */
  const registerWicket = () => {
    setOutBatsman(strikerIndex);
    setIsWicketPending(true);
  };

  // ✅ Set dismissal info
  const setDismissal = (wicketType, fielder, bowlerName, outBatsmanIndex) => {
    setPlayers((prev) => {
      const updated = [...prev];

      const batsmanIndex =
        outBatsmanIndex !== undefined ? outBatsmanIndex : outBatsman;

      if (
        batsmanIndex === null ||
        batsmanIndex === undefined ||
        !updated[batsmanIndex]
      ) {
        console.error("❌ Invalid batsman index for dismissal:", batsmanIndex);
        return prev;
      }

      let dismissalText = "";

      switch (wicketType) {
        case "runout":
          dismissalText = `run out (${fielder})`;
          break;
        case "caught":
          if (fielder && fielder === bowlerName) {
            dismissalText = `c & b ${bowlerName}`;
          } else {
            dismissalText = `c ${fielder} b ${bowlerName}`;
          }
          break;
        case "bowled":
          dismissalText = `b ${bowlerName}`;
          break;
        case "lbw":
          dismissalText = `lbw b ${bowlerName}`;
          break;
        case "stumped":
          dismissalText = `st ${fielder} b ${bowlerName}`;
          break;
        default:
          dismissalText = "out";
      }

      updated[batsmanIndex].dismissal = dismissalText;
      console.log(
        `✅ Dismissal set for ${updated[batsmanIndex].name}: ${dismissalText}`
      );
      return updated;
    });
  };

  // ✅ FIXED: Replace batsman and save to history
  const replaceBatsman = (index, newName) => {
    setPlayers((prev) => {
      const updated = [...prev];
      if (index !== null && index !== undefined && updated[index]) {
        // ✅ Save the dismissed batsman to allPlayers before replacing
        const dismissedPlayer = { ...updated[index] };

        // Only add to allPlayers if they actually batted (or got out without facing a ball)
        if (dismissedPlayer.balls > 0 || dismissedPlayer.dismissal) {
          setAllPlayers((all) => {
            // Check if player already exists (shouldn't happen, but just in case)
            const exists = all.some((p) => p.name === dismissedPlayer.name);
            if (!exists) {
              console.log(
                `✅ Adding dismissed player to history: ${dismissedPlayer.name}`
              );
              return [...all, dismissedPlayer];
            }
            return all;
          });
        }

        // Replace with new batsman
        updated[index] = { name: newName, runs: 0, balls: 0, dismissal: null };
        console.log(`✅ Replaced batsman at index ${index} with ${newName}`);
      } else {
        console.error("❌ Invalid index for batsman replacement:", index);
      }
      return updated;
    });
  };

  const confirmNewBatsman = (name) => {
    setPlayers((prev) => {
      const updated = [...prev];

      if (outBatsman === null || outBatsman === undefined) {
        console.error("❌ No out batsman to replace");
        return prev;
      }

      updated[outBatsman] = { name, runs: 0, balls: 0, dismissal: null };
      return updated;
    });

    setIsWicketPending(false);
  };

  /* ================= NEW BOWLER FLOW ================= */
  const requestNewBowler = (lastBowlerIndex = null) => {
    setPreviousBowlerIndex(lastBowlerIndex);
    setIsNewBowlerPending(true);
  };

  const confirmNewBowler = (name) => {
    const trimmedName = name.trim();
  
    if (!trimmedName) {
      setBowlerError("Bowler name required");
      return;
    }
  
    const existingIndex = bowlers.findIndex(
      (b) => b.name.toLowerCase() === trimmedName.toLowerCase()
    );
  
    let selectedIndex;
    let selectedBowler;
  
    if (existingIndex !== -1) {
      selectedIndex = existingIndex;
      selectedBowler = bowlers[existingIndex];
    } else {
      selectedIndex = bowlers.length;
      selectedBowler = {
        name: trimmedName,
        overs: 0,
        balls: 0,
        runs: 0,
        wickets: 0,
      };
    }
  
    const completedOvers = selectedBowler.overs;
  
    /* ================= VALIDATION ================= */
  
    // 🚫 Prevent consecutive overs
    if (
      previousBowlerIndex !== null &&
      selectedIndex === previousBowlerIndex
    ) {
      setBowlerError("Same bowler cannot bowl consecutive overs!");
      return;
    }
  
    // 🚫 Restrict max overs
    if (
      matchData?.maxOversPerBowler &&
      !matchData?.isTestMatch &&
      completedOvers >= matchData.maxOversPerBowler
    ) {
      setBowlerError(
        `Max ${matchData.maxOversPerBowler} overs allowed per bowler in this innings.`
      );
      return;
    }
  
    /* ================= APPLY ================= */
  
    if (existingIndex !== -1) {
      setCurrentBowlerIndex(existingIndex);
    } else {
      setBowlers((prev) => [...prev, selectedBowler]);
      setCurrentBowlerIndex(selectedIndex);
    }
  
    setBowlerError(null); // ✅ clear previous error
    setIsNewBowlerPending(false);
  
    return { success: true };
  };

  /* ================= RESTORE (FOR UNDO) ================= */
  const restorePlayersState = (snap) => {
    setPlayers(JSON.parse(JSON.stringify(snap.players)));
    setAllPlayers(JSON.parse(JSON.stringify(snap.allPlayers || [])));
    setStrikerIndex(snap.strikerIndex);
    setNonStrikerIndex(snap.nonStrikerIndex);
    setIsWicketPending(snap.isWicketPending || false);
    setOutBatsman(snap.outBatsman || null);
  };

  const restoreBowlersState = (snap) => {
    setBowlers(JSON.parse(JSON.stringify(snap.bowlers)));
    setCurrentBowlerIndex(snap.currentBowlerIndex);
  };

  return {
    players,
    allPlayers, // ✅ NEW: Export allPlayers
    strikerIndex,
    nonStrikerIndex,
    bowlers,
    currentBowlerIndex,
    isWicketPending,
    isNewBowlerPending,
    outBatsman,
    setOutBatsman,
    setIsWicketPending,
    setDismissal,
    replaceBatsman,
    startInnings,
    swapStrike,
    addRunsToStriker,
    addRunsToBowler,
    addBallToBowler,
    addWicketToBowler,
    registerWicket,
    confirmNewBatsman,
    requestNewBowler,
    confirmNewBowler,
    restorePlayersState,
    restoreBowlersState,
    bowlerError,
    setBowlerError,
  };
}
