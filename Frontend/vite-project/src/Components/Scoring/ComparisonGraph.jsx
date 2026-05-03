import { useEffect, useRef, useCallback, useState } from "react";

export default function ComparisonGraph({
  innings1History = [],
  innings2History = [],
  innings1Score,
  innings2Score,
  team1Name = "Inn 1",
  team2Name = "Inn 2",
  matchData,
  onClose,
}) {
  const canvasRef = useRef(null);
  const wrapperRef = useRef(null);
  const in1Ref = useRef(innings1History);
  const in2Ref = useRef(innings2History);
  const hoverRef = useRef(null); // { x, y } in display pixels

  useEffect(() => { in1Ref.current = innings1History; }, [innings1History]);
  useEffect(() => { in2Ref.current = innings2History; }, [innings2History]);

  const buildSeries = (history) => {
    const points = [{ ball: 0, score: 0, wickets: 0 }];
    const wicketPoints = [];
    let score = 0;
    let wickets = 0;
    let ballCount = 0;

    (history || []).forEach((e) => {
      if (e.event === "WD" || e.event === "NB") {
        score += 1;
      } else {
        score += e.runs || 0;
      }

      const isExtra = e.event === "WD" || e.event === "NB";
      if (!isExtra) ballCount++;

      const isWicket =
        e.event === "WICKET" || e.event === "HW" ||
        e.event === "RUNOUT" || e.isWicket;

      if (isWicket) {
        wickets++;
        wicketPoints.push({ ball: ballCount, score, wickets });
      }

      if (["RUN","WD","NB","BYE","LB","WICKET","HW","RUNOUT"].includes(e.event)) {
        points.push({ ball: ballCount, score, wickets });
      }
    });

    return { points, wicketPoints, finalScore: score, finalWickets: wickets };
  };

  const drawRef = useRef(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const wrapper = wrapperRef.current;
    if (!canvas || !wrapper) return;

    const dpr = window.devicePixelRatio || 1;
    const displayW = wrapper.clientWidth || 320;
    const wrapperH = wrapper.clientHeight || 0;
const displayH = wrapperH > 100
  ? wrapperH - 16
  : Math.min(Math.max(Math.round(displayW * 0.58), 240), 460);

    canvas.width = displayW * dpr;
    canvas.height = displayH * dpr;
    canvas.style.width = `${displayW}px`;
    canvas.style.height = `${displayH}px`;

    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);
    const W = displayW;
    const H = displayH;

    ctx.fillStyle = "#0a0e1a";
    ctx.fillRect(0, 0, W, H);

    // Replace the PAD line with:
const isNarrow = W < 340;
const PAD = { top: isNarrow ? 52 : 36, right: 24, bottom: 50, left: 52 };
    const cW = W - PAD.left - PAD.right;
    const cH = H - PAD.top - PAD.bottom;

    const s1 = buildSeries(in1Ref.current);
    const s2 = buildSeries(in2Ref.current);

    if (s1.points.length <= 1 && s2.points.length <= 1) {
      ctx.fillStyle = "#6b7280";
      ctx.font = "13px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("No data yet", W / 2, H / 2);
      return;
    }

    const totalOvers = Number(matchData?.overs || 20);
    const maxBalls = totalOvers * 6;

    const t1Score = innings1Score?.score ?? s1.finalScore;
    const t1Wickets = innings1Score?.wickets ?? s1.finalWickets;
    const t2Score = innings2Score?.score ?? s2.finalScore;
    const t2Wickets = innings2Score?.wickets ?? s2.finalWickets;

    const maxRuns = Math.max(
      ...s1.points.map((p) => p.score),
      ...s2.points.map((p) => p.score),
      t1Score, t2Score, 20
    );

    const toX = (ball) => PAD.left + (ball / maxBalls) * cW;
    const toY = (runs) => PAD.top + cH - (runs / maxRuns) * cH;

    // Store for hover use
    drawRef.current = { PAD, cW, cH, toX, toY, maxBalls, maxRuns, s1, s2, t1Score, t1Wickets, t2Score, t2Wickets, totalOvers, W, H };

    // Grid
    ctx.strokeStyle = "#1e293b";
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 4]);
    const ySteps = 5;
    for (let i = 0; i <= ySteps; i++) {
      const runs = Math.round((i / ySteps) * maxRuns);
      const y = toY(runs);
      ctx.beginPath();
      ctx.moveTo(PAD.left, y);
      ctx.lineTo(PAD.left + cW, y);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "#64748b";
      ctx.font = "11px sans-serif";
      ctx.textAlign = "right";
      ctx.fillText(runs, PAD.left - 8, y + 4);
      ctx.setLineDash([3, 4]);
    }
    const labelEvery = Math.max(1, Math.ceil(totalOvers / 8));
    for (let ov = 0; ov <= totalOvers; ov += labelEvery) {
      const x = toX(ov * 6);
      ctx.beginPath();
      ctx.moveTo(x, PAD.top);
      ctx.lineTo(x, PAD.top + cH);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "#64748b";
      ctx.font = "11px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(ov, x, PAD.top + cH + 16);
      ctx.setLineDash([3, 4]);
    }
    ctx.setLineDash([]);

    // Axes
    ctx.strokeStyle = "#334155";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(PAD.left, PAD.top);
    ctx.lineTo(PAD.left, PAD.top + cH);
    ctx.lineTo(PAD.left + cW, PAD.top + cH);
    ctx.stroke();

    ctx.fillStyle = "#475569";
    ctx.font = "11px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Overs →", PAD.left + cW / 2, H - 6);

    const drawLine = (points, color, dashed = false) => {
      if (points.length < 2) return;
      ctx.beginPath();
      points.forEach((p, i) => {
        i === 0 ? ctx.moveTo(toX(p.ball), toY(p.score)) : ctx.lineTo(toX(p.ball), toY(p.score));
      });
      ctx.lineTo(toX(points[points.length - 1].ball), toY(0));
      ctx.lineTo(toX(0), toY(0));
      ctx.closePath();
      ctx.fillStyle = color + "20";
      ctx.fill();
      if (dashed) ctx.setLineDash([7, 4]);
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      points.forEach((p, i) => {
        i === 0 ? ctx.moveTo(toX(p.ball), toY(p.score)) : ctx.lineTo(toX(p.ball), toY(p.score));
      });
      ctx.stroke();
      ctx.setLineDash([]);
    };

    const drawWickets = (wicketPoints, color) => {
      wicketPoints.forEach((w) => {
        const x = toX(w.ball);
        const y = toY(w.score);
        ctx.fillStyle = "#dc2626";
        ctx.beginPath();
        ctx.arc(x, y, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#000";
        ctx.font = "bold 8px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("W", x, y + 3);
      });
    };

    drawLine(s2.points, "#ec4899", true);
    drawLine(s1.points, "#f97316");
    drawWickets(s2.wicketPoints, "#ec4899");
    drawWickets(s1.wicketPoints, "#f97316");

    // ── Hover crosshair + tooltip ──────────────────────────────────
    const hover = hoverRef.current;
    if (hover) {
      const { x: hx } = hover;
      // Clamp to chart area
      const cx = Math.max(PAD.left, Math.min(PAD.left + cW, hx));
      const hoverBall = ((cx - PAD.left) / cW) * maxBalls;
      const hoverOver = hoverBall / 6;

      // Find nearest point in each series
      const nearest = (points) => {
        let best = points[0];
        let bestDist = Infinity;
        points.forEach((p) => {
          const d = Math.abs(p.ball - hoverBall);
          if (d < bestDist) { bestDist = d; best = p; }
        });
        return best;
      };

      const p1 = nearest(s1.points);
      const p2 = nearest(s2.points);

      // Vertical dashed line
      ctx.strokeStyle = "rgba(255,255,255,0.35)";
      ctx.lineWidth = 1.2;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(cx, PAD.top);
      ctx.lineTo(cx, PAD.top + cH);
      ctx.stroke();
      ctx.setLineDash([]);

      // Dots on lines
      [{ p: p1, color: "#f97316" }, { p: p2, color: "#ec4899" }].forEach(({ p, color }) => {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(toX(p.ball), toY(p.score), 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 1.5;
        ctx.stroke();
      });

      // Tooltip box
      const overLabel = `${Math.floor(hoverOver)}.${Math.floor((hoverOver % 1) * 6)} ov`;
      const lines = [
        { color: "#f97316", text: `${team1Name.slice(0, 10)}: ${p1.score}/${p1.wickets}` },
        { color: "#ec4899", text: `${team2Name.slice(0, 10)}: ${p2.score}/${p2.wickets}` },
      ];

      const ttW = 160;
      const ttH = 58;
      const ttPad = 8;
      let ttX = cx + 10;
      let ttY = PAD.top + 10;
      if (ttX + ttW > W - 8) ttX = cx - ttW - 10;

      ctx.fillStyle = "rgba(10,14,26,0.92)";
      ctx.strokeStyle = "rgba(255,255,255,0.15)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(ttX, ttY, ttW, ttH, 6);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#94a3b8";
      ctx.font = "bold 10px sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(overLabel, ttX + ttPad, ttY + ttPad + 9);

      lines.forEach(({ color, text }, i) => {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(ttX + ttPad + 5, ttY + ttPad + 22 + i * 16, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#e2e8f0";
        ctx.font = "11px sans-serif";
        ctx.fillText(text, ttX + ttPad + 14, ttY + ttPad + 26 + i * 16);
      });
    }

    // Legend
    // Legend
const legendItems = [
  { color: "#f97316", label: `${team1Name.length > 10 ? team1Name.slice(0, 9) + "…" : team1Name}: ${t1Score}/${t1Wickets}`, dashed: false },
  { color: "#ec4899", label: `${team2Name.length > 10 ? team2Name.slice(0, 9) + "…" : team2Name}: ${t2Score}/${t2Wickets}`, dashed: true },
];

legendItems.forEach(({ color, label, dashed }, i) => {
  const lx = isNarrow ? PAD.left : PAD.left + i * Math.min(140, cW / 2);
  const ly = isNarrow ? 14 + i * 16 : 18;
  if (dashed) ctx.setLineDash([5, 3]);
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(lx, ly);
  ctx.lineTo(lx + 16, ly);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = "#e2e8f0";
  ctx.font = "10px sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(label, lx + 20, ly + 4);
});

// Wicket legend — push down if narrow to avoid overlap
const wx = isNarrow ? PAD.left + cW - 60 : PAD.left + Math.min(290, cW - 60);
const wy = isNarrow ? 14 : 18;
ctx.fillStyle = "#dc2626";
ctx.beginPath();
ctx.arc(wx, wy, 6, 0, Math.PI * 2);
ctx.fill();
ctx.fillStyle = "#fff";
ctx.beginPath();
ctx.arc(wx, wy, 4, 0, Math.PI * 2);
ctx.fill();
ctx.fillStyle = "#000";
ctx.font = "bold 7px sans-serif";
ctx.textAlign = "center";
ctx.fillText("W", wx, wy + 3);
ctx.fillStyle = "#94a3b8";
ctx.font = "10px sans-serif";
ctx.textAlign = "left";
ctx.fillText("= Wicket", wx + 10, wy + 4);

  }, [team1Name, team2Name, matchData, innings1Score, innings2Score]);

  // Mouse / touch handlers
  const getCanvasX = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    return clientX - rect.left;
  };

  const handleMove = useCallback((e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    e.preventDefault();
    hoverRef.current = { x: getCanvasX(e, canvas) };
    draw();
  }, [draw]);

  const handleLeave = useCallback(() => {
    hoverRef.current = null;
    draw();
  }, [draw]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.addEventListener("mousemove", handleMove);
    canvas.addEventListener("mouseleave", handleLeave);
    canvas.addEventListener("touchmove", handleMove, { passive: false });
    canvas.addEventListener("touchend", handleLeave);
    return () => {
      canvas.removeEventListener("mousemove", handleMove);
      canvas.removeEventListener("mouseleave", handleLeave);
      canvas.removeEventListener("touchmove", handleMove);
      canvas.removeEventListener("touchend", handleLeave);
    };
  }, [handleMove, handleLeave]);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    const ro = new ResizeObserver(() => draw());
    ro.observe(wrapper);
    draw();
    return () => ro.disconnect();
  }, [draw]);

  useEffect(() => {
    in1Ref.current = innings1History;
    in2Ref.current = innings2History;
    draw();
  }, [innings1History, innings2History, draw]);

  return (
    <div ref={wrapperRef} style={{ width: "100%", height: "100%", padding: "0 4px", boxSizing: "border-box" }}>
      <canvas
        ref={canvasRef}
        style={{ display: "block", width: "100%", borderRadius: "8px", cursor: "crosshair" }}
      />
    </div>
  );
}