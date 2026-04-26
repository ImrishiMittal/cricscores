import { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import BrandTitle from "../Components/BrandTitle";
import ScoreHeader from "../Components/Scoring/ScoreHeader";
import InfoStrip from "../Components/Scoring/InfoStrip";
import OverBalls from "../Components/Scoring/OverBalls";
import BatsmenRow from "../Components/Scoring/BatsmenRow";
import RunControls from "../Components/Scoring/RunControls";
import ModalManager from "../Components/Scoring/ModalManager";
import styles from "../Components/Scoring/scoring.module.css";
import UtilityBar from "../Components/Scoring/UtilityBar";
import NoResultBanner from "../Components/Scoring/NoResultBanner";
import ScoringModals from "../Components/Scoring/ScoringModals";
import useMatchEngine from "../hooks/useMatchEngine";
import usePlayersAndBowlers from "../hooks/usePlayersAndBowlers";
import usePartnerships from "../hooks/usePartnerships";
import useModalStates from "../hooks/useModalStates";
import useWicketFlow from "../hooks/useWicketFlow";
import useInningsData from "../hooks/useInningsData";
import useHistorySnapshot from "../hooks/useHistorySnapshot";
import useHatTrick from "../hooks/useHatTrick";
import usePlayerDatabase from "../hooks/usePlayerDatabase";
import * as matchApi from "../api/matchApi";

function ScoringPage() {
  const location = useLocation();
  const matchData = location.state || {};
  const navigate = useNavigate();
  const [updatedMatchData, setUpdatedMatchData] = useState(matchData);

  const innings2SnapshotCountRef = useRef(0);
  const currentInningsRef = useRef(1);
  const initialStrikerRef = useRef(null);
  const initialNonStrikerRef = useRef(null);
  const realMatchInnings1DataRef = useRef(null);
  const realMatchInnings2DataRef = useRef(null);
  const soInnings1SavedRef = useRef(false);
  const soCompleteSavedRef = useRef(false);

  const teamABattersRef = useRef(new Set());
  const teamBBattersRef = useRef(new Set());
  const teamABowlersRef = useRef(new Set());
  const teamBBowlersRef = useRef(new Set());

  const dismissedPlayersRef = useRef(new Set());
  const allTimeDismissedRef = useRef(new Set());

  const inningsScoreTrackerRef = useRef({});
  const innings1ScoreSnapshotRef = useRef({});

  const innings1BowlersSnapshotRef = useRef([]);
  const lastKnownBowlersRef = useRef([]);
  const allTimeBowlersRef = useRef(new Set());

  const captainStatsSavedRef = useRef(false);

  const modalStates = useModalStates();
  const wicketFlow = useWicketFlow();
  const hatTrickHook = useHatTrick();
  const playerDBHook = usePlayerDatabase();

  useEffect(() => {
    const existingMatchId = playerDBHook.getCurrentMatchId();
    if (!existingMatchId) {
      const matchId = `match_${Date.now()}`;
      playerDBHook.setCurrentMatchId(matchId);
      captainStatsSavedRef.current = false;
      console.log("🆔 Match ID set:", matchId);
    }
  }, []); // ← empty deps: run once on mount only

  const playersHook = usePlayersAndBowlers(updatedMatchData, playerDBHook);
  const partnershipsHook = usePartnerships();
  const bowlersRef = useRef([]);
  const engine = useMatchEngine(updatedMatchData, playersHook.swapStrike);
  bowlersRef.current = playersHook.bowlers;

  currentInningsRef.current = engine.innings;

  const inningsDataHook = useInningsData(
    engine.completeHistory,
    playersHook.players,
    playersHook.allPlayers,
    playersHook.bowlers,
    engine.score,
    engine.wickets,
    engine.overs,
    engine.balls,
    engine.innings,
    engine.inningsChangeEvent,
    engine.setInningsChangeEvent,
    engine.matchOver,
    partnershipsHook.partnershipRuns,
    partnershipsHook.partnershipBalls,
    playersHook.strikerIndex,
    playersHook.nonStrikerIndex,
    partnershipsHook.savePartnership,
    playersHook.restorePlayersState,
    playersHook.restoreBowlersState,
    partnershipsHook.restorePartnershipState,
    modalStates.setShowStartModal,
    engine.innings1Score,
    engine.innings2Score,
    engine.innings1History,
    engine.winner,
    engine.extras,
    engine.innings1Extras,
    innings1BowlersSnapshotRef,
    engine.innings1HistoryRef
  );

  const historySnapshotHook = useHistorySnapshot(
    modalStates.showStartModal,
    playersHook.players,
    playersHook.allPlayers,
    playersHook.bowlers,
    engine.score,
    engine.wickets,
    engine.balls,
    engine.overs,
    engine.currentOver,
    engine.completeHistory,
    playersHook.strikerIndex,
    playersHook.nonStrikerIndex,
    partnershipsHook.partnershipRuns,
    partnershipsHook.partnershipBalls,
    partnershipsHook.striker1Contribution,
    partnershipsHook.striker2Contribution,
    playersHook.currentBowlerIndex,
    partnershipsHook.partnershipHistory,
    playersHook.isWicketPending,
    playersHook.outBatsman,
    playersHook.retiredPlayers,
    engine.innings,
    engine.extras
  );

  console.log("tossWinner from state:", matchData.tossWinner);

  useEffect(() => {
    if (playersHook.players.length === 0) modalStates.setShowStartModal(true);
  }, []);

  useEffect(() => {
    if (engine.innings === 1) {
      innings2SnapshotCountRef.current = 0;
    } else if (engine.innings === 2) {
      hatTrickHook.resetTracker();
      innings1ScoreSnapshotRef.current = { ...inningsScoreTrackerRef.current };
      inningsScoreTrackerRef.current = {};
    }
    dismissedPlayersRef.current = new Set();
  }, [engine.innings]);

  useEffect(() => {
    if (!engine.overCompleteEvent) return;
    const { isMaiden } = engine.overCompleteEvent;
    const bowler = playersHook.bowlers[playersHook.currentBowlerIndex];
    if (isMaiden && bowler?.playerId) {
      playerDBHook.updatePlayerStats(bowler.playerId, { maidens: 1 });
    }
    const lastBowlerIndex = playersHook.currentBowlerIndex;
    engine.setOverCompleteEvent(null);
    lastKnownBowlersRef.current = [...playersHook.bowlers];
    innings1BowlersSnapshotRef.current = [...lastKnownBowlersRef.current];
    playersHook.bowlers.forEach(b => {
      if (b?.playerId) allTimeBowlersRef.current.add(String(b.playerId));
    });
    console.log(
      "📸 Bowlers snapshot captured:",
      innings1BowlersSnapshotRef.current
    );
    playersHook.requestNewBowler(lastBowlerIndex);
  }, [engine.overCompleteEvent]);

  useEffect(() => {
    if (!engine.inningsChangeEvent || engine.inningsChangeEvent.superOver) return;
  
    if (engine.innings === 1) {
      setTimeout(() => {
        // ✅ THIS DELAY FIXES YOUR ISSUE
  
        const liveBowlers = playersHook.bowlers;
        const snapshot = [...lastKnownBowlersRef.current];
  
        for (const liveBowler of liveBowlers) {
          const key = String(liveBowler.playerId || liveBowler.displayName || "");
          const idx = snapshot.findIndex(
            b => String(b.playerId || b.displayName || "") === key
          );
  
          if (idx >= 0) {
            const snapBalls = snapshot[idx].ballsBowled || snapshot[idx].balls || 0;
            const liveBalls = liveBowler.ballsBowled || liveBowler.balls || 0;
  
            if (liveBalls > snapBalls) {
              snapshot[idx] = { ...liveBowler };
            }
          } else {
            snapshot.push({ ...liveBowler });
          }
        }
  
        lastKnownBowlersRef.current = snapshot;
        innings1BowlersSnapshotRef.current = snapshot;
        snapshot.forEach(b => {
          if (b?.playerId) allTimeBowlersRef.current.add(String(b.playerId));
        });
  
        console.log("📸 [FIXED] Merged bowlers snapshot:", snapshot);
  
      }, 50); // 🔥 IMPORTANT DELAY
    }
  }, [engine.inningsChangeEvent]);

  useEffect(() => {
    if (
      !engine.inningsChangeEvent?.superOver ||
      engine.innings !== 2 ||
      soInnings1SavedRef.current
    )
      return;
    soInnings1SavedRef.current = true;
    const soInnings1Data = inningsDataHook.innings1DataRef?.current;
    if (soInnings1Data) engine.saveSuperOverInnings1Data(soInnings1Data);
  }, [engine.inningsChangeEvent, engine.innings]);

  useEffect(() => {
    console.log(
      "🪙 tossWinner:",
      matchData.tossWinner,
      "| full matchData:",
      matchData
    );
    if (!engine.matchOver || !engine.isSuperOver || soCompleteSavedRef.current)
      return;
    soCompleteSavedRef.current = true;
    const soInnings2Data = inningsDataHook.captureCurrentInningsData(
      playersHook.players,
      playersHook.allPlayers,
      playersHook.bowlers,
      engine.completeHistory,
      engine.score,
      engine.wickets,
      engine.overs,
      engine.balls,
      engine.extras
    );
    engine.saveSuperOverComplete(engine.superOverNumber, soInnings2Data);
  }, [engine.matchOver, engine.isSuperOver, engine.superOverNumber]);

  // ─── REPLACE the captain+team stats useEffect in ScoringPage.js ──────────────
// Find the useEffect block that starts with:
//   useEffect(() => {
//     if (!engine.matchOver || !playerDBHook) return;
//     if (captainStatsSavedRef.current) return;
//     captainStatsSavedRef.current = true;
//
// Replace the entire body with the code below.
// ─────────────────────────────────────────────────────────────────────────────

useEffect(() => {
  if (!engine.matchOver || !playerDBHook) return;
  if (captainStatsSavedRef.current) return;
  captainStatsSavedRef.current = true;

  (async () => {
    const captainA = matchData.teamACaptain;
    const captainB = matchData.teamBCaptain;
    const teamAName = matchData.teamA || "Team 1";
    const teamBName = matchData.teamB || "Team 2";
    const isNR = engine.winner === "NO RESULT";

    // ── STEP 1: Warm cache for captains (may not have batted/bowled) ─────────
    if (captainA?.jersey) {
      await playerDBHook.createOrGetPlayer(captainA.jersey, captainA.name);
    }
    if (captainB?.jersey) {
      await playerDBHook.createOrGetPlayer(captainB.jersey, captainB.name);
    }

    // ── STEP 2: Write captain stats into buffer ──────────────────────────────
    if (isNR) {
      if (captainA?.jersey)
        playerDBHook.updatePlayerStats(captainA.jersey, { captainMatches: 1, captainNR: 1 });
      if (captainB?.jersey)
        playerDBHook.updatePlayerStats(captainB.jersey, { captainMatches: 1, captainNR: 1 });
    } else {
      const teamAWon = engine.winner === teamAName;
      const teamBWon = engine.winner === teamBName;

      if (captainA?.jersey) {
        playerDBHook.updatePlayerStats(captainA.jersey, {
          captainMatches: 1,
          ...(teamAWon ? { captainWins: 1 } : teamBWon ? { captainLosses: 1 } : { captainTies: 1 }),
        });
      }
      if (captainB?.jersey) {
        playerDBHook.updatePlayerStats(captainB.jersey, {
          captainMatches: 1,
          ...(teamBWon ? { captainWins: 1 } : teamAWon ? { captainLosses: 1 } : { captainTies: 1 }),
        });
      }
    }

    // ── STEP 3: Write team stats (async, fire and forget) ────────────────────
    if (isNR) {
      playerDBHook.updateTeamStats(teamAName, { matches: 1, nr: 1 });
      playerDBHook.updateTeamStats(teamBName, { matches: 1, nr: 1 });
    } else {
      const teamAWon = engine.winner === teamAName;
      const teamBWon = engine.winner === teamBName;
      playerDBHook.updateTeamStats(teamAName, {
        matches: 1,
        ...(teamAWon ? { wins: 1 } : teamBWon ? { losses: 1 } : { ties: 1 }),
      });
      playerDBHook.updateTeamStats(teamBName, {
        matches: 1,
        ...(teamBWon ? { wins: 1 } : teamAWon ? { losses: 1 } : { ties: 1 }),
      });
    }

    // ── STEP 4: Write matches:1 for every participant into buffer ────────────
    // Must happen BEFORE updateMatchMilestones() flushes the buffer.
    const allParticipantIds = new Set();
    [...playersHook.players, ...playersHook.allPlayers].forEach((p) => {
      if (p?.playerId) allParticipantIds.add(String(p.playerId));
    });
    bowlersRef.current.forEach((b) => {
      if (b?.playerId) allParticipantIds.add(String(b.playerId));
    });
    // ← ADD THIS: include innings 1 bowlers who are no longer in bowlersRef
    allTimeBowlersRef.current.forEach((pid) => {
      allParticipantIds.add(pid);
    });
    allParticipantIds.forEach((pid) => {
      playerDBHook.updatePlayerStats(pid, { matches: 1 });
    });

    // ── STEP 5: Write highestScore + notOuts into buffer ─────────────────────
    // Also before the flush.
    [...playersHook.players, ...playersHook.allPlayers].forEach((p) => {
      if (!p?.playerId) return;
      const pid = String(p.playerId);
      const inningsRuns = inningsScoreTrackerRef.current[pid] ?? (p.runs || 0);
      const hasBatted = inningsRuns > 0 || (p.balls || 0) > 0 || p.hasBatted;
      if (inningsRuns > 0) {
        const existing = playerDBHook.getPlayer(pid);
        if (existing && inningsRuns > (existing.highestScore || 0)) {
          playerDBHook.setHighestScore(pid, inningsRuns);
        }
      }
      if (hasBatted && !allTimeDismissedRef.current.has(pid)) {
        playerDBHook.updatePlayerStats(pid, { notOuts: 1 });
      }
    });

    // ── STEP 6: Flush everything to MongoDB in one pass ──────────────────────
    await playerDBHook.updateMatchMilestones();

    // ── STEP 7: Save match document to MongoDB ───────────────────────────────
    const currentMatchId = playerDBHook.getCurrentMatchId();
    const innings1 = inningsDataHook.innings1DataRef.current;
    const innings2 = inningsDataHook.innings2DataRef.current || captureCurrentData();

    const cleanPlayer = (p) => {
      const name = p.playerName || p.displayName || p.name || "";
      if (!name || name === "Unknown") return null;
      const dismissalObj = p.dismissal || {};
      return {
        playerName: name,
        jersey: p.jersey || p.playerId || "",
        runs: p.runs ?? 0,
        balls: p.balls ?? 0,
        fours: p.fours ?? 0,
        sixes: p.sixes ?? 0,
        dotBalls: p.dotBalls ?? 0,
        ones: p.ones ?? 0,
        twos: p.twos ?? 0,
        threes: p.threes ?? 0,
        isOut: p.isOut ?? !!p.dismissal,
        dismissalType: p.dismissalType || dismissalObj.type || "",
        fielderName: p.fielderName || dismissalObj.fielder || "",
        bowlerName: p.bowlerName || dismissalObj.bowler || "",
        ballsBowled: p.ballsBowled ?? 0,
        runsGiven: p.runsGiven ?? 0,
        wickets: p.wickets ?? 0,
        wides: p.wides ?? 0,
        noBalls: p.noBalls ?? 0,
        dotBallsBowled: p.dotBallsBowled ?? 0,
        maidens: p.maidens ?? 0,
      };
    };

    const allBattersForMOM = [
      ...(innings1?.battingStats || []),
      ...(innings2?.battingStats || []),
    ];
    let mom = null;
    let momScore = -1;
    for (const b of allBattersForMOM) {
      const pid = String(b.playerId || b.jersey || "");
      const trackedRuns =
        inningsScoreTrackerRef.current[pid] ??
        innings1ScoreSnapshotRef.current[pid];
      const liveRuns = pid && trackedRuns != null ? trackedRuns : b.runs || 0;
      const liveBalls = (b.balls || 0) + (liveRuns > (b.runs || 0) ? 1 : 0);
      const sr = liveBalls > 0 ? liveRuns / liveBalls : 0;
      const score = liveRuns * 1000 + sr;
      if (score > momScore) {
        momScore = score;
        const name = b.playerName || b.displayName || b.name || "";
        if (name && name !== "Unknown") mom = name;
      }
    }
    if (!mom) {
      const allBowlersForMOM = [
        ...(innings1?.bowlingStats || []),
        ...(innings2?.bowlingStats || []),
      ];
      let bestW = 0, bestR = 9999;
      for (const b of allBowlersForMOM) {
        const w = b.wickets || 0, r = b.runsGiven || 9999;
        const name = b.playerName || b.displayName || b.name || "";
        if (name && name !== "Unknown" && (w > bestW || (w === bestW && r < bestR))) {
          bestW = w; bestR = r; mom = name;
        }
      }
    }

    const clean1Batting = (innings1?.battingStats || []).map(cleanPlayer).filter(Boolean);
    const clean2Batting = (innings2?.battingStats || []).map(cleanPlayer).filter(Boolean);
    const inn1BowlingStats = innings1?.bowlingStats || [];

    const clean1Bowling = inn1BowlingStats.length > 0
      ? inn1BowlingStats
          .filter((b) => {
            const name = b.playerName || b.displayName || b.name || "";
            return name && name !== "Unknown";
          })
          .map((b) => {
            const ballsBowled = b.ballsBowled || b.balls || 0;
            const runsGiven = b.runsGiven || b.runs || 0;
            const fullOvers = Math.floor(ballsBowled / 6);
            const remBalls = ballsBowled % 6;
            return {
              playerName: b.playerName || b.displayName || b.name || "",
              jersey: String(b.playerId || ""),
              ballsBowled,
              overs: remBalls > 0 ? `${fullOvers}.${remBalls}` : `${fullOvers}.0`,
              runsGiven,
              wickets: b.wickets || 0,
              wides: b.wides || 0,
              noBalls: b.noBalls || 0,
              dotBallsBowled: b.dotBallsBowled || 0,
              maidens: b.maidens || 0,
            };
          })
      : (
          inningsDataHook.innings1BowlersSnapshotRef?.current?.length > 0
            ? inningsDataHook.innings1BowlersSnapshotRef.current
            : innings1BowlersSnapshotRef.current
        )
          .filter((b) => {
            const name = b.displayName || b.playerName || b.name || "";
            return name && name !== "Unknown";
          })
          .map((b) => {
            const ballsBowled = b.ballsBowled || b.balls || 0;
            const runsGiven = b.runsGiven || b.runs || 0;
            const fullOvers = Math.floor(ballsBowled / 6);
            const remBalls = ballsBowled % 6;
            return {
              playerName: b.displayName || b.playerName || b.name || "",
              jersey: String(b.playerId || ""),
              ballsBowled,
              overs: remBalls > 0 ? `${fullOvers}.${remBalls}` : `${fullOvers}.0`,
              runsGiven,
              wickets: b.wickets || 0,
              wides: b.wides || 0,
              noBalls: b.noBalls || 0,
              dotBallsBowled: b.dotBallsBowled || 0,
              maidens: b.maidens || 0,
            };
          });

    const clean2Bowling = (innings2?.bowlingStats || []).map(cleanPlayer).filter(Boolean);
    const inn1Balls =
      (engine.innings1Score?.overs ?? 0) * 6 +
      (engine.innings1Score?.balls ?? 0);

    console.log("💾 Saving match with toss:", matchData.tossWinner, "MoM:", mom);

    matchApi
      .saveMatch({
        matchId: currentMatchId || `match_${Date.now()}`,
        totalOvers: updatedMatchData.overs,
        team1Name: firstBattingTeam,
        team2Name: secondBattingTeam,
        tossWinner: matchData.tossWinner || "",
        team1Score: engine.innings1Score?.score ?? 0,
        team1Wickets: engine.innings1Score?.wickets ?? 0,
        team1Balls: inn1Balls,
        team2Score: engine.score,
        team2Wickets: engine.wickets,
        team2Balls: engine.overs * 6 + engine.balls,
        winner: engine.winner || "",
        resultText: engine.winner
          ? ["TIE", "NO RESULT"].includes(engine.winner)
            ? engine.winner
            : `${engine.winner} won`
          : "No Result",
        team1Captain: firstBattingTeam === matchData.teamA
          ? matchData.teamACaptain?.name || ""
          : matchData.teamBCaptain?.name || "",
        team2Captain: firstBattingTeam === matchData.teamA
          ? matchData.teamBCaptain?.name || ""
          : matchData.teamACaptain?.name || "",
        manOfTheMatch: mom || "",
        team1Batting: clean1Batting,
        team2Batting: clean2Batting,
        team1Bowling: clean1Bowling,
        team2Bowling: clean2Bowling,
        innings1DataBlob: innings1,
        innings2DataBlob: innings2,
      })
      .catch((err) => console.error("❌ saveMatch failed:", err));

    setTimeout(() => {
      playerDBHook.setCurrentMatchId(null);
    }, 500);
  })();
}, [engine.matchOver]);


  useEffect(() => {
    if (!engine.tieDetected) return;
    modalStates.openSuperOverModal(
      engine.isSuperOver ? engine.superOverNumber + 1 : 1
    );
    engine.setTieDetected(false);
  }, [engine.tieDetected]);

  const firstBattingTeam = matchData.battingFirst;
  const secondBattingTeam =
    matchData.battingFirst === matchData.teamA
      ? matchData.teamB
      : matchData.teamA;
  const currentBattingTeam = engine.isSuperOver
    ? engine.innings === 1
      ? secondBattingTeam
      : firstBattingTeam
    : engine.innings === 1
    ? firstBattingTeam
    : secondBattingTeam;

  const addBatterJersey = (jersey) => {
    if (!jersey) return;
    if (engine.innings === 1) teamABattersRef.current.add(String(jersey));
    else teamBBattersRef.current.add(String(jersey));
  };

  const addBowlerJersey = (jersey) => {
    if (!jersey) return;
    if (engine.innings === 1) teamBBowlersRef.current.add(String(jersey));
    else teamABowlersRef.current.add(String(jersey));
  };

  const triggerSnapshotWithTracking = () => {
    historySnapshotHook.triggerSnapshot();
    if (currentInningsRef.current === 2) innings2SnapshotCountRef.current += 1;
  };

  const captureCurrentData = () =>
    inningsDataHook.captureCurrentInningsData(
      playersHook.players,
      playersHook.allPlayers,
      playersHook.bowlers,
      engine.completeHistory,
      engine.score,
      engine.wickets,
      engine.overs,
      engine.balls,
      engine.extras
    );

  const startPartnershipFromPlayers = (p, fallback1 = "", fallback2 = "") => {
    partnershipsHook.startPartnership(
      p[0]
        ? { playerId: p[0].playerId, displayName: p[0].displayName }
        : { playerId: "", displayName: fallback1 },
      p[1]
        ? { playerId: p[1].playerId, displayName: p[1].displayName }
        : { playerId: "", displayName: fallback2 }
    );
  };

  const trackInningsRun = (playerId, runs) => {
    if (!playerId) return;
    const pid = String(playerId);
    inningsScoreTrackerRef.current[pid] =
      (inningsScoreTrackerRef.current[pid] || 0) + runs;

    const currentInningsTotal = inningsScoreTrackerRef.current[pid];
    const existing = playerDBHook.getPlayer(pid);
    if (existing && currentInningsTotal > (existing.highestScore || 0)) {
      playerDBHook.setHighestScore(pid, currentInningsTotal);
    }
  };

  const handleRunClick = (r) => {
    lastKnownBowlersRef.current = [...playersHook.bowlers];

    // ─── RUNOUT PATH ───────────────────────────────────────────────
    if (wicketFlow.waitingForRunoutRun) {
      wicketFlow.handleRunoutWithRuns(r);
      engine.handleWicket(
        true,
        false,
        playersHook.players[playersHook.strikerIndex]?.playerId,
        true,
        playersHook.bowlers[playersHook.currentBowlerIndex]?.displayName || ""  // ← add
      );
      const bowler = playersHook.bowlers[playersHook.currentBowlerIndex];

      if (bowler && !bowler.hasBowled) {
        bowler.hasBowled = true;
        if (bowler.playerId) {
          playerDBHook.updatePlayerStats(bowler.playerId, {
            bowlingInnings: 1,
          });
        }
      }

      if (r > 0) {
        playersHook.addRunsToStriker(r);
        const striker = playersHook.players[playersHook.strikerIndex];

        if (striker && !striker.hasBatted) {
          striker.hasBatted = true;
          if (striker.playerId) {
            playerDBHook.updatePlayerStats(striker.playerId, { innings: 1 });
          }
        }

        if (striker?.playerId) {
          trackInningsRun(striker.playerId, r);
          const runStats = {};
          if (r === 1) runStats.ones = 1;
          else if (r === 2) runStats.twos = 1;
          else if (r === 3) runStats.threes = 1;
          else if (r === 4) runStats.fours = 1;
          else if (r === 6) runStats.sixes = 1;
          runStats.runs = r;
          runStats.balls = 1;
          playerDBHook.updatePlayerStats(striker.playerId, runStats);
        }

        if (bowler?.playerId) {
          playerDBHook.updatePlayerStats(bowler.playerId, {
            ballsBowled: 1,
            runsGiven: r,
          });
        }

        playersHook.addRunsToBowler(r);
        if (
          playersHook.strikerIndex >= 0 &&
          playersHook.players[playersHook.strikerIndex]
        )
          partnershipsHook.addRunsToPartnership(
            r,
            playersHook.players[playersHook.strikerIndex].playerId
          );
        engine.addScore(r);
        engine.addRunToCurrentOver(r, true);
        if (r % 2 !== 0) playersHook.swapStrike();
      } else {
        playersHook.addBallToBowler();
        if (bowler?.playerId) {
          playerDBHook.updatePlayerStats(bowler.playerId, {
            ballsBowled: 1,
            runsGiven: 0,
            dotBallsBowled: 1,
          });
        }
        const striker = playersHook.players[playersHook.strikerIndex];
        if (striker?.playerId) {
          playerDBHook.updatePlayerStats(striker.playerId, { dotBalls: 1 });
        }
        partnershipsHook.addBallToPartnership();
      }

      engine.addRunToCurrentOver("W", false);
      playersHook.registerWicket();
      return;
    }

    // ─── WINNING RUN CAPTURE ────────────────────────────────────────
    if (currentInningsRef.current === 2 && engine.score + r >= engine.target) {
      try {
        const finalData = captureCurrentData();
        const strikerId = String(
          playersHook.players[playersHook.strikerIndex]?.playerId || ""
        );
        const strikerEntry = finalData?.battingStats?.find(
          (b) => String(b.playerId) === strikerId
        );
        if (strikerEntry) {
          strikerEntry.runs += r;
          strikerEntry.balls += 1;
        }
        const liveBowler = playersHook.bowlers[playersHook.currentBowlerIndex];
        if (liveBowler && finalData) {
          if (!finalData.bowlingStats) finalData.bowlingStats = [];
          const bowlerId = String(liveBowler.playerId || "");
          const bowlerEntry = finalData.bowlingStats.find(
            (b) =>
              String(b.playerId) === bowlerId ||
              b.playerName === liveBowler.displayName
          );
          if (bowlerEntry) {
            bowlerEntry.ballsBowled = (bowlerEntry.ballsBowled || 0) + 1;
            bowlerEntry.runsGiven = (bowlerEntry.runsGiven || 0) + r;
          } else {
            finalData.bowlingStats.push({
              playerId: bowlerId,
              playerName: liveBowler.displayName || liveBowler.name || "",
              jersey: bowlerId,
              ballsBowled: 1,
              runsGiven: r,
              wickets: liveBowler.wickets || 0,
              wides: liveBowler.wides || 0,
              noBalls: liveBowler.noBalls || 0,
              dotBallsBowled: r === 0 ? 1 : 0,
              maidens: liveBowler.maidens || 0,
            });
          }
        }
        inningsDataHook.innings2DataRef.current = finalData;
        inningsDataHook.setInnings2Data(finalData);
      } catch (e) {
        console.warn(
          "⚠️ captureCurrentInningsData failed on winning run:",
          e.message
        );
      }
    }

    // ─── NORMAL RUN PATH ────────────────────────────────────────────
    triggerSnapshotWithTracking();
    playersHook.addRunsToStriker(r);

    const striker = playersHook.players[playersHook.strikerIndex];

    if (striker && !striker.hasBatted) {
      striker.hasBatted = true;
      if (striker.playerId) {
        playerDBHook.updatePlayerStats(striker.playerId, { innings: 1 });
      }
    }

    if (striker?.playerId) {
      if (r > 0) trackInningsRun(striker.playerId, r);
      const stats = {};
      if (r === 1) stats.ones = 1;
      else if (r === 2) stats.twos = 1;
      else if (r === 3) stats.threes = 1;
      else if (r === 0) stats.dotBalls = 1;
      else if (r === 4) stats.fours = 1;
      else if (r === 6) stats.sixes = 1;
      stats.runs = r;
      stats.balls = 1;
      playerDBHook.updatePlayerStats(striker.playerId, stats);
    }

    const bowler = playersHook.bowlers[playersHook.currentBowlerIndex];

    if (bowler && !bowler.hasBowled) {
      bowler.hasBowled = true;
      if (bowler.playerId) {
        playerDBHook.updatePlayerStats(bowler.playerId, { bowlingInnings: 1 });
      }
    }

    playersHook.addRunsToBowler(r);
    playersHook.addBallToBowler();

    if (bowler?.playerId) {
      playerDBHook.updatePlayerStats(bowler.playerId, {
        ballsBowled: 1,
        runsGiven: r,
        ...(r === 0 ? { dotBallsBowled: 1 } : {}),
      });
    }

    if (
      playersHook.strikerIndex >= 0 &&
      playersHook.players[playersHook.strikerIndex]
    )
      partnershipsHook.addRunsToPartnership(
        r,
        playersHook.players[playersHook.strikerIndex].playerId
      );

    engine.addToCurrentOverRuns(r);
    engine.handleRun(
      r,
      playersHook.players[playersHook.strikerIndex]?.playerId,
      bowler?.displayName || ""          // ← bowlerName (bowler is already declared above)
    );

    hatTrickHook.trackBall(
      playersHook.bowlers[playersHook.currentBowlerIndex]?.displayName ||
        "Unknown",
      false,
      false
    );
  };

  const handleRetiredHurt = () => {
    if (playersHook.players.length < 2 || playersHook.isWicketPending) return;
    modalStates.setShowRetiredHurtModal(true);
  };

  const handleDismissBowler = () => {
    if (!playersHook.bowlers[playersHook.currentBowlerIndex]) return;
    modalStates.setShowDismissBowlerModal(true);
  };

  const handleDismissBowlerConfirm = (bowlerData) => {
    const name = typeof bowlerData === "string" ? bowlerData : bowlerData.name;
    if (bowlerData?.jersey) addBowlerJersey(bowlerData.jersey);
    playersHook.dismissCurrentBowler(name);
    modalStates.setShowDismissBowlerModal(false);
  };

  const handleNoResultConfirm = () => {
    modalStates.setShowNoResultModal(false);
    engine.endMatchNoResult();
    setTimeout(() => {
      inningsDataHook.setInnings2Data(captureCurrentData());
      inningsDataHook.setMatchCompleted(true);
      modalStates.setShowSummary(true);
    }, 150);
  };

  const handleFielderConfirm = ({ fielder, fielderJersey }) => {
    const bowlerName =
      playersHook.bowlers[playersHook.currentBowlerIndex]?.displayName ||
      "Unknown";
    const currentOutBatsman = playersHook.strikerIndex;
    const currentBattingTeamKey =
      currentInningsRef.current === 1 ? "teamAPlayers" : "teamBPlayers";
    const currentTeamSize = engine.isSuperOver
      ? 3
      : Number(matchData[currentBattingTeamKey] || 11);
    const currentMaxWickets = engine.isSuperOver ? 2 : currentTeamSize - 1;
    const nextWickets = engine.wickets + 1;

    if (fielderJersey) addBowlerJersey(fielderJersey);

    playersHook.setDismissal(
      wicketFlow.selectedWicketType,
      fielder,
      bowlerName,
      currentOutBatsman
    );

    console.log(
      "🪦 Dismissed player object:",
      JSON.stringify(playersHook.players[currentOutBatsman])
    );
    console.log("🪦 allPlayers:", JSON.stringify(playersHook.allPlayers));
    const outPlayerId = playersHook.players[currentOutBatsman]?.playerId;
    if (outPlayerId) {
      dismissedPlayersRef.current.add(String(outPlayerId));
      allTimeDismissedRef.current.add(String(outPlayerId));
      playerDBHook.updatePlayerStats(outPlayerId, { dismissals: 1 });
    }

    hatTrickHook.trackBall(
      bowlerName,
      true,
      wicketFlow.selectedWicketType === "runout"
    );

    const bowler = playersHook.bowlers[playersHook.currentBowlerIndex];

    if (wicketFlow.selectedWicketType !== "runout") {
      playersHook.addWicketToBowler();
      if (bowler?.playerId) {
        playerDBHook.updatePlayerStats(bowler.playerId, {
          wickets: 1,
          ballsBowled: 1,
          runsGiven: 0,
          dotBallsBowled: 1,
        });
      }
    } else {
      playersHook.addBallToBowler();
      if (bowler?.playerId) {
        playerDBHook.updatePlayerStats(bowler.playerId, {
          ballsBowled: 1,
          runsGiven: 0,
          dotBallsBowled: 1,
        });
      }
    }

    partnershipsHook.addBallToPartnership();
    partnershipsHook.savePartnership(engine.score, nextWickets);
    partnershipsHook.resetPartnership();

    engine.handleWicket(
      wicketFlow.selectedWicketType === "runout",
      false,
      playersHook.players[currentOutBatsman]?.playerId,
      bowlerName
    );


    if (fielderJersey) {
      playerDBHook.updateFieldingStats(
        fielderJersey,
        wicketFlow.selectedWicketType,
        fielder
      );
    }

    wicketFlow.setShowFielderInputModal(false);

    if (nextWickets >= currentMaxWickets) {
      wicketFlow.completeWicketFlow();
      playersHook.setIsWicketPending(false);
      setTimeout(() => triggerSnapshotWithTracking(), 100);
      return;
    }

    if (!engine.isSuperOver && playersHook.players.length >= currentTeamSize) {
      wicketFlow.completeWicketFlow();
      playersHook.setIsWicketPending(false);
      return;
    }

    playersHook.setOutBatsman(currentOutBatsman);
    playersHook.setIsWicketPending(true);
    setTimeout(() => triggerSnapshotWithTracking(), 200);
  };

  const undoLastBall = () => {
    if (
      currentInningsRef.current === 2 &&
      innings2SnapshotCountRef.current === 0
    ) {
      alert("⚠️ Cannot undo — no balls have been bowled yet in this innings.");
      return;
    }
    const last = historySnapshotHook.getLastSnapshot();
    if (!last) {
      alert("No balls to undo!");
      return;
    }
    historySnapshotHook.popSnapshot();
    if (currentInningsRef.current === 2)
      innings2SnapshotCountRef.current = Math.max(
        0,
        innings2SnapshotCountRef.current - 1
      );
    engine.restoreState(last);
    playersHook.restorePlayersState(last);
    playersHook.restoreBowlersState(last);
    partnershipsHook.restorePartnershipState(last);
    hatTrickHook.resetTracker();
    wicketFlow.cancelWicketFlow();
    playersHook.setIsWicketPending(false);
  };

  const handleChangePlayersConfirm = ({
    team,
    isBattingTeam,
    newCount,
    oldCount,
  }) => {
    const updated = { ...updatedMatchData };
    if (engine.innings === 1)
      updated[isBattingTeam ? "teamAPlayers" : "teamBPlayers"] = newCount;
    else updated[isBattingTeam ? "teamBPlayers" : "teamAPlayers"] = newCount;
    setUpdatedMatchData(updated);
    localStorage.setItem("matchData", JSON.stringify(updated));
    modalStates.setShowChangePlayersModal(false);
    alert(`✅ ${team} player count changed from ${oldCount} to ${newCount}`);
  };

  const handleChangeOversConfirm = ({ newOvers, oldOvers }) => {
    const updated = { ...updatedMatchData, overs: newOvers };
    setUpdatedMatchData(updated);
    localStorage.setItem("matchData", JSON.stringify(updated));
    modalStates.setShowChangeOversModal(false);
    alert(`✅ Total overs changed from ${oldOvers} to ${newOvers}`);
  };

  const handleChangeBowlerLimitConfirm = ({ newLimit, oldLimit }) => {
    const updated = { ...updatedMatchData, maxOversPerBowler: newLimit };
    setUpdatedMatchData(updated);
    localStorage.setItem("matchData", JSON.stringify(updated));
    modalStates.setShowChangeBowlerLimitModal(false);
    alert(`✅ Bowler limit changed from ${oldLimit} to ${newLimit} overs`);
  };

  const handleWicketTypeSelectWithHitWicket = (wicketType) => {
    if (
      engine.isFreeHit &&
      wicketType !== "runout" &&
      wicketType !== "stumped"
    ) {
      alert("Only Run out or Stumping allowed on Free Hit");
      return;
    }
    wicketFlow.handleWicketTypeSelect(wicketType);
    if (wicketType !== "hitwicket") return;

    const bowlerName =
      playersHook.bowlers[playersHook.currentBowlerIndex]?.displayName ||
      "Unknown";
    const currentOutBatsman = playersHook.strikerIndex;
    const nextWickets = engine.wickets + 1;
    const bowler = playersHook.bowlers[playersHook.currentBowlerIndex];

    playersHook.setDismissal("hitwicket", null, bowlerName, currentOutBatsman);
    hatTrickHook.trackBall(bowlerName, true, false);
    playersHook.addWicketToBowler();

    if (bowler?.playerId) {
      playerDBHook.updatePlayerStats(bowler.playerId, {
        wickets: 1,
        ballsBowled: 1,
        runsGiven: 0,
        dotBallsBowled: 1,
      });
    }

    const outPlayerId = playersHook.players[currentOutBatsman]?.playerId;
    if (outPlayerId) {
      dismissedPlayersRef.current.add(String(outPlayerId));
      allTimeDismissedRef.current.add(String(outPlayerId));
      playerDBHook.updatePlayerStats(outPlayerId, { dismissals: 1 });
    }

    partnershipsHook.addBallToPartnership();
    partnershipsHook.savePartnership(engine.score, nextWickets);
    partnershipsHook.resetPartnership();
    engine.handleWicket(
      false,
      true,
      playersHook.players[currentOutBatsman]?.playerId,
      bowlerName             
    );

    playersHook.setOutBatsman(currentOutBatsman);
    playersHook.setIsWicketPending(true);
    triggerSnapshotWithTracking();
  };

  const handleStartSuperOver = () => {
    modalStates.closeSuperOverModal();
    if (!realMatchInnings1DataRef.current)
      realMatchInnings1DataRef.current = inningsDataHook.innings1Data;
    if (!realMatchInnings2DataRef.current)
      realMatchInnings2DataRef.current = inningsDataHook.innings2Data;
    const result = engine.startSuperOver(modalStates.superOverNumber);
    if (result === "SUPER_OVER_STARTED") {
      soInnings1SavedRef.current = false;
      soCompleteSavedRef.current = false;
      playersHook.resetForNewInnings();
      partnershipsHook.resetPartnership();
      partnershipsHook.restorePartnershipState({
        partnershipRuns: 0,
        partnershipBalls: 0,
        striker1Contribution: 0,
        striker2Contribution: 0,
        partnershipHistory: [],
      });
      hatTrickHook.resetTracker();
      setTimeout(() => {
        engine.setInningsChangeEvent(null);
        modalStates.setShowStartModal(true);
      }, 100);
    }
  };

  const handleSkipSuperOver = () => {
    modalStates.closeSuperOverModal();
    engine.setTieDetected(false);
    engine.endMatchNoResult();
  };

  const summaryInnings1Data = engine.isSuperOver
    ? realMatchInnings1DataRef.current
    : inningsDataHook.innings1Data;
  const summaryInnings2Data = engine.isSuperOver
    ? realMatchInnings2DataRef.current
    : inningsDataHook.innings2Data;
  const isNoResult = engine.winner === "NO RESULT";
  const activeBatterJerseys =
    engine.innings === 1 ? teamABattersRef.current : teamBBattersRef.current;
  const activeBowlerJerseys =
    engine.innings === 1 ? teamBBowlersRef.current : teamABowlersRef.current;

  return (
    <div className={styles.container}>
      <BrandTitle size="small" />
      {!modalStates.showSummary && (
        <>
          <ScoreHeader
            innings={engine.innings}
            teamName={currentBattingTeam}
            score={engine.score}
            wickets={engine.wickets}
            overs={engine.overs}
            balls={engine.balls}
            totalOvers={engine.isSuperOver ? 1 : updatedMatchData.overs}
            target={engine.target}
            isSuperOver={engine.isSuperOver}
            superOverNumber={engine.superOverNumber}
            toss={`${matchData.tossWinner} elected to ${
              matchData.battingFirst === matchData.tossWinner ? "bat" : "bowl"
            }`}
          />
          <InfoStrip
            overs={engine.overs}
            balls={engine.balls}
            bowler={
              playersHook.bowlers[playersHook.currentBowlerIndex]?.displayName
            }
            bowlers={playersHook.bowlers}
            currentBowlerIndex={playersHook.currentBowlerIndex}
            score={engine.score}
            target={engine.target}
            innings={engine.innings}
            totalOvers={engine.isSuperOver ? 1 : updatedMatchData.overs}
            isFreeHit={engine.isFreeHit}
            matchData={updatedMatchData}
            currentTeam={currentBattingTeam}
            onBowlerClick={modalStates.openBowlerStats}
          />
          <OverBalls history={engine.currentOver} />
          {playersHook.players.length >= 2 && (
            <BatsmenRow
              striker={playersHook.players[playersHook.strikerIndex]}
              nonStriker={playersHook.players[playersHook.nonStrikerIndex]}
              partnershipRuns={partnershipsHook.partnershipRuns}
              partnershipBalls={partnershipsHook.partnershipBalls}
              matchData={updatedMatchData}
              currentTeam={currentBattingTeam}
              wickets={engine.wickets}
              onStatsClick={modalStates.openPlayerStats}
            />
          )}
          {!engine.matchOver && (
            <RunControls
              onRun={handleRunClick}
              onWide={() => {
                lastKnownBowlersRef.current = [...playersHook.bowlers];
                triggerSnapshotWithTracking();
                const bowler =
                  playersHook.bowlers[playersHook.currentBowlerIndex];
                if (bowler && !bowler.hasBowled) {
                  bowler.hasBowled = true;
                  if (bowler.playerId)
                    playerDBHook.updatePlayerStats(bowler.playerId, {
                      bowlingInnings: 1,
                    });
                }
                playersHook.addBallToBowler();
                if (bowler?.playerId)
                  playerDBHook.updatePlayerStats(bowler.playerId, {
                    wides: 1,
                    runsGiven: 1,
                  });
                playersHook.addRunsToBowler(1);
                partnershipsHook.addExtraToPartnership(1);
                engine.handleWide(bowler?.displayName || "");               engine.addToCurrentOverRuns(1);
              }}
              onNoBall={() => {
                lastKnownBowlersRef.current = [...playersHook.bowlers];
                triggerSnapshotWithTracking();
                const bowler =
                  playersHook.bowlers[playersHook.currentBowlerIndex];
                if (bowler && !bowler.hasBowled) {
                  bowler.hasBowled = true;
                  if (bowler.playerId)
                    playerDBHook.updatePlayerStats(bowler.playerId, {
                      bowlingInnings: 1,
                    });
                }
                playersHook.addBallToBowler();
                if (bowler?.playerId)
                  playerDBHook.updatePlayerStats(bowler.playerId, {
                    noBalls: 1,
                    runsGiven: 1,
                  });
                playersHook.addRunsToBowler(1);
                partnershipsHook.addExtraToPartnership(1);
                engine.handleNoBall(bowler?.displayName || "");
                engine.addToCurrentOverRuns(1);
              }}
              onBye={(r) => {
                lastKnownBowlersRef.current = [...playersHook.bowlers];
                triggerSnapshotWithTracking();
                const bowler =
                  playersHook.bowlers[playersHook.currentBowlerIndex];
                if (bowler && !bowler.hasBowled) {
                  bowler.hasBowled = true;
                  if (bowler.playerId)
                    playerDBHook.updatePlayerStats(bowler.playerId, {
                      bowlingInnings: 1,
                    });
                }
                playersHook.addBallToBowler();
                if (bowler?.playerId)
                  playerDBHook.updatePlayerStats(bowler.playerId, {
                    ballsBowled: 1,
                  });
                partnershipsHook.addExtraToPartnership(r);
                partnershipsHook.addBallToPartnership();
               engine.handleBye(r, bowler?.displayName || "");                engine.addToCurrentOverRuns(r);
              }}
              onLegBye={(r) => {
                lastKnownBowlersRef.current = [...playersHook.bowlers];
                triggerSnapshotWithTracking();
                const bowler =
                  playersHook.bowlers[playersHook.currentBowlerIndex];
                if (bowler && !bowler.hasBowled) {
                  bowler.hasBowled = true;
                  if (bowler.playerId)
                    playerDBHook.updatePlayerStats(bowler.playerId, {
                      bowlingInnings: 1,
                    });
                }
                playersHook.addBallToBowler();
                if (bowler?.playerId)
                  playerDBHook.updatePlayerStats(bowler.playerId, {
                    ballsBowled: 1,
                  });
                partnershipsHook.addExtraToPartnership(r);
                partnershipsHook.addBallToPartnership();
                 engine.handleLegBye(r, bowler?.displayName || "");

                engine.addToCurrentOverRuns(r);
              }}
              onWicket={() => wicketFlow.startWicketFlow(engine.isFreeHit)}
              onSwapStrike={playersHook.swapStrike}
              onUndo={undoLastBall}
              onRetiredHurt={handleRetiredHurt}
              isWicketPending={playersHook.isWicketPending}
              onDismissBowler={handleDismissBowler}
              onNoResult={() => modalStates.setShowNoResultModal(true)}
            />
          )}
          {engine.matchOver && isNoResult && <NoResultBanner />}
        </>
      )}
      <UtilityBar
        partnershipHistory={partnershipsHook.partnershipHistory}
        matchCompleted={inningsDataHook.matchCompleted}
        onPartnership={() => modalStates.setShowPartnershipHistory(true)}
        onInningsHistory={() => modalStates.setShowInningsHistory(true)}
        onInningsSummary={() => modalStates.setShowInningsSummary(true)}
        onComparisonGraph={() => modalStates.setShowComparisonGraph(true)}
        onMore={() => modalStates.setShowMoreMenu(true)}
        onScorecard={() => modalStates.setShowFullScorecard(true)}
        onMatchSummary={() => modalStates.setShowSummary(true)}
      />
      {engine.matchOver && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginTop: "15px",
          }}
        >
          <button
            onClick={() => navigate("/home")}
            style={{
              background: "#22c55e",
              color: "white",
              padding: "12px 20px",
              borderRadius: "10px",
              border: "none",
              cursor: "pointer",
              fontWeight: "600",
              fontSize: "15px",
            }}
          >
            🏠 Go to Home
          </button>
        </div>
      )}
      <ModalManager
        modalStates={modalStates}
        wicketFlow={wicketFlow}
        players={playersHook.players}
        allPlayers={playersHook.allPlayers}
        retiredPlayers={playersHook.retiredPlayers}
        bowlers={playersHook.bowlers}
        currentBowlerIndex={playersHook.currentBowlerIndex}
        isWicketPending={playersHook.isWicketPending}
        isNewBowlerPending={playersHook.isNewBowlerPending}
        strikerIndex={playersHook.strikerIndex}
        partnershipHistory={partnershipsHook.partnershipHistory}
        innings1Data={summaryInnings1Data}
        innings2Data={summaryInnings2Data}
        innings1Score={engine.realMatchInnings1Score ?? engine.innings1Score}
        innings2Score={engine.realMatchInnings2Score ?? engine.innings2Score}
        innings1HistoryRef={inningsDataHook.innings1HistoryRef}
        innings1History={
          engine.innings === 1
            ? engine.completeHistory
            : engine.innings1History || engine.innings1HistoryRef?.current || []
        }
        innings2History={engine.innings === 2 ? engine.completeHistory : []}
        matchData={matchData}
        updatedMatchData={updatedMatchData}
        firstBattingTeam={firstBattingTeam}
        secondBattingTeam={secondBattingTeam}
        currentBattingTeam={currentBattingTeam}
        winner={engine.winner}
        score={engine.score}
        wickets={engine.wickets}
        overs={engine.overs}
        balls={engine.balls}
        completeHistory={engine.completeHistory}
        innings={engine.innings}
        liveExtras={engine.extras}
        isSuperOver={engine.isSuperOver}
        superOverNumber={engine.superOverNumber}
        onStartInnings={(strikerData, nonStrikerData, bowlerData) => {
          addBatterJersey(strikerData.jersey);
          addBatterJersey(nonStrikerData.jersey);
          addBowlerJersey(bowlerData.jersey);
          playersHook.startInnings(strikerData, nonStrikerData, bowlerData);
          setTimeout(() => {
            const p = playersHook.players;
            initialStrikerRef.current = p[0]?.playerId ?? null;
            initialNonStrikerRef.current = p[1]?.playerId ?? null;
            startPartnershipFromPlayers(
              p,
              strikerData.name,
              nonStrikerData.name
            );
          }, 50);
          modalStates.setShowStartModal(false);
        }}
        onConfirmNewBatsman={(batsmanData) => {
          if (batsmanData?.jersey) addBatterJersey(batsmanData.jersey);
          const name =
            typeof batsmanData === "string" ? batsmanData : batsmanData.name;
          const isReturnedPlayer = playersHook.retiredPlayersRef.current.some(
            (p) =>
              p.displayName.toLowerCase().trim() === name.toLowerCase().trim()
          );
          if (isReturnedPlayer)
            playersHook.returnRetiredBatsman(name, playersHook.outBatsman);
          else playersHook.replaceBatsman(playersHook.outBatsman, batsmanData);
          playersHook.setIsWicketPending(false);
          wicketFlow.completeWicketFlow();
          const outIdx = playersHook.outBatsman ?? playersHook.strikerIndex;
          const nonStrikerIdx = outIdx === 0 ? 1 : 0;
          const nonStriker = playersHook.players[nonStrikerIdx];
          setTimeout(() => {
            partnershipsHook.startPartnership(
              {
                playerId: batsmanData?.jersey
                  ? String(batsmanData.jersey)
                  : "new-" + Date.now(),
                displayName: name,
              },
              nonStriker
                ? {
                    playerId: nonStriker.playerId,
                    displayName: nonStriker.displayName,
                  }
                : { playerId: "", displayName: "" }
            );
          }, 50);
        }}
        onConfirmNewBowler={(bowlerData) => {
          if (bowlerData?.jersey) addBowlerJersey(bowlerData.jersey);
          const result = playersHook.confirmNewBowler(bowlerData);
          if (result?.success) playersHook.setIsNewBowlerPending(false);
        }}
        onRetiredHurtConfirm={(batsmanData) => {
          const name =
            typeof batsmanData === "string" ? batsmanData : batsmanData.name;
          if (batsmanData?.jersey) addBatterJersey(batsmanData.jersey);
          playersHook.retireBatsman(name);
          modalStates.setShowRetiredHurtModal(false);
          setTimeout(
            () => startPartnershipFromPlayers(playersHook.players, name, ""),
            50
          );
        }}
        onReturnRetiredConfirm={(retiredPlayerName) => {
          playersHook.returnRetiredBatsman(
            retiredPlayerName,
            playersHook.outBatsman
          );
          playersHook.setIsWicketPending(false);
          setTimeout(
            () => startPartnershipFromPlayers(playersHook.players),
            50
          );
        }}
        onWicketTypeSelect={handleWicketTypeSelectWithHitWicket}
        onFielderConfirm={handleFielderConfirm}
        onFielderCancel={wicketFlow.cancelWicketFlow}
        onChangePlayersConfirm={handleChangePlayersConfirm}
        onChangeOversConfirm={handleChangeOversConfirm}
        onChangeBowlerLimitConfirm={handleChangeBowlerLimitConfirm}
        onDismissBowlerConfirm={handleDismissBowlerConfirm}
        onNoResultConfirm={handleNoResultConfirm}
        onRenameConfirm={(playerId, newName) =>
          playersHook.renamePlayer(playerId, newName)
        }
        onRenameBowlerConfirm={(playerId, newName) =>
          playersHook.renameBowler(playerId, newName)
        }
        renameModalState={modalStates}
        onStatsClick={modalStates.openPlayerStats}
        initialStrikerPlayerId={initialStrikerRef.current}
        initialNonStrikerPlayerId={initialNonStrikerRef.current}
        nonStrikerIndex={playersHook.nonStrikerIndex}
        activePlayers={playersHook.players}
        playerDB={playerDBHook}
        onOpenPlayerDatabase={() => modalStates.setShowPlayerDatabase(true)}
        bowlerJerseys={activeBowlerJerseys}
        batterJerseys={activeBatterJerseys}
        dismissedPlayers={dismissedPlayersRef.current}
        currentBowlerJersey={
          playersHook.bowlers[playersHook.currentBowlerIndex]?.playerId
        }
      />
      <ScoringModals
        hatTrickHook={hatTrickHook}
        modalStates={modalStates}
        matchData={matchData}
        secondBattingTeam={secondBattingTeam}
        firstBattingTeam={firstBattingTeam}
        handleStartSuperOver={handleStartSuperOver}
        handleSkipSuperOver={handleSkipSuperOver}
        realMatchInnings1DataRef={realMatchInnings1DataRef}
        realMatchInnings2DataRef={realMatchInnings2DataRef}
        inningsDataHook={inningsDataHook}
        engine={engine}
      />
    </div>
  );
}

export default ScoringPage;
