import { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./MatchSetupPage.module.css";
import BrandTitle from "../Components/BrandTitle";

function MatchSetupPage() {
  const navigate = useNavigate();

  // ---------------- BASIC INFO ----------------
  const [teamA, setTeamA] = useState("");
  const [teamB, setTeamB] = useState("");
  const [teamAPlayers, setTeamAPlayers] = useState("");
  const [teamBPlayers, setTeamBPlayers] = useState("");
  const [teamACaptain, setTeamACaptain] = useState("");
  const [teamBCaptain, setTeamBCaptain] = useState("");
  const [overs, setOvers] = useState("");

  // ---------------- TOSS ----------------
  const [callChoice, setCallChoice] = useState("heads");
  const [callingTeam, setCallingTeam] = useState("Team A");
  const [tossResult, setTossResult] = useState(null);
  const [tossWinner, setTossWinner] = useState(null);
  const [battingFirst, setBattingFirst] = useState(null);

  // ---------------- MATCH RULES ----------------
  const [rules, setRules] = useState({
    wide: false,
    noBall: false,
    byes: false,
    wideRunAllowed: false,
    noBallRunAllowed: false,
  });

  // ---------------- TOSS LOGIC ----------------
  const handleToss = () => {
    const result = Math.random() < 0.5 ? "heads" : "tails";
    setTossResult(result);

    if (result === callChoice) {
      setTossWinner(callingTeam);
    } else {
      setTossWinner(callingTeam === "Team A" ? "Team B" : "Team A");
    }
  };

  // ---------------- START MATCH ----------------
  const startMatch = () => {
    const matchData = {
      teamA,
      teamB,
      teamAPlayers,
      teamBPlayers,
      teamACaptain,
      teamBCaptain,
      overs,
      tossWinner,
      battingFirst,
      rules,
    };

    console.log(matchData);
    navigate("/scoring", { state: matchData });
  };

  return (
    <div className={styles.container}>
      <BrandTitle size="medium" />

      <div className={styles.card}>
        <h2 className={styles.sectionTitle}>Match Setup</h2>

        {/* TEAM INFO */}
        <input
          className={styles.input}
          placeholder="Team A Name"
          onChange={(e) => setTeamA(e.target.value)}
        />
        <input
          className={styles.input}
          placeholder="Team B Name"
          onChange={(e) => setTeamB(e.target.value)}
        />
        <input
          className={styles.input}
          placeholder="Team A Players"
          type="number"
          onChange={(e) => setTeamAPlayers(e.target.value)}
        />
        <input
          className={styles.input}
          placeholder="Team B Players"
          type="number"
          onChange={(e) => setTeamBPlayers(e.target.value)}
        />
        <input
          className={styles.input}
          placeholder="Team A Captain"
          onChange={(e) => setTeamACaptain(e.target.value)}
        />
        <input
          className={styles.input}
          placeholder="Team B Captain"
          onChange={(e) => setTeamBCaptain(e.target.value)}
        />
        <input
          className={styles.input}
          placeholder="Number of Overs"
          type="number"
          onChange={(e) => setOvers(e.target.value)}
        />

        {/* TOSS CALL */}
        <div className={styles.tossCallRow}>
          <p>Captain Call</p>
          <select
            className={styles.select}
            onChange={(e) => setCallChoice(e.target.value)}
          >
            <option value="heads">Heads</option>
            <option value="tails">Tails</option>
          </select>

          <select
            className={styles.select}
            onChange={(e) => setCallingTeam(e.target.value)}
          >
            <option value="Team A">Team A Calls</option>
            <option value="Team B">Team B Calls</option>
          </select>
        </div>

        <button className={styles.tossBtn} onClick={handleToss}>
          Flip Coin for Toss
        </button>

        {tossResult && (
          <div className={styles.tossResult}>
            Coin landed: <strong>{tossResult.toUpperCase()}</strong>
            <br />
            Toss won by: <strong>{tossWinner}</strong>
          </div>
        )}

        {/* BAT/BOWL */}
        {tossWinner && (
          <div className={styles.choiceRow}>
            <p>{tossWinner} chooses:</p>
            <button
              className={styles.choiceBtn}
              onClick={() => setBattingFirst(tossWinner)}
            >
              Bat
            </button>
            <button
              className={styles.choiceBtn}
              onClick={() =>
                setBattingFirst(tossWinner === "Team A" ? "Team B" : "Team A")
              }
            >
              Bowl
            </button>
          </div>
        )}

        {/* EXTRAS RULES */}
        <div className={styles.extrasRow}>
          <label>
            <input
              type="checkbox"
              checked={rules.wide}
              onChange={(e) => setRules({ ...rules, wide: e.target.checked })}
            />{" "}
            Wide
          </label>

          <label>
            <input
              type="checkbox"
              checked={rules.noBall}
              onChange={(e) => setRules({ ...rules, noBall: e.target.checked })}
            />{" "}
            No Ball
          </label>

          <label>
            <input
              type="checkbox"
              checked={rules.byes}
              onChange={(e) => setRules({ ...rules, byes: e.target.checked })}
            />{" "}
            Byes
          </label>
        </div>

        {/* WIDE RULE OPTIONS */}
        {rules.wide && (
          <div className={styles.ruleBox}>
            <p>Wide Ball Rule</p>
            <label>
              <input
                type="radio"
                name="wideRun"
                onChange={() => setRules({ ...rules, wideRunAllowed: false })}
              />
              Only 1 run penalty
            </label>
          </div>
        )}

        {/* NO BALL RULE OPTIONS */}
        {rules.noBall && (
          <div className={styles.ruleBox}>
            <p>No Ball Rule</p>
            <label>
              <input
                type="radio"
                name="noBallRun"
                onChange={() => setRules({ ...rules, noBallRunAllowed: true })}
              />
              FreeHit
            </label>
            <label>
              <input
                type="radio"
                name="noBallRun"
                onChange={() => setRules({ ...rules, noBallRunAllowed: false })}
              />
              Only 1 run penalty
            </label>
          </div>
        )}

        <button className={styles.startBtn} onClick={startMatch}>
          Start Match
        </button>
      </div>
    </div>
  );
}

export default MatchSetupPage;
