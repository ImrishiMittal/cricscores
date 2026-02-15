import { useState } from 'react';
import styles from './TabbedInningsSummary.module.css';

function TabbedInningsSummary({ 
  innings1Data, 
  innings2Data,
  // ✅ NEW: Live current innings data
  players,
  allPlayers,
  bowlers,
  score,
  wickets,
  overs,
  balls,
  currentInnings,
  onClose 
}) {
  // ✅ Default to current innings tab
  const [activeTab, setActiveTab] = useState(currentInnings === 2 ? 'innings2' : 'innings1');

  const formatOvers = (oversNum, ballsNum) => {
    if (oversNum === undefined || ballsNum === undefined) return '0.0';
    return `${oversNum}.${ballsNum}`;
  };

  // ✅ FIXED: Get data for active tab with proper priority
  const getData = (tab) => {
    // ✅ PRIORITY 1: If viewing COMPLETED innings 1 from innings 2, use innings1Data
    if (tab === 'innings1' && currentInnings === 2 && innings1Data) {
      console.log("📊 Loading completed Innings 1 data:", innings1Data);
      return {
        score: innings1Data.score || 0,
        wickets: innings1Data.wickets || 0,
        overs: innings1Data.overs || 0,
        balls: innings1Data.balls || 0,
        battedPlayers: innings1Data.battingStats || [],
        bowlers: innings1Data.bowlingStats || [],
      };
    }

    // ✅ PRIORITY 2: If viewing LIVE innings 1, show live data
    if (tab === 'innings1' && currentInnings === 1) {
      const battedPlayers = [...(allPlayers || []), ...players];
      return {
        score,
        wickets,
        overs,
        balls,
        battedPlayers: battedPlayers.filter(p => p.balls > 0 || p.dismissal),
        bowlers,
      };
    }
    
    // ✅ PRIORITY 3: If viewing LIVE innings 2, show live data
    if (tab === 'innings2' && currentInnings === 2) {
      const battedPlayers = [...(allPlayers || []), ...players];
      return {
        score,
        wickets,
        overs,
        balls,
        battedPlayers: battedPlayers.filter(p => p.balls > 0 || p.dismissal),
        bowlers,
      };
    }

    // ✅ FALLBACK: If completed innings 2 data exists
    if (tab === 'innings2' && innings2Data) {
      return {
        score: innings2Data.score || 0,
        wickets: innings2Data.wickets || 0,
        overs: innings2Data.overs || 0,
        balls: innings2Data.balls || 0,
        battedPlayers: innings2Data.battingStats || [],
        bowlers: innings2Data.bowlingStats || [],
      };
    }

    return null;
  };

  const data = getData(activeTab);

  if (!data) {
    return (
      <div className={styles.overlay} onClick={onClose}>
        <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
          <div className={styles.header}>
            <h2 className={styles.title}>📋 Innings Summary</h2>
            <button className={styles.closeIcon} onClick={onClose}>✕</button>
          </div>
          <p style={{ textAlign: 'center', color: '#888' }}>No data available for this innings</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>📋 Innings Summary</h2>
          <button className={styles.closeIcon} onClick={onClose}>✕</button>
        </div>

        {/* ✅ TABS - Show only if both innings have data */}
        {currentInnings === 2 && (
          <div className={styles.tabContainer}>
            <button
              className={`${styles.tab} ${activeTab === 'innings1' ? styles.activeTab : ''}`}
              onClick={() => setActiveTab('innings1')}
            >
              Innings 1 {innings1Data && `(${innings1Data.score}/${innings1Data.wickets})`}
            </button>
            <button
              className={`${styles.tab} ${activeTab === 'innings2' ? styles.activeTab : ''}`}
              onClick={() => setActiveTab('innings2')}
            >
              Innings 2 (Live)
            </button>
          </div>
        )}

        {/* Score Display */}
        <div className={styles.scoreBox}>
          <div className={styles.scoreMain}>
            <span className={styles.runs}>{data.score}</span>
            <span className={styles.wickets}>/{data.wickets}</span>
          </div>
          <div className={styles.oversText}>
            {formatOvers(data.overs, data.balls)} overs
          </div>
        </div>

        {/* Batting Summary */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>🏏 BATTING</h3>
          <div className={styles.table}>
            <div className={styles.tableHeader}>
              <div className={styles.playerCol}>BATSMAN</div>
              <div className={styles.statCol}>R</div>
              <div className={styles.statCol}>B</div>
              <div className={styles.statCol}>SR</div>
            </div>
            {data.battedPlayers.length === 0 && (
              <div className={styles.noData}>No batting data available</div>
            )}
            {data.battedPlayers.map((player, idx) => {
              const strikeRate = player.balls > 0 
                ? ((player.runs / player.balls) * 100).toFixed(1) 
                : '0.0';
              
              return (
                <div key={idx} className={styles.tableRow}>
                  <div className={styles.playerCol}>
                    <div className={styles.playerName}>{player.name}</div>
                    {player.dismissal && (
                      <div className={styles.dismissal}>{player.dismissal}</div>
                    )}
                    {!player.dismissal && player.balls > 0 && (
                      <div className={styles.notOut}>not out</div>
                    )}
                  </div>
                  <div className={styles.statCol}>{player.runs}</div>
                  <div className={styles.statCol}>{player.balls}</div>
                  <div className={styles.statCol}>{strikeRate}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bowling Summary */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>⚡ BOWLING</h3>
          <div className={styles.table}>
            <div className={styles.tableHeader}>
              <div className={styles.playerCol}>BOWLER</div>
              <div className={styles.statCol}>O</div>
              <div className={styles.statCol}>R</div>
              <div className={styles.statCol}>W</div>
              <div className={styles.statCol}>ECO</div>
            </div>
            {data.bowlers.length === 0 && (
              <div className={styles.noData}>No bowling data available</div>
            )}
            {data.bowlers.map((bowler, idx) => {
              const totalOvers = bowler.overs + (bowler.balls / 6);
              const economy = totalOvers > 0 
                ? (bowler.runs / totalOvers).toFixed(2) 
                : '0.00';
              
              return (
                <div key={idx} className={styles.tableRow}>
                  <div className={styles.playerCol}>{bowler.name}</div>
                  <div className={styles.statCol}>{bowler.overs}.{bowler.balls}</div>
                  <div className={styles.statCol}>{bowler.runs}</div>
                  <div className={styles.statCol}>{bowler.wickets}</div>
                  <div className={styles.statCol}>{economy}</div>
                </div>
              );
            })}
          </div>
        </div>

        <button className={styles.closeBtn} onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}

export default TabbedInningsSummary;
