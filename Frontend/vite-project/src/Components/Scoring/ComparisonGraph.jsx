import { useState, useRef, useEffect } from 'react';
import styles from './ComparisonGraph.module.css';

function ComparisonGraph({ 
  team1Name, 
  team2Name, 
  innings1Data, 
  innings2Data,
  innings1Score,
  innings2Score,
  matchData,
  innings1History,
  innings2History,
  currentInnings,
  currentHistory,
  currentScore,
  currentWickets,
  onClose 
}) {
  const canvasRef = useRef(null);
  const [hoveredPoint, setHoveredPoint] = useState(null);

  console.log("🎯 ComparisonGraph received:");
  console.log("  Current Innings:", currentInnings);
  console.log("  Innings 1 History:", innings1History?.length || 0, "balls");
  console.log("  Innings 2 History:", innings2History?.length || 0, "balls");
  console.log("  Current History:", currentHistory?.length || 0, "balls");
  console.log("  Innings 1 Score:", innings1Score);
  console.log("  Innings 2 Score:", innings2Score);

  // ✅ Build progression from ball history
  const buildProgressionData = (history) => {
    const points = [];
    const wicketPoints = [];

    // ✅ ALWAYS start at 0,0
    points.push({ over: 0, score: 0, wickets: 0 });

    if (!history || history.length === 0) {
      return { points, wicketPoints };
    }

    let cumulativeScore = 0;
    let cumulativeWickets = 0;

    history.forEach((ball, index) => {
      // Add runs from this ball
      if (ball.runs !== undefined && ball.runs !== null) {
        cumulativeScore += ball.runs;
      }
      // Also check for 'event' field with runs
      else if (ball.event === "RUN" && ball.runs) {
        cumulativeScore += ball.runs;
      }

      // Track wickets
      if (ball.event === "WICKET") {
        cumulativeWickets++;
        
        // Calculate over number
        const overNum = (ball.over || 0) + ((ball.ball || 0) / 6);
        
        wicketPoints.push({
          over: overNum,
          score: cumulativeScore,
          wicketNum: cumulativeWickets
        });
      }

      // Add point for this ball
      const overNum = (ball.over || 0) + ((ball.ball || 0) / 6);
      points.push({
        over: overNum,
        score: cumulativeScore,
        wickets: cumulativeWickets
      });
    });

    console.log(`  ✅ Built ${points.length} points, final score: ${cumulativeScore}/${cumulativeWickets}`);

    return { points, wicketPoints };
  };

  // ✅ Determine which history to use for each innings
  let inn1HistoryToUse = [];
  let inn2HistoryToUse = [];

  if (currentInnings === 1) {
    // Currently in innings 1 - use live history
    inn1HistoryToUse = currentHistory || [];
    inn2HistoryToUse = []; // No innings 2 yet
  } else if (currentInnings === 2) {
    // Currently in innings 2
    inn1HistoryToUse = innings1History || innings1Data?.history || [];
    inn2HistoryToUse = currentHistory || [];
  } else {
    // Match over - use saved histories
    inn1HistoryToUse = innings1History || innings1Data?.history || [];
    inn2HistoryToUse = innings2History || innings2Data?.history || [];
  }

  const inn1Progression = buildProgressionData(inn1HistoryToUse);
  const inn2Progression = buildProgressionData(inn2HistoryToUse);

  useEffect(() => {
    drawGraph();
  }, [inn1Progression, inn2Progression, hoveredPoint]);

  const drawGraph = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;

    canvas.width = 1000 * dpr;
    canvas.height = 500 * dpr;
    ctx.scale(dpr, dpr);

    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, 1000, 500);

    const padding = { left: 70, right: 200, top: 50, bottom: 80 };
    const graphWidth = 1000 - padding.left - padding.right;
    const graphHeight = 500 - padding.top - padding.bottom;

    let maxOvers = Number(matchData?.overs) || 20;
    let maxScore = 50;

    // Calculate max score from actual data
    if (inn1Progression.points.length > 0) {
      const inn1Max = inn1Progression.points[inn1Progression.points.length - 1]?.score || 0;
      maxScore = Math.max(maxScore, inn1Max);
    }
    if (inn2Progression.points.length > 0) {
      const inn2Max = inn2Progression.points[inn2Progression.points.length - 1]?.score || 0;
      maxScore = Math.max(maxScore, inn2Max);
    }

    maxScore = Math.ceil(maxScore / 10) * 10 + 10;

    drawGrid(ctx, padding, graphWidth, graphHeight, maxScore, maxOvers);
    drawAxes(ctx, padding, graphWidth, graphHeight);
    drawLabels(ctx, padding, graphWidth, graphHeight, maxScore, maxOvers);

    // ✅ Draw both innings lines
    if (inn1Progression.points.length > 1) {
      console.log("📈 Drawing innings 1 (pink):", inn1Progression.points.length, "points");
      drawTeamLine(ctx, inn1Progression.points, '#ff1a8c', padding, graphWidth, graphHeight, maxScore, maxOvers);
    }

    if (inn2Progression.points.length > 1) {
      console.log("📈 Drawing innings 2 (cyan):", inn2Progression.points.length, "points");
      drawTeamLine(ctx, inn2Progression.points, '#00d9ff', padding, graphWidth, graphHeight, maxScore, maxOvers);
    }

    // Draw wicket markers
    if (inn1Progression.wicketPoints.length > 0) {
      drawWickets(ctx, inn1Progression.wicketPoints, padding, graphWidth, graphHeight, maxScore, maxOvers);
    }
    if (inn2Progression.wicketPoints.length > 0) {
      drawWickets(ctx, inn2Progression.wicketPoints, padding, graphWidth, graphHeight, maxScore, maxOvers);
    }

    drawLegend(ctx, padding, graphWidth, team1Name, team2Name, inn1Progression, inn2Progression);

    if (hoveredPoint) {
      drawTooltip(ctx, hoveredPoint, padding, graphWidth, graphHeight, maxScore, maxOvers);
    }
  };

  const drawGrid = (ctx, padding, width, height, maxScore, maxOvers) => {
    ctx.strokeStyle = '#2a2a2a';
    ctx.lineWidth = 1;

    const scoreStep = Math.max(10, Math.ceil(maxScore / 5 / 10) * 10);
    for (let score = 0; score <= maxScore; score += scoreStep) {
      const y = padding.top + height - (score / maxScore) * height;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(padding.left + width, y);
      ctx.stroke();
    }

    const overStep = maxOvers > 10 ? Math.ceil(maxOvers / 10) : 1;
    for (let over = 0; over <= maxOvers; over += overStep) {
      const x = padding.left + (over / maxOvers) * width;
      ctx.beginPath();
      ctx.moveTo(x, padding.top);
      ctx.lineTo(x, padding.top + height);
      ctx.stroke();
    }
  };

  const drawAxes = (ctx, padding, width, height) => {
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 3;

    ctx.beginPath();
    ctx.moveTo(padding.left, padding.top);
    ctx.lineTo(padding.left, padding.top + height);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(padding.left, padding.top + height);
    ctx.lineTo(padding.left + width, padding.top + height);
    ctx.stroke();
  };

  const drawLabels = (ctx, padding, width, height, maxScore, maxOvers) => {
    ctx.fillStyle = '#aaa';
    ctx.font = 'bold 13px Arial';
    ctx.textAlign = 'right';

    const scoreStep = Math.max(10, Math.ceil(maxScore / 5 / 10) * 10);
    for (let score = 0; score <= maxScore; score += scoreStep) {
      const y = padding.top + height - (score / maxScore) * height;
      ctx.fillText(score.toString(), padding.left - 15, y + 5);
    }

    ctx.textAlign = 'center';
    const overStep = maxOvers > 10 ? Math.ceil(maxOvers / 10) : 1;
    for (let over = 0; over <= maxOvers; over += overStep) {
      const x = padding.left + (over / maxOvers) * width;
      ctx.fillText(over.toString(), x, padding.top + height + 30);
    }

    ctx.fillStyle = '#22c55e';
    ctx.font = 'bold 16px Arial';

    ctx.save();
    ctx.translate(25, 250);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.fillText('RUNS', 0, 0);
    ctx.restore();

    ctx.textAlign = 'center';
    ctx.fillText('OVERS', 500, 490);
  };

  const drawTeamLine = (ctx, points, color, padding, width, height, maxScore, maxOvers) => {
    if (!points || points.length < 2) return;

    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.beginPath();

    points.forEach((point, idx) => {
      const x = padding.left + (point.over / maxOvers) * width;
      const y = padding.top + height - (point.score / maxScore) * height;

      if (idx === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();

    // Draw end point marker
    const lastPoint = points[points.length - 1];
    const endX = padding.left + (lastPoint.over / maxOvers) * width;
    const endY = padding.top + height - (lastPoint.score / maxScore) * height;

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(endX, endY, 7, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();
  };

  const drawWickets = (ctx, wicketPoints, padding, width, height, maxScore, maxOvers) => {
    if (!wicketPoints || wicketPoints.length === 0) return;

    wicketPoints.forEach((wicket) => {
      const x = padding.left + (wicket.over / maxOvers) * width;
      const y = padding.top + height - (wicket.score / maxScore) * height;

      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#dc2626';
      ctx.lineWidth = 3;
      ctx.stroke();
    });
  };

  const drawLegend = (ctx, padding, width, team1Name, team2Name, inn1Progression, inn2Progression) => {
    const legendX = padding.left + width + 30;
    const legendY = 80;

    // Innings 1 - Pink
    ctx.fillStyle = '#ff1a8c';
    ctx.fillRect(legendX, legendY, 25, 25);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(team1Name || "Team 1", legendX + 40, legendY + 18);
    
    const inn1FinalScore = inn1Progression.points.length > 1
      ? inn1Progression.points[inn1Progression.points.length - 1]
      : { score: 0, wickets: 0 };
    
    ctx.fillStyle = '#22c55e';
    ctx.font = 'bold 14px Arial';
    ctx.fillText(`${inn1FinalScore.score}/${inn1FinalScore.wickets}`, legendX + 40, legendY + 40);

    // Innings 2 - Cyan
    ctx.fillStyle = '#00d9ff';
    ctx.fillRect(legendX, legendY + 70, 25, 25);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 16px Arial';
    ctx.fillText(team2Name || "Team 2", legendX + 40, legendY + 88);
    
    const inn2FinalScore = inn2Progression.points.length > 1
      ? inn2Progression.points[inn2Progression.points.length - 1]
      : { score: 0, wickets: 0 };
    
    ctx.fillStyle = '#22c55e';
    ctx.font = 'bold 14px Arial';
    ctx.fillText(`${inn2FinalScore.score}/${inn2FinalScore.wickets}`, legendX + 40, legendY + 110);

    // Wicket marker
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(legendX + 12, legendY + 164, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = '#aaa';
    ctx.font = '13px Arial';
    ctx.fillText('Wicket', legendX + 40, legendY + 170);
  };

  const drawTooltip = (ctx, point, padding, width, height, maxScore, maxOvers) => {
    const x = point.canvasX;
    const y = point.canvasY;

    const boxWidth = 160;
    const boxHeight = 80;
    let boxX = x + 20;
    let boxY = y - boxHeight / 2;

    if (boxX + boxWidth > 1000) boxX = x - boxWidth - 20;
    if (boxY < 0) boxY = 10;
    if (boxY + boxHeight > 500) boxY = 420;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.95)';
    ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 2;
    ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Over: ${point.over.toFixed(1)}`, boxX + 12, boxY + 22);
    ctx.fillText(`Score: ${point.score}/${point.wickets}`, boxX + 12, boxY + 45);
    ctx.fillStyle = '#22c55e';
    ctx.font = 'bold 12px Arial';
    ctx.fillText(point.team, boxX + 12, boxY + 68);
  };

  const handleCanvasClick = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / (rect.width / 1000);
    const y = (e.clientY - rect.top) / (rect.height / 500);

    const padding = { left: 70, right: 200, top: 50, bottom: 80 };
    const graphWidth = 730;
    const graphHeight = 370;

    if (x < padding.left || x > padding.left + graphWidth || y < padding.top || y > padding.top + graphHeight) {
      setHoveredPoint(null);
      return;
    }

    const maxOvers = Number(matchData?.overs) || 20;
    let maxScore = 50;
    
    if (inn1Progression.points.length > 0) {
      maxScore = Math.max(maxScore, inn1Progression.points[inn1Progression.points.length - 1].score);
    }
    if (inn2Progression.points.length > 0) {
      maxScore = Math.max(maxScore, inn2Progression.points[inn2Progression.points.length - 1].score);
    }
    
    maxScore = Math.ceil(maxScore / 10) * 10 + 10;

    let closestPoint = null;
    let minDistance = Infinity;

    [
      { points: inn1Progression.points, team: team1Name || "Team 1" },
      { points: inn2Progression.points, team: team2Name || "Team 2" },
    ].forEach(({ points, team }) => {
      if (!points || points.length === 0) return;

      points.forEach((point) => {
        const pointX = padding.left + (point.over / maxOvers) * graphWidth;
        const pointY = padding.top + graphHeight - (point.score / maxScore) * graphHeight;
        const distance = Math.sqrt((x - pointX) ** 2 + (y - pointY) ** 2);

        if (distance < minDistance && distance < 40) {
          minDistance = distance;
          closestPoint = { ...point, team, canvasX: pointX, canvasY: pointY };
        }
      });
    });

    setHoveredPoint(closestPoint);
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.title}>📈 Comparison Graph</h2>
        <p className={styles.subtitle}>Ball-by-ball progression - Click to view scores</p>

        <div className={styles.canvasContainer}>
          <canvas
            ref={canvasRef}
            className={styles.canvas}
            width="1000"
            height="500"
            onClick={handleCanvasClick}
            style={{
              cursor: 'crosshair',
              border: '1px solid #22c55e',
              borderRadius: '8px',
              display: 'block',
              maxWidth: '100%',
              height: 'auto',
            }}
          />
        </div>

        <button className={styles.closeBtn} onClick={onClose}>Close</button>
      </div>
    </div>
  );
}

export default ComparisonGraph;


