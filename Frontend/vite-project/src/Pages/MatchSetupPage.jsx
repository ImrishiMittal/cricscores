import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./MatchSetupPage.module.css";
import BrandTitle from "../Components/BrandTitle";
import CaptainSearch from "../Components/Scoring/CaptainSearch";
import * as teamApi from "../api/teamApi";

function TeamAutocomplete({ placeholder, value, onChange, allTeams = [] }) {
  const [suggestions, setSuggestions] = useState([]);
  const [show, setShow] = useState(false);
  const ref = useRef(null);

  // ✅ REMOVED: teamNames state and fetch — now received via allTeams prop from parent

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setShow(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleChange = (e) => {
    const val = e.target.value;
    onChange(val);
    if (val.trim().length === 0) {
      setSuggestions([]);
      setShow(false);
      return;
    }
    const matches = allTeams
      .filter((name) => name.toLowerCase().startsWith(val.trim().toLowerCase()))
      .slice(0, 5);
    setSuggestions(matches);
    setShow(matches.length > 0);
  };

  return (
    <div ref={ref} style={{ position: "relative", width: "100%" }}>
      <input
        className={styles.input}
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        onFocus={() => {
          if (suggestions.length > 0) setShow(true);
        }}
        autoComplete="off"
      />
      {show && suggestions.length > 0 && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            background: "#1a1a1a",
            border: "1px solid #22c55e",
            borderRadius: "8px",
            zIndex: 100,
            overflow: "hidden",
          }}
        >
          {suggestions.map((name) => (
            <div
              key={name}
              onMouseDown={() => {
                onChange(name);
                setShow(false);
                setSuggestions([]);
              }}
              style={{
                padding: "10px 14px",
                cursor: "pointer",
                color: "#e5e7eb",
                fontSize: "14px",
                borderBottom: "1px solid #2a2a2a",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "#0f2a0f")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "transparent")
              }
            >
              🏏 {name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MatchSetupPage() {
  const navigate = useNavigate();

  // ---------------- BASIC INFO ----------------
  const [teamA, setTeamA] = useState("");
  const [teamB, setTeamB] = useState("");
  const [teamAPlayers, setTeamAPlayers] = useState("");
  const [teamBPlayers, setTeamBPlayers] = useState("");

  // Captain stored as { jersey, name } or null
  const [teamACaptain, setTeamACaptain] = useState(null);
  const [teamBCaptain, setTeamBCaptain] = useState(null);

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
    noBallFreeHit: false,
  });

  const [enableSuperOver, setEnableSuperOver] = useState(false);

  // ----------------Single Batsman ---------------
  const [lastManBatting, setLastManBatting] = useState(false);

  const [maxOversPerBowler, setMaxOversPerBowler] = useState("");
  const [showAdditionalSetup, setShowAdditionalSetup] = useState(false);

  // ✅ ADDED: teamNames lives here so it can be passed down to both TeamAutocomplete instances
  const [teamNames, setTeamNames] = useState([]);

  useEffect(() => {
    teamApi
      .getTeams()
      .then((teams) => setTeamNames(teams.map((t) => t.name)))
      .catch(() => {});
  }, []);

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
    // ── Required field validation ──────────────────────────────
    const errors = [];

    if (!teamA.trim()) errors.push("Team A Name");
    if (!teamB.trim()) errors.push("Team B Name");
    if (!teamAPlayers) errors.push("Team A Number of Players");
    if (!teamBPlayers) errors.push("Team B Number of Players");
    if (!overs) errors.push("Number of Overs");

    // Toss must be completed AND bat/bowl choice must be made
    if (!tossWinner) errors.push("Toss (flip the coin first)");
    if (tossWinner && !batChoice) errors.push("Bat / Bowl choice after toss");

    if (errors.length > 0) {
      alert(
        `⚠️ Please complete the following before starting:\n\n• ${errors.join(
          "\n• "
        )}`
      );
      return;
    }

    const matchData = {
      teamA: teamA.trim(),
      teamB: teamB.trim(),
      teamAPlayers,
      teamBPlayers,
      teamACaptain: teamACaptain || null,
      teamBCaptain: teamBCaptain || null,
      overs,
      tossWinner,
      battingFirst,
      rules,
      isTestMatch,
      matchDays,
      inningsPerTeam,
      oversPerDay,
      lastManBatting,
      maxOversPerBowler: isTestMatch
        ? null
        : maxOversPerBowler !== "" && maxOversPerBowler !== null
        ? Number(maxOversPerBowler)
        : null,
      enableSuperOver,
    };

    localStorage.setItem("matchData", JSON.stringify(matchData));
try { localStorage.removeItem("cricket_match_snapshot"); } catch(e) {}
navigate("/scoring", { state: matchData });
  };

  return (
    <div className={styles.container}>
      <BrandTitle size="medium" />

      <div className={styles.card}>
        <h2 className={styles.sectionTitle}>Match Setup</h2>

        {/* TEAM INFO */}
        <TeamAutocomplete
          placeholder="Team A Name"
          value={teamA}
          onChange={setTeamA}
          allTeams={teamNames}
        />
        <TeamAutocomplete
          placeholder="Team B Name"
          value={teamB}
          onChange={setTeamB}
          allTeams={teamNames}
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

        {/* CAPTAIN SEARCH — autocomplete from player database */}
        <CaptainSearch
          placeholder="Team A Captain (name or jersey)"
          value={teamACaptain}
          onSelect={setTeamACaptain}
        />
        <CaptainSearch
          placeholder="Team B Captain (name or jersey)"
          value={teamBCaptain}
          onSelect={setTeamBCaptain}
        />

        <input
          className={styles.input}
          placeholder="Number of Overs"
          type="number"
          onChange={(e) => setOvers(e.target.value)}
        />

        {/* ================= ADDITIONAL SETUP ================= */}
        <div className={styles.additionalBox}>
          <div
            className={styles.additionalHeader}
            onClick={() => setShowAdditionalSetup(!showAdditionalSetup)}
          >
            <span>⚙ Additional Setup</span>
            <span>{showAdditionalSetup ? "▲" : "▼"}</span>
          </div>

          {showAdditionalSetup && (
            <div className={styles.additionalContent}>
              {/* Gully Mode */}
              <label className={styles.additionalOption}>
                <input
                  type="checkbox"
                  checked={lastManBatting}
                  onChange={(e) => setLastManBatting(e.target.checked)}
                />
                Gully Mode (Last Man Can Bat Alone)
              </label>

              {/* Super Over Toggle */}
              <label className={styles.additionalOption}>
                <input
                  type="checkbox"
                  checked={enableSuperOver}
                  onChange={(e) => setEnableSuperOver(e.target.checked)}
                />
                Super Over (On Tie)
              </label>

              {/* Max Overs Per Bowler */}
              <div className={styles.testField}>
                <label>Max Overs Per Bowler (Per Innings)</label>
                <input
                  type="number"
                  min="1"
                  value={maxOversPerBowler}
                  placeholder="No limit"
                  onChange={(e) => setMaxOversPerBowler(e.target.value)}
                  disabled={isTestMatch}
                />
              </div>

              {/* Test Match Toggle */}
              <label
                className={styles.additionalOption}
                style={{ opacity: 0.5, cursor: "not-allowed" }}
              >
                <input
                  type="checkbox"
                  checked={isTestMatch}
                  onChange={() => {}}
                  disabled
                />
                Test Match Setup{" "}
                <span
                  style={{
                    fontSize: "11px",
                    color: "#facc15",
                    marginLeft: "6px",
                  }}
                >
                  🚧 Coming Soon
                </span>
              </label>

              {/* Test Match Options */}
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
                type="checkbox"
                checked={rules.noBallFreeHit}
                onChange={(e) =>
                  setRules({ ...rules, noBallFreeHit: e.target.checked })
                }
              />
              Free Hit
            </label>

            <label>
              <input
                type="checkbox"
                checked={rules.noBallRunAllowed}
                onChange={(e) =>
                  setRules({ ...rules, noBallRunAllowed: e.target.checked })
                }
              />
              Run
            </label>
          </div>
        )}

        {(() => {
          const ready =
            teamA.trim() &&
            teamB.trim() &&
            teamAPlayers &&
            teamBPlayers &&
            overs &&
            tossWinner &&
            batChoice;

          return (
            <button
              className={styles.startBtn}
              onClick={startMatch}
              disabled={!ready}
              style={{
                opacity: ready ? 1 : 0.45,
                cursor: ready ? "pointer" : "not-allowed",
              }}
            >
              Start Match
            </button>
          );
        })()}
      </div>
    </div>
  );
}

export default MatchSetupPage;
