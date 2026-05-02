import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n) => (n == null ? "0" : String(n));

const fmtOvers = (balls) => {
  const b = Number(balls) || 0;
  return `${Math.floor(b / 6)}.${b % 6}`;
};

const oversStr = fmtOvers;

const economy = (runs, balls) => {
  if (!balls) return "0.00";
  return ((runs / balls) * 6).toFixed(2);
};

const strikeRate = (runs, balls) => {
  if (!balls) return "0.00";
  return ((runs / balls) * 100).toFixed(1);
};

// ─── Colour palette ───────────────────────────────────────────────────────────
const C = {
  navy: [15, 52, 96],
  blue: [30, 90, 160],
  lightBlue: [219, 234, 254],
  gold: [234, 179, 8],
  white: [255, 255, 255],
  offWhite: [248, 250, 252],
  gray: [100, 116, 139],
  darkGray: [51, 65, 85],
  border: [203, 213, 225],
};

// ─── Header ───────────────────────────────────────────────────────────────────
function drawHeader(doc, match, t1, t2) {
  const pageW = doc.internal.pageSize.getWidth();

  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageW, 52, "F");

  doc.setFontSize(18);
  doc.setTextColor(250, 250, 250);
  doc.setFont("helvetica", "bold");
  doc.text("CRICKET SCORECARD", pageW / 2, 13, { align: "center" });

  doc.setFontSize(12);
  doc.setTextColor(209, 213, 219);
  const inn1 = `${t1}:  ${fmt(match.team1Score)}/${fmt(
    match.team1Wickets
  )}  (${oversStr(match.team1Balls)} ov)`;
  const inn2 = `${t2}:  ${fmt(match.team2Score)}/${fmt(
    match.team2Wickets
  )}  (${oversStr(match.team2Balls)} ov)`;
  doc.text(inn1, pageW / 2, 23, { align: "center" });
  doc.text(inn2, pageW / 2, 31, { align: "center" });

  const winner = match.winner || "";
  const resultText = match.resultText || "";
  const resultLine =
    resultText || (winner ? `${winner} won` : "Result pending");
  doc.setFontSize(11);
  doc.setTextColor(74, 222, 128);
  doc.text(resultLine, pageW / 2, 40, { align: "center" });

  if (match.manOfTheMatch) {
    doc.setFontSize(10);
    doc.setTextColor(251, 191, 36);
    doc.text(`Man of the Match: ${match.manOfTheMatch}`, pageW / 2, 48, {
      align: "center",
    });
  }

  if (match.tossWinner) {
    doc.setFontSize(9);
    doc.setTextColor(156, 163, 175);
    doc.text(
      `Toss: ${match.tossWinner}  |  ${match.totalOvers || "?"} overs`,
      pageW / 2,
      55,
      { align: "center" }
    );
  }

  return 60;
}

// ─── Info strip (toss / captains / MoM card) ──────────────────────────────────
function drawInfoStrip(doc, match, t1, t2, y) {
  const pw = doc.internal.pageSize.getWidth();

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

  const mom = match.manOfTheMatch;
  if (mom) {
    doc.setFillColor(180, 210, 255);
    doc.roundedRect(8.8, y + 0.8, pw - 17.6, 14.4, 3, 3, "F");
    doc.setFillColor(254, 243, 199);
    doc.roundedRect(8, y, pw - 16, 15, 3, 3, "F");
    doc.setFillColor(...C.gold);
    doc.roundedRect(8, y, 4, 15, 2, 2, "F");
    doc.setDrawColor(...C.gold);
    doc.setLineWidth(0.5);
    doc.roundedRect(8, y, pw - 16, 15, 3, 3, "S");
    doc.setLineWidth(0.2);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(120, 80, 0);
    doc.text("PLAYER OF THE MATCH", pw / 2, y + 5.5, { align: "center" });
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(92, 60, 0);
    doc.text(mom, pw / 2, y + 12, { align: "center" });
  }

  return y + (mom ? 19 : 0);
}

// ─── Score summary cards ──────────────────────────────────────────────────────
function drawScoreCards(doc, match, t1, t2, y) {
  const pw = doc.internal.pageSize.getWidth();
  const half = (pw - 24) / 2;

  [
    [t1, match.team1Score, match.team1Wickets, match.team1Balls],
    [t2, match.team2Score, match.team2Wickets, match.team2Balls],
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
    doc.text(`${score ?? "-"}/${wkts ?? "-"}`, x + half / 2, y + 14, {
      align: "center",
    });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...C.gray);
    doc.text(`(${fmtOvers(balls)} ov)`, x + half / 2, y + 19.5, {
      align: "center",
    });
  });

  return y + 25;
}

// ─── Section heading ──────────────────────────────────────────────────────────
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

// ─── Batting table ────────────────────────────────────────────────────────────
function drawBattingTable(doc, battingStats, startY) {
  const rows = (battingStats || []).map((b) => [
    b.playerName || "",
    b.isOut
      ? (b.dismissalType || "out") +
        (b.fielderName ? ` (${b.fielderName})` : "") +
        (b.bowlerName ? ` b ${b.bowlerName}` : "")
      : "not out",
    fmt(b.runs),
    fmt(b.balls),
    fmt(b.fours),
    fmt(b.sixes),
    strikeRate(b.runs, b.balls),
  ]);

  autoTable(doc, {
    startY,
    head: [["Batter", "Dismissal", "R", "B", "4s", "6s", "SR"]],
    body: rows,
    theme: "grid",
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontSize: 9,
    },
    bodyStyles: { fontSize: 8, textColor: [31, 31, 31] },
    columnStyles: {
      0: { cellWidth: 38 },
      1: { cellWidth: 64 },
      2: { cellWidth: 10, halign: "right" },
      3: { cellWidth: 10, halign: "right" },
      4: { cellWidth: 10, halign: "right" },
      5: { cellWidth: 10, halign: "right" },
      6: { cellWidth: 18, halign: "right" },
    },
    margin: { left: 14, right: 14 },
  });

  return doc.lastAutoTable.finalY + 4;
}

// ─── Bowling table ────────────────────────────────────────────────────────────
function drawBowlingTable(doc, bowlingStats, startY) {
  const rows = (bowlingStats || []).map((b) => {
    const balls = b.ballsBowled || 0;
    return [
      b.playerName || "",
      oversStr(balls),
      fmt(b.runsGiven),
      fmt(b.wickets),
      economy(b.runsGiven, balls),
      fmt(b.wides),
      fmt(b.noBalls),
      fmt(b.maidens),
    ];
  });

  autoTable(doc, {
    startY,
    head: [["Bowler", "O", "R", "W", "Econ", "Wd", "Nb", "M"]],
    body: rows,
    theme: "grid",
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontSize: 9,
    },
    bodyStyles: { fontSize: 8, textColor: [31, 31, 31] },
    columnStyles: {
      0: { cellWidth: 38 },
      1: { cellWidth: 14, halign: "right" },
      2: { cellWidth: 12, halign: "right" },
      3: { cellWidth: 10, halign: "right" },
      4: { cellWidth: 18, halign: "right" },
      5: { cellWidth: 12, halign: "right" },
      6: { cellWidth: 12, halign: "right" },
      7: { cellWidth: 12, halign: "right" },
    },
    margin: { left: 14, right: 14 },
  });

  return doc.lastAutoTable.finalY + 6;
}

// ─── Extras row ───────────────────────────────────────────────────────────────
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
  if (ex.wides) parts.push(`W ${ex.wides}`);
  if (ex.noBalls) parts.push(`NB ${ex.noBalls}`);
  if (ex.byes) parts.push(`B ${ex.byes}`);
  if (ex.legByes) parts.push(`LB ${ex.legByes}`);
  doc.text(`Extras: ${ex.total ?? 0}  (${parts.join(", ")})`, 12, y + 5);
  return y + 9;
}

// ─── Page-break guard ─────────────────────────────────────────────────────────
function ensureSpace(doc, y, needed = 40) {
  const ph = doc.internal.pageSize.getHeight();
  if (y + needed > ph - 15) {
    doc.addPage();
    return 10;
  }
  return y;
}

// ─── Footer ───────────────────────────────────────────────────────────────────
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
// generateScorecardPDF  — THE MAIN EXPORT
//
// Accepts a unified match object from either:
//   • buildScoringPagePayload()  (live match)
//   • generateHistoryMatchPDF()  (history record from MongoDB)
// ─────────────────────────────────────────────────────────────────────────────
export function generateScorecardPDF(match) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const t1 = match.team1Name || match.team1 || "Team A";
  const t2 = match.team2Name || match.team2 || "Team B";

  // Detect data shape: blob (from MongoDB innings blobs) vs flat arrays
  const hasBlob = !!(match.innings1DataBlob || match.innings2DataBlob);

  const getStats = (blobKey, flatBatKey, flatBowlKey) => {
    if (hasBlob) {
      const blob = match[blobKey];
      return {
        batting: blob?.battingStats || [],
        bowling: blob?.bowlingStats || [],
        extras: blob?.extras || null,
      };
    }
    return {
      batting: match[flatBatKey] || [],
      bowling: match[flatBowlKey] || [],
      extras: null,
    };
  };

  const inn1 = getStats("innings1DataBlob", "team1Batting", "team1Bowling");
  const inn2 = getStats("innings2DataBlob", "team2Batting", "team2Bowling");

  let y = drawHeader(doc, match, t1, t2);
  y = drawInfoStrip(doc, match, t1, t2, y);
  y = drawScoreCards(doc, match, t1, t2, y);

  // Innings 1
  y = ensureSpace(doc, y, 20);
  y = drawSectionHeading(
    doc,
    `${t1} — BATTING  (${fmtOvers(match.team1Balls)} ov)`,
    y
  );
  y = drawBattingTable(doc, inn1.batting, y);
  y = drawExtras(doc, hasBlob ? match.innings1DataBlob : null, y);

  y = ensureSpace(doc, y, 20);
  y = drawSectionHeading(doc, `${t2} — BOWLING  (${t1} innings)`, y);
  y = drawBowlingTable(doc, inn1.bowling, y);

  // Innings 2
  y = ensureSpace(doc, y, 20);
  y = drawSectionHeading(
    doc,
    `${t2} — BATTING  (${fmtOvers(match.team2Balls)} ov)`,
    y
  );
  y = drawBattingTable(doc, inn2.batting, y);
  y = drawExtras(doc, hasBlob ? match.innings2DataBlob : null, y);

  y = ensureSpace(doc, y, 20);
  y = drawSectionHeading(doc, `${t1} — BOWLING  (${t2} innings)`, y);
  y = drawBowlingTable(doc, inn2.bowling, y);

  drawFooter(doc);

  const safeT1 = t1.replace(/\s+/g, "_");
  const safeT2 = t2.replace(/\s+/g, "_");
  doc.save(`Scorecard_${safeT1}_vs_${safeT2}.pdf`);
}

// ─────────────────────────────────────────────────────────────────────────────
// generateHistoryMatchPDF  — called from match history page
// ─────────────────────────────────────────────────────────────────────────────
export function generateHistoryMatchPDF(match) {
  const winnerName =
    match.winner === "TIE"
      ? "Match Tied"
      : match.winner === "NO RESULT"
      ? "No Result"
      : match.winner
      ? match.winner
      : "Result pending";

  const resultLine =
    match.resultText ||
    (match.winner ? `${match.winner} won` : "Result pending");

  generateScorecardPDF({
    team1Name: match.team1Name || "Team 1",
    team2Name: match.team2Name || "Team 2",
    team1Score: match.team1Score ?? 0,
    team1Wickets: match.team1Wickets ?? 0,
    team1Balls: match.team1Balls ?? 0,
    team2Score: match.team2Score ?? 0,
    team2Wickets: match.team2Wickets ?? 0,
    team2Balls: match.team2Balls ?? 0,
    winner: winnerName,
    resultText: resultLine,
    manOfTheMatch: match.manOfTheMatch || "",
    tossWinner: match.tossWinner || "",
    totalOvers: match.totalOvers || "?",
    team1Captain: match.team1Captain || "",
    team2Captain: match.team2Captain || "",
    team1Batting: match.team1Batting || [],
    team2Batting: match.team2Batting || [],
    team1Bowling: match.team1Bowling || [],
    team2Bowling: match.team2Bowling || [],
    innings1DataBlob: match.innings1DataBlob || null,
    innings2DataBlob: match.innings2DataBlob || null,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// buildScoringPagePayload  — called from ScoringPage to build live PDF payload
// ─────────────────────────────────────────────────────────────────────────────
export function buildScoringPagePayload({
  matchData,
  updatedMatchData,
  engine,
  firstBattingTeam,
  secondBattingTeam,
  inningsDataHook,
  inn1BowlersSnapshotRef,
  manOfTheMatch,
}) {
  const innings1 = inningsDataHook.innings1DataRef?.current || {};
  const innings2 = inningsDataHook.innings2DataRef?.current || {};

  const inn1Balls = (engine.innings1Score?.overs ?? 0) * 6 + (engine.innings1Score?.balls ?? 0);
  const inn2Balls = engine.overs * 6 + engine.balls;

  const winnerName =
    engine.winner === "TIE"       ? "Match Tied" :
    engine.winner === "NO RESULT" ? "No Result"  :
    engine.winner                 ? engine.winner :
                                    "";

  // ✅ FIX: use teamACaptain/teamBCaptain objects, not team1Captain strings
  const captainA = matchData.teamACaptain;
  const captainB = matchData.teamBCaptain;
  const team1CaptainName = firstBattingTeam === matchData.teamA
    ? (captainA?.name || "")
    : (captainB?.name || "");
  const team2CaptainName = firstBattingTeam === matchData.teamA
    ? (captainB?.name || "")
    : (captainA?.name || "");

  return {
    team1Name:    firstBattingTeam,
    team2Name:    secondBattingTeam,
    team1Score:   engine.innings1Score?.score   ?? 0,
    team1Wickets: engine.innings1Score?.wickets ?? 0,
    team1Balls:   inn1Balls,
    team2Score:   engine.score,
    team2Wickets: engine.wickets,
    team2Balls:   inn2Balls,
    winner:       winnerName,
    resultText:   engine.winner
      ? ["TIE", "NO RESULT"].includes(engine.winner)
        ? engine.winner
        : `${engine.winner} won`
      : "",
    manOfTheMatch: manOfTheMatch || "",
    tossWinner:    matchData.tossWinner || "",
    totalOvers:    updatedMatchData.overs || matchData.overs || "?",
    team1Captain:  team1CaptainName,   // ✅ fixed
    team2Captain:  team2CaptainName,   // ✅ fixed
    team1Batting:  innings1.battingStats || [],
    team2Batting:  innings2.battingStats || [],
    team1Bowling:  innings1.bowlingStats || inn1BowlersSnapshotRef?.current || [],
    team2Bowling:  innings2.bowlingStats || [],
  };
}