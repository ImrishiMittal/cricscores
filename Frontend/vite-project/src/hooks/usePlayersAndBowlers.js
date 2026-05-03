import { useState, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
 let _battingOrderCounter = 0;
export default function usePlayersAndBowlers(matchData, playerDB) {
  /* ================= PLAYERS ================= */
  const [players, setPlayers] = useState([]);
  const [allPlayers, setAllPlayers] = useState([]);
  const [retiredPlayers, setRetiredPlayers] = useState([]);
  const retiredPlayersRef = useRef([]);
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

  const [dismissedBowlers, setDismissedBowlers] = useState([]);
  const dismissedBowlersRef = useRef([]);

  /* ================= HELPERS ================= */


const makeBatsman = (displayName, jersey = null, orderIndex = null) => ({
  playerId: jersey ? String(jersey) : uuidv4(),
  displayName,
  runs: 0,
  balls: 0,
  fours: 0,
  sixes: 0,
  dismissal: null,
  battingOrder: orderIndex !== null ? orderIndex : _battingOrderCounter++,
});

  const makeBowler = (displayName, jersey = null) => ({
    playerId: jersey ? String(jersey) : uuidv4(),
    displayName,
    overs: 0,
    balls: 0,
    runs: 0,
    wickets: 0,
  });

  // ✅ FIX BUG 1: Save player to DB whenever a new player is introduced
  const savePlayerToDB = (displayName, jersey) => {
    if (!playerDB || !jersey || !displayName?.trim()) return;
  
    playerDB.createOrGetPlayer(
      String(jersey),      // ✅ jersey is the KEY
      displayName.trim()   // ✅ name is the VALUE
    );
  };

  /* ================= START INNINGS ================= */
  const startInnings = (strikerData, nonStrikerData, bowlerData) => {
    _battingOrderCounter = 0;  // reset
    savePlayerToDB(strikerData.name, strikerData.jersey);
    savePlayerToDB(nonStrikerData.name, nonStrikerData.jersey);
    savePlayerToDB(bowlerData.name, bowlerData.jersey);
  
    setPlayers([
      makeBatsman(strikerData.name, strikerData.jersey),   // ✅ no explicit index — counter goes 0→1
      makeBatsman(nonStrikerData.name, nonStrikerData.jersey), // counter goes 1→2
    ]);

    setAllPlayers([]);
    setRetiredPlayers([]);
    retiredPlayersRef.current = [];

    setDismissedBowlers([]);
    dismissedBowlersRef.current = [];

    setBowlers([makeBowler(bowlerData.name, bowlerData.jersey)]);
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
      const striker = updated[strikerIndex];
      if (!striker) return prev;
      updated[strikerIndex] = {
        ...striker,
        runs: striker.runs + runs,
        balls: striker.balls + 1,
        fours: runs === 4 ? (striker.fours || 0) + 1 : striker.fours || 0,
        sixes: runs === 6 ? (striker.sixes || 0) + 1 : striker.sixes || 0,
      };
      return updated;
    });
  };
  const addBallToStriker = () => {
    setPlayers((prev) => {
      const updated = [...prev];
      const s = updated[strikerIndex];
      if (!s) return prev;
      updated[strikerIndex] = { ...s, balls: s.balls + 1 };
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

  const setDismissal = (wicketType, fielder, bowlerDisplayName, outBatsmanIndex) => {
    setPlayers((prev) => {
      const updated = [...prev];
      const batsmanIndex =
        outBatsmanIndex !== undefined ? outBatsmanIndex : outBatsman;

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
          dismissalText =
            fielder && fielder === bowlerDisplayName
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
        case "hitwicket":
          dismissalText = `hit wicket b ${bowlerDisplayName}`;
          break;
        default:
          dismissalText = "out";
      }

      updated[batsmanIndex] = {
        ...updated[batsmanIndex],
        dismissal: dismissalText,
      };
      return updated;
    });
  };

  const replaceBatsman = (index, batsmanData) => {
    const name = typeof batsmanData === "string" ? batsmanData : batsmanData.name;
    const jersey = typeof batsmanData === "object" ? batsmanData.jersey : null;
  
    savePlayerToDB(name, jersey);
  
    setPlayers((prev) => {
      const updated = [...prev];
  
      if (index !== null && index !== undefined && updated[index]) {
        const dismissedPlayer = { ...updated[index] };
  
        if (dismissedPlayer.balls > 0 || dismissedPlayer.dismissal) {
          setAllPlayers((all) => {
            const exists = all.some((p) => p.playerId === dismissedPlayer.playerId);
            if (!exists) return [...all, dismissedPlayer];
            return all;
          });
        }
        updated[index] = makeBatsman(name, jersey, _battingOrderCounter++);
      }
  
      return updated;
    });
  };

  /* ================= RETIRED HURT ================= */
  const retireBatsman = (newBatsmanData) => {
    const newBatsmanName =
      typeof newBatsmanData === "string" ? newBatsmanData : newBatsmanData.name;
    const jersey =
      typeof newBatsmanData === "object" ? newBatsmanData.jersey : null;

    // ✅ FIX BUG 1: Save replacement to DB
    savePlayerToDB(newBatsmanName, jersey);

    setPlayers((prev) => {
      const updated = [...prev];
      const retiring = { ...updated[strikerIndex] };

      const retiredEntry = { ...retiring, dismissal: "retired hurt" };
      setAllPlayers((all) => {
        const exists = all.some((p) => p.playerId === retiring.playerId);
        if (!exists) return [...all, retiredEntry];
        return all.map((p) =>
          p.playerId === retiring.playerId ? retiredEntry : p
        );
      });

      const savedEntry = {
        playerId: retiring.playerId,
        displayName: retiring.displayName,
        runs: retiring.runs,
        balls: retiring.balls,
      };
      retiredPlayersRef.current = [
        ...retiredPlayersRef.current.filter(
          (p) => p.playerId !== retiring.playerId
        ),
        savedEntry,
      ];
      setRetiredPlayers([...retiredPlayersRef.current]);

      updated[strikerIndex] = makeBatsman(newBatsmanName, jersey, _battingOrderCounter++);
      return updated;
    });
  };

  const returnRetiredBatsman = (retiredPlayerName, replacingIndex) => {
    const retiredPlayer = retiredPlayersRef.current.find(
      (p) =>
        p.displayName.toLowerCase().trim() ===
        retiredPlayerName.toLowerCase().trim()
    );

    if (!retiredPlayer) return;

    setPlayers((prev) => {
      const updated = [...prev];
      const dismissed = updated[replacingIndex];

      if (dismissed && (dismissed.balls > 0 || dismissed.dismissal)) {
        setAllPlayers((all) => {
          const exists = all.some((p) => p.playerId === dismissed.playerId);
          if (!exists) return [...all, { ...dismissed }];
          return all.map((p) =>
            p.playerId === dismissed.playerId ? { ...dismissed } : p
          );
        });
      }

      updated[replacingIndex] = {
        playerId: retiredPlayer.playerId,
        displayName: retiredPlayer.displayName,
        runs: retiredPlayer.runs,
        balls: retiredPlayer.balls,
        dismissal: null,
      };
      return updated;
    });

    setAllPlayers((all) =>
      all.filter((p) => p.playerId !== retiredPlayer.playerId)
    );

    setStrikerIndex(replacingIndex);
    setNonStrikerIndex(replacingIndex === 0 ? 1 : 0);

    retiredPlayersRef.current = retiredPlayersRef.current.filter(
      (p) => p.playerId !== retiredPlayer.playerId
    );
    setRetiredPlayers([...retiredPlayersRef.current]);
  };

  const confirmNewBatsman = (batsmanData) => {
    const name =
      typeof batsmanData === "string"
        ? batsmanData
        : batsmanData.name;
  
    const jersey =
      typeof batsmanData === "object"
        ? batsmanData.jersey
        : null;
  
    savePlayerToDB(name, jersey);
  
    setPlayers((prev) => {
      const updated = [...prev];
  
      if (outBatsman === null) return prev;
  
      updated[outBatsman] = makeBatsman(name, jersey, _battingOrderCounter++);
  
      return updated;
    });
  
    setIsWicketPending(false);
  };

  /* ================= NEW BOWLER FLOW ================= */
  const requestNewBowler = (lastBowlerIndex = null) => {
    setPreviousBowlerIndex(lastBowlerIndex);
    setIsNewBowlerPending(true);
  };

  const confirmNewBowler = (bowlerData) => {
    const name =
      typeof bowlerData === "string"
        ? bowlerData
        : bowlerData.name;
  
    const jersey =
      typeof bowlerData === "object"
        ? bowlerData.jersey
        : null;
  
    const trimmedName = name?.trim();
  
    if (!trimmedName) {
      setBowlerError("Bowler name required");
      return;
    }
  
    // save to DB
    savePlayerToDB(trimmedName, jersey);
  
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
      selectedBowler = makeBowler(trimmedName, jersey);
    }
  
    const completedOvers = selectedBowler.overs;
  
    if (previousBowlerIndex !== null && selectedIndex === previousBowlerIndex) {
      setBowlerError("Same bowler cannot bowl consecutive overs!");
      return;
    }
  
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
  
    if (
      dismissedBowlersRef.current.some(
        (d) => d.toLowerCase() === trimmedName.toLowerCase()
      )
    ) {
      setBowlerError(
        `${trimmedName} has been dismissed and cannot bowl again.`
      );
      return;
    }
  
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
  const dismissCurrentBowler = (newBowlerData) => {
    const trimmedName =
      typeof newBowlerData === "string"
        ? newBowlerData.trim()
        : newBowlerData.name.trim();
    const jersey =
      typeof newBowlerData === "object" ? newBowlerData.jersey : null;
    const dismissedName = bowlers[currentBowlerIndex]?.displayName;

    if (!dismissedName) return;

    // ✅ FIX BUG 1: Save new bowler to DB
    savePlayerToDB(trimmedName, jersey);

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
      const newBowler = makeBowler(trimmedName, jersey);
      setBowlers((prev) => [...prev, newBowler]);
      setCurrentBowlerIndex(bowlers.length);
    }
  };

  /* ================= RESTORE (FOR UNDO) ================= */
  const restorePlayersState = (snap) => {
    try {
      setPlayers(
        snap.players && Array.isArray(snap.players)
          ? JSON.parse(JSON.stringify(snap.players))
          : []
      );
      setAllPlayers(
        snap.allPlayers && Array.isArray(snap.allPlayers)
          ? JSON.parse(JSON.stringify(snap.allPlayers))
          : []
      );

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
      setBowlers(
        snap.bowlers && Array.isArray(snap.bowlers)
          ? JSON.parse(JSON.stringify(snap.bowlers))
          : []
      );
      setCurrentBowlerIndex(snap.currentBowlerIndex ?? 0);
    } catch (error) {
      console.error("❌ Error restoring bowlers state:", error);
      setBowlers([]);
      setCurrentBowlerIndex(0);
    }
  };

  /* ================= RENAME ================= */
  const renamePlayer = (playerId, newDisplayName) => {
    setPlayers((prev) =>
      prev.map((p) =>
        p.playerId === playerId ? { ...p, displayName: newDisplayName } : p
      )
    );
    setAllPlayers((prev) =>
      prev.map((p) =>
        p.playerId === playerId ? { ...p, displayName: newDisplayName } : p
      )
    );
    setRetiredPlayers((prev) =>
      prev.map((p) =>
        p.playerId === playerId ? { ...p, displayName: newDisplayName } : p
      )
    );
    retiredPlayersRef.current = retiredPlayersRef.current.map((p) =>
      p.playerId === playerId ? { ...p, displayName: newDisplayName } : p
    );
  };

  const renameBowler = (playerId, newDisplayName) => {
    setBowlers((prev) =>
      prev.map((b) =>
        b.playerId === playerId ? { ...b, displayName: newDisplayName } : b
      )
    );
  };

  const getDisplayName = (list, playerId) =>
    list.find((p) => p.playerId === playerId)?.displayName ?? playerId;

  const resetForNewInnings = () => {
    _battingOrderCounter = 0;
    setPlayers([]);
    setAllPlayers([]);
    setBowlers([]);
    setStrikerIndex(0);
    setNonStrikerIndex(1);
    setCurrentBowlerIndex(0);
    setIsWicketPending(false);
    setOutBatsman(null);
    retiredPlayersRef.current = [];
    setRetiredPlayers([]);
  };

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
  setIsNewBowlerPending,  // ✅ ADD ONLY THIS LINE
  setDismissal,
  replaceBatsman,
  startInnings,
  swapStrike,
  addRunsToStriker,
  addRunsToBowler,
  addBallToStriker,
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
  renamePlayer,
  renameBowler,
  getDisplayName,
  bowlerError,
  setBowlerError,
  resetForNewInnings,
};
}