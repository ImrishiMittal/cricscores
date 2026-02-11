import { useRef, useEffect } from 'react';
import styles from './ComparisonGraph.module.css';

function ComparisonGraph({
  team1Name,
  team2Name,
  innings1Data,
  innings2Data,
  innings1Score,
  innings2Score,
  innings1History,
  innings2History,
  matchData,
  currentInnings,
  onClose,
}) {
  const canvasRef = useRef(null);

  useEffect(() => {
    console.log("🎨 Drawing graph with:", {
      currentInnings,
      innings1HistoryLength: innings1History?.length || 0,
      innings2HistoryLength: innings2History?.length || 0,
      innings1DataExists: !!innings1Data,
      innings1DataHistoryLength: innings1Data?.history?.length || 0,
      innings2DataExists: !!innings2Data,
      innings1Score,
      innings2Score
    });

    // Log first few balls to verify data
    if (innings1History?.length > 0) {
      console.log("📊 Innings 1 first 3 balls:", innings1History.slice(0, 3));
    }
    if (innings2History?.length > 0) {
      console.log("📊 Innings 2 first 3 balls:", innings2History.slice(0, 3));
    }

    drawGraph();
  }, [
    innings1History,
    innings2History,
    currentInnings,
    innings1Data,
    innings2Data,
    innings1Score,
    innings2Score,
    team1Name,
    team2Name,
    matchData
  ]);

  const buildProgressionData = (history) => {
    const points = [];
    const wicketPoints = [];
    let cumulativeScore = 0;
    let cumulativeWickets = 0;
    let ballCount = 0;

    // Starting point
    points.push({ ball: 0, score: 0, wickets: 0 });

    if (!history || history.length === 0) {
      return { points, wicketPoints };
    }

    history.forEach((ball) => {
      ballCount++;

      // Add runs (including extras, penalties, etc.)
      if (ball.runs) {
        cumulativeScore += ball.runs;
      }

      // Track wickets
      if (ball.event === "WICKET") {
        cumulativeWickets++;
        wicketPoints.push({
          ball: ballCount,
          score: cumulativeScore,
          wicketNum: cumulativeWickets
        });
      }

      // Add point after every ball
      points.push({
        ball: ballCount,
        score: cumulativeScore,
        wickets: cumulativeWickets
      });
    });

    return { points, wicketPoints };
  };

  const drawGraph = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;

    const displayWidth = 1000;
    const displayHeight = 500;

    canvas.width = displayWidth * dpr;
    canvas.height = displayHeight * dpr;
    ctx.scale(dpr, dpr);

    canvas.style.width = `${displayWidth}px`;
    canvas.style.height = `${displayHeight}px`;

    // Clear canvas
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, displayWidth, displayHeight);

    const padding = { top: 50, right: 60, bottom: 60, left: 70 };
    const graphWidth = displayWidth - padding.left - padding.right;
    const graphHeight = displayHeight - padding.top - padding.bottom;

    // ────────────────────────────────────────────────
    // Use the passed history directly (should come from parent)
    // team1History = innings 1 data (always available after innings 1 ends)
    // team2History = innings 2 data (only during/after innings 2)
    const team1History = innings1History || [];
    const team2History = innings2History || [];

    console.log("📊 Graph histories:", {
      team1Length: team1History.length,
      team2Length: team2History.length,
      currentInnings,
    });

    // Final scores – prefer provided score objects, fallback to calculation
    const team1FinalScore =
      innings1Score?.score ??
      team1History.reduce((sum, b) => sum + (b.runs || 0), 0);

    const team1FinalWickets =
      innings1Score?.wickets ??
      team1History.filter(b => b.event === "WICKET").length;

    const team2FinalScore =
      innings2Score?.score ??
      team2History.reduce((sum, b) => sum + (b.runs || 0), 0);

    const team2FinalWickets =
      innings2Score?.wickets ??
      team2History.filter(b => b.event === "WICKET").length;

    const { points: team1Points, wicketPoints: team1Wickets } =
      buildProgressionData(team1History);

    const { points: team2Points, wicketPoints: team2Wickets } =
      buildProgressionData(team2History);

    // Calculate scales
    const maxOvers = Number(matchData?.overs || 20);
    const maxBalls = maxOvers * 6;
    const maxScore = Math.max(
      team1FinalScore,
      team2FinalScore,
      ...team1Points.map(p => p.score),
      ...team2Points.map(p => p.score),
      50 // minimum reasonable scale
    );

    const scaleX = graphWidth / maxBalls;
    const scaleY = graphHeight / maxScore;

    // ────────────────────────────────────────────────
    // Draw grid
    ctx.strokeStyle = 'rgba(34, 197, 94, 0.1)';
    ctx.lineWidth = 1;

    // Vertical grid (overs)
    for (let over = 0; over <= maxOvers; over++) {
      const ball = over * 6;
      const x = padding.left + (ball * scaleX);
      ctx.beginPath();
      ctx.moveTo(x, padding.top);
      ctx.lineTo(x, displayHeight - padding.bottom);
      ctx.stroke();
    }

    // Horizontal grid (runs)
    const runStep = Math.ceil(maxScore / 10 / 10) * 10;
    for (let runs = 0; runs <= maxScore; runs += runStep) {
      const y = displayHeight - padding.bottom - (runs * scaleY);
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(displayWidth - padding.right, y);
      ctx.stroke();
    }

    // Axes
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(padding.left, padding.top);
    ctx.lineTo(padding.left, displayHeight - padding.bottom);
    ctx.lineTo(displayWidth - padding.right, displayHeight - padding.bottom);
    ctx.stroke();

    // X-axis labels (overs)
    ctx.fillStyle = '#22c55e';
    ctx.font = 'bold 13px Inter, system-ui';
    ctx.textAlign = 'center';

    for (let over = 0; over <= maxOvers; over += 2) {
      const ball = over * 6;
      const x = padding.left + (ball * scaleX);
      ctx.fillText(over.toString(), x, displayHeight - padding.bottom + 25);
    }

    // Y-axis labels (runs)
    ctx.textAlign = 'right';
    for (let runs = 0; runs <= maxScore; runs += runStep) {
      const y = displayHeight - padding.bottom - (runs * scaleY);
      ctx.fillText(runs.toString(), padding.left - 15, y + 5);
    }

    // Axis titles
    ctx.textAlign = 'center';
    ctx.font = 'bold 15px Inter, system-ui';
    ctx.fillStyle = '#22c55e';
    ctx.fillText('OVERS', displayWidth / 2, displayHeight - 15);

    ctx.save();
    ctx.translate(20, displayHeight / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('RUNS', 0, 0);
    ctx.restore();

    // ────────────────────────────────────────────────
    // Draw scoring lines
    const drawLine = (points, color, lineWidth = 4) => {
      if (points.length < 2) return;

      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';

      ctx.beginPath();
      points.forEach((point, idx) => {
        const x = padding.left + (point.ball * scaleX);
        const y = displayHeight - padding.bottom - (point.score * scaleY);

        if (idx === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      ctx.stroke();
    };

    // Always draw team 1 if it has data
    if (team1Points.length > 1) {
      drawLine(team1Points, '#ff6b35'); // orange
    }

    // Draw team 2 only if it has data
    if (team2Points.length > 1) {
      drawLine(team2Points, '#ff1a8c'); // magenta/pink
    }

    // ────────────────────────────────────────────────
    // Draw wicket markers
    const drawWickets = (wicketPoints, color = '#dc2626') => {
      wicketPoints.forEach(w => {
        const x = padding.left + (w.ball * scaleX);
        const y = displayHeight - padding.bottom - (w.score * scaleY);

        // Outer red circle
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, 9, 0, Math.PI * 2);
        ctx.fill();

        // Inner white circle
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, Math.PI * 2);
        ctx.fill();

        // 'W' text
        ctx.fillStyle = '#000';
        ctx.font = 'bold 10px Inter, system-ui';
        ctx.textAlign = 'center';
        ctx.fillText('W', x, y + 3.5);
      });
    };

    drawWickets(team1Wickets);
    drawWickets(team2Wickets);

    // ────────────────────────────────────────────────
    // Legend
    const legendY = 25;
    ctx.font = 'bold 14px Inter, system-ui';
    ctx.textAlign = 'left';

    // Team 1 (always show if has data)
    if (team1Points.length > 1) {
      ctx.fillStyle = '#ff6b35';
      ctx.fillRect(padding.left, legendY - 8, 25, 16);
      ctx.fillStyle = '#fff';
      ctx.fillText(
        `${team1Name}: ${team1FinalScore}/${team1FinalWickets}`,
        padding.left + 35,
        legendY + 5
      );
    }

    // Team 2 (show when it has data)
    if (team2Points.length > 1) {
      const team2X = padding.left + 320;
      ctx.fillStyle = '#ff1a8c';
      ctx.fillRect(team2X, legendY - 8, 25, 16);
      ctx.fillStyle = '#fff';
      ctx.fillText(
        `${team2Name}: ${team2FinalScore}/${team2FinalWickets}`,
        team2X + 35,
        legendY + 5
      );
    }

    // Wicket legend
    const wicketX = padding.left + 620;
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.arc(wicketX, legendY, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.fillText('= Wicket', wicketX + 15, legendY + 5);
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.title}>📈 MATCH PROGRESSION</h2>
        <p className={styles.subtitle}>
          {team1Name} vs {team2Name}
        </p>

        <div className={styles.canvasContainer}>
          <canvas ref={canvasRef} className={styles.canvas} />
        </div>

        <button className={styles.closeBtn} onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}

export default ComparisonGraph;