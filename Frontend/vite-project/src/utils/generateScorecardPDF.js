// ─────────────────────────────────────────────────────────────────────────────
// src/utils/generateScorecardPDF.js
//
// Drop this file at:  src/utils/generateScorecardPDF.js
//
// Install deps once:  npm install jspdf jspdf-autotable
// ─────────────────────────────────────────────────────────────────────────────

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// ─── tiny helpers ─────────────────────────────────────────────────────────────

function fmtOvers(balls) {
  if (balls == null || balls === 0) return "0.0";
  return `${Math.floor(balls / 6)}.${balls % 6}`;
}

function sr(runs, balls) {
  if (!balls) return "-";
  return ((runs / balls) * 100).toFixed(0);
}

function econ(runs, balls) {
  if (!balls) return "-";
  return ((runs / balls) * 6).toFixed(1);
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

// ─── colour palette ───────────────────────────────────────────────────────────
const C = {
  navy:      [15, 52, 96],
  blue:      [30, 90, 160],
  lightBlue: [219, 234, 254],
  green:     [34, 197, 94],
  gold:      [234, 179, 8],
  white:     [255, 255, 255],
  offWhite:  [248, 250, 252],
  gray:      [100, 116, 139],
  darkGray:  [51, 65, 85],
  border:    [203, 213, 225],
};

// ─── draw the big match-result header ─────────────────────────────────────────
function drawHeader(doc, match, t1, t2) {
  const pw = doc.internal.pageSize.getWidth();

  // background strip
  doc.setFillColor(...C.navy);
  doc.rect(0, 0, pw, 38, "F");

  // gradient-like accent bar
  doc.setFillColor(...C.blue);
  doc.rect(0, 34, pw, 4, "F");

  // title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(...C.white);
  doc.text(`${t1}  vs  ${t2}`, pw / 2, 14, { align: "center" });

  // result
  const result = match.resultText || match.result || "Result pending";
  doc.setFontSize(9);
  doc.setTextColor(...C.gold);
  doc.text(result, pw / 2, 22, { align: "center" });

  // date + overs format
  const overs  = match.totalOvers || match.overs || "?";
  const date   = fmtDate(match.createdAt);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(180, 200, 230);
  doc.text(date, 10, 30);
doc.text(`T${overs} format`, pw - 10, 30, { align: "right" });

  return 44; // y cursor after header
}

// ─── toss / MoM / captains info strip ─────────────────────────────────────────
function drawInfoStrip(doc, match, t1, t2, y) {
    const pw = doc.internal.pageSize.getWidth();
  
    // ── top 3 info items ──────────────────────────────────────────────────────
    doc.setFillColor(...C.offWhite);
    doc.roundedRect(8, y, pw - 16, 14, 2, 2, "F");
    doc.setDrawColor(...C.border);
    doc.roundedRect(8, y, pw - 16, 14, 2, 2, "S");
  
    const items = [
      `Toss: ${match.tossWinner || "-"}`,
      `${t1} Captain: ${match.team1Captain || "-"}`,
      `${t2} Captain: ${match.team2Captain || "-"}`,
    ];
  
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...C.darkGray);
  
    const col = (pw - 16) / items.length;
    items.forEach((txt, i) => {
      doc.text(txt, 12 + col * i, y + 8, { maxWidth: col - 4 });
    });
  
    y += 17;
  
    // ── Man of the Match — standalone glowing card ────────────────────────────
    const mom = match.manOfTheMatch;
    if (mom) {
      // outer glow shadow (fake it with a slightly larger rect behind)
      doc.setFillColor(180, 210, 255);
      doc.roundedRect(8.8, y + 0.8, pw - 17.6, 14.4, 3, 3, "F");
  
      // gold-gradient-like background (two rects, light gold + white blend)
      doc.setFillColor(254, 243, 199);   // warm gold tint
      doc.roundedRect(8, y, pw - 16, 15, 3, 3, "F");
  
      // left accent bar in gold
      doc.setFillColor(...C.gold);
      doc.roundedRect(8, y, 4, 15, 2, 2, "F");
  
      // border
      doc.setDrawColor(...C.gold);
      doc.setLineWidth(0.5);
      doc.roundedRect(8, y, pw - 16, 15, 3, 3, "S");
      doc.setLineWidth(0.2);
  
      // label
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(120, 80, 0);
      doc.text("PLAYER OF THE MATCH", pw / 2, y + 5.5, { align: "center" });
  
      // name — big and bold
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(92, 60, 0);
      doc.text(mom, pw / 2, y + 12, { align: "center" });
    }
  
    return y + (mom ? 19 : 0);
  }

// ─── score-summary cards (like the app's ScoreCard) ──────────────────────────
function drawScoreCards(doc, match, t1, t2, y) {
  const pw = doc.internal.pageSize.getWidth();
  const half = (pw - 24) / 2;

  [[t1, match.team1Score, match.team1Wickets, match.team1Balls],
   [t2, match.team2Score, match.team2Wickets, match.team2Balls]
  ].forEach(([name, score, wkts, balls], i) => {
    const x = 8 + i * (half + 8);
    doc.setFillColor(...C.lightBlue);
    doc.roundedRect(x, y, half, 20, 3, 3, "F");
    doc.setDrawColor(...C.blue);
    doc.roundedRect(x, y, half, 20, 3, 3, "S");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...C.navy);
    doc.text(name, x + half / 2, y + 6, { align: "center" });

    doc.setFontSize(13);
    doc.setTextColor(...C.blue);
    doc.text(`${score ?? "-"}/${wkts ?? "-"}`, x + half / 2, y + 14, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...C.gray);
    doc.text(`(${fmtOvers(balls)} ov)`, x + half / 2, y + 19.5, { align: "center" });
  });

  return y + 25;
}

// ─── section heading ──────────────────────────────────────────────────────────
function drawSectionHeading(doc, label, y) {
  const pw = doc.internal.pageSize.getWidth();
  doc.setFillColor(...C.blue);
  doc.rect(8, y, pw - 16, 7, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...C.white);
  doc.text(label, 12, y + 5);
  return y + 9;
}

// ─── batting table ─────────────────────────────────────────────────────────────
function drawBattingTable(doc, batting, hasBlob, y) {
  if (!batting || !batting.length) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(7);
    doc.setTextColor(...C.gray);
    doc.text("No batting data recorded.", 10, y + 5);
    return y + 10;
  }

  const rows = batting.map((p) => {
    const name = p.playerName || p.displayName || p.name || "-";
    const dismissal = hasBlob
      ? (p.dismissal || "not out")
      : (p.isOut
          ? `${p.dismissalType || "out"}${p.fielderName ? ` (${p.fielderName})` : ""}`
          : "not out");
    return [
      name,
      dismissal,
      p.runs ?? "-",
      p.balls ?? "-",
      p.fours ?? "-",
      p.sixes ?? "-",
      sr(p.runs, p.balls),
    ];
  });

  autoTable(doc, {
    startY: y,
    margin: { left: 8, right: 8 },
    head: [["Batter", "Dismissal", "R", "B", "4s", "6s", "SR"]],
    body: rows,
    theme: "grid",
    styles: {
      fontSize: 7,
      cellPadding: 1.8,
      textColor: C.darkGray,
      lineColor: C.border,
      lineWidth: 0.2,
    },
    headStyles: {
      fillColor: C.navy,
      textColor: C.white,
      fontStyle: "bold",
      fontSize: 7,
    },
    alternateRowStyles: { fillColor: C.offWhite },
    columnStyles: {
      0: { cellWidth: 38 },
      1: { cellWidth: "auto" },
      2: { cellWidth: 10, halign: "center" },
      3: { cellWidth: 10, halign: "center" },
      4: { cellWidth: 10, halign: "center" },
      5: { cellWidth: 10, halign: "center" },
      6: { cellWidth: 12, halign: "center" },
    },
    didParseCell(data) {
      if (data.section === "body" && data.column.index === 1) {
        if (data.cell.raw === "not out") {
          data.cell.styles.textColor = [34, 197, 94]; // green
          data.cell.styles.fontStyle = "italic";
        }
      }
      if (data.section === "body" && data.column.index === 2) {
        const runs = parseInt(data.cell.raw, 10);
        if (runs >= 50) data.cell.styles.fontStyle = "bold";
        if (runs >= 100) data.cell.styles.textColor = C.gold;
      }
    },
  });

  return doc.lastAutoTable.finalY + 3;
}

// ─── bowling table ─────────────────────────────────────────────────────────────
function drawBowlingTable(doc, bowling, y) {
  if (!bowling || !bowling.length) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(7);
    doc.setTextColor(...C.gray);
    doc.text("No bowling data recorded.", 10, y + 5);
    return y + 10;
  }

  const rows = bowling.map((p) => {
    const balls = p.ballsBowled || p.balls || 0;
    const runs  = p.runsGiven  || p.runs  || 0;
    const overs = p.overs || fmtOvers(balls);
    return [
      p.playerName || p.displayName || p.name || "-",
      overs,
      runs,
      p.wickets ?? "-",
      p.wides   ?? "-",
      p.noBalls ?? "-",
      econ(runs, balls),
    ];
  });

  autoTable(doc, {
    startY: y,
    margin: { left: 8, right: 8 },
    head: [["Bowler", "O", "R", "W", "Wd", "NB", "Econ"]],
    body: rows,
    theme: "grid",
    styles: {
      fontSize: 7,
      cellPadding: 1.8,
      textColor: C.darkGray,
      lineColor: C.border,
      lineWidth: 0.2,
    },
    headStyles: {
      fillColor: C.navy,
      textColor: C.white,
      fontStyle: "bold",
      fontSize: 7,
    },
    alternateRowStyles: { fillColor: C.offWhite },
    columnStyles: {
      0: { cellWidth: 45 },
      1: { cellWidth: 12, halign: "center" },
      2: { cellWidth: 10, halign: "center" },
      3: { cellWidth: 10, halign: "center", fontStyle: "bold" },
      4: { cellWidth: 10, halign: "center" },
      5: { cellWidth: 10, halign: "center" },
      6: { cellWidth: 14, halign: "center" },
    },
    didParseCell(data) {
      if (data.section === "body" && data.column.index === 3) {
        const w = parseInt(data.cell.raw, 10);
        if (w >= 3) data.cell.styles.textColor = C.green;
        if (w >= 5) data.cell.styles.textColor = C.gold;
      }
    },
  });

  return doc.lastAutoTable.finalY + 3;
}

// ─── extras row ───────────────────────────────────────────────────────────────
function drawExtras(doc, blob, y) {
  if (!blob?.extras) return y;
  const ex = blob.extras;
  if (!ex.total && !ex.wides && !ex.noBalls) return y;

  const pw = doc.internal.pageSize.getWidth();
  doc.setFillColor(241, 245, 249);
  doc.rect(8, y, pw - 16, 7, "F");
  doc.setFont("helvetica", "italic");
  doc.setFontSize(7);
  doc.setTextColor(...C.gray);
  const parts = [];
  if (ex.wides)   parts.push(`W ${ex.wides}`);
  if (ex.noBalls) parts.push(`NB ${ex.noBalls}`);
  if (ex.byes)    parts.push(`B ${ex.byes}`);
  if (ex.legByes) parts.push(`LB ${ex.legByes}`);
  doc.text(
    `Extras: ${ex.total ?? 0}  (${parts.join(", ")})`,
    12, y + 5
  );
  return y + 9;
}

// ─── page-break guard ─────────────────────────────────────────────────────────
function ensureSpace(doc, y, needed = 40) {
  const ph = doc.internal.pageSize.getHeight();
  if (y + needed > ph - 15) {
    doc.addPage();
    return 10;
  }
  return y;
}

// ─── footer ───────────────────────────────────────────────────────────────────
function drawFooter(doc) {
  const pw = doc.internal.pageSize.getWidth();
  const ph = doc.internal.pageSize.getHeight();
  const total = doc.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    doc.setFillColor(...C.navy);
    doc.rect(0, ph - 10, pw, 10, "F");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(180, 200, 230);
    doc.text("Generated by CricketScorer", 10, ph - 3.5);
    doc.text(`Page ${i} of ${total}`, pw - 10, ph - 3.5, { align: "right" });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// buildScoringPagePayload
//
// Call this inside ScoringPage when you have live engine state.
// It assembles a match-like object that generateScorecardPDF can consume.
// ─────────────────────────────────────────────────────────────────────────────
export function buildScoringPagePayload({
  matchData,
  updatedMatchData,
  engine,
  firstBattingTeam,
  secondBattingTeam,
  inningsDataHook,
  inn1BowlersSnapshotRef,
}) {
  const inn1 = inningsDataHook.innings1DataRef?.current;
  const inn2 = inningsDataHook.innings2DataRef?.current;
  const inn1Balls =
    (engine.innings1Score?.overs ?? 0) * 6 +
    (engine.innings1Score?.balls ?? 0);

  return {
    // identifiers
    team1Name: firstBattingTeam,
    team2Name: secondBattingTeam,
    totalOvers: updatedMatchData.overs,
    createdAt: new Date().toISOString(),

    // toss / captains / MoM
    tossWinner:    matchData.tossWinner || "",
    team1Captain:  firstBattingTeam === matchData.teamA
      ? matchData.teamACaptain?.name || ""
      : matchData.teamBCaptain?.name || "",
    team2Captain:  firstBattingTeam === matchData.teamA
      ? matchData.teamBCaptain?.name || ""
      : matchData.teamACaptain?.name || "",
    manOfTheMatch: engine.manOfTheMatch || "",

    // scores
    team1Score:   engine.innings1Score?.score   ?? 0,
    team1Wickets: engine.innings1Score?.wickets  ?? 0,
    team1Balls:   inn1Balls,
    team2Score:   engine.score,
    team2Wickets: engine.wickets,
    team2Balls:   engine.overs * 6 + engine.balls,

    // result
    winner:     engine.winner || "",
    resultText: engine.winner
      ? ["TIE", "NO RESULT"].includes(engine.winner)
        ? engine.winner
        : `${engine.winner} won`
      : "No Result",

    // blob data — richer dismissal strings etc.
    innings1DataBlob: inn1,
    innings2DataBlob: inn2,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// generateScorecardPDF  ←  THE MAIN EXPORT
//
// Works with both sources of match data:
//   • match history records  (from MongoDB / getMatches())
//   • live ScoringPage payload  (built by buildScoringPagePayload above)
// ─────────────────────────────────────────────────────────────────────────────
export function generateScorecardPDF(match) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const t1 = match.team1Name || match.team1 || "Team A";
  const t2 = match.team2Name || match.team2 || "Team B";

  // ── which data source? ────────────────────────────────────────────────────
  //  "blob" shape  →  innings1DataBlob / innings2DataBlob
  //  "flat" shape  →  team1Batting / team1Bowling arrays on the root object
  const hasBlob = !!(match.innings1DataBlob || match.innings2DataBlob);

  const getStats = (blobKey, flatBatKey, flatBowlKey) => {
    if (hasBlob) {
      const blob = match[blobKey];
      return {
        batting: blob?.battingStats || [],
        bowling: blob?.bowlingStats || [],
        extras:  blob?.extras,
      };
    }
    return {
      batting: match[flatBatKey]  || [],
      bowling: match[flatBowlKey] || [],
      extras:  null,
    };
  };

  const inn1 = getStats("innings1DataBlob", "team1Batting", "team1Bowling");
  const inn2 = getStats("innings2DataBlob", "team2Batting", "team2Bowling");

  // ── BUILD PDF ─────────────────────────────────────────────────────────────
  let y = drawHeader(doc, match, t1, t2);
  y = drawInfoStrip(doc, match, t1, t2, y);
  y = drawScoreCards(doc, match, t1, t2, y);

  // ── INNINGS 1 ─────────────────────────────────────────────────────────────
  y = ensureSpace(doc, y, 20);
  y = drawSectionHeading(doc, `${t1} — BATTING  (${fmtOvers(match.team1Balls)} ov)`, y);
  y = drawBattingTable(doc, inn1.batting, hasBlob, y);
  y = drawExtras(doc, hasBlob ? match.innings1DataBlob : null, y);

  y = ensureSpace(doc, y, 20);
  y = drawSectionHeading(doc, `${t2} — BOWLING  (${t1} innings)`, y);
  y = drawBowlingTable(doc, inn1.bowling, y);

  // ── INNINGS 2 ─────────────────────────────────────────────────────────────
  y = ensureSpace(doc, y, 20);
  y = drawSectionHeading(doc, `${t2} — BATTING  (${fmtOvers(match.team2Balls)} ov)`, y);
  y = drawBattingTable(doc, inn2.batting, hasBlob, y);
  y = drawExtras(doc, hasBlob ? match.innings2DataBlob : null, y);

  y = ensureSpace(doc, y, 20);
  y = drawSectionHeading(doc, `${t1} — BOWLING  (${t2} innings)`, y);
  y = drawBowlingTable(doc, inn2.bowling, y);

  drawFooter(doc);

  // ── SAVE ─────────────────────────────────────────────────────────────────
  const safeT1 = t1.replace(/\s+/g, "_");
  const safeT2 = t2.replace(/\s+/g, "_");
  doc.save(`Scorecard_${safeT1}_vs_${safeT2}.pdf`);
}
