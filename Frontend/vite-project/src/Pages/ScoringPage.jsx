import { useLocation } from "react-router-dom";
import { useState } from "react";
import styles from "./ScoringPage.module.css";
import BrandTitle from "../Components/BrandTitle";

function ScoringPage() {
  const location = useLocation();
  const matchData = location.state || {};

  const [players, setPlayers] = useState([]);
  const [strikerIndex, setStrikerIndex] = useState(null);
  const [nonStrikerIndex, setNonStrikerIndex] = useState(null);

  const [score, setScore] = useState(0);
  const [wickets] = useState(0);
  const [balls, setBalls] = useState(0);
  const [overs, setOvers] = useState(0);
  const [ballHistory, setBallHistory] = useState([]);

  const [showDialog, setShowDialog] = useState(true);
  const [strikerName, setStrikerName] = useState("");
  const [nonStrikerName, setNonStrikerName] = useState("");
  const [bowler, setBowler] = useState("");

  const [showNewBatsmanPopup, setShowNewBatsmanPopup] = useState(false);
  const [newBatsmanName, setNewBatsmanName] = useState("");

  const [showBowlerPopup, setShowBowlerPopup] = useState(false);
  const [newBowlerName, setNewBowlerName] = useState("");

  const formatOvers = () => `${overs}.${balls}`;

  const swapStrike = () => {
    setStrikerIndex(nonStrikerIndex);
    setNonStrikerIndex(strikerIndex);
  };

  const handleRun = (runs) => {
    setScore((prev) => prev + runs);

    const updatedPlayers = [...players];
    updatedPlayers[strikerIndex].runs += runs;
    updatedPlayers[strikerIndex].balls += 1;
    setPlayers(updatedPlayers);

    let newBallCount = balls + 1;
    if (newBallCount === 6) {
      setOvers((prev) => prev + 1);
      setBalls(0);
      swapStrike();
      setShowBowlerPopup(true);
    } else setBalls(newBallCount);

    if (runs % 2 === 1) swapStrike();

    setBallHistory((prev) => [...prev, { runs }]);
  };

  const startInnings = () => {
    if (!strikerName || !nonStrikerName || !bowler) return alert("Fill all");

    setPlayers([
      { name: strikerName, runs: 0, balls: 0 },
      { name: nonStrikerName, runs: 0, balls: 0 },
    ]);
    setStrikerIndex(0);
    setNonStrikerIndex(1);
    setShowDialog(false);
  };

  const handleWicket = () => {
    setWickets((prev) => prev + 1);
    setShowNewBatsmanPopup(true);

    setBallHistory((prev) => [...prev, { type: "wicket", runs: 0 }]);
  };

  const striker = players[strikerIndex] || {};
  const nonStriker = players[nonStrikerIndex] || {};

  return (
    <div className={styles.container}>
      <BrandTitle size="small" />

      {showDialog && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalBox}>
            <h2 className={styles.modalTitle}>Start Innings</h2>

            <input
              type="text"
              placeholder="Striker Name"
              onChange={(e) => setStrikerName(e.target.value)}
            />

            <input
              type="text"
              placeholder="Non-Striker Name"
              onChange={(e) => setNonStrikerName(e.target.value)}
            />

            <input
              type="text"
              placeholder="Opening Bowler"
              onChange={(e) => setBowler(e.target.value)}
            />

            <button onClick={startInnings}>Start Match</button>
          </div>
        </div>
      )}

      {!showDialog && (
        <>
          <div className={styles.scoreCard}>
            <h2 className={styles.teamName}>{matchData.battingFirst}</h2>
            <h1 className={styles.bigScore}>
              {score}/{wickets}
            </h1>
          </div>

          <div className={styles.infoStrip}>
            <div>
              <span className={styles.label}>OVERS&nbsp; -</span>
              <span className={styles.value}>{formatOvers()}</span>
            </div>
            <div className={styles.divider}></div>
            <div>
              <span className={styles.label}>BOWLER&nbsp; -</span>
              <span className={styles.value}>{bowler}</span>
            </div>
          </div>

          <div className={styles.overBalls}>
            {ballHistory.slice(-6).map((b, i) => (
              <div key={i} className={styles.ball}>
                {b.runs}
              </div>
            ))}
          </div>

          <div className={styles.batsmenRow}>
            <div>
              <h3>{striker.name} *</h3>
              <p>
                {striker.runs} ({striker.balls})
              </p>
            </div>
            <div>
              <h3>{nonStriker.name}</h3>
              <p>
                {nonStriker.runs} ({nonStriker.balls})
              </p>
            </div>
          </div>

          <div className={styles.runPanel}>
            {[0, 1, 2, 3, 4, 5, 6].map((r) => (
              <button key={r} onClick={() => handleRun(r)}>
                {r}
              </button>
            ))}
          </div>

          <button className={styles.wicketBtn} onClick={handleWicket}>
            WICKET
          </button>

          {showNewBatsmanPopup && (
            <div className={styles.modalOverlay}>
              <div className={styles.modalBox}>
                <h2>New Batsman</h2>
                <input
                  placeholder="Enter batsman name"
                  onChange={(e) => setNewBatsmanName(e.target.value)}
                />
                <button
                  onClick={() => {
                    if (!newBatsmanName) return;

                    const updatedPlayers = [...players];
                    updatedPlayers[strikerIndex] = {
                      name: newBatsmanName,
                      runs: 0,
                      balls: 0,
                    };
                    setPlayers(updatedPlayers);
                    setShowNewBatsmanPopup(false);
                  }}
                >
                  Confirm
                </button>
              </div>
            </div>
          )}

          {showBowlerPopup && (
            <div className={styles.modalOverlay}>
              <div className={styles.modalBox}>
                <h2>New Bowler</h2>
                <input
                  placeholder="Enter bowler name"
                  onChange={(e) => setNewBowlerName(e.target.value)}
                />
                <button
                  onClick={() => {
                    if (!newBowlerName) return;
                    setBowler(newBowlerName);
                    setShowBowlerPopup(false);
                  }}
                >
                  Confirm
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default ScoringPage;
