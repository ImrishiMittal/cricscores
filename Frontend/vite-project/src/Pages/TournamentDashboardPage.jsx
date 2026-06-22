import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import * as tournamentApi from "../api/tournamentApi";
import BrandTitle from "../Components/BrandTitle";
import { getMatch } from "../api/matchApi";
import { generateScorecardPDF } from "../utils/generateScorecardPDF";
import { getTournamentAwards } from "../api/tournamentApi";

const SR_MIN_BALLS = 50;

const STAGE_ORDER = [
  "quarterfinal",
  "semifinal",
  "qualifier1",
  "eliminator",
  "qualifier2",
  "final",
];
const STAGE_LABEL = {
  quarterfinal: "Quarter Finals",
  semifinal: "Semi Finals",
  qualifier1: "Qualifier 1",
  eliminator: "Eliminator",
  qualifier2: "Qualifier 2",
  final: "Final",
};
const SLOT_LABEL = {
  QF1: "QF 1",
  QF2: "QF 2",
  QF3: "QF 3",
  QF4: "QF 4",
  SF1: "SF 1",
  SF2: "SF 2",
  Q1: "Qualifier 1",
  EL: "Eliminator",
  Q2: "Qualifier 2",
  F: "Final",
};

function KnockoutCard({ fixture }) {
  const done = fixture.status === "completed";
  const teamRow = (name, runs, wickets, balls, isWinner, isTbd) => (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "7px 10px",
        borderRadius: "6px",
        background: isWinner ? "#14532d" : "transparent",
      }}
    >
      <span
        style={{
          fontSize: "13px",
          fontWeight: isWinner ? "700" : "500",
          color: isTbd ? "#6b7280" : isWinner ? "#4ade80" : "#e5e7eb",
          fontStyle: isTbd ? "italic" : "normal",
        }}
      >
        {isTbd ? "TBD" : name}
      </span>
      {done && !isTbd && (
        <span
          style={{
            fontSize: "13px",
            fontWeight: "700",
            color: isWinner ? "#4ade80" : "#9ca3af",
          }}
        >
          {runs}/{wickets}
          <span
            style={{
              fontSize: "11px",
              fontWeight: "400",
              color: "#6b7280",
              marginLeft: "3px",
            }}
          >
            ({Math.floor(balls / 6)}.{balls % 6})
          </span>
        </span>
      )}
    </div>
  );
  return (
    <div
      style={{
        background: "#0d1117",
        borderRadius: "8px",
        overflow: "hidden",
        border: `1px solid ${done ? "#1f2937" : "#374151"}`,
        minWidth: "190px",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          padding: "4px 10px",
          background: "#1f2937",
          fontSize: "10px",
          color: "#6b7280",
          fontWeight: "700",
          letterSpacing: "0.5px",
        }}
      >
        {SLOT_LABEL[fixture.knockoutSlot] || fixture.knockoutSlot}
      </div>
      <div style={{ padding: "6px" }}>
        {teamRow(
          fixture.teamA,
          fixture.teamARuns,
          fixture.teamAWickets,
          fixture.teamABalls,
          done && fixture.winner === fixture.teamA,
          !fixture.teamA
        )}
        <div
          style={{ height: "1px", background: "#1f2937", margin: "2px 0" }}
        />
        {teamRow(
          fixture.teamB,
          fixture.teamBRuns,
          fixture.teamBWickets,
          fixture.teamBBalls,
          done && fixture.winner === fixture.teamB,
          !fixture.teamB
        )}
      </div>
      <div
        style={{
          padding: "4px 10px",
          borderTop: "1px solid #1f2937",
          fontSize: "10px",
          color: done
            ? "#9ca3af"
            : !fixture.teamA || !fixture.teamB
            ? "#6b7280"
            : "#f59e0b",
          fontStyle: !fixture.teamA || !fixture.teamB ? "italic" : "normal",
        }}
      >
        {done
          ? fixture.resultText || `${fixture.winner} won`
          : !fixture.teamA || !fixture.teamB
          ? "Awaiting teams"
          : "Scheduled"}
      </div>
    </div>
  );
}

// ── AwardsTab component — defined OUTSIDE TournamentDashboardPage ─────────────
const AwardsTab = ({ awardsData, awardsLoading, awardsTab, setAwardsTab }) => {
  if (awardsLoading) {
    return (
      <div style={{ textAlign: "center", color: "#6b7280", padding: "40px 0" }}>
        Loading awards...
      </div>
    );
  }

  if (!awardsData) {
    return (
      <div style={{ textAlign: "center", color: "#6b7280", padding: "40px 0" }}>
        No data yet — play some matches first.
      </div>
    );
  }

  if (awardsData.matchesScored === 0) {
    return (
      <div style={{ textAlign: "center", color: "#6b7280", padding: "40px 0" }}>
        No scored matches found. Awards appear once matches are scored through the app.
      </div>
    );
  }

  const { awards, batting, bowling, fielding } = awardsData;

  // ── Sub-tab toggle ──────────────────────────────────────────────────────────
  const SubTabs = () => (
    <div style={{ display: "flex", gap: "6px", marginBottom: "16px" }}>
      {[
        ["awards", "🏆 Awards"],
        ["batting", "🧡 Batting"],
        ["bowling", "💜 Bowling"],
        ["fielding", "🧤 Fielding"],
      ].map(([key, label]) => (
        <button
          key={key}
          onClick={() => setAwardsTab(key)}
          style={{
            flex: 1,
            padding: "8px 4px",
            borderRadius: "8px",
            border: `1px solid ${awardsTab === key ? "#d97706" : "#1f2937"}`,
            background: awardsTab === key ? "#451a03" : "#111827",
            color: awardsTab === key ? "#fbbf24" : "#6b7280",
            fontWeight: "600",
            fontSize: "11px",
            cursor: "pointer",
          }}
        >
          {label}
        </button>
      ))}
    </div>
  );

  // ── Award card ──────────────────────────────────────────────────────────────
  const AwardCard = ({ emoji, title, winner, stat, subStat }) => {
    if (!winner) return null;
    return (
      <div style={{
        background: "#111827",
        border: "1px solid #1f2937",
        borderRadius: "12px",
        padding: "14px 16px",
        display: "flex",
        alignItems: "center",
        gap: "14px",
      }}>
        <div style={{ fontSize: "28px", flexShrink: 0 }}>{emoji}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: "11px", color: "#6b7280", fontWeight: "600", marginBottom: "2px", letterSpacing: "0.5px" }}>
            {title.toUpperCase()}
          </div>
          <div style={{
            fontSize: "15px", fontWeight: "700", color: "#f9fafb",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {winner.playerName}
          </div>
          <div style={{ fontSize: "13px", color: "#fbbf24", fontWeight: "600", marginTop: "2px" }}>
            {stat}
          </div>
          {subStat && (
            <div style={{ fontSize: "11px", color: "#6b7280", marginTop: "1px" }}>{subStat}</div>
          )}
        </div>
      </div>
    );
  };

  // ── Leaderboard table ───────────────────────────────────────────────────────
  const LeaderTable = ({ columns, rows, emptyMsg }) => {
    if (!rows || rows.length === 0) {
      return <div style={{ color: "#6b7280", fontSize: "13px", textAlign: "center", padding: "20px" }}>{emptyMsg}</div>;
    }
    return (
      <div style={{ background: "#111827", border: "1px solid #1f2937", borderRadius: "12px", overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "400px" }}>
            <thead>
              <tr style={{ background: "#0f172a" }}>
                <th style={{ padding: "8px 10px", color: "#6b7280", fontSize: "11px", fontWeight: "600", textAlign: "left", paddingLeft: "14px", borderBottom: "1px solid #1f2937" }}>#</th>
                <th style={{ padding: "8px 10px", color: "#6b7280", fontSize: "11px", fontWeight: "600", textAlign: "left", borderBottom: "1px solid #1f2937" }}>Player</th>
                {columns.map(c => (
                  <th key={c.key} style={{ padding: "8px 10px", color: "#6b7280", fontSize: "11px", fontWeight: "600", textAlign: "center", borderBottom: "1px solid #1f2937" }}>
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={row.jersey || row.playerName} style={{ background: i % 2 === 0 ? "#0d1117" : "#111827" }}>
                  <td style={{ padding: "9px 10px", paddingLeft: "14px", fontSize: "12px", color: i === 0 ? "#fbbf24" : "#6b7280", fontWeight: i === 0 ? "700" : "400", borderBottom: "1px solid #111827" }}>
                    {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}
                  </td>
                  <td style={{ padding: "9px 10px", fontSize: "13px", fontWeight: "600", color: "#f9fafb", borderBottom: "1px solid #111827", maxWidth: "120px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {row.playerName}
                  </td>
                  {columns.map(c => (
                    <td key={c.key} style={{ padding: "9px 10px", fontSize: "13px", textAlign: "center", color: c.highlight ? "#fbbf24" : "#e5e7eb", fontWeight: c.highlight ? "700" : "400", borderBottom: "1px solid #111827" }}>
                      {c.format ? c.format(row[c.key], row) : (row[c.key] ?? "—")}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // ── Awards overview ─────────────────────────────────────────────────────────
  if (awardsTab === "awards") {
    const a = awards;
    return (
      <div>
        <SubTabs />

        {a.playerOfTournament && (
          <div style={{
            background: "linear-gradient(135deg, #451a03, #1a1a2e)",
            border: "1px solid #d97706",
            borderRadius: "14px",
            padding: "18px 16px",
            marginBottom: "14px",
            textAlign: "center",
          }}>
            <div style={{ fontSize: "32px", marginBottom: "6px" }}>⭐</div>
            <div style={{ fontSize: "11px", color: "#d97706", fontWeight: "700", letterSpacing: "1px", marginBottom: "4px" }}>
              PLAYER OF THE TOURNAMENT
            </div>
            <div style={{ fontSize: "20px", fontWeight: "800", color: "#f9fafb", marginBottom: "8px" }}>
              {a.playerOfTournament.playerName}
            </div>
            <div style={{ display: "flex", justifyContent: "center", gap: "20px", fontSize: "13px", color: "#9ca3af" }}>
              {a.playerOfTournament.runs > 0 && <span>🏏 {a.playerOfTournament.runs} Runs</span>}
              {a.playerOfTournament.wickets > 0 && <span>🎯 {a.playerOfTournament.wickets} Wkts</span>}
              {a.playerOfTournament.catches > 0 && <span>🤲 {a.playerOfTournament.catches} Catches</span>}
            </div>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <AwardCard emoji="🧡" title="Orange Cap" winner={a.orangeCap}
            stat={`${a.orangeCap?.runs} Runs`}
            subStat={a.orangeCap ? `Avg ${a.orangeCap.avg ?? "—"} · SR ${a.orangeCap.sr}` : null}
          />
          <AwardCard emoji="💜" title="Purple Cap" winner={a.purpleCap}
            stat={`${a.purpleCap?.wickets} Wickets`}
            subStat={a.purpleCap ? `Econ ${a.purpleCap.economy} · Avg ${a.purpleCap.avg ?? "—"}` : null}
          />
          <AwardCard emoji="🎯" title="Best Bowling Figures" winner={a.bestBowlingFigures}
            stat={a.bestBowlingFigures?.bestFigures}
          />
          <AwardCard emoji="💥" title="Highest Score" winner={a.highestScore}
            stat={`${a.highestScore?.highestScore} (${a.highestScore?.highestScoreBalls})`}
          />
          <AwardCard emoji="⚡" title="Best Strike Rate" winner={a.bestStrikeRate}
            stat={`SR ${a.bestStrikeRate?.sr}`}
            subStat={a.bestStrikeRate ? `(min ${SR_MIN_BALLS} balls)` : null}
          />
          <AwardCard emoji="📊" title="Best Batting Average" winner={a.bestBattingAvg}
            stat={`Avg ${a.bestBattingAvg?.avg ?? "—"}`}
          />
          <AwardCard emoji="💸" title="Best Economy" winner={a.bestEconomy}
            stat={`Econ ${a.bestEconomy?.economy}`}
          />
          <AwardCard emoji="6️⃣" title="Most Sixes" winner={a.mostSixes}
            stat={`${a.mostSixes?.sixes} Sixes`}
          />
          <AwardCard emoji="4️⃣" title="Most Fours" winner={a.mostFours}
            stat={`${a.mostFours?.fours} Fours`}
          />
          <AwardCard emoji="📈" title="Most Fifties" winner={a.mostFifties}
            stat={`${a.mostFifties?.fifties} Fifties`}
          />
          <AwardCard emoji="💯" title="Most Hundreds" winner={a.mostHundreds}
            stat={`${a.mostHundreds?.hundreds} Hundreds`}
          />
          <AwardCard emoji="🔴" title="Most Dot Balls (Bowling)" winner={a.mostDotBalls}
            stat={`${a.mostDotBalls?.dotBalls} Dots`}
          />
          <AwardCard emoji="🎳" title="Most Maidens" winner={a.mostMaidens}
            stat={`${a.mostMaidens?.maidens} Maidens`}
          />
          <AwardCard emoji="⭐" title="Most 5-Wicket Hauls" winner={a.mostFiveWicketHauls}
            stat={`${a.mostFiveWicketHauls?.fiveWicketHauls} Five-fers`}
          />
          <AwardCard emoji="🤲" title="Most Catches" winner={a.mostCatches}
            stat={`${a.mostCatches?.catches} Catches`}
          />
          <AwardCard emoji="🏃" title="Most Run Outs" winner={a.mostRunOuts}
            stat={`${a.mostRunOuts?.runOuts} Run Outs`}
          />
          {a.mostStumpings?.stumpings > 0 && (
            <AwardCard emoji="🧤" title="Most Stumpings" winner={a.mostStumpings}
              stat={`${a.mostStumpings?.stumpings} Stumpings`}
            />
          )}
          {a.bestAllRounder && (
            <AwardCard emoji="🌟" title="Best All-Rounder" winner={a.bestAllRounder}
              stat={`${a.bestAllRounder.runs} Runs · ${a.bestAllRounder.wickets} Wkts`}
            />
          )}
        </div>
      </div>
    );
  }

  // ── Batting leaderboard ─────────────────────────────────────────────────────
  if (awardsTab === "batting") {
    return (
      <div>
        <SubTabs />
        <div style={{ fontSize: "12px", color: "#6b7280", marginBottom: "10px" }}>
          Sorted by runs · {batting.length} players
        </div>
        <LeaderTable
          emptyMsg="No batting data yet"
          rows={batting.slice(0, 20)}
          columns={[
            { key: "runs", label: "Runs", highlight: true },
            { key: "innings", label: "Inn" },
            { key: "highestScore", label: "HS", format: (v, row) => `${v}${row.notOuts === row.innings ? "*" : ""}` },
            { key: "avg", label: "Avg", format: v => v !== null ? v : "—" },
            { key: "sr", label: "SR" },
            { key: "fours", label: "4s" },
            { key: "sixes", label: "6s" },
          ]}
        />
      </div>
    );
  }

  // ── Bowling leaderboard ─────────────────────────────────────────────────────
  if (awardsTab === "bowling") {
    return (
      <div>
        <SubTabs />
        <div style={{ fontSize: "12px", color: "#6b7280", marginBottom: "10px" }}>
          Sorted by wickets · {bowling.length} players
        </div>
        <LeaderTable
          emptyMsg="No bowling data yet"
          rows={bowling.slice(0, 20)}
          columns={[
            { key: "wickets", label: "Wkts", highlight: true },
            { key: "overs", label: "Overs" },
            { key: "runsGiven", label: "Runs" },
            { key: "economy", label: "Econ" },
            { key: "avg", label: "Avg", format: v => v !== null ? v : "—" },
            { key: "bestFigures", label: "Best" },
            { key: "maidens", label: "Mdn" },
          ]}
        />
      </div>
    );
  }

  // ── Fielding leaderboard ────────────────────────────────────────────────────
  if (awardsTab === "fielding") {
    return (
      <div>
        <SubTabs />
        <div style={{ fontSize: "12px", color: "#6b7280", marginBottom: "10px" }}>
          Sorted by total dismissals · {fielding.length} players
        </div>
        <LeaderTable
          emptyMsg="No fielding data yet"
          rows={fielding.slice(0, 20)}
          columns={[
            { key: "catches", label: "Catches", highlight: true },
            { key: "runOuts", label: "Run Outs" },
            { key: "stumpings", label: "Stumpings" },
            { key: "total", label: "Total" },
          ]}
        />
      </div>
    );
  }

  return null;
};

// ── Main page component ───────────────────────────────────────────────────────
export default function TournamentDashboardPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tournament, setTournament] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("fixtures");
  const [generating, setGenerating] = useState(false);
  const [fixtureMode, setFixtureMode] = useState("auto"); // "auto" | "manual"
  const [manualTeamA, setManualTeamA] = useState("");
  const [manualTeamB, setManualTeamB] = useState("");
  const [manualPairs, setManualPairs] = useState([]);
  const [manualError, setManualError] = useState("");
  const [savingManual, setSavingManual] = useState(false);
  const [genLoading, setGenLoading] = useState(false);
  const [knockoutData, setKnockoutData] = useState(null);

  // ── Awards state — declared here with all other state, NOT inside JSX ───────
  const [awardsData, setAwardsData] = useState(null);
  const [awardsLoading, setAwardsLoading] = useState(false);
  const [awardsTab, setAwardsTab] = useState("awards");

  useEffect(() => {
    tournamentApi
      .getTournament(id)
      .then((t) => {
        setTournament(t);
        if (t.knockoutFormat && t.knockoutFormat !== "none") {
          tournamentApi
            .getKnockout(id)
            .then(setKnockoutData)
            .catch(() => {});
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const refresh = () => {
    tournamentApi.getTournament(id).then((t) => {
      setTournament(t);
      if (t.knockoutFormat && t.knockoutFormat !== "none") {
        tournamentApi
          .getKnockout(id)
          .then(setKnockoutData)
          .catch(() => {});
      }
    });
  };

  const handleStartMatch = (fixture) => {
    const teamA = fixture.teamA;
    const teamB = fixture.teamB;
    navigate("/setup", {
      state: {
        fromTournament: true,
        tournamentId: id,
        fixtureId: fixture._id,
        prefillTeamA: teamA,
        prefillTeamB: teamB,
        format: tournament.format,
        overs: tournament.overs,
        matchDays: tournament.matchDays,
        oversPerDay: tournament.oversPerDay,
      },
    });
  };

  const handleMarkResult = async (fixtureId, winner) => {
    await tournamentApi.updateFixtureResult(id, fixtureId, {
      winner,
      status: "completed",
    });
    refresh();
  };

  const handleGenerateFixtures = async () => {
    setGenerating(true);
    try {
      await tournamentApi.generateFixtures(id);
      refresh();
    } catch (err) {
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  const handleAddManualPair = () => {
    if (!manualTeamA || !manualTeamB) {
      setManualError("Select both teams.");
      return;
    }
    if (manualTeamA === manualTeamB) {
      setManualError("A team can't play itself.");
      return;
    }
    const alreadyAdded = manualPairs.some(
      (p) =>
        (p.teamA === manualTeamA && p.teamB === manualTeamB) ||
        (p.teamA === manualTeamB && p.teamB === manualTeamA)
    );
    if (alreadyAdded) {
      setManualError("That matchup is already in the list.");
      return;
    }
    setManualError("");
    setManualPairs((prev) => [
      ...prev,
      { teamA: manualTeamA, teamB: manualTeamB },
    ]);
    setManualTeamA("");
    setManualTeamB("");
  };

  const handleRemoveManualPair = (idx) => {
    setManualPairs((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSaveManualFixtures = async () => {
    setSavingManual(true);
    setManualError("");
    try {
      await tournamentApi.createManualFixtures(id, manualPairs);
      setManualPairs([]);
      refresh();
    } catch (err) {
      setManualError(err.message || "Failed to save fixtures");
    } finally {
      setSavingManual(false);
    }
  };

  const handleDownloadScorecard = async (fixture) => {
    if (!fixture.matchId) {
      alert(
        "No scorecard available — this result was entered manually without scoring."
      );
      return;
    }
    try {
      const match = await getMatch(fixture.matchId);
      generateScorecardPDF(match);
    } catch (err) {
      console.error("Failed to load scorecard:", err);
      alert("Could not load scorecard.");
    }
  };

  // Checklist: every team must appear the same number of times.
  const manualCounts = {};
  (tournament?.teams || []).forEach((t) => {
    manualCounts[t] = 0;
  });
  manualPairs.forEach((p) => {
    manualCounts[p.teamA] = (manualCounts[p.teamA] || 0) + 1;
    manualCounts[p.teamB] = (manualCounts[p.teamB] || 0) + 1;
  });
  const manualCountValues = Object.values(manualCounts);
  const manualIsBalanced =
    manualPairs.length > 0 &&
    manualCountValues.every((c) => c === manualCountValues[0]);

  if (loading)
    return (
      <div
        style={{
          background: "#0a0a0a",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#6b7280",
        }}
      >
        Loading...
      </div>
    );
  if (!tournament)
    return (
      <div
        style={{
          background: "#0a0a0a",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#ef4444",
        }}
      >
        Tournament not found.
      </div>
    );

  const toRow = (s) => ({
    team: s.teamName,
    group: s.group || null,
    p: s.played,
    w: s.wins,
    l: s.losses,
    t: s.ties,
    nr: s.nr,
    pts: s.points,
    nrr: typeof s.nrr === "number" ? s.nrr : 0,
  });
  const sortRows = (rows) =>
    [...rows].sort((a, b) => b.pts - a.pts || b.nrr - a.nrr);

  const allStandingRows = (tournament.standings || []).map(toRow);
  const isGroupStage =
    tournament.leagueFormat === "groups" &&
    allStandingRows.some((r) => r.group);

  const groupedTables = isGroupStage
    ? Object.entries(
        allStandingRows.reduce((acc, row) => {
          const key = row.group || "Ungrouped";
          (acc[key] = acc[key] || []).push(row);
          return acc;
        }, {})
      )
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([group, rows]) => [group, sortRows(rows)])
    : [];

  const pointsTable = sortRows(allStandingRows);

  const upcoming = (tournament.fixtures || []).filter(
    (f) => f.status !== "completed"
  );
  const completed = (tournament.fixtures || []).filter(
    (f) => f.status === "completed"
  );
  const total = tournament.fixtures?.length || 0;
  const doneCount = completed.length;

  const thStyle = {
    padding: "8px 10px",
    color: "#6b7280",
    fontSize: "12px",
    fontWeight: "600",
    textAlign: "center",
    borderBottom: "1px solid #1f2937",
  };
  const tdStyle = {
    padding: "10px",
    fontSize: "13px",
    textAlign: "center",
    borderBottom: "1px solid #111827",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0a0a0a",
        color: "#e5e7eb",
        padding: "20px 16px",
        paddingBottom: "40px",
      }}
    >
      <BrandTitle size="small" />

      {/* Header */}
      <div style={{ marginTop: "10px", marginBottom: "16px" }}>
        <h2
          style={{
            fontSize: "20px",
            fontWeight: "700",
            color: "#f9fafb",
            margin: "0 0 4px",
          }}
        >
          {tournament.name}
        </h2>
        <div style={{ fontSize: "13px", color: "#6b7280" }}>
          {tournament.format === "Test"
            ? "Test Match"
            : `${tournament.overs} overs`}{" "}
          · {tournament.teams?.length} teams
        </div>
      </div>

      {/* Progress bar */}
      <div
        style={{
          background: "#1f2937",
          borderRadius: "8px",
          height: "8px",
          marginBottom: "6px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            background: "#16a34a",
            height: "100%",
            width: `${total ? (doneCount / total) * 100 : 0}%`,
            transition: "width 0.4s",
          }}
        />
      </div>
      <div
        style={{
          fontSize: "12px",
          color: "#6b7280",
          textAlign: "right",
          marginBottom: "18px",
        }}
      >
        {doneCount}/{total} matches done
      </div>

      <button
        onClick={() =>
          navigate("/squads", {
            state: { tournamentId: id, teams: tournament.teams || [] },
          })
        }
        style={{
          width: "100%",
          background: "#0d1f0d",
          border: "1px solid #16a34a",
          color: "#4ade80",
          padding: "10px",
          borderRadius: "8px",
          cursor: "pointer",
          fontSize: "13px",
          fontWeight: "600",
          marginBottom: "18px",
        }}
      >
        👥 Manage Squads
      </button>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "18px", flexWrap: "wrap" }}>
        {[
          ["fixtures", "Fixtures"],
          ["points", "Points Table"],
          ["done", `Results (${doneCount})`],
          ...(tournament.knockoutFormat && tournament.knockoutFormat !== "none"
            ? [["bracket", "Bracket"]]
            : []),
          ["awards", "🏆 Awards"],
        ].map(([key, label]) => (
          <button
            key={key}
            onClick={() => {
              setActiveTab(key);
              if (key === "awards" && !awardsLoading) {
                setAwardsLoading(true);
                setAwardsData(null);
                getTournamentAwards(id)
                  .then(setAwardsData)
                  .catch(console.error)
                  .finally(() => setAwardsLoading(false));
              }
            }}
            style={{
              flex: 1,
              minWidth: "60px",
              padding: "9px 4px",
              borderRadius: "8px",
              border: `1px solid ${activeTab === key ? "#16a34a" : "#1f2937"}`,
              background: activeTab === key ? "#14532d" : "#111827",
              color: activeTab === key ? "#4ade80" : "#6b7280",
              fontWeight: "600",
              fontSize: "12px",
              cursor: "pointer",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Fixtures Tab */}
      {activeTab === "fixtures" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {total === 0 && (
            <div style={{ marginTop: "10px" }}>
              <div
                style={{ display: "flex", gap: "8px", marginBottom: "18px" }}
              >
                {[
                  ["auto", "⚡ Auto-Generate"],
                  ["manual", "✍️ Manual Setup"],
                ].map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setFixtureMode(key)}
                    style={{
                      flex: 1,
                      padding: "9px 4px",
                      borderRadius: "8px",
                      border: `1px solid ${
                        fixtureMode === key ? "#16a34a" : "#1f2937"
                      }`,
                      background: fixtureMode === key ? "#14532d" : "#111827",
                      color: fixtureMode === key ? "#4ade80" : "#6b7280",
                      fontWeight: "600",
                      fontSize: "12px",
                      cursor: "pointer",
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {fixtureMode === "auto" && (
                <div style={{ textAlign: "center", marginTop: "20px" }}>
                  <p style={{ color: "#6b7280", marginBottom: "16px" }}>
                    No fixtures yet. Generate the round-robin schedule to get
                    started.
                  </p>
                  <button
                    onClick={handleGenerateFixtures}
                    disabled={generating}
                    style={{
                      background: generating ? "#374151" : "#16a34a",
                      color: "#fff",
                      padding: "12px 20px",
                      borderRadius: "8px",
                      border: "none",
                      fontWeight: "700",
                      fontSize: "14px",
                      cursor: generating ? "not-allowed" : "pointer",
                    }}
                  >
                    {generating ? "Generating..." : "📋 Generate Fixtures"}
                  </button>
                </div>
              )}

              {fixtureMode === "manual" && (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "14px",
                  }}
                >
                  <p style={{ color: "#6b7280", fontSize: "13px", margin: 0 }}>
                    Pick a matchup and add it to the schedule. Every team needs
                    the same number of matches before you can save.
                  </p>

                  <div
                    style={{
                      display: "flex",
                      gap: "8px",
                      alignItems: "center",
                    }}
                  >
                    <select
                      value={manualTeamA}
                      onChange={(e) => setManualTeamA(e.target.value)}
                      style={{
                        flex: 1,
                        background: "#111827",
                        border: "1px solid #374151",
                        color: "#f9fafb",
                        padding: "10px",
                        borderRadius: "8px",
                        fontSize: "13px",
                      }}
                    >
                      <option value="">Team A</option>
                      {(tournament.teams || []).map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                    <span style={{ color: "#4b5563", fontWeight: "700" }}>
                      vs
                    </span>
                    <select
                      value={manualTeamB}
                      onChange={(e) => setManualTeamB(e.target.value)}
                      style={{
                        flex: 1,
                        background: "#111827",
                        border: "1px solid #374151",
                        color: "#f9fafb",
                        padding: "10px",
                        borderRadius: "8px",
                        fontSize: "13px",
                      }}
                    >
                      <option value="">Team B</option>
                      {(tournament.teams || []).map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={handleAddManualPair}
                      style={{
                        background: "#1e3a5f",
                        color: "#60a5fa",
                        padding: "10px 14px",
                        borderRadius: "8px",
                        border: "1px solid #2563eb",
                        fontWeight: "700",
                        fontSize: "13px",
                        cursor: "pointer",
                      }}
                    >
                      + Add
                    </button>
                  </div>

                  {manualError && (
                    <p
                      style={{
                        color: "#ef4444",
                        fontSize: "13px",
                        margin: 0,
                        textAlign: "center",
                      }}
                    >
                      {manualError}
                    </p>
                  )}

                  {manualPairs.length > 0 && (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "8px",
                      }}
                    >
                      {manualPairs.map((p, i) => (
                        <div
                          key={i}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            background: "#111827",
                            border: "1px solid #1f2937",
                            borderRadius: "8px",
                            padding: "10px 12px",
                          }}
                        >
                          <span style={{ fontSize: "13px", color: "#e5e7eb" }}>
                            {p.teamA}{" "}
                            <span style={{ color: "#4b5563" }}>vs</span>{" "}
                            {p.teamB}
                          </span>
                          <button
                            onClick={() => handleRemoveManualPair(i)}
                            style={{
                              background: "transparent",
                              border: "none",
                              color: "#ef4444",
                              cursor: "pointer",
                              fontSize: "13px",
                            }}
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Balance checklist */}
                  <div
                    style={{
                      background: "#111827",
                      border: "1px solid #1f2937",
                      borderRadius: "10px",
                      padding: "14px",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "13px",
                        color: "#9ca3af",
                        marginBottom: "10px",
                        fontWeight: "600",
                      }}
                    >
                      Checklist
                    </div>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "6px",
                        marginBottom: "10px",
                      }}
                    >
                      {(tournament.teams || []).map((t) => (
                        <div
                          key={t}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            fontSize: "12px",
                            color: "#9ca3af",
                          }}
                        >
                          <span>{t}</span>
                          <span>
                            {manualCounts[t] || 0} match
                            {(manualCounts[t] || 0) === 1 ? "" : "es"}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div
                      style={{
                        fontSize: "13px",
                        fontWeight: "600",
                        color: manualIsBalanced ? "#4ade80" : "#f87171",
                      }}
                    >
                      {manualPairs.length === 0
                        ? "Add at least one matchup to begin."
                        : manualIsBalanced
                        ? "✅ All teams have an equal number of matches."
                        : "⚠️ Uneven schedule — every team must play the same number of matches."}
                    </div>
                  </div>

                  <button
                    onClick={handleSaveManualFixtures}
                    disabled={!manualIsBalanced || savingManual}
                    style={{
                      background:
                        !manualIsBalanced || savingManual
                          ? "#374151"
                          : "#16a34a",
                      color: "#fff",
                      padding: "12px",
                      borderRadius: "8px",
                      border: "none",
                      fontWeight: "700",
                      fontSize: "14px",
                      cursor:
                        !manualIsBalanced || savingManual
                          ? "not-allowed"
                          : "pointer",
                    }}
                  >
                    {savingManual ? "Saving..." : "✍️ Save Fixtures"}
                  </button>
                </div>
              )}
            </div>
          )}
          {total > 0 && upcoming.length === 0 && (
            <p
              style={{
                color: "#6b7280",
                textAlign: "center",
                marginTop: "30px",
              }}
            >
              All matches completed!
            </p>
          )}
          {upcoming.map((f, i) => (
            <div
              key={f._id}
              style={{
                background: "#111827",
                border: "1px solid #1f2937",
                borderRadius: "12px",
                padding: "14px",
              }}
            >
              <div
                style={{
                  fontSize: "12px",
                  color: "#6b7280",
                  marginBottom: "8px",
                }}
              >
                Match {completed.length + i + 1}
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "12px",
                }}
              >
                <span
                  style={{
                    fontWeight: "700",
                    color: "#f9fafb",
                    fontSize: "15px",
                  }}
                >
                  {f.teamA}
                </span>
                <span style={{ color: "#4b5563", fontWeight: "700" }}>vs</span>
                <span
                  style={{
                    fontWeight: "700",
                    color: "#f9fafb",
                    fontSize: "15px",
                  }}
                >
                  {f.teamB}
                </span>
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  onClick={() => handleStartMatch(f)}
                  style={{
                    flex: 1,
                    background: "#1e3a5f",
                    color: "#60a5fa",
                    padding: "9px",
                    borderRadius: "8px",
                    border: "1px solid #2563eb",
                    fontWeight: "600",
                    fontSize: "13px",
                    cursor: "pointer",
                  }}
                >
                  🏏 Start Match
                </button>
                <button
                  onClick={() => {
                    const winner = prompt(
                      `Enter winner:\n1. ${f.teamA}\n2. ${f.teamB}\n3. TIE\n4. NO RESULT`
                    );
                    if (!winner) return;
                    const w =
                      winner.trim() === "1"
                        ? f.teamA
                        : winner.trim() === "2"
                        ? f.teamB
                        : winner.trim() === "3"
                        ? "Tie"
                        : winner.trim() === "4"
                        ? "No Result"
                        : winner.trim();
                    handleMarkResult(f._id, w);
                  }}
                  style={{
                    flex: 1,
                    background: "#1a1a1a",
                    color: "#9ca3af",
                    padding: "9px",
                    borderRadius: "8px",
                    border: "1px solid #374151",
                    fontWeight: "600",
                    fontSize: "13px",
                    cursor: "pointer",
                  }}
                >
                  ✏️ Enter Result
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Points Table Tab */}
      {activeTab === "points" &&
        (() => {
          const StandingsTable = ({ rows, highlightTop }) => (
            <div
              style={{
                background: "#111827",
                border: "1px solid #1f2937",
                borderRadius: "12px",
                overflow: "hidden",
              }}
            >
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#0f172a" }}>
                    <th
                      style={{
                        ...thStyle,
                        textAlign: "left",
                        paddingLeft: "14px",
                      }}
                    >
                      Team
                    </th>
                    <th style={thStyle}>P</th>
                    <th style={thStyle}>W</th>
                    <th style={thStyle}>L</th>
                    <th style={thStyle}>T</th>
                    <th style={thStyle}>NR</th>
                    <th style={{ ...thStyle, color: "#60a5fa" }}>NRR</th>
                    <th style={{ ...thStyle, color: "#4ade80" }}>Pts</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => (
                    <tr
                      key={row.team}
                      style={{
                        background: i % 2 === 0 ? "#0d1117" : "#111827",
                      }}
                    >
                      <td
                        style={{
                          ...tdStyle,
                          textAlign: "left",
                          paddingLeft: "14px",
                          fontWeight: "600",
                          color: "#f9fafb",
                        }}
                      >
                        {i === 0 && highlightTop ? "🥇 " : ""}
                        {row.team}
                      </td>
                      <td style={tdStyle}>{row.p}</td>
                      <td style={{ ...tdStyle, color: "#4ade80" }}>{row.w}</td>
                      <td style={{ ...tdStyle, color: "#f87171" }}>{row.l}</td>
                      <td style={tdStyle}>{row.t}</td>
                      <td style={tdStyle}>{row.nr}</td>
                      <td
                        style={{
                          ...tdStyle,
                          color:
                            row.nrr > 0
                              ? "#4ade80"
                              : row.nrr < 0
                              ? "#f87171"
                              : "#9ca3af",
                          fontWeight: "600",
                        }}
                      >
                        {row.nrr > 0 ? "+" : ""}
                        {row.nrr.toFixed(3)}
                      </td>
                      <td
                        style={{
                          ...tdStyle,
                          fontWeight: "700",
                          color: "#4ade80",
                          fontSize: "15px",
                        }}
                      >
                        {row.pts}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );

          if (!isGroupStage) {
            return (
              <StandingsTable rows={pointsTable} highlightTop={doneCount > 0} />
            );
          }

          return (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "22px" }}
            >
              {groupedTables.map(([group, rows]) => (
                <div key={group}>
                  <div
                    style={{
                      fontSize: "12px",
                      fontWeight: "700",
                      color: "#4ade80",
                      letterSpacing: "0.5px",
                      marginBottom: "8px",
                    }}
                  >
                    GROUP {group.toUpperCase()}
                  </div>
                  <StandingsTable rows={rows} highlightTop={doneCount > 0} />
                </div>
              ))}

              <div>
                <div
                  style={{
                    fontSize: "12px",
                    fontWeight: "700",
                    color: "#60a5fa",
                    letterSpacing: "0.5px",
                    marginBottom: "8px",
                    paddingTop: "6px",
                    borderTop: "1px solid #1f2937",
                  }}
                >
                  OVERALL STANDINGS
                </div>
                <StandingsTable rows={pointsTable} highlightTop={false} />
              </div>
            </div>
          );
        })()}

      {/* Results Tab */}
      {activeTab === "done" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {completed.length === 0 && (
            <p
              style={{
                color: "#6b7280",
                textAlign: "center",
                marginTop: "30px",
              }}
            >
              No completed matches yet.
            </p>
          )}
          {completed.map((f, i) => (
            <div
              key={f._id}
              style={{
                background: "#111827",
                border: "1px solid #1f2937",
                borderRadius: "10px",
                padding: "12px 14px",
              }}
            >
              <div
                style={{
                  fontSize: "12px",
                  color: "#6b7280",
                  marginBottom: "4px",
                }}
              >
                Match {i + 1}
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span
                  style={{
                    fontWeight: "600",
                    color: f.winner === f.teamA ? "#4ade80" : "#9ca3af",
                  }}
                >
                  {f.teamA}
                </span>
                <span style={{ color: "#4b5563" }}>vs</span>
                <span
                  style={{
                    fontWeight: "600",
                    color: f.winner === f.teamB ? "#4ade80" : "#9ca3af",
                  }}
                >
                  {f.teamB}
                </span>
              </div>
              <div
                style={{
                  textAlign: "center",
                  fontSize: "12px",
                  color: "#60a5fa",
                  marginTop: "6px",
                  fontWeight: "600",
                }}
              >
                {f.winner === "Tie"
                  ? "🤝 Match Tied"
                  : f.winner === "No Result"
                  ? "🌧 No Result"
                  : `🏆 ${f.winner} won`}
              </div>
              {f.matchId && (
                <button
                  onClick={() => handleDownloadScorecard(f)}
                  style={{
                    marginTop: "10px",
                    width: "100%",
                    background: "#1a1a1a",
                    border: "1px solid #374151",
                    color: "#9ca3af",
                    padding: "8px",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontSize: "12px",
                    fontWeight: "600",
                  }}
                >
                  📄 Download Scorecard
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Bracket Tab */}
      {activeTab === "bracket" &&
        tournament.knockoutFormat &&
        tournament.knockoutFormat !== "none" &&
        (() => {
          const knockoutFixtures = (tournament.fixtures || []).filter(
            (f) => f.stage !== "league"
          );
          const knockoutGenerated = knockoutFixtures.length > 0;
          const byStage = {};
          knockoutFixtures.forEach((f) => {
            if (!byStage[f.stage]) byStage[f.stage] = [];
            byStage[f.stage].push(f);
          });
          const orderedStages = STAGE_ORDER.filter((s) => byStage[s]);
          const leagueFixtures = (tournament.fixtures || []).filter(
            (f) => f.stage === "league"
          );
          const leagueDoneCount = leagueFixtures.filter(
            (f) => f.status === "completed"
          ).length;
          const leagueTotal = leagueFixtures.length;

          return (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "16px" }}
            >
              {!knockoutGenerated ? (
                <div
                  style={{
                    background: "#111827",
                    border: "1px solid #1f2937",
                    borderRadius: "12px",
                    padding: "24px 16px",
                    textAlign: "center",
                  }}
                >
                  <div style={{ fontSize: "28px", marginBottom: "10px" }}>
                    🏅
                  </div>
                  <div
                    style={{
                      fontSize: "14px",
                      color: "#9ca3af",
                      marginBottom: "6px",
                    }}
                  >
                    Knockout bracket not generated yet.
                  </div>
                  <div
                    style={{
                      fontSize: "12px",
                      color: "#6b7280",
                      marginBottom: "18px",
                    }}
                  >
                    {leagueTotal === 0
                      ? "Generate league fixtures first."
                      : leagueDoneCount < leagueTotal
                      ? `${leagueTotal - leagueDoneCount} league match${
                          leagueTotal - leagueDoneCount !== 1 ? "es" : ""
                        } still to play — you can seed early or wait.`
                      : "All league matches done. Ready to seed the bracket."}
                  </div>
                  <button
                    onClick={async () => {
                      if (
                        !window.confirm(
                          "Generate the knockout bracket from current standings?"
                        )
                      )
                        return;
                      setGenLoading(true);
                      try {
                        await tournamentApi.generateKnockout(id);
                        refresh();
                      } catch (err) {
                        alert(
                          err.message || "Failed to generate knockout bracket"
                        );
                      } finally {
                        setGenLoading(false);
                      }
                    }}
                    disabled={genLoading || leagueTotal === 0}
                    style={{
                      background:
                        genLoading || leagueTotal === 0 ? "#374151" : "#16a34a",
                      color: "#fff",
                      border: "none",
                      padding: "11px 24px",
                      borderRadius: "8px",
                      fontWeight: "700",
                      fontSize: "14px",
                      cursor:
                        genLoading || leagueTotal === 0
                          ? "not-allowed"
                          : "pointer",
                    }}
                  >
                    {genLoading ? "Generating…" : "🏅 Generate Bracket"}
                  </button>
                </div>
              ) : (
                <>
                  {tournament.status === "completed" && tournament.winner && (
                    <div
                      style={{
                        padding: "12px 16px",
                        borderRadius: "10px",
                        background: "#14532d",
                        border: "1px solid #16a34a",
                        fontSize: "15px",
                        fontWeight: "700",
                        color: "#4ade80",
                        textAlign: "center",
                      }}
                    >
                      🥇 {tournament.winner} — Tournament Champions
                    </div>
                  )}
                  {orderedStages.map((stage) => (
                    <div key={stage}>
                      <div
                        style={{
                          fontSize: "11px",
                          fontWeight: "700",
                          color: "#4ade80",
                          letterSpacing: "1px",
                          textTransform: "uppercase",
                          marginBottom: "10px",
                          paddingBottom: "6px",
                          borderBottom: "1px solid #1f2937",
                        }}
                      >
                        {STAGE_LABEL[stage]}
                      </div>
                      <div
                        style={{
                          display: "flex",
                          gap: "10px",
                          overflowX: "auto",
                          paddingBottom: "4px",
                        }}
                      >
                        {byStage[stage].map((f) => (
                          <KnockoutCard key={f._id} fixture={f} />
                        ))}
                      </div>
                    </div>
                  ))}
                  <button
                    onClick={async () => {
                      if (
                        !window.confirm(
                          "Regenerate bracket? All existing knockout results will be lost."
                        )
                      )
                        return;
                      setGenLoading(true);
                      try {
                        await tournamentApi.generateKnockout(id, true);
                        refresh();
                      } catch (err) {
                        alert(err.message || "Failed to regenerate");
                      } finally {
                        setGenLoading(false);
                      }
                    }}
                    disabled={genLoading}
                    style={{
                      background: "transparent",
                      color: "#6b7280",
                      border: "1px solid #374151",
                      padding: "8px",
                      borderRadius: "8px",
                      fontSize: "12px",
                      cursor: genLoading ? "not-allowed" : "pointer",
                      width: "100%",
                    }}
                  >
                    ↺ Regenerate Bracket from Current Standings
                  </button>
                </>
              )}
            </div>
          );
        })()}

      {/* Awards Tab — renders the AwardsTab component defined at the top of this file */}
      {activeTab === "awards" && (
        <AwardsTab
          awardsData={awardsData}
          awardsLoading={awardsLoading}
          awardsTab={awardsTab}
          setAwardsTab={setAwardsTab}
        />
      )}

      <button
        onClick={() => navigate("/tournaments")}
        style={{
          marginTop: "28px",
          background: "transparent",
          border: "1px solid #374151",
          color: "#6b7280",
          padding: "10px",
          borderRadius: "8px",
          cursor: "pointer",
          fontSize: "14px",
          width: "100%",
        }}
      >
        ← Back to Tournaments
      </button>
    </div>
  );
}
