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

  // ---------------- TEST MATCH ----------------
  const [isTestMatch, setIsTestMatch] = useState(false);
  const [matchDays, setMatchDays] = useState("");
  const [inningsPerTeam, setInningsPerTeam] = useState("2");
  const [oversPerDay, setOversPerDay] = useState("");

  // ---------------- TOSS ----------------
  const [callChoice, setCallChoice] = useState("heads");
  const [callingTeam, setCallingTeam] = useState("teamA");
  const [tossResult, setTossResult] = useState(null);
  const [tossWinner, setTossWinner] = useState(null);
  const [battingFirst, setBattingFirst] = useState(null);

  const [batChoice, setBatChoice] = useState(null);


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

    const callerName =
      callingTeam === "teamA" ? teamA || "Team 1" : teamB || "Team 2";
    const otherTeamName =
      callingTeam === "teamA" ? teamB || "Team 2" : teamA || "Team 1";

    if (result === callChoice) {
      setTossWinner(callerName);
    } else {
      setTossWinner(otherTeamName);
    }
  };

  // ---------------- START MATCH ----------------
  const startMatch = () => {
    const matchData = {
      teamA: teamA || "Team 1",
      teamB: teamB || "Team 2",
      teamAPlayers,
      teamBPlayers,
      teamACaptain,
      teamBCaptain,
      overs,
      tossWinner,
      battingFirst,
      rules,
      isTestMatch,
      matchDays,
      inningsPerTeam,
      oversPerDay,
    };

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
          placeholder="Team A Number Players"
          type="number"
          onChange={(e) => setTeamAPlayers(e.target.value)}
        />
        <input
          className={styles.input}
          placeholder="Team B Number Players"
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

        {/* TEST MATCH SETUP */}
        <div className={styles.testMatchBox}>
          <label className={styles.testToggle}>
            <input
              type="checkbox"
              checked={isTestMatch}
              onChange={(e) => setIsTestMatch(e.target.checked)}
            />
            <span>Test Match Setup</span>
          </label>

          {isTestMatch && (
            <div className={styles.testOptions}>
              <div className={styles.testField}>
                <label>Number of Days</label>
                <input
                  type="number"
                  placeholder="e.g. 5"
                  onChange={(e) => setMatchDays(e.target.value)}
                />
              </div>

              <div className={styles.testField}>
                <label>Overs per Day</label>
                <input
                  type="number"
                  placeholder="e.g. 90"
                  onChange={(e) => setOversPerDay(e.target.value)}
                />
              </div>

              <div className={styles.inningsRow}>
                <label>Innings per Team</label>
                <div className={styles.radioGroup}>
                  <label>
                    <input
                      type="radio"
                      name="innings"
                      value="1"
                      checked={inningsPerTeam === 1}
                      onChange={() => setInningsPerTeam(1)}
                    />
                    1
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="innings"
                      value="2"
                      checked={inningsPerTeam === 2}
                      onChange={() => setInningsPerTeam(2)}
                    />
                    2
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

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
            <option value="teamA">{teamA || "Team 1"} Calls</option>
            <option value="teamB">{teamB || "Team 2"} Calls</option>
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
            className={`${styles.choiceBtn} ${
              batChoice === "bat" ? styles.activeChoice : ""
            }`}
            onClick={() => {
              setBatChoice("bat");
              setBattingFirst(tossWinner);
            }}
          >
            Bat
          </button>
        
          <button
            className={`${styles.choiceBtn} ${
              batChoice === "bowl" ? styles.activeChoice : ""
            }`}
            onClick={() => {
              setBatChoice("bowl");
              setBattingFirst(tossWinner === teamA ? teamB : teamA);
            }}
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

        {rules.wide && (
          <div className={styles.ruleBox}>
            <p>Wide Ball Rule</p>
            <label>
              <input
                type="radio"
                name="wideRun"
                onChange={() => setRules({ ...rules, wideRunAllowed: false })}
              />{" "}
              Only 1 run penalty
            </label>
          </div>
        )}

        {rules.noBall && (
          <div className={styles.ruleBox}>
            <p>No Ball Rule</p>
            <label>
              <input
                type="radio"
                name="noBallRun"
                onChange={() => setRules({ ...rules, noBallRunAllowed: true })}
              />{" "}
              FreeHit
            </label>
            <label>
              <input
                type="radio"
                name="noBallRun"
                onChange={() => setRules({ ...rules, noBallRunAllowed: false })}
              />{" "}
              Run
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
