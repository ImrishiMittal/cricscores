import { useState } from "react";
import { useNavigate } from "react-router-dom";
import * as tournamentApi from "../api/tournamentApi";
import BrandTitle from "../Components/BrandTitle";

// ─── Knockout format definitions ────────────────────────────────────────────
const KNOCKOUT_OPTIONS = [
  { value: "top2", label: "Top 2 → Final", min: 3, desc: "League → Top 2 → Final" },
  { value: "top4", label: "Top 4 → Semis → Final", min: 4, desc: "League → Top 4 → Semi 1 / Semi 2 → Final" },
  { value: "top8", label: "Top 8 → Quarters → Semis → Final", min: 8, desc: "League → Top 8 → QF → SF → Final" },
  { value: "ipl", label: "IPL Playoffs", min: 4, desc: "Top 4 → Qualifier 1 / Eliminator → Qualifier 2 → Final" },
  { value: "none", label: "No Knockout", min: 3, desc: "Table-topper wins — no playoffs" },
];

const TOTAL_STEPS = 8;
const MIN_TEAMS = 3;
const MAX_TEAMS = 32;

export default function CreateTournamentPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // ── Step 1 — basics ──────────────────────────────────────────────────────
  const [name, setName] = useState("");
  const [format, setFormat] = useState("limited"); // "limited" | "test"
  const [overs, setOvers] = useState(20);
  const [matchDays, setMatchDays] = useState(5);
  const [oversPerDay, setOversPerDay] = useState(90);

  // ── Step 2 — teams ───────────────────────────────────────────────────────
  // numTeams is kept as the RAW string the user is typing while focused, so the
  // field never fights keystrokes (clearing it, typing a single digit, etc).
  // It's only clamped to [MIN_TEAMS, MAX_TEAMS] on blur or when actually
  // submitting the step — never on every keystroke.
  const [numTeams, setNumTeams] = useState(8);
  const [teamNames, setTeamNames] = useState(Array(8).fill(""));

  // ── Step 3 — league stage ───────────────────────────────────────────────
  const [leagueFormat, setLeagueFormat] = useState("roundRobin"); // "roundRobin" | "groups"
  const [roundRobinType, setRoundRobinType] = useState("single"); // "single" | "double"
  const [numGroups, setNumGroups] = useState(2);

  // ── Step 4 — knockout stage ─────────────────────────────────────────────
  const [knockoutFormat, setKnockoutFormat] = useState("top4");

  // ── Step 5 — points ──────────────────────────────────────────────────────
  const [pointsWin, setPointsWin] = useState(2);
  const [pointsTie, setPointsTie] = useState(1);
  const [pointsNR, setPointsNR] = useState(1);
  const pointsLoss = 0;

  // ── Step 6 — super over ─────────────────────────────────────────────────
  const [leagueTieHandling, setLeagueTieHandling] = useState("tieAllowed"); // "tieAllowed" | "superOver"
  // Knockouts always default to mandatory super over, per spec.

  // ── Step 7 — squads ──────────────────────────────────────────────────────
  const [setupSquadsNow, setSetupSquadsNow] = useState(false);

  // ────────────────────────────────────────────────────────────────────────
  const inputStyle = {
    width: "100%", background: "#111827", border: "1px solid #374151",
    color: "#f9fafb", padding: "10px 12px", borderRadius: "8px",
    fontSize: "14px", boxSizing: "border-box",
  };
  const labelStyle = { fontSize: "13px", color: "#9ca3af", marginBottom: "6px", display: "block" };
  const cardStyle = { background: "#111827", border: "1px solid #1f2937", borderRadius: "10px", padding: "16px" };
  const sectionTitleStyle = { fontSize: "13px", color: "#9ca3af", marginBottom: "10px", fontWeight: "600" };

  const optionBtn = (active) => ({
    flex: 1, padding: "10px", borderRadius: "8px",
    border: `1px solid ${active ? "#16a34a" : "#374151"}`,
    background: active ? "#14532d" : "#111827",
    color: active ? "#4ade80" : "#9ca3af",
    fontWeight: "600", cursor: "pointer", fontSize: "13px", textAlign: "left",
  });

  // ── Helpers ──────────────────────────────────────────────────────────────

  // Resize the teamNames array to `count` entries, preserving existing values.
  const resizeTeamNames = (count) => {
    setTeamNames((prev) => {
      const updated = [...prev];
      while (updated.length < count) updated.push("");
      return updated.slice(0, count);
    });
  };

  // Fires on every keystroke. Does NOT clamp — that would snap the field back
  // mid-type (e.g. clearing "2" to type "30" would re-clamp to 2 before the
  // "3" could land). We just store whatever the user typed, and only resize
  // the team-name inputs once we have a real, usable number to react to.
  const handleNumTeamsChange = (raw) => {
    setNumTeams(raw);

    const parsed = Number(raw);
    if (raw !== "" && Number.isFinite(parsed) && parsed >= 1) {
      resizeTeamNames(Math.min(MAX_TEAMS, Math.floor(parsed)));
    }
  };

  // Fires on blur (or before moving on). This is the only place numTeams gets
  // clamped into [MIN_TEAMS, MAX_TEAMS] — typing itself is never restricted.
  const handleNumTeamsBlur = () => {
    const parsed = Number(numTeams);
    if (numTeams === "" || !Number.isFinite(parsed) || parsed < MIN_TEAMS) {
      setNumTeams(MIN_TEAMS);
      resizeTeamNames(MIN_TEAMS);
      return;
    }
    const count = Math.min(MAX_TEAMS, Math.floor(parsed));
    setNumTeams(count);
    resizeTeamNames(count);
  };

  const cleanTeamNames = teamNames.map((t) => t.trim()).filter(Boolean);
  const duplicateTeamNames =
    new Set(cleanTeamNames.map((t) => t.toLowerCase())).size !== cleanTeamNames.length;

  // Which specific input indices are involved in a name clash (case-insensitive,
  // trimmed), so the UI can highlight exactly the offending fields live as the
  // user types — not just block them with a generic message at Next.
  const duplicateTeamIndexes = (() => {
    const seen = new Map(); // lowercase name -> first index seen
    const dupes = new Set();
    teamNames.forEach((raw, i) => {
      const key = raw.trim().toLowerCase();
      if (!key) return; // empty fields aren't "duplicates" of each other
      if (seen.has(key)) {
        dupes.add(seen.get(key)); // mark the earlier occurrence too
        dupes.add(i);
      } else {
        seen.set(key, i);
      }
    });
    return dupes;
  })();

  // Group validation has two tiers:
  //  - HARD floor: teams must split evenly, and each group needs >= 2 teams.
  //    Below 2 a "group" isn't a group (can't even play itself), so this
  //    still blocks progress.
  //  - SOFT recommendation: 3+ per group is recommended (gives each team
  //    more than one match, makes NRR/tiebreakers meaningful) but a lot of
  //    real small tournaments run fine with 2-team groups, so this is a
  //    warning the organizer can proceed past, not a wall.
  const GROUP_HARD_MIN = 2;
  const GROUP_RECOMMENDED_MIN = 3;
  const groupsValid =
    leagueFormat !== "groups" ||
    (numTeams % numGroups === 0 && numTeams / numGroups >= GROUP_HARD_MIN);
  const groupsBelowRecommended =
    leagueFormat === "groups" &&
    groupsValid &&
    numTeams / numGroups < GROUP_RECOMMENDED_MIN;

  const selectedKnockout = KNOCKOUT_OPTIONS.find((k) => k.value === knockoutFormat);
  const knockoutValid = !selectedKnockout || numTeams >= selectedKnockout.min;

  // Expected match counts for the preview
  const expectedLeagueMatches = (() => {
    const legs = roundRobinType === "double" ? 2 : 1;
    if (leagueFormat === "roundRobin") {
      return Math.floor((numTeams * (numTeams - 1)) / 2) * legs;
    }
    // groups: round robin within each group
    const perGroup = numTeams / numGroups;
    const perGroupMatches = Math.floor((perGroup * (perGroup - 1)) / 2) * legs;
    return perGroupMatches * numGroups;
  })();

  const expectedKnockoutMatches = {
    top2: 1,
    top4: 3,
    top8: 7,
    ipl: 4,
    none: 0,
  }[knockoutFormat];

  // ── Step navigation / validation ────────────────────────────────────────
  const goNext = () => {
    setError("");

    if (step === 1) {
      if (!name.trim()) return setError("Tournament name is required.");
      if (format === "limited" && (!overs || Number(overs) < 1)) return setError("Enter a valid number of overs.");
      if (format === "test" && (!matchDays || !oversPerDay)) return setError("Enter match days and overs per day.");
    }

    if (step === 2) {
      // Clamp/normalize first so a half-typed value can't sneak past validation.
      const parsed = Number(numTeams);
      if (numTeams === "" || !Number.isFinite(parsed) || parsed < MIN_TEAMS) {
        alert(`⚠️ A tournament needs at least ${MIN_TEAMS} teams to proceed.`);
        setNumTeams(MIN_TEAMS);
        resizeTeamNames(MIN_TEAMS);
        return setError(`A tournament needs at least ${MIN_TEAMS} teams.`);
      }
      const count = Math.min(MAX_TEAMS, Math.floor(parsed));
      if (count !== numTeams) {
        setNumTeams(count);
        resizeTeamNames(count);
      }
      if (cleanTeamNames.length !== count) return setError("All team names are required.");
      if (duplicateTeamNames) {
        alert("⚠️ Two or more teams have the same name. Each team name must be unique.");
        return setError("Team names must be unique.");
      }
    }

    if (step === 3) {
      if (leagueFormat === "groups" && !groupsValid) {
        alert(
          `⚠️ ${numTeams} teams can't be split into ${numGroups} equal groups of at least ${GROUP_HARD_MIN}. Try a different group count.`
        );
        return setError(
          `${numTeams} teams can't be split into ${numGroups} equal groups of at least ${GROUP_HARD_MIN}. Try a different group count.`
        );
      }
      // groupsBelowRecommended (2 teams/group) is allowed through — it's a
      // soft warning shown inline above, not a hard block.
    }

    if (step === 4) {
      if (!knockoutValid) {
        alert(`⚠️ ${selectedKnockout.label} needs at least ${selectedKnockout.min} teams. You have ${numTeams}.`);
        return setError(`${selectedKnockout.label} needs at least ${selectedKnockout.min} teams.`);
      }
    }

    setStep((s) => Math.min(TOTAL_STEPS, s + 1));
  };

  const goBack = () => {
    setError("");
    setStep((s) => Math.max(1, s - 1));
  };

  const applyPreset = (preset) => {
    const p = POINTS_PRESETS[preset];
    setPointsWin(p.win);
    setPointsTie(p.tie);
    setPointsNR(p.nr);
  };

  const handleCreate = async () => {
    setLoading(true);
    setError("");
    try {
      const payload = {
        name: name.trim(),
        format: format === "limited" ? "Limited Overs" : "Test",
        overs: format === "limited" ? Number(overs) : undefined,
        days: format === "test" ? Number(matchDays) : undefined,
        oversPerDay: format === "test" ? Number(oversPerDay) : undefined,
        teams: cleanTeamNames,
        roundRobinType,
        leagueFormat,
        numGroups: leagueFormat === "groups" ? Number(numGroups) : undefined,
        knockoutFormat,
        pointsRules: { win: pointsWin, tie: pointsTie, nr: pointsNR, loss: pointsLoss },
        superOver: {
          leagueTieAllowed: leagueTieHandling === "tieAllowed",
          knockoutMandatory: true,
        },
      };
      const tournament = await tournamentApi.createTournament(payload);
      if (setupSquadsNow) {
        navigate("/squads", { state: { tournamentId: tournament._id, teams: cleanTeamNames } });
      } else {
        navigate(`/tournaments/${tournament._id}`);
      }
    } catch (err) {
      setError(err.message || "Failed to create tournament");
      setLoading(false);
    }
  };

  // ── Progress dots ────────────────────────────────────────────────────────
  const StepProgress = (
    <div style={{ display: "flex", gap: "4px", marginBottom: "20px" }}>
      {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map((s) => (
        <div
          key={s}
          style={{
            flex: 1, height: "4px", borderRadius: "2px",
            background: s <= step ? "#16a34a" : "#1f2937",
          }}
        />
      ))}
    </div>
  );

  const StepLabel = ({ children }) => (
    <div style={{ fontSize: "12px", color: "#4ade80", fontWeight: "700", marginBottom: "4px", letterSpacing: "0.5px" }}>
      STEP {step} / {TOTAL_STEPS}
    </div>
  );

  const NavButtons = ({ nextLabel = "Next →", onNext = goNext, nextDisabled = false }) => (
    <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
      {step > 1 && (
        <button onClick={goBack} style={{ flex: 1, background: "#1f2937", color: "#9ca3af", padding: "12px", borderRadius: "8px", border: "none", fontWeight: "600", cursor: "pointer" }}>
          ← Back
        </button>
      )}
      <button
        onClick={onNext}
        disabled={nextDisabled}
        style={{
          flex: step > 1 ? 2 : 1, background: nextDisabled ? "#374151" : "#16a34a", color: "#fff",
          padding: "12px", borderRadius: "8px", border: "none", fontWeight: "700",
          fontSize: "15px", cursor: nextDisabled ? "not-allowed" : "pointer",
        }}
      >
        {nextLabel}
      </button>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", color: "#e5e7eb", padding: "20px 16px", paddingBottom: "40px" }}>
      <BrandTitle size="small" />
      <h2 style={{ fontSize: "20px", fontWeight: "700", color: "#f9fafb", margin: "12px 0 14px" }}>🏆 Create Tournament</h2>
      {StepProgress}

      {/* ── STEP 1 — Basic Details ───────────────────────────────────────── */}
      {step === 1 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <StepLabel />
          <div>
            <label style={labelStyle}>Tournament Name</label>
            <input style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Mohalla Premier League" autoFocus />
          </div>

          <div>
            <label style={labelStyle}>Tournament Format</label>
            <div style={{ display: "flex", gap: "10px" }}>
              <button onClick={() => setFormat("limited")} style={optionBtn(format === "limited")}>🏏 Limited Overs</button>
              <button onClick={() => setFormat("test")} style={optionBtn(format === "test")}>📅 Test Match</button>
            </div>
          </div>

          {format === "limited" && (
            <div>
              <label style={labelStyle}>Overs per innings</label>
              <input type="number" style={inputStyle} value={overs} onChange={(e) => setOvers(e.target.value)} min={1} />
            </div>
          )}
          {format === "test" && (
            <>
              <div>
                <label style={labelStyle}>Match Days</label>
                <input type="number" style={inputStyle} value={matchDays} onChange={(e) => setMatchDays(e.target.value)} min={1} />
              </div>
              <div>
                <label style={labelStyle}>Overs per Day</label>
                <input type="number" style={inputStyle} value={oversPerDay} onChange={(e) => setOversPerDay(e.target.value)} min={1} />
              </div>
            </>
          )}

          {error && <p style={{ color: "#ef4444", fontSize: "13px", textAlign: "center", margin: 0 }}>{error}</p>}
          <NavButtons />
        </div>
      )}

      {/* ── STEP 2 — Teams ───────────────────────────────────────────────── */}
      {step === 2 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <StepLabel />
          <div>
            <label style={labelStyle}>Number of Teams ({MIN_TEAMS}–{MAX_TEAMS})</label>
            <input
              type="number"
              style={inputStyle}
              value={numTeams}
              onChange={(e) => handleNumTeamsChange(e.target.value)}
              onBlur={handleNumTeamsBlur}
              min={MIN_TEAMS}
              max={MAX_TEAMS}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {teamNames.map((t, i) => {
              const isDupe = duplicateTeamIndexes.has(i);
              return (
                <input
                  key={i}
                  style={{
                    ...inputStyle,
                    borderColor: isDupe ? "#ef4444" : "#374151",
                    background: isDupe ? "#2a1414" : inputStyle.background,
                  }}
                  value={t}
                  onChange={(e) => {
                    const updated = [...teamNames];
                    updated[i] = e.target.value;
                    setTeamNames(updated);
                  }}
                  placeholder={`Team ${i + 1} name`}
                />
              );
            })}
          </div>

          {duplicateTeamIndexes.size > 0 && (
            <p style={{ color: "#f87171", fontSize: "12px", margin: 0 }}>
              ⚠️ Team names must be unique — the highlighted fields match each other.
            </p>
          )}

          {error && <p style={{ color: "#ef4444", fontSize: "13px", textAlign: "center", margin: 0 }}>{error}</p>}
          <NavButtons />
        </div>
      )}

      {/* ── STEP 3 — League Stage ────────────────────────────────────────── */}
      {step === 3 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <StepLabel />
          <div>
            <label style={labelStyle}>League Format</label>
            <div style={{ display: "flex", gap: "10px" }}>
              <button onClick={() => setLeagueFormat("roundRobin")} style={optionBtn(leagueFormat === "roundRobin")}>🔁 Round Robin</button>
              <button onClick={() => setLeagueFormat("groups")} style={optionBtn(leagueFormat === "groups")}>🗂 Group Stage</button>
            </div>
          </div>

          {leagueFormat === "roundRobin" && (
            <div>
              <label style={labelStyle}>Round Robin Type</label>
              <div style={{ display: "flex", gap: "10px" }}>
                <button onClick={() => setRoundRobinType("single")} style={optionBtn(roundRobinType === "single")}>
                  Single <span style={{ color: "#6b7280", fontWeight: "400" }}>— each team plays once</span>
                </button>
                <button onClick={() => setRoundRobinType("double")} style={optionBtn(roundRobinType === "double")}>
                  Double <span style={{ color: "#6b7280", fontWeight: "400" }}>— home & away</span>
                </button>
              </div>
            </div>
          )}

          {leagueFormat === "groups" && (
            <>
              <div>
                <label style={labelStyle}>Number of Groups</label>
                <input type="number" style={inputStyle} value={numGroups} onChange={(e) => setNumGroups(Number(e.target.value) || 1)} min={2} max={8} />
              </div>
              <div>
                <label style={labelStyle}>Round Robin Type (within group)</label>
                <div style={{ display: "flex", gap: "10px" }}>
                  <button onClick={() => setRoundRobinType("single")} style={optionBtn(roundRobinType === "single")}>Single</button>
                  <button onClick={() => setRoundRobinType("double")} style={optionBtn(roundRobinType === "double")}>Double</button>
                </div>
              </div>
              <div style={{ ...cardStyle, fontSize: "13px" }}>
                {!groupsValid ? (
                  <span style={{ color: "#f87171" }}>
                    ⚠️ {numTeams} teams can't split evenly into {numGroups} groups of at least {GROUP_HARD_MIN}. Try a different count.
                  </span>
                ) : groupsBelowRecommended ? (
                  <span style={{ color: "#eab308" }}>
                    ⚡ {numTeams} teams → {numGroups} groups of {numTeams / numGroups}. That works, but {GROUP_RECOMMENDED_MIN}+ per group is recommended so each team plays more than one league match. You can still proceed.
                  </span>
                ) : (
                  <span style={{ color: "#4ade80" }}>
                    ✅ {numTeams} teams → {numGroups} groups of {numTeams / numGroups}
                  </span>
                )}
              </div>
            </>
          )}

          {error && <p style={{ color: "#ef4444", fontSize: "13px", textAlign: "center", margin: 0 }}>{error}</p>}
          <NavButtons nextDisabled={leagueFormat === "groups" && !groupsValid} />
        </div>
      )}

      {/* ── STEP 4 — Knockout Stage ──────────────────────────────────────── */}
      {step === 4 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <StepLabel />
          <label style={labelStyle}>Knockout Format</label>
          {KNOCKOUT_OPTIONS.map((k) => {
            const disabled = numTeams < k.min;
            const active = knockoutFormat === k.value;
            return (
              <button
                key={k.value}
                onClick={() => !disabled && setKnockoutFormat(k.value)}
                disabled={disabled}
                style={{
                  ...cardStyle,
                  textAlign: "left", cursor: disabled ? "not-allowed" : "pointer",
                  border: `1px solid ${active ? "#16a34a" : "#1f2937"}`,
                  background: active ? "#14532d" : "#111827",
                  opacity: disabled ? 0.4 : 1,
                }}
              >
                <div style={{ fontWeight: "700", color: active ? "#4ade80" : "#f9fafb", fontSize: "14px" }}>
                  {k.label}
                </div>
                <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "2px" }}>{k.desc}</div>
                {disabled && <div style={{ fontSize: "11px", color: "#f87171", marginTop: "4px" }}>Needs at least {k.min} teams</div>}
              </button>
            );
          })}
          {error && <p style={{ color: "#ef4444", fontSize: "13px", textAlign: "center", margin: 0 }}>{error}</p>}
          <NavButtons nextDisabled={!knockoutValid} />
        </div>
      )}

      {/* ── STEP 5 — Points System ───────────────────────────────────────── */}
      {step === 5 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <StepLabel />

          <div style={cardStyle}>
            <div style={sectionTitleStyle}>Points per result</div>
            <div style={{ display: "flex", gap: "10px" }}>
              {[
                ["Win", pointsWin, setPointsWin],
                ["Tie", pointsTie, setPointsTie],
                ["No Result", pointsNR, setPointsNR],
                ["Loss", pointsLoss, null],
              ].map(([label, val, setter]) => (
                <div key={label} style={{ flex: 1 }}>
                  <label style={{ ...labelStyle, textAlign: "center" }}>{label}</label>
                  <input
                    type="number"
                    style={{ ...inputStyle, textAlign: "center" }}
                    value={val}
                    onChange={setter ? (e) => setter(Number(e.target.value)) : undefined}
                    readOnly={!setter}
                    min={0}
                  />
                </div>
              ))}
            </div>
          </div>

          {error && <p style={{ color: "#ef4444", fontSize: "13px", textAlign: "center", margin: 0 }}>{error}</p>}
          <NavButtons />
        </div>
      )}

      {/* ── STEP 6 — Super Over ──────────────────────────────────────────── */}
      {step === 6 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <StepLabel />
          {format === "test" ? (
            <div style={{ ...cardStyle, color: "#6b7280", fontSize: "13px" }}>
              Test matches can end in a draw — super over rules don't apply.
            </div>
          ) : (
            <>
              <div>
                <label style={labelStyle}>If a League Stage match is tied</label>
                <div style={{ display: "flex", gap: "10px" }}>
                  <button onClick={() => setLeagueTieHandling("tieAllowed")} style={optionBtn(leagueTieHandling === "tieAllowed")}>
                    🤝 Tie Allowed
                  </button>
                  <button onClick={() => setLeagueTieHandling("superOver")} style={optionBtn(leagueTieHandling === "superOver")}>
                    ⚡ Super Over
                  </button>
                </div>
              </div>

              {knockoutFormat !== "none" && (
                <div style={{ ...cardStyle, fontSize: "13px", color: "#9ca3af" }}>
                  🔒 Knockout matches always use a <strong style={{ color: "#4ade80" }}>mandatory Super Over</strong> on a tie — there has to be a winner.
                </div>
              )}
            </>
          )}
          {error && <p style={{ color: "#ef4444", fontSize: "13px", textAlign: "center", margin: 0 }}>{error}</p>}
          <NavButtons />
        </div>
      )}

      {/* ── STEP 7 — Squads ──────────────────────────────────────────────── */}
      {step === 7 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <StepLabel />
          <p style={{ color: "#6b7280", fontSize: "13px", margin: 0 }}>
            Save each team's roster now, or skip and add squads later from the tournament dashboard.
          </p>
          <div style={{ display: "flex", gap: "10px" }}>
            <button onClick={() => setSetupSquadsNow(true)} style={optionBtn(setupSquadsNow)}>👥 Create Squads Now</button>
            <button onClick={() => setSetupSquadsNow(false)} style={optionBtn(!setupSquadsNow)}>⏭ Skip for Now</button>
          </div>
          {setupSquadsNow && (
            <div style={{ ...cardStyle, fontSize: "13px", color: "#9ca3af" }}>
              After creating the tournament, you'll be taken straight to the Squad Manager for {cleanTeamNames.length} teams.
            </div>
          )}
          {error && <p style={{ color: "#ef4444", fontSize: "13px", textAlign: "center", margin: 0 }}>{error}</p>}
          <NavButtons />
        </div>
      )}

      {/* ── STEP 8 — Preview ─────────────────────────────────────────────── */}
      {step === 8 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <StepLabel />

          <div style={cardStyle}>
            <div style={sectionTitleStyle}>Tournament</div>
            <div style={{ fontSize: "16px", fontWeight: "700", color: "#f9fafb" }}>{name}</div>
          </div>

          <div style={cardStyle}>
            <div style={sectionTitleStyle}>Format</div>
            <div style={{ fontSize: "14px", color: "#e5e7eb" }}>
              {format === "limited" ? `Limited Overs — ${overs} overs` : `Test Match — ${matchDays} days × ${oversPerDay} overs/day`}
            </div>
          </div>

          <div style={cardStyle}>
            <div style={sectionTitleStyle}>Teams ({numTeams})</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {cleanTeamNames.map((t) => (
                <span key={t} style={{ background: "#0d1117", border: "1px solid #374151", borderRadius: "20px", padding: "4px 10px", fontSize: "12px", color: "#e5e7eb" }}>
                  {t}
                </span>
              ))}
            </div>
          </div>

          <div style={cardStyle}>
            <div style={sectionTitleStyle}>League</div>
            <div style={{ fontSize: "14px", color: "#e5e7eb" }}>
              {leagueFormat === "groups"
                ? `${numGroups} Groups of ${numTeams / numGroups} · ${roundRobinType === "double" ? "Double" : "Single"} Round Robin`
                : `${roundRobinType === "double" ? "Double" : "Single"} Round Robin`}
            </div>
          </div>

          <div style={cardStyle}>
            <div style={sectionTitleStyle}>Knockouts</div>
            <div style={{ fontSize: "14px", color: "#e5e7eb" }}>{selectedKnockout.label}</div>
          </div>

          <div style={cardStyle}>
            <div style={sectionTitleStyle}>Points</div>
            <div style={{ fontSize: "14px", color: "#e5e7eb" }}>
              Win {pointsWin} · Tie {pointsTie} · NR {pointsNR} · Loss {pointsLoss}
            </div>
          </div>

          {format === "limited" && (
            <div style={cardStyle}>
              <div style={sectionTitleStyle}>Super Over</div>
              <div style={{ fontSize: "14px", color: "#e5e7eb" }}>
                League: {leagueTieHandling === "superOver" ? "Super Over" : "Tie Allowed"}
                {knockoutFormat !== "none" && " · Knockouts: Super Over (mandatory)"}
              </div>
            </div>
          )}

          <div style={{ ...cardStyle, background: "#0d1f0d", border: "1px solid #16a34a" }}>
            <div style={{ ...sectionTitleStyle, color: "#4ade80" }}>Expected Matches</div>
            <div style={{ fontSize: "14px", color: "#e5e7eb" }}>
              League: {expectedLeagueMatches} · Knockouts: {expectedKnockoutMatches} · Total: {expectedLeagueMatches + expectedKnockoutMatches}
            </div>
          </div>

          {error && <p style={{ color: "#ef4444", fontSize: "13px", textAlign: "center", margin: 0 }}>{error}</p>}
          <NavButtons nextLabel={loading ? "Creating..." : "🏆 Create Tournament"} onNext={handleCreate} nextDisabled={loading} />
        </div>
      )}

      <button
        onClick={() => navigate("/tournaments")}
        style={{ marginTop: "20px", background: "transparent", border: "1px solid #374151", color: "#6b7280", padding: "10px", borderRadius: "8px", cursor: "pointer", fontSize: "14px", width: "100%" }}
      >
        ← Cancel
      </button>
    </div>
  );
}
