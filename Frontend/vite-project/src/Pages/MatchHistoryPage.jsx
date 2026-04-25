import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMatches } from "../api/matchApi";
import s from "./MatchHistory.module.css";

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmtOvers(balls) {
  if (balls == null) return "-";
  return `${Math.floor(balls / 6)}.${balls % 6}`;
}

function fmtDate(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function calcEcon(runs, balls) {
  if (!balls) return "-";
  return ((runs / balls) * 6).toFixed(1);
}

function calcSR(runs, balls) {
  if (!balls) return "-";
  return ((runs / balls) * 100).toFixed(0);
}

// ── Match card ────────────────────────────────────────────────────────────────
function MatchCard({ match, onClick }) {
  const t1 = match.team1Name || match.team1 || "Team A";
  const t2 = match.team2Name || match.team2 || "Team B";
  const s1 = `${match.team1Score ?? "-"}/${match.team1Wickets ?? "-"}`;
  const s2 = `${match.team2Score ?? "-"}/${match.team2Wickets ?? "-"}`;
  const ov1 = match.team1Balls != null ? `(${fmtOvers(match.team1Balls)} ov)` : "";
  const ov2 = match.team2Balls != null ? `(${fmtOvers(match.team2Balls)} ov)` : "";
  const result = match.resultText || match.result || "Result pending";

  return (
    <div className={s.matchCard} onClick={onClick}>
      <div className={s.teamRow}>
        <span className={s.teamName}>{t1}</span>
        <span className={s.teamScore}>{s1} <span className={s.teamOvers}>{ov1}</span></span>
      </div>
      <div className={s.teamRow}>
        <span className={s.teamName}>{t2}</span>
        <span className={s.teamScore}>{s2} <span className={s.teamOvers}>{ov2}</span></span>
      </div>
      <hr className={s.cardDivider} />
      <div className={s.cardFooter}>
        <span className={s.resultText}>{result}</span>
        <span className={s.dateText}>{fmtDate(match.createdAt)}</span>
      </div>
    </div>
  );
}

// ── Score summary card ────────────────────────────────────────────────────────
function ScoreCard({ team, score, wickets, balls }) {
  return (
    <div className={s.scoreCard}>
      <div className={s.scoreCardTeam}>{team}</div>
      <div className={s.scoreCardRuns}>
        {score ?? "-"}<span>/{wickets ?? "-"}</span>
      </div>
      {balls != null && (
        <div className={s.scoreCardOvers}>{fmtOvers(balls)} overs</div>
      )}
    </div>
  );
}

// ── Batting table ─────────────────────────────────────────────────────────────
function BattingTable({ batting, hasBlob }) {
  if (!batting.length)
    return <p className={s.empty}>No batting data recorded.</p>;

  return (
    <div className={s.tableWrap}>
      <table className={`${s.table} ${s.batting}`}>
        <colgroup>
          <col /><col /><col /><col /><col /><col /><col />
        </colgroup>
        <thead>
          <tr>
            <th>Batter</th>
            <th>Dismissal</th>
            <th>R</th><th>B</th>
            <th>4s</th><th>6s</th>
            <th>SR</th>
          </tr>
        </thead>
        <tbody>
          {batting.map((p, i) => {
            const dismissalText = hasBlob
              ? (p.dismissal || null)
              : (p.isOut
                  ? `${p.dismissalType || "out"}${p.fielderName ? ` (${p.fielderName})` : ""}`
                  : null);

            return (
              <tr key={i}>
                {/* Batter name */}
                <td>{p.playerName || p.displayName || p.name}</td>

                {/* Dismissal — truncated naturally by fixed layout */}
                <td className={dismissalText ? s.tdOut : s.tdNotOut}>
                  {dismissalText || "not out"}
                </td>

                <td className={s.tdRuns}>{p.runs ?? "-"}</td>
                <td>{p.balls ?? "-"}</td>
                <td>{p.fours ?? "-"}</td>
                <td>{p.sixes ?? "-"}</td>
                <td>{calcSR(p.runs, p.balls)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── Bowling table ─────────────────────────────────────────────────────────────
function BowlingTable({ bowling }) {
  if (!bowling.length)
    return <p className={s.empty}>No bowling data recorded.</p>;

  return (
    <div className={s.tableWrap}>
      <table className={`${s.table} ${s.bowling}`}>
        <colgroup>
          <col /><col /><col /><col /><col /><col /><col />
        </colgroup>
        <thead>
          <tr>
            <th>Bowler</th>
            <th>O</th><th>R</th><th>W</th>
            <th>Wd</th><th>NB</th>
            <th>Econ</th>
          </tr>
        </thead>
        <tbody>
          {bowling.map((p, i) => {
            const balls = p.ballsBowled || p.balls || 0;
            const runs  = p.runsGiven  || p.runs  || 0;
            return (
              <tr key={i}>
                <td>{p.playerName || p.displayName || p.name}</td>
                <td>{fmtOvers(balls)}</td>
                <td>{runs}</td>
                <td className={p.wickets > 0 ? s.tdWkts : ""}>
                  {p.wickets ?? "-"}
                </td>
                <td>{p.wides ?? "-"}</td>
                <td>{p.noBalls ?? "-"}</td>
                <td>{calcEcon(runs, balls)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── Scorecard tab ─────────────────────────────────────────────────────────────
function ScorecardTab({ match, t1, t2 }) {
  const [inningsView, setInningsView] = useState(1);

  const hasBlob  = !!(match.innings1DataBlob || match.innings2DataBlob);
  const blob     = inningsView === 1 ? match.innings1DataBlob : match.innings2DataBlob;

  const batting  = hasBlob
    ? (blob?.battingStats  || [])
    : (inningsView === 1 ? (match.team1Batting  || []) : (match.team2Batting  || []));
  const bowling  = hasBlob
    ? (blob?.bowlingStats  || [])
    : (inningsView === 1 ? (match.team1Bowling  || []) : (match.team2Bowling  || []));

  const battingTeam = inningsView === 1 ? t1 : t2;
  const bowlingTeam = inningsView === 1 ? t2 : t1;

  return (
    <div>
      {/* Innings selector */}
      <div className={s.inningsTabs}>
        {[1, 2].map(inn => (
          <button
            key={inn}
            onClick={() => setInningsView(inn)}
            className={`${s.innBtn} ${inningsView === inn ? s.innBtnActive : ""}`}
          >
            {inn === 1 ? t1 : t2} Innings
          </button>
        ))}
      </div>

      {/* Batting */}
      <p className={s.sectionHeader}>{battingTeam} — Batting</p>
      <BattingTable batting={batting} hasBlob={hasBlob} />

      {/* Bowling */}
      <p className={s.sectionHeader}>{bowlingTeam} — Bowling</p>
      <BowlingTable bowling={bowling} />
    </div>
  );
}

// ── Info tab ──────────────────────────────────────────────────────────────────
function InfoTab({ match, t1, t2, result }) {
  const rows = [
    ["Teams",           `${t1} vs ${t2}`],
    ["Format",          match.totalOvers ?? match.overs ? `${match.totalOvers ?? match.overs} overs` : "-"],
    ["Toss",            match.tossWinner ? `${match.tossWinner} won` : "-"],
    ["Result",          result],
    [`${t1} Captain`,   match.team1Captain || "-"],
    [`${t2} Captain`,   match.team2Captain || "-"],
    ["Man of Match",    match.manOfTheMatch || "-"],
    ["Date",            fmtDate(match.createdAt)],
  ];

  return (
    <div className={s.infoTable}>
      {rows.map(([label, value], i) => (
        <div key={i} className={s.infoRow}>
          <span className={s.infoLabel}>{label}</span>
          <span className={s.infoValue}>{value}</span>
        </div>
      ))}
    </div>
  );
}

// ── Match detail ──────────────────────────────────────────────────────────────
function MatchDetail({ match, onBack }) {
  const [tab, setTab] = useState("scorecard");
  const t1     = match.team1Name || match.team1 || "Team A";
  const t2     = match.team2Name || match.team2 || "Team B";
  const result = match.resultText || match.result || "Result pending";

  return (
    <div className={s.detail}>
      <button className={s.detailBackBtn} onClick={onBack}>
        ← Back to list
      </button>

      <h2 className={s.matchTitle}>{t1} vs {t2}</h2>
      <p className={s.matchDate}>{fmtDate(match.createdAt)}</p>

      <div className={s.scoreCards}>
        <ScoreCard team={t1} score={match.team1Score} wickets={match.team1Wickets} balls={match.team1Balls} />
        <ScoreCard team={t2} score={match.team2Score} wickets={match.team2Wickets} balls={match.team2Balls} />
      </div>

      <div className={s.resultBanner}>{result}</div>

      {/* Tab switcher */}
      <div className={s.tabs}>
        {[
          { id: "scorecard", label: "Scorecard" },
          { id: "info",      label: "Match Info" },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`${s.tabBtn} ${tab === t.id ? s.tabBtnActive : ""}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "scorecard" && <ScorecardTab match={match} t1={t1} t2={t2} />}
      {tab === "info"      && <InfoTab match={match} t1={t1} t2={t2} result={result} />}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
function MatchHistoryPage() {
  const navigate = useNavigate();
  const [matches,  setMatches]  = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);

  useEffect(() => {
    getMatches()
      .then(data => {
        setMatches([...data].sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        ));
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className={s.page}>
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className={s.header}>
        <button
          className={s.backBtn}
          onClick={() => selected ? setSelected(null) : navigate("/home")}
        >
          ←
        </button>
        <h1 className={s.pageTitle}>
          Match <span>History</span>
        </h1>
      </div>

      {/* ── Body ───────────────────────────────────────────────────── */}
      {loading && <p className={s.stateMsg}>Loading match history…</p>}
      {error   && <p className={`${s.stateMsg} ${s.error}`}>Error: {error}</p>}

      {!loading && !error && !selected && (
        <div className={s.cardList}>
          {matches.length === 0
            ? <p className={s.stateMsg}>No matches recorded yet. Play one!</p>
            : matches.map(m => (
                <MatchCard key={m._id} match={m} onClick={() => setSelected(m)} />
              ))
          }
        </div>
      )}

      {!loading && !error && selected && (
        <MatchDetail match={selected} onBack={() => setSelected(null)} />
      )}
    </div>
  );
}

export default MatchHistoryPage;
