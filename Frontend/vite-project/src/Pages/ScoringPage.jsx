import { useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import BrandTitle from "../Components/BrandTitle";

import ScoreHeader from "../Components/Scoring/ScoreHeader";
import InfoStrip from "../Components/Scoring/InfoStrip";
import OverBalls from "../Components/Scoring/OverBalls";
import BatsmenRow from "../Components/Scoring/BatsmenRow";
import RunControls from "../Components/Scoring/RunControls";
import styles from "../Components/Scoring/scoring.module.css";
import StartInningsModal from "../Components/Scoring/StartInningsModal";
import NewBatsmanModal from "../Components/Scoring/NewBatsmanModal";
import NewBowlerModal from "../Components/Scoring/NewBowlerModal";

function ScoringPage() {
  const location = useLocation();
  const matchData = location.state || {};
  const rules = matchData.rules || {};

  // ================= MATCH CONFIG =================
  const totalOvers = matchData.isTestMatch
    ? Number(matchData.oversPerDay) || 90
    : Number(matchData.overs) || 10;

  const totalBalls = totalOvers * 6;

  // ================= SCORE =================
  const [score, setScore] = useState(0);
  const [wickets, setWickets] = useState(0);
  const [balls, setBalls] = useState(0);
  const [overs, setOvers] = useState(0);
  const [ballHistory, setBallHistory] = useState([]);

  // ================= INNINGS =================
  const [innings, setInnings] = useState(1);
  const [target, setTarget] = useState(null);

  const maxWickets =
    innings === 1
      ? Number(matchData.teamAPlayers || 11) - 1
      : Number(matchData.teamBPlayers || 11) - 1;

  // ================= PLAYERS =================
  const [players, setPlayers] = useState([]);
  const [strikerIndex, setStrikerIndex] = useState(0);
  const [nonStrikerIndex, setNonStrikerIndex] = useState(1);

  // ================= BOWLERS =================
  const [bowlers, setBowlers] = useState([]);
  const [currentBowlerIndex, setCurrentBowlerIndex] = useState(0);
  const [isNewBowlerPending, setIsNewBowlerPending] = useState(false);

  // ================= MODALS =================
  const [showDialog, setShowDialog] = useState(true);
  const [isWicketPending, setIsWicketPending] = useState(false);
  const [outBatsman, setOutBatsman] = useState(null);

  // ================= PARTNERSHIP =================
  const [partnershipRuns, setPartnershipRuns] = useState(0);
  const [partnershipBalls, setPartnershipBalls] = useState(0);

  // ================= FREE HIT =================
  const [isFreeHit, setIsFreeHit] = useState(false);

  const formatOvers = () => `${overs}.${balls}`;

  const calculateRunRate = () => {
    const totalOversBowled = overs + balls / 6;
    return totalOversBowled === 0
      ? "0.00"
      : (score / totalOversBowled).toFixed(2);
  };

  const swapStrike = () => {
    setStrikerIndex((prev) => {
      setNonStrikerIndex(prev);
      return prev === 0 ? 1 : 0;
    });
  };

  // ================= END INNINGS =================
  const endInnings = () => {
    if (innings === 1) {
      setTarget(score + 1);
      setInnings(2);

      setScore(0);
      setWickets(0);
      setBalls(0);
      setOvers(0);
      setBallHistory([]);
      setPartnershipRuns(0);
      setPartnershipBalls(0);
      setIsFreeHit(false);

      setShowDialog(true);
    } else {
      alert("Match Over");
    }
  };

  // ================= AUTO END ENGINE (MAIN FIX) =================
  useEffect(() => {
    if (showDialog) return;

    const ballsBowled = overs * 6 + balls;

    if (wickets >= maxWickets || ballsBowled >= totalBalls) {
      endInnings();
    }
  }, [overs, balls, wickets]);

  // ================= RUN =================
  const handleRun = (runs) => {
    if (isFreeHit) setIsFreeHit(false);

    setScore((prev) => prev + runs);
    setPartnershipRuns((prev) => prev + runs);
    setPartnershipBalls((prev) => prev + 1);

    setPlayers((prev) => {
      const updated = [...prev];
      updated[strikerIndex].runs += runs;
      updated[strikerIndex].balls += 1;
      return updated;
    });

    let nextBalls = balls + 1;
    let nextOvers = overs;

    if (runs % 2 === 1) swapStrike();

    if (nextBalls === 6) {
      nextOvers = overs + 1;
      nextBalls = 0;
      swapStrike();
      setIsNewBowlerPending(true);
    }

    setBalls(nextBalls);
    setOvers(nextOvers);

    setBallHistory((prev) => [...prev, { runs }]);
  };

  // ================= WICKET =================
  const handleWicket = () => {
    if (isFreeHit) {
      setBallHistory((prev) => [...prev, { type: "FH" }]);
      setIsFreeHit(false);
      return;
    }

    setWickets((prev) => prev + 1);
    setOutBatsman(strikerIndex);
    setIsWicketPending(true);
    setPartnershipRuns(0);
    setPartnershipBalls(0);

    let nextBalls = balls + 1;
    let nextOvers = overs;

    if (nextBalls === 6) {
      nextOvers = overs + 1;
      nextBalls = 0;
      swapStrike();
      setIsNewBowlerPending(true);
    }

    setBalls(nextBalls);
    setOvers(nextOvers);

    setBallHistory((prev) => [...prev, { type: "W" }]);
  };

  // ================= EXTRAS =================
  const handleWide = () => {
    if (!rules.wide) return;
    setScore((prev) => prev + 1);
    setBallHistory((prev) => [...prev, { type: "WD" }]);
  };

  const handleNoBall = () => {
    if (!rules.noBall) return;
    setScore((prev) => prev + 1);
    setIsFreeHit(true);
    setBallHistory((prev) => [...prev, { type: "NB" }]);
  };

  // ================= NEW BATSMAN =================
  const handleNewBatsman = (name) => {
    const updated = [...players];
    updated[outBatsman] = { name, runs: 0, balls: 0 };
    setPlayers(updated);
    setIsWicketPending(false);
  };

  // ================= NEW BOWLER =================
  const handleNewBowler = (name) => {
    setBowlers((prev) => [
      ...prev,
      { name, overs: 0, balls: 0, runs: 0, wickets: 0 },
    ]);
    setCurrentBowlerIndex((prev) => prev + 1);
    setIsNewBowlerPending(false);
  };

  return (
    <div className={styles.container}>
      {showDialog && (
        <StartInningsModal
          onStart={(s, ns, b) => {
            setPlayers([
              { name: s, runs: 0, balls: 0 },
              { name: ns, runs: 0, balls: 0 },
            ]);
            setBowlers([{ name: b, overs: 0, balls: 0, runs: 0, wickets: 0 }]);
            setShowDialog(false);
          }}
        />
      )}

      {!showDialog && (
        <>
          <BrandTitle size="small" />
          <ScoreHeader team={matchData.battingFirst} score={score} wickets={wickets} />

          <InfoStrip
            overs={formatOvers()}
            bowler={`${bowlers[currentBowlerIndex]?.name}`}
            runRate={calculateRunRate()}
            isFreeHit={isFreeHit}
          />

          <OverBalls history={ballHistory} />

          {players.length >= 2 && (
            <BatsmenRow
              striker={players[strikerIndex]}
              nonStriker={players[nonStrikerIndex]}
              partnershipRuns={partnershipRuns}
              partnershipBalls={partnershipBalls}
            />
          )}

          <RunControls
            onRun={handleRun}
            onWide={handleWide}
            onNoBall={handleNoBall}
            onWicket={handleWicket}
            disabled={isWicketPending}
          />
        </>
      )}

      {isWicketPending && <NewBatsmanModal onConfirm={handleNewBatsman} />}
      {isNewBowlerPending && <NewBowlerModal onConfirm={handleNewBowler} />}
    </div>
  );
}

export default ScoringPage;
