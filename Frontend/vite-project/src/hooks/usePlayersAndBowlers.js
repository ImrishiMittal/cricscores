import { useState, useRef } from "react";

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

  // ✅ NEW: Track dismissed bowlers so they can't bowl again
  const [dismissedBowlers, setDismissedBowlers] = useState([]);
  const dismissedBowlersRef = useRef([]);

  /* ================= START INNINGS ================= */
  const startInnings = (strikerName, nonStrikerName, bowlerName) => {
    setPlayers([
      { name: strikerName, runs: 0, balls: 0, dismissal: null },
      { name: nonStrikerName, runs: 0, balls: 0, dismissal: null },
    ]);

    // ✅ Reset allPlayers and retiredPlayers for new innings
    setAllPlayers([]);
    setRetiredPlayers([]);
    retiredPlayersRef.current = [];

    // ✅ NEW: Reset dismissed bowlers for new innings
    setDismissedBowlers([]);
    dismissedBowlersRef.current = [];

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

  /* ================= RETIRED HURT ================= */

  const retireBatsman = (newBatsmanName) => {
    setPlayers((prev) => {
      const updated = [...prev];
      const retiring = { ...updated[strikerIndex] };

      // Save to allPlayers as "retired hurt"
      const retiredEntry = { ...retiring, dismissal: "retired hurt" };
      setAllPlayers((all) => {
        const exists = all.some((p) => p.name === retiring.name);
        if (!exists) return [...all, retiredEntry];
        return all.map((p) => (p.name === retiring.name ? retiredEntry : p));
      });

      // Save raw stats to ref AND state simultaneously
      const savedEntry = { name: retiring.name, runs: retiring.runs, balls: retiring.balls };
      console.log(`🏥 ${retiring.name} retired hurt on ${retiring.runs}(${retiring.balls})`);
      retiredPlayersRef.current = [
        ...retiredPlayersRef.current.filter((p) => p.name !== retiring.name),
        savedEntry,
      ];
      setRetiredPlayers([...retiredPlayersRef.current]);

      // Put new batsman on the field
      updated[strikerIndex] = { name: newBatsmanName, runs: 0, balls: 0, dismissal: null };
      return updated;
    });
  };

  const returnRetiredBatsman = (retiredPlayerName, replacingIndex) => {
    // Read stats synchronously from ref — immune to stale closure / batching
    const retiredPlayer = retiredPlayersRef.current.find(
      (p) => p.name.toLowerCase().trim() === retiredPlayerName.toLowerCase().trim()
    );

    if (!retiredPlayer) {
      console.error("❌ Retired player not found in ref:", retiredPlayerName);
      return;
    }

    console.log(`✅ ${retiredPlayerName} returning — resumes at ${retiredPlayer.runs}(${retiredPlayer.balls})`);

    // ✅ Save the dismissed batsman at replacingIndex to allPlayers BEFORE overwriting.
    setPlayers((prev) => {
      const updated = [...prev];
      const dismissed = updated[replacingIndex];

      // Add dismissed player to history if they actually batted or have a dismissal
      if (dismissed && (dismissed.balls > 0 || dismissed.dismissal)) {
        setAllPlayers((all) => {
          const exists = all.some((p) => p.name === dismissed.name);
          if (!exists) {
            console.log(`✅ Saving dismissed player to history before retired-hurt return: ${dismissed.name}`);
            return [...all, { ...dismissed }];
          }
          // Update existing entry (e.g. dismissal was set after they were added)
          return all.map((p) => p.name === dismissed.name ? { ...dismissed } : p);
        });
      }

      // Restore retired player with saved stats
      updated[replacingIndex] = {
        name: retiredPlayer.name,
        runs: retiredPlayer.runs,   // ✅ from ref — always correct
        balls: retiredPlayer.balls, // ✅ from ref — always correct
        dismissal: null,
      };
      return updated;
    });

    // Remove from allPlayers (reappears as "not out" via active players)
    setAllPlayers((all) => all.filter((p) => p.name !== retiredPlayerName));

    // Make them the striker
    setStrikerIndex(replacingIndex);
    setNonStrikerIndex(replacingIndex === 0 ? 1 : 0);

    // Remove from ref and state
    retiredPlayersRef.current = retiredPlayersRef.current.filter(
      (p) => p.name !== retiredPlayerName
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

    // ✅ NEW: 🚫 Prevent dismissed bowler from bowling again
    if (dismissedBowlersRef.current.some(
      (d) => d.toLowerCase() === trimmedName.toLowerCase()
    )) {
      setBowlerError(`${trimmedName} has been dismissed and cannot bowl again.`);
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

  /* ================= DISMISS BOWLER ================= */
  const dismissCurrentBowler = (newBowlerName) => {
    const trimmedName = newBowlerName.trim();
    const dismissedName = bowlers[currentBowlerIndex]?.name;

    if (!dismissedName) {
      console.error("❌ No current bowler to dismiss");
      return;
    }

    console.log(`🚫 Dismissing bowler: ${dismissedName}, replacing with: ${trimmedName}`);

    // 1. Blacklist the dismissed bowler
    const updatedDismissed = [
      ...dismissedBowlersRef.current.filter(
        (d) => d.toLowerCase() !== dismissedName.toLowerCase()
      ),
      dismissedName,
    ];
    dismissedBowlersRef.current = updatedDismissed;
    setDismissedBowlers([...updatedDismissed]);

    // 2. Check if replacement already exists in bowlers list
    const existingIndex = bowlers.findIndex(
      (b) => b.name.toLowerCase() === trimmedName.toLowerCase()
    );

    if (existingIndex !== -1) {
      // Switch to existing bowler — over continues from where it was
      setCurrentBowlerIndex(existingIndex);
    } else {
      // Add new bowler — starts at 0 stats, partial over continues
      const newBowler = { name: trimmedName, overs: 0, balls: 0, runs: 0, wickets: 0 };
      setBowlers((prev) => [...prev, newBowler]);
      setCurrentBowlerIndex(bowlers.length); // new bowler lands at current length
    }

    console.log(`✅ ${dismissedName} dismissed. ${trimmedName} now bowling. Over continues.`);
  };

  /* ================= RESTORE (FOR UNDO) ================= */
  const restorePlayersState = (snap) => {
    // ✅ FIX: Safe JSON parsing with proper checks
    try {
      if (snap.players && Array.isArray(snap.players)) {
        setPlayers(JSON.parse(JSON.stringify(snap.players)));
      } else {
        setPlayers([]);
      }
      if (snap.allPlayers && Array.isArray(snap.allPlayers)) {
        setAllPlayers(JSON.parse(JSON.stringify(snap.allPlayers)));
      } else {
        setAllPlayers([]);
      }
      // ✅ RETIRED HURT: restore retiredPlayers on undo, keep ref in sync
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
    // ✅ FIX: Safe JSON parsing with proper checks
    try {
      if (snap.bowlers && Array.isArray(snap.bowlers)) {
        setBowlers(JSON.parse(JSON.stringify(snap.bowlers)));
      } else {
        setBowlers([]);
      }

      setCurrentBowlerIndex(snap.currentBowlerIndex ?? 0);
    } catch (error) {
      console.error("❌ Error restoring bowlers state:", error);
      // Reset to safe defaults
      setBowlers([]);
      setCurrentBowlerIndex(0);
    }
  };

  return {
    players,
    allPlayers, // ✅ NEW: Export allPlayers
    retiredPlayers, // ✅ RETIRED HURT
    retiredPlayersRef, // ✅ exported for ScoringPage name-match check
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
    retireBatsman,          // ✅ RETIRED HURT
    returnRetiredBatsman,   // ✅ RETIRED HURT
    requestNewBowler,
    confirmNewBowler,
    dismissCurrentBowler,   // ✅ NEW
    dismissedBowlersRef,    // ✅ NEW
    restorePlayersState,
    restoreBowlersState,
    bowlerError,
    setBowlerError,
  };
}