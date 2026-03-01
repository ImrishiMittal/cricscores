import { useState, useRef } from "react";
import { v4 as uuidv4 } from "uuid";

export default function usePlayersAndBowlers(matchData) {
  /* ================= PLAYERS ================= */
  const [players, setPlayers] = useState([]);
  const [allPlayers, setAllPlayers] = useState([]); // ✅ Track all batsmen who have played
  const [retiredPlayers, setRetiredPlayers] = useState([]); // ✅ RETIRED HURT: saved stats to restore later
  const retiredPlayersRef = useRef([]); // ✅ mirrors retiredPlayers synchronously — no useEffect
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

  // ✅ Track dismissed bowlers so they can't bowl again
  const [dismissedBowlers, setDismissedBowlers] = useState([]);
  const dismissedBowlersRef = useRef([]);

  /* ================= HELPERS ================= */

  // ✅ Build a fresh batsman object with a stable playerId
  const makeBatsman = (displayName) => ({
    playerId: uuidv4(),
    displayName,
    runs: 0,
    balls: 0,
    dismissal: null,
  });

  // ✅ Build a fresh bowler object with a stable playerId
  const makeBowler = (displayName) => ({
    playerId: uuidv4(),
    displayName,
    overs: 0,
    balls: 0,
    runs: 0,
    wickets: 0,
  });

  /* ================= START INNINGS ================= */
  const startInnings = (strikerName, nonStrikerName, bowlerName) => {
    setPlayers([makeBatsman(strikerName), makeBatsman(nonStrikerName)]);

    // Reset allPlayers and retiredPlayers for new innings
    setAllPlayers([]);
    setRetiredPlayers([]);
    retiredPlayersRef.current = [];

    // Reset dismissed bowlers for new innings
    setDismissedBowlers([]);
    dismissedBowlersRef.current = [];

    setBowlers([makeBowler(bowlerName)]);
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
      if (strikerIndex >= 0 && strikerIndex < updated.length && updated[strikerIndex]) {
        updated[strikerIndex] = {
          ...updated[strikerIndex],
          runs: updated[strikerIndex].runs + runs,
          balls: updated[strikerIndex].balls + 1,
        };
      }
      return updated;
    });
  };

  /* ================= UPDATE BOWLER STATS ================= */
  const addRunsToBowler = (runs) => {
    setBowlers((prev) => {
      const updated = [...prev];
      const b = updated[currentBowlerIndex];
      if (b) updated[currentBowlerIndex] = { ...b, runs: b.runs + runs };
      return updated;
    });
  };

  const addBallToBowler = () => {
    setBowlers((prev) => {
      const updated = [...prev];
      const b = updated[currentBowlerIndex];
      if (!b) return prev;
      const newBalls = b.balls + 1;
      updated[currentBowlerIndex] = {
        ...b,
        balls: newBalls === 6 ? 0 : newBalls,
        overs: newBalls === 6 ? b.overs + 1 : b.overs,
      };
      return updated;
    });
  };

  const addWicketToBowler = () => {
    setBowlers((prev) => {
      const updated = [...prev];
      const b = updated[currentBowlerIndex];
      if (!b) return prev;
      const newBalls = b.balls + 1;
      updated[currentBowlerIndex] = {
        ...b,
        wickets: b.wickets + 1,
        balls: newBalls === 6 ? 0 : newBalls,
        overs: newBalls === 6 ? b.overs + 1 : b.overs,
      };
      return updated;
    });
  };

  /* ================= WICKET FLOW ================= */
  const registerWicket = () => {
    setOutBatsman(strikerIndex);
    setIsWicketPending(true);
  };

  // ✅ Set dismissal info — lookup by index (stable within an innings)
  const setDismissal = (wicketType, fielder, bowlerDisplayName, outBatsmanIndex) => {
    setPlayers((prev) => {
      const updated = [...prev];
      const batsmanIndex = outBatsmanIndex !== undefined ? outBatsmanIndex : outBatsman;

      if (batsmanIndex === null || batsmanIndex === undefined || !updated[batsmanIndex]) {
        console.error("❌ Invalid batsman index for dismissal:", batsmanIndex);
        return prev;
      }

      let dismissalText = "";
      switch (wicketType) {
        case "runout":
          dismissalText = `run out (${fielder})`;
          break;
        case "caught":
          dismissalText = fielder && fielder === bowlerDisplayName
            ? `c & b ${bowlerDisplayName}`
            : `c ${fielder} b ${bowlerDisplayName}`;
          break;
        case "bowled":
          dismissalText = `b ${bowlerDisplayName}`;
          break;
        case "lbw":
          dismissalText = `lbw b ${bowlerDisplayName}`;
          break;
        case "stumped":
          dismissalText = `st ${fielder} b ${bowlerDisplayName}`;
          break;
        default:
          dismissalText = "out";
      }

      updated[batsmanIndex] = { ...updated[batsmanIndex], dismissal: dismissalText };
      console.log(`✅ Dismissal set for ${updated[batsmanIndex].displayName}: ${dismissalText}`);
      return updated;
    });
  };

  // ✅ Replace batsman and save to history — identified by index, not name
  const replaceBatsman = (index, newDisplayName) => {
    setPlayers((prev) => {
      const updated = [...prev];
      if (index !== null && index !== undefined && updated[index]) {
        const dismissedPlayer = { ...updated[index] };

        if (dismissedPlayer.balls > 0 || dismissedPlayer.dismissal) {
          setAllPlayers((all) => {
            // ✅ Dedup by playerId — not name
            const exists = all.some((p) => p.playerId === dismissedPlayer.playerId);
            if (!exists) {
              console.log(`✅ Adding dismissed player to history: ${dismissedPlayer.displayName}`);
              return [...all, dismissedPlayer];
            }
            return all;
          });
        }

        // New batsman gets a fresh playerId
        updated[index] = makeBatsman(newDisplayName);
        console.log(`✅ Replaced batsman at index ${index} with ${newDisplayName}`);
      } else {
        console.error("❌ Invalid index for batsman replacement:", index);
      }
      return updated;
    });
  };

  /* ================= RETIRED HURT ================= */
  const retireBatsman = (newBatsmanName) => {
    setPlayers((prev) => {
      const updated = [...prev];
      const retiring = { ...updated[strikerIndex] };

      // Save to allPlayers as "retired hurt"
      const retiredEntry = { ...retiring, dismissal: "retired hurt" };
      setAllPlayers((all) => {
        const exists = all.some((p) => p.playerId === retiring.playerId);
        if (!exists) return [...all, retiredEntry];
        return all.map((p) => p.playerId === retiring.playerId ? retiredEntry : p);
      });

      // Save raw stats to ref AND state — keyed by playerId
      const savedEntry = {
        playerId: retiring.playerId,
        displayName: retiring.displayName,
        runs: retiring.runs,
        balls: retiring.balls,
      };
      console.log(`🏥 ${retiring.displayName} retired hurt on ${retiring.runs}(${retiring.balls})`);
      retiredPlayersRef.current = [
        ...retiredPlayersRef.current.filter((p) => p.playerId !== retiring.playerId),
        savedEntry,
      ];
      setRetiredPlayers([...retiredPlayersRef.current]);

      // Put new batsman on the field with fresh identity
      updated[strikerIndex] = makeBatsman(newBatsmanName);
      return updated;
    });
  };

  const returnRetiredBatsman = (retiredPlayerName, replacingIndex) => {
    // ✅ Find by displayName (user-facing lookup) — identity is playerId
    const retiredPlayer = retiredPlayersRef.current.find(
      (p) => p.displayName.toLowerCase().trim() === retiredPlayerName.toLowerCase().trim()
    );

    if (!retiredPlayer) {
      console.error("❌ Retired player not found in ref:", retiredPlayerName);
      return;
    }

    console.log(`✅ ${retiredPlayerName} returning — resumes at ${retiredPlayer.runs}(${retiredPlayer.balls})`);

    setPlayers((prev) => {
      const updated = [...prev];
      const dismissed = updated[replacingIndex];

      // Save the dismissed batsman to history before overwriting
      if (dismissed && (dismissed.balls > 0 || dismissed.dismissal)) {
        setAllPlayers((all) => {
          const exists = all.some((p) => p.playerId === dismissed.playerId);
          if (!exists) {
            console.log(`✅ Saving dismissed player to history: ${dismissed.displayName}`);
            return [...all, { ...dismissed }];
          }
          return all.map((p) => p.playerId === dismissed.playerId ? { ...dismissed } : p);
        });
      }

      // Restore retired player — reuse original playerId so stats remain linked
      updated[replacingIndex] = {
        playerId: retiredPlayer.playerId, // ✅ same identity restored
        displayName: retiredPlayer.displayName,
        runs: retiredPlayer.runs,
        balls: retiredPlayer.balls,
        dismissal: null,
      };
      return updated;
    });

    // Remove from allPlayers (they're active again)
    setAllPlayers((all) => all.filter((p) => p.playerId !== retiredPlayer.playerId));

    setStrikerIndex(replacingIndex);
    setNonStrikerIndex(replacingIndex === 0 ? 1 : 0);

    // Remove from ref and state
    retiredPlayersRef.current = retiredPlayersRef.current.filter(
      (p) => p.playerId !== retiredPlayer.playerId
    );
    setRetiredPlayers([...retiredPlayersRef.current]);
  };

  const confirmNewBatsman = (name) => {
    setPlayers((prev) => {
      const updated = [...prev];
      if (outBatsman === null || outBatsman === undefined) {
        console.error("❌ No out batsman to replace");
        return prev;
      }
      updated[outBatsman] = makeBatsman(name);
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

    // ✅ Match by displayName (user input is always a name string)
    const existingIndex = bowlers.findIndex(
      (b) => b.displayName.toLowerCase() === trimmedName.toLowerCase()
    );

    let selectedIndex;
    let selectedBowler;

    if (existingIndex !== -1) {
      selectedIndex = existingIndex;
      selectedBowler = bowlers[existingIndex];
    } else {
      selectedIndex = bowlers.length;
      selectedBowler = makeBowler(trimmedName);
    }

    const completedOvers = selectedBowler.overs;

    /* ── Validation ── */

    if (previousBowlerIndex !== null && selectedIndex === previousBowlerIndex) {
      setBowlerError("Same bowler cannot bowl consecutive overs!");
      return;
    }

    if (
      matchData?.maxOversPerBowler &&
      !matchData?.isTestMatch &&
      completedOvers >= matchData.maxOversPerBowler
    ) {
      setBowlerError(`Max ${matchData.maxOversPerBowler} overs allowed per bowler in this innings.`);
      return;
    }

    // ✅ Dismissed bowler check by displayName (user types names)
    if (dismissedBowlersRef.current.some(
      (d) => d.toLowerCase() === trimmedName.toLowerCase()
    )) {
      setBowlerError(`${trimmedName} has been dismissed and cannot bowl again.`);
      return;
    }

    /* ── Apply ── */

    if (existingIndex !== -1) {
      setCurrentBowlerIndex(existingIndex);
    } else {
      setBowlers((prev) => [...prev, selectedBowler]);
      setCurrentBowlerIndex(selectedIndex);
    }

    setBowlerError(null);
    setIsNewBowlerPending(false);

    return { success: true };
  };

  /* ================= DISMISS BOWLER ================= */
  const dismissCurrentBowler = (newBowlerName) => {
    const trimmedName = newBowlerName.trim();
    const dismissedName = bowlers[currentBowlerIndex]?.displayName;

    if (!dismissedName) {
      console.error("❌ No current bowler to dismiss");
      return;
    }

    console.log(`🚫 Dismissing bowler: ${dismissedName}, replacing with: ${trimmedName}`);

    const updatedDismissed = [
      ...dismissedBowlersRef.current.filter(
        (d) => d.toLowerCase() !== dismissedName.toLowerCase()
      ),
      dismissedName,
    ];
    dismissedBowlersRef.current = updatedDismissed;
    setDismissedBowlers([...updatedDismissed]);

    const existingIndex = bowlers.findIndex(
      (b) => b.displayName.toLowerCase() === trimmedName.toLowerCase()
    );

    if (existingIndex !== -1) {
      setCurrentBowlerIndex(existingIndex);
    } else {
      const newBowler = makeBowler(trimmedName);
      setBowlers((prev) => [...prev, newBowler]);
      setCurrentBowlerIndex(bowlers.length);
    }

    console.log(`✅ ${dismissedName} dismissed. ${trimmedName} now bowling.`);
  };

  /* ================= RESTORE (FOR UNDO) ================= */
  const restorePlayersState = (snap) => {
    try {
      setPlayers(snap.players && Array.isArray(snap.players)
        ? JSON.parse(JSON.stringify(snap.players)) : []);
      setAllPlayers(snap.allPlayers && Array.isArray(snap.allPlayers)
        ? JSON.parse(JSON.stringify(snap.allPlayers)) : []);

      if (snap.retiredPlayers && Array.isArray(snap.retiredPlayers)) {
        const restored = JSON.parse(JSON.stringify(snap.retiredPlayers));
        retiredPlayersRef.current = restored;
        setRetiredPlayers(restored);
      } else {
        retiredPlayersRef.current = [];
        setRetiredPlayers([]);
      }

      setStrikerIndex(snap.strikerIndex ?? 0);
      setNonStrikerIndex(snap.nonStrikerIndex ?? 1);
      setIsWicketPending(snap.isWicketPending || false);
      setOutBatsman(snap.outBatsman ?? null);
    } catch (error) {
      console.error("❌ Error restoring players state:", error);
      setPlayers([]);
      setAllPlayers([]);
      retiredPlayersRef.current = [];
      setRetiredPlayers([]);
      setStrikerIndex(0);
      setNonStrikerIndex(1);
      setIsWicketPending(false);
      setOutBatsman(null);
    }
  };

  const restoreBowlersState = (snap) => {
    try {
      setBowlers(snap.bowlers && Array.isArray(snap.bowlers)
        ? JSON.parse(JSON.stringify(snap.bowlers)) : []);
      setCurrentBowlerIndex(snap.currentBowlerIndex ?? 0);
    } catch (error) {
      console.error("❌ Error restoring bowlers state:", error);
      setBowlers([]);
      setCurrentBowlerIndex(0);
    }
  };

  /* ================= RENAME ================= */
  // ✅ Update displayName by playerId — stats and history never break
  const renamePlayer = (playerId, newDisplayName) => {
    setPlayers((prev) =>
      prev.map((p) => p.playerId === playerId ? { ...p, displayName: newDisplayName } : p)
    );
    setAllPlayers((prev) =>
      prev.map((p) => p.playerId === playerId ? { ...p, displayName: newDisplayName } : p)
    );
    setRetiredPlayers((prev) =>
      prev.map((p) => p.playerId === playerId ? { ...p, displayName: newDisplayName } : p)
    );
    retiredPlayersRef.current = retiredPlayersRef.current.map((p) =>
      p.playerId === playerId ? { ...p, displayName: newDisplayName } : p
    );
  };

  /* ================= DISPLAY NAME LOOKUP ================= */
  const getDisplayName = (list, playerId) =>
    list.find((p) => p.playerId === playerId)?.displayName ?? playerId;

  /* ================= EXPORTS ================= */
  return {
    players,
    allPlayers,
    retiredPlayers,
    retiredPlayersRef,
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
    retireBatsman,
    returnRetiredBatsman,
    requestNewBowler,
    confirmNewBowler,
    dismissCurrentBowler,
    dismissedBowlersRef,
    restorePlayersState,
    restoreBowlersState,
    renamePlayer,        // ✅ NEW — update displayName safely by playerId
    getDisplayName,      // ✅ NEW — resolve displayName from playerId for UI
    bowlerError,
    setBowlerError,
  };
}