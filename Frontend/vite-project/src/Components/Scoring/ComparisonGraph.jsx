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
  onClose 
}) {
  // Guard: Ensure required data exists
  if (!matchData) {
    return (
      <div className={styles.overlay} onClick={onClose}>
        <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
          <h2 className={styles.title}>📈 Comparison Graph</h2>
          <p className={styles.subtitle}>Loading match data...</p>
          <button className={styles.closeBtn} onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    );
  }

  const canvasRef = useRef(null);
  const [hoveredPoint, setHoveredPoint] = useState(null);

  // ✅ FIX: Proper cricket over formatting (0.1-0.6 = 1 over, 1.1-1.6 = 2 overs, etc.)
  const formatCricketOver = (totalOvers) => {
    const completeOvers = Math.floor(totalOvers);
    const balls = Math.round((totalOvers - completeOvers) * 10) % 6;
    return `${completeOvers}.${balls}`;
  };

  // Build progression data from actual score objects - REAL TIME
  const buildProgressionData = (scoreData) => {
    if (!scoreData) {
      return { points: [], wicketPoints: [] };
    }

    const points = [];
    const wicketPoints = [];

    // Get actual overs and balls
    const totalOvers = (scoreData.overs || 0) + ((scoreData.balls || 0) / 6);
    const finalScore = scoreData.score || 0;
    const finalWickets = scoreData.wickets || 0;

    // Create smooth progression points with fine granularity
    const step = 0.1; // Even finer steps for real-time smoothness
    
    for (let over = 0; over <= totalOvers; over += step) {
      const progress = totalOvers > 0 ? over / totalOvers : 0;
      const score = Math.round(finalScore * progress);
      const wickets = Math.round(finalWickets * progress);

      points.push({
        over: parseFloat(over.toFixed(2)),
        score: score,
        wickets: wickets,
      });
    }

    // Add final point to ensure we reach the end
    if (totalOvers > 0) {
      const lastPoint = points[points.length - 1];
      if (lastPoint.over < totalOvers) {
        points.push({
          over: parseFloat(totalOvers.toFixed(2)),
          score: finalScore,
          wickets: finalWickets,
        });
      }
    }

    // Add wicket markers - distributed proportionally
    if (finalWickets > 0) {
      for (let i = 0; i < finalWickets; i++) {
        const wicketOver = (totalOvers / (finalWickets + 1)) * (i + 1);
        const wicketScore = Math.round(finalScore * (wicketOver / totalOvers));
        wicketPoints.push({
          over: parseFloat(wicketOver.toFixed(2)),
          score: wicketScore,
          wicketNum: i + 1,
        });
      }
    }

    return { points, wicketPoints };
  };

  // Build progression for both innings - UPDATES IN REAL TIME
  const inn1Progression = buildProgressionData(innings1Score);
  const inn2Progression = buildProgressionData(innings2Score);

  // Redraw graph whenever data changes (real-time)
  useEffect(() => {
    drawGraph();
  }, [inn1Progression, inn2Progression, hoveredPoint, innings1Score, innings2Score]);

  const drawGraph = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;

    // Set physical size
    canvas.width = 1000 * dpr;
    canvas.height = 500 * dpr;

    // Scale for retina
    ctx.scale(dpr, dpr);

    // Clear canvas
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, 1000, 500);

    const padding = { left: 70, right: 200, top: 50, bottom: 80 };
    const graphWidth = 1000 - padding.left - padding.right;
    const graphHeight = 500 - padding.top - padding.bottom;

    // Calculate scales based on BOTH innings - handle empty innings
    let maxOvers = 1;
    let maxScore = 50;

    if (inn1Progression.points.length > 0) {
      maxOvers = Math.max(maxOvers, inn1Progression.points[inn1Progression.points.length - 1].over);
      maxScore = Math.max(maxScore, innings1Score?.score || 0);
    }

    if (inn2Progression.points.length > 0) {
      maxOvers = Math.max(maxOvers, inn2Progression.points[inn2Progression.points.length - 1].over);
      maxScore = Math.max(maxScore, innings2Score?.score || 0);
    }

    maxOvers = Math.ceil(maxOvers) + 1;
    maxScore = Math.ceil(maxScore / 10) * 10 + 10;

    // Draw grid
    drawGrid(ctx, padding, graphWidth, graphHeight, maxScore, maxOvers);

    // Draw axes
    drawAxes(ctx, padding, graphWidth, graphHeight);

    // Draw labels
    drawLabels(ctx, padding, graphWidth, graphHeight, maxScore, maxOvers);

    // Draw team lines
    if (inn1Progression.points.length > 0) {
      drawTeamLine(
        ctx,
        inn1Progression.points,
        '#ff1a8c',
        padding,
        graphWidth,
        graphHeight,
        maxScore,
        maxOvers
      );
    }

    if (inn2Progression.points.length > 0) {
      drawTeamLine(
        ctx,
        inn2Progression.points,
        '#00d9ff',
        padding,
        graphWidth,
        graphHeight,
        maxScore,
        maxOvers
      );
    }

    // Draw wicket markers
    if (inn1Progression.wicketPoints.length > 0) {
      drawWickets(
        ctx,
        inn1Progression.wicketPoints,
        padding,
        graphWidth,
        graphHeight,
        maxScore,
        maxOvers
      );
    }

    if (inn2Progression.wicketPoints.length > 0) {
      drawWickets(
        ctx,
        inn2Progression.wicketPoints,
        padding,
        graphWidth,
        graphHeight,
        maxScore,
        maxOvers
      );
    }

    // Draw legend
    drawLegend(ctx, padding, graphWidth, inn1Progression, inn2Progression);

    // Draw tooltip if hovering
    if (hoveredPoint) {
      drawTooltip(ctx, hoveredPoint, padding, graphWidth, graphHeight, maxScore, maxOvers);
    }
  };

  const drawGrid = (ctx, padding, width, height, maxScore, maxOvers) => {
    ctx.strokeStyle = '#2a2a2a';
    ctx.lineWidth = 1;

    // Horizontal grid lines (score)
    const scoreStep = Math.ceil(maxScore / 5 / 10) * 10;
    for (let score = 0; score <= maxScore; score += scoreStep) {
      const y = padding.top + height - (score / maxScore) * height;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(padding.left + width, y);
      ctx.stroke();
    }

    // Vertical grid lines (overs)
    const overStep = Math.max(1, Math.ceil(maxOvers / 5));
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

    // Y-axis
    ctx.beginPath();
    ctx.moveTo(padding.left, padding.top);
    ctx.lineTo(padding.left, padding.top + height);
    ctx.stroke();

    // X-axis
    ctx.beginPath();
    ctx.moveTo(padding.left, padding.top + height);
    ctx.lineTo(padding.left + width, padding.top + height);
    ctx.stroke();
  };

  const drawLabels = (ctx, padding, width, height, maxScore, maxOvers) => {
    ctx.fillStyle = '#aaa';
    ctx.font = 'bold 13px Arial';
    ctx.textAlign = 'right';

    // Y-axis labels
    const scoreStep = Math.ceil(maxScore / 5 / 10) * 10;
    for (let score = 0; score <= maxScore; score += scoreStep) {
      const y = padding.top + height - (score / maxScore) * height;
      ctx.fillText(score.toString(), padding.left - 15, y + 5);
    }

    // X-axis labels - ✅ FIX: Use proper cricket over format
    ctx.textAlign = 'center';
    const overStep = Math.max(1, Math.ceil(maxOvers / 5));
    for (let over = 0; over <= maxOvers; over += overStep) {
      const x = padding.left + (over / maxOvers) * width;
      // ✅ Format as cricket overs (0.0, 1.1, 2.2, etc.)
      const formattedOver = formatCricketOver(over);
      ctx.fillText(formattedOver, x, padding.top + height + 30);
    }

    // Axis titles
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
    if (!points || points.length === 0) return;

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

    // Draw endpoint circle
    const lastPoint = points[points.length - 1];
    const endX = padding.left + (lastPoint.over / maxOvers) * width;
    const endY = padding.top + height - (lastPoint.score / maxScore) * height;

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(endX, endY, 7, 0, Math.PI * 2);
    ctx.fill();

    // White border on endpoint
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();
  };

  const drawWickets = (ctx, wicketPoints, padding, width, height, maxScore, maxOvers) => {
    if (!wicketPoints || wicketPoints.length === 0) return;

    wicketPoints.forEach((wicket) => {
      const x = padding.left + (wicket.over / maxOvers) * width;
      const y = padding.top + height - (wicket.score / maxScore) * height;

      // White circle with red border
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#dc2626';
      ctx.lineWidth = 3;
      ctx.stroke();
    });
  };

  const drawLegend = (ctx, padding, width, inn1Prog, inn2Prog) => {
    const legendX = padding.left + width + 30;
    const legendY = 80;
    const lineHeight = 45;

    // Team 1
    ctx.fillStyle = '#ff1a8c';
    ctx.fillRect(legendX, legendY, 25, 25);

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(team1Name, legendX + 40, legendY + 18);

    ctx.fillStyle = '#22c55e';
    ctx.font = 'bold 14px Arial';
    ctx.fillText(
      `${innings1Score?.score || 0}/${innings1Score?.wickets || 0}`,
      legendX + 40,
      legendY + 40
    );

    // Team 2
    ctx.fillStyle = '#00d9ff';
    ctx.fillRect(legendX, legendY + lineHeight, 25, 25);

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 16px Arial';
    ctx.fillText(team2Name, legendX + 40, legendY + lineHeight + 18);

    ctx.fillStyle = '#22c55e';
    ctx.font = 'bold 14px Arial';
    ctx.fillText(
      `${innings2Score?.score || 0}/${innings2Score?.wickets || 0}`,
      legendX + 40,
      legendY + lineHeight + 40
    );

    // Wicket indicator
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(legendX + 12, legendY + lineHeight * 2 + 12, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = '#aaa';
    ctx.font = '13px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('Wicket', legendX + 40, legendY + lineHeight * 2 + 18);
  };

  const drawTooltip = (ctx, point, padding, width, height, maxScore, maxOvers) => {
    const x = point.canvasX;
    const y = point.canvasY;

    const boxWidth = 160;
    const boxHeight = 80;
    let boxX = x + 20;
    let boxY = y - boxHeight / 2;

    // Keep tooltip within canvas
    if (boxX + boxWidth > 1000) {
      boxX = x - boxWidth - 20;
    }
    if (boxY < 0) {
      boxY = 10;
    }
    if (boxY + boxHeight > 500) {
      boxY = 500 - boxHeight - 10;
    }

    // Tooltip background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.95)';
    ctx.fillRect(boxX, boxY, boxWidth, boxHeight);

    // Tooltip border
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 2;
    ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);

    // Tooltip text - ✅ FIX: Use proper cricket over format
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Over: ${formatCricketOver(point.over)}`, boxX + 12, boxY + 22);
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
    const graphWidth = 1000 - padding.left - padding.right;
    const graphHeight = 500 - padding.top - padding.bottom;

    // Check if click is within graph area
    if (
      x < padding.left ||
      x > padding.left + graphWidth ||
      y < padding.top ||
      y > padding.top + graphHeight
    ) {
      setHoveredPoint(null);
      return;
    }

    let maxOvers = 1;
    let maxScore = 50;

    if (inn1Progression.points.length > 0) {
      maxOvers = Math.max(maxOvers, inn1Progression.points[inn1Progression.points.length - 1].over);
      maxScore = Math.max(maxScore, innings1Score?.score || 0);
    }

    if (inn2Progression.points.length > 0) {
      maxOvers = Math.max(maxOvers, inn2Progression.points[inn2Progression.points.length - 1].over);
      maxScore = Math.max(maxScore, innings2Score?.score || 0);
    }

    maxOvers = Math.ceil(maxOvers) + 1;
    maxScore = Math.ceil(maxScore / 10) * 10 + 10;

    // Find closest point
    let closestPoint = null;
    let minDistance = Infinity;

    [
      { points: inn1Progression.points, team: team1Name },
      { points: inn2Progression.points, team: team2Name },
    ].forEach(({ points, team }) => {
      if (!points || points.length === 0) return;

      points.forEach((point) => {
        const pointX = padding.left + (point.over / maxOvers) * graphWidth;
        const pointY = padding.top + graphHeight - (point.score / maxScore) * graphHeight;

        const distance = Math.sqrt((x - pointX) ** 2 + (y - pointY) ** 2);

        if (distance < minDistance && distance < 40) {
          minDistance = distance;
          closestPoint = {
            ...point,
            team,
            canvasX: pointX,
            canvasY: pointY,
          };
        }
      });
    });

    setHoveredPoint(closestPoint);
  };

  const handleCanvasMouseMove = (e) => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.style.cursor = 'crosshair';
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.title}>📈 Comparison Graph</h2>
        <p className={styles.subtitle}>Live innings progression - Click to view scores</p>

        <div className={styles.canvasContainer}>
          <canvas
            ref={canvasRef}
            className={styles.canvas}
            width="1000"
            height="500"
            onClick={handleCanvasClick}
            onMouseMove={handleCanvasMouseMove}
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

        <button className={styles.closeBtn} onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}

export default ComparisonGraph;
