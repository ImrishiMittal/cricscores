import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { getMatches, deleteMatch } from "../api/matchApi";
import s from "./MatchHistory.module.css";
import {
  generateScorecardPDF,
  generateHistoryMatchPDF,
} from "../utils/generateScorecardPDF";

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmtOvers(balls) {
  if (balls == null) return "-";
  return `${Math.floor(balls / 6)}.${balls % 6}`;
}

function fmtDate(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
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

// ── Delete confirmation modal ─────────────────────────────────────────────────
function DeleteConfirmModal({ matchLabel, onConfirm, onCancel, loading }) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.78)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
      }}
    >
      <div
        style={{
          background: "#1a1a1a",
          border: "1px solid #ef4444",
          borderRadius: "14px",
          padding: "28px 24px",
          maxWidth: "340px",
          width: "90%",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: "32px", marginBottom: "12px" }}>🗑️</div>
        <h3 style={{ color: "#e5e7eb", marginBottom: "8px", fontSize: "17px" }}>
          Delete Match?
        </h3>
        <p
          style={{
            color: "#9ca3af",
            fontSize: "14px",
            marginBottom: "22px",
            lineHeight: 1.5,
          }}
        >
          <strong style={{ color: "#e5e7eb" }}>{matchLabel}</strong>
          <br />
          This will permanently remove the match record. This cannot be undone.
        </p>
        <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
          <button
            onClick={onCancel}
            disabled={loading}
            style={{
              background: "#374151",
              color: "#e5e7eb",
              padding: "10px 22px",
              borderRadius: "8px",
              border: "none",
              fontWeight: "600",
              fontSize: "14px",
              cursor: "pointer",
              opacity: loading ? 0.6 : 1,
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            style={{
              background: "#ef4444",
              color: "#fff",
              padding: "10px 22px",
              borderRadius: "8px",
              border: "none",
              fontWeight: "600",
              fontSize: "14px",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Match card ────────────────────────────────────────────────────────────────
function MatchCard({ match, onClick, onDeleteRequest }) {
  const t1 = match.team1Name || match.team1 || "Team A";
  const t2 = match.team2Name || match.team2 || "Team B";
  const s1 = `${match.team1Score ?? "-"}/${match.team1Wickets ?? "-"}`;
  const s2 = `${match.team2Score ?? "-"}/${match.team2Wickets ?? "-"}`;
  const ov1 =
    match.team1Balls != null ? `(${fmtOvers(match.team1Balls)} ov)` : "";
  const ov2 =
    match.team2Balls != null ? `(${fmtOvers(match.team2Balls)} ov)` : "";
  const result = match.resultText || match.result || "Result pending";

  return (
    <div className={s.matchCard} style={{ position: "relative" }}>
      {/* Delete button — top-right corner */}
      <button
        title="Delete match"
        onClick={(e) => {
          e.stopPropagation();
          onDeleteRequest(match);
        }}
        style={{
          position: "absolute",
          top: "12px",
          right: "12px",
          background: "transparent",
          border: "none",
          color: "#3d4a5a",
          cursor: "pointer",
          padding: "4px",
          borderRadius: "5px",
          lineHeight: 1,
          transition: "color 0.15s, background 0.15s",
          display: "flex",
          alignItems: "center",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = "#ef4444";
          e.currentTarget.style.background = "rgba(239,68,68,0.08)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = "#3d4a5a";
          e.currentTarget.style.background = "transparent";
        }}
      >
        <TrashIcon />
      </button>

      {/* Clickable body */}
      <div
        onClick={onClick}
        style={{ cursor: "pointer", paddingRight: "28px" }}
      >
        <div className={s.teamRow}>
          <span className={s.teamName}>{t1}</span>
          <span className={s.teamScore}>
            {s1} <span className={s.teamOvers}>{ov1}</span>
          </span>
        </div>
        <div className={s.teamRow}>
          <span className={s.teamName}>{t2}</span>
          <span className={s.teamScore}>
            {s2} <span className={s.teamOvers}>{ov2}</span>
          </span>
        </div>
        <hr className={s.cardDivider} />
        <div className={s.cardFooter}>
          <span className={s.resultText}>{result}</span>
          <span className={s.dateText}>{fmtDate(match.createdAt)}</span>
        </div>
      </div>

      {/* PDF download button */}
      <button
        className={s.pdfBtn}
        onClick={(e) => {
          e.stopPropagation();
          generateHistoryMatchPDF(match);
        }}
      >
        ⬇ PDF
      </button>
    </div>
  );
}

// ── Score summary card ────────────────────────────────────────────────────────
function ScoreCard({ team, score, wickets, balls }) {
  return (
    <div className={s.scoreCard}>
      <div className={s.scoreCardTeam}>{team}</div>
      <div className={s.scoreCardRuns}>
        {score ?? "-"}
        <span>/{wickets ?? "-"}</span>
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
          <col />
          <col />
          <col />
          <col />
          <col />
          <col />
          <col />
        </colgroup>
        <thead>
          <tr>
            <th>Batter</th>
            <th>Dismissal</th>
            <th>R</th>
            <th>B</th>
            <th>4s</th>
            <th>6s</th>
            <th>SR</th>
          </tr>
        </thead>
        <tbody>
          {batting.map((p, i) => {
            const dismissalText = hasBlob
              ? p.dismissal || null
              : p.isOut
              ? `${p.dismissalType || "out"}${
                  p.fielderName ? ` (${p.fielderName})` : ""
                }`
              : null;
            return (
              <tr key={i}>
                <td>{p.playerName || p.displayName || p.name}</td>
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
          <col />
          <col />
          <col />
          <col />
          <col />
          <col />
          <col />
        </colgroup>
        <thead>
          <tr>
            <th>Bowler</th>
            <th>O</th>
            <th>R</th>
            <th>W</th>
            <th>Wd</th>
            <th>NB</th>
            <th>Econ</th>
          </tr>
        </thead>
        <tbody>
          {bowling.map((p, i) => {
            const balls = p.ballsBowled || p.balls || 0;
            const runs = p.runsGiven || p.runs || 0;
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

  const hasBlob = !!(match.innings1DataBlob || match.innings2DataBlob);
  const blob =
    inningsView === 1 ? match.innings1DataBlob : match.innings2DataBlob;

  const batting = hasBlob
    ? blob?.battingStats || []
    : inningsView === 1
    ? match.team1Batting || []
    : match.team2Batting || [];
  const bowling = hasBlob
    ? blob?.bowlingStats || []
    : inningsView === 1
    ? match.team1Bowling || []
    : match.team2Bowling || [];

  const battingTeam = inningsView === 1 ? t1 : t2;
  const bowlingTeam = inningsView === 1 ? t2 : t1;

  return (
    <div>
      <div className={s.inningsTabs}>
        {[1, 2].map((inn) => (
          <button
            key={inn}
            onClick={() => setInningsView(inn)}
            className={`${s.innBtn} ${
              inningsView === inn ? s.innBtnActive : ""
            }`}
          >
            {inn === 1 ? t1 : t2} Innings
          </button>
        ))}
      </div>
      <p className={s.sectionHeader}>{battingTeam} — Batting</p>
      <BattingTable batting={batting} hasBlob={hasBlob} />
      <p className={s.sectionHeader}>{bowlingTeam} — Bowling</p>
      <BowlingTable bowling={bowling} />
    </div>
  );
}

// ── Info tab ──────────────────────────────────────────────────────────────────
function InfoTab({ match, t1, t2, result }) {
  const rows = [
    ["Teams", `${t1} vs ${t2}`],
    [
      "Format",
      match.totalOvers ?? match.overs
        ? `${match.totalOvers ?? match.overs} overs`
        : "-",
    ],
    ["Toss", match.tossWinner ? `${match.tossWinner} won` : "-"],
    ["Result", result],
    [`${t1} Captain`, match.team1Captain || "-"],
    [`${t2} Captain`, match.team2Captain || "-"],
    ["Man of Match", match.manOfTheMatch || "-"],
    ["Date", fmtDate(match.createdAt)],
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
function MatchDetail({ match, onBack, onDeleteRequest }) {
  const [tab, setTab] = useState("scorecard");
  const t1 = match.team1Name || match.team1 || "Team A";
  const t2 = match.team2Name || match.team2 || "Team B";
  const result = match.resultText || match.result || "Result pending";

  return (
    <div className={s.detail}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "4px",
        }}
      >
        <button className={s.detailBackBtn} onClick={onBack}>
          ← Back to list
        </button>
        {/* Delete button in detail view */}
        <button
          onClick={() => onDeleteRequest(match)}
          style={{
            background: "transparent",
            border: "1px solid rgba(239,68,68,0.35)",
            color: "#ef4444",
            padding: "6px 12px",
            borderRadius: "8px",
            fontSize: "12px",
            fontWeight: "600",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            transition: "background 0.15s, border-color 0.15s",
            letterSpacing: "0.5px",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(239,68,68,0.08)";
            e.currentTarget.style.borderColor = "#ef4444";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.borderColor = "rgba(239,68,68,0.35)";
          }}
        >
          <TrashIcon /> Delete
        </button>
      </div>

      <h2 className={s.matchTitle}>
        {t1} vs {t2}
      </h2>
      <p className={s.matchDate}>{fmtDate(match.createdAt)}</p>

      <div className={s.scoreCards}>
        <ScoreCard
          team={t1}
          score={match.team1Score}
          wickets={match.team1Wickets}
          balls={match.team1Balls}
        />
        <ScoreCard
          team={t2}
          score={match.team2Score}
          wickets={match.team2Wickets}
          balls={match.team2Balls}
        />
      </div>

      <div className={s.resultBanner}>{result}</div>
      <button
        className={s.pdfBtnDetail}
        onClick={() => generateHistoryMatchPDF(match)}
      >
        📄 Download Scorecard PDF
      </button>

      <div className={s.tabs}>
        {[
          { id: "scorecard", label: "Scorecard" },
          { id: "info", label: "Match Info" },
        ].map((t) => (
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
      {tab === "info" && (
        <InfoTab match={match} t1={t1} t2={t2} result={result} />
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
function MatchHistoryPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [matches, setMatches] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState(null); // match object to delete
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchMatches = () => {
    setLoading(true);
    setError(null);
    getMatches()
      .then((data) => {
        setMatches(
          [...data].sort(
            (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
          )
        );
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchMatches();
  }, [location.key]);

  const handleDeleteRequest = (match) => {
    setDeleteTarget(match);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await deleteMatch(deleteTarget._id);

      // Remove from local state
      setMatches((prev) => prev.filter((m) => m._id !== deleteTarget._id));

      // If we were viewing this match in detail, go back to list
      if (selected && selected._id === deleteTarget._id) {
        setSelected(null);
      }

      setDeleteTarget(null);
    } catch (err) {
      alert(`❌ Failed to delete match: ${err.message}`);
    } finally {
      setDeleteLoading(false);
    }
  };

  const matchLabel = deleteTarget
    ? `${deleteTarget.team1Name || deleteTarget.team1 || "Team A"} vs ${
        deleteTarget.team2Name || deleteTarget.team2 || "Team B"
      } — ${fmtDate(deleteTarget.createdAt)}`
    : "";

  return (
    <div className={s.page}>
      {/* ── Delete confirmation modal ───────────────────────────────── */}
      {deleteTarget && (
        <DeleteConfirmModal
          matchLabel={matchLabel}
          onConfirm={handleDeleteConfirm}
          onCancel={() => !deleteLoading && setDeleteTarget(null)}
          loading={deleteLoading}
        />
      )}

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className={s.header}>
        <button
          className={s.backBtn}
          onClick={() => (selected ? setSelected(null) : navigate("/home"))}
        >
          ←
        </button>
        <h1 className={s.pageTitle}>
          Match <span>History</span>
        </h1>
        <button className={s.refreshBtn} onClick={fetchMatches}>
          🔄
        </button>
      </div>

      {/* ── Body ───────────────────────────────────────────────────── */}
      {loading && <p className={s.stateMsg}>Loading match history…</p>}
      {error && <p className={`${s.stateMsg} ${s.error}`}>Error: {error}</p>}

      {!loading && !error && !selected && (
        <div className={s.cardList}>
          {matches.length === 0 ? (
            <p className={s.stateMsg}>No matches recorded yet. Play one!</p>
          ) : (
            matches.map((m) => (
              <MatchCard
                key={m._id}
                match={m}
                onClick={() => setSelected(m)}
                onDeleteRequest={handleDeleteRequest}
              />
            ))
          )}
        </div>
      )}

      {!loading && !error && selected && (
        <MatchDetail
          match={selected}
          onBack={() => setSelected(null)}
          onDeleteRequest={handleDeleteRequest}
        />
      )}
    </div>
  );
}

export default MatchHistoryPage;
