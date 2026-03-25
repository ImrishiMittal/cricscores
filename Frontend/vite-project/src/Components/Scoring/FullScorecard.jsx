import { useState } from 'react';
import styles from './FullScorecard.module.css';

/**
 * FullScorecard - Complete scorecard viewer
 * Tabs: Main Match | Super Over 1 | Super Over 2 | ...
 */
function FullScorecard({
  matchData,
  mainMatchData,    // { innings1Data, innings2Data, realInnings1Score, realInnings2Score }
  superOverData,    // [{ number, innings1Data, innings2Data }, ...]
  firstBattingTeam,
  secondBattingTeam,
  onClose,
}) {
  const [activePhase, setActivePhase] = useState('main');

  const formatOvers = (o, b) => {
    if (o === undefined || b === undefined) return '0.0';
    return `${o}.${b}`;
  };

  const formatExtras = (extras) => {
    if (!extras || extras.total === 0) return null;
    const parts = [];
    if (extras.wides > 0) parts.push(`W ${extras.wides}`);
    if (extras.noBalls > 0) parts.push(`NB ${extras.noBalls}`);
    if (extras.byes > 0) parts.push(`B ${extras.byes}`);
    if (extras.legByes > 0) parts.push(`LB ${extras.legByes}`);
    return `Extras: ${extras.total} (${parts.join(', ')})`;
  };

  const renderInningsCard = (inningsData, inningsNumber, phaseLabel, teamName) => {
    if (!inningsData) {
      return (
        <div className={styles.inningsCard}>
          <div className={styles.inningsHeader}>
            <h3>{phaseLabel} — Innings {inningsNumber} {teamName ? `(${teamName})` : ''}</h3>
          </div>
          <p className={styles.noData}>No data available</p>
        </div>
      );
    }

    const battedPlayers = inningsData.battingStats || [];
    const bowlers = inningsData.bowlingStats || [];

    return (
      <div className={styles.inningsCard}>
        <div className={styles.inningsHeader}>
          <h3>
            {phaseLabel} — Innings {inningsNumber}
            {teamName ? <span className={styles.teamLabel}> ({teamName})</span> : ''}
          </h3>
          <div className={styles.scoreDisplay}>
            <span className={styles.score}>{inningsData.score ?? '—'}</span>
            <span className={styles.wickets}>/{inningsData.wickets ?? '—'}</span>
            <span className={styles.overs}>
              ({formatOvers(inningsData.overs, inningsData.balls)})
            </span>
          </div>
          {inningsData.extras && inningsData.extras.total > 0 && (
            <div className={styles.extras}>{formatExtras(inningsData.extras)}</div>
          )}
        </div>

        {/* Batting */}
        <div className={styles.section}>
          <h4 className={styles.sectionTitle}>🏏 BATTING</h4>
          <div className={styles.table}>
            <div className={`${styles.tableRow} ${styles.tableHeader}`}>
              <div className={styles.playerCol}>BATSMAN</div>
              <div className={styles.statCol}>R</div>
              <div className={styles.statCol}>B</div>
              <div className={styles.statCol}>SR</div>
            </div>
            {battedPlayers.length === 0 && (
              <div className={styles.noData}>No batting data</div>
            )}
            {battedPlayers.map((player, idx) => {
              const sr = player.balls > 0
                ? ((player.runs / player.balls) * 100).toFixed(1)
                : '0.0';
              const name = player.displayName || player.name || '—';
              return (
                <div key={idx} className={styles.tableRow}>
                  <div className={styles.playerCol}>
                    <div className={styles.playerName}>{name}</div>
                    {player.dismissal
                      ? <div className={styles.dismissal}>{player.dismissal}</div>
                      : player.balls > 0
                        ? <div className={styles.notOut}>not out</div>
                        : null
                    }
                  </div>
                  <div className={styles.statCol}>{player.runs}</div>
                  <div className={styles.statCol}>{player.balls}</div>
                  <div className={styles.statCol}>{sr}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bowling */}
        <div className={styles.section}>
          <h4 className={styles.sectionTitle}>⚡ BOWLING</h4>
          <div className={styles.table}>
            <div className={`${styles.tableRow} ${styles.tableHeader}`}>
              <div className={styles.playerCol}>BOWLER</div>
              <div className={styles.statCol}>O</div>
              <div className={styles.statCol}>R</div>
              <div className={styles.statCol}>W</div>
              <div className={styles.statCol}>ECO</div>
            </div>
            {bowlers.length === 0 && (
              <div className={styles.noData}>No bowling data</div>
            )}
            {bowlers.map((bowler, idx) => {
              const totalO = bowler.overs + (bowler.balls / 6);
              const eco = totalO > 0 ? (bowler.runs / totalO).toFixed(2) : '0.00';
              const name = bowler.displayName || bowler.name || '—';
              return (
                <div key={idx} className={styles.tableRow}>
                  <div className={styles.playerCol}>{name}</div>
                  <div className={styles.statCol}>{bowler.overs}.{bowler.balls}</div>
                  <div className={styles.statCol}>{bowler.runs}</div>
                  <div className={styles.statCol}>{bowler.wickets}</div>
                  <div className={styles.statCol}>{eco}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderPhaseContent = () => {
    if (activePhase === 'main') {
      // ✅ If super over happened, real match scores are in realInnings1Score/realInnings2Score.
      // Merge them with batting/bowling data from innings1Data/innings2Data.
      const inn1 = mainMatchData?.innings1Data
        ? {
            ...mainMatchData.innings1Data,
            // Override raw score/wickets with the preserved real match final if available
            ...(mainMatchData.realInnings1Score
              ? {
                  score: mainMatchData.realInnings1Score.score,
                  wickets: mainMatchData.realInnings1Score.wickets,
                  overs: mainMatchData.realInnings1Score.overs,
                  balls: mainMatchData.realInnings1Score.balls,
                }
              : {}),
          }
        : null;

      const inn2 = mainMatchData?.innings2Data
        ? {
            ...mainMatchData.innings2Data,
            ...(mainMatchData.realInnings2Score
              ? {
                  score: mainMatchData.realInnings2Score.score,
                  wickets: mainMatchData.realInnings2Score.wickets,
                  overs: mainMatchData.realInnings2Score.overs,
                  balls: mainMatchData.realInnings2Score.balls,
                }
              : {}),
          }
        : null;

      return (
        <div className={styles.phaseContent}>
          {renderInningsCard(inn1, 1, 'Main Match', firstBattingTeam)}
          {renderInningsCard(inn2, 2, 'Main Match', secondBattingTeam)}
        </div>
      );
    }

    // Super Over tab
    const soNumber = parseInt(activePhase.replace('so', ''), 10);
    const soData = superOverData?.find(so => so.number === soNumber);

    if (!soData) {
      return <p className={styles.noData}>No data for Super Over {soNumber}</p>;
    }

    return (
      <div className={styles.phaseContent}>
        {renderInningsCard(soData.innings1Data, 1, `Super Over ${soNumber}`, null)}
        {renderInningsCard(soData.innings2Data, 2, `Super Over ${soNumber}`, null)}
      </div>
    );
  };

  // Build tabs
  const tabs = [{ id: 'main', label: 'Main Match' }];
  if (superOverData && superOverData.length > 0) {
    superOverData.forEach(so => {
      tabs.push({ id: `so${so.number}`, label: `Super Over ${so.number}` });
    });
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>

        <div className={styles.header}>
          <h2 className={styles.title}>📊 Full Scorecard</h2>
          <button className={styles.closeIcon} onClick={onClose}>✕</button>
        </div>

        <div className={styles.matchInfo}>
          <div className={styles.teams}>{matchData?.teamA} vs {matchData?.teamB}</div>
          <div className={styles.venue}>{matchData?.overs} overs per side</div>
        </div>

        <div className={styles.tabContainer}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`${styles.tab} ${activePhase === tab.id ? styles.activeTab : ''}`}
              onClick={() => setActivePhase(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className={styles.scrollContent}>
          {renderPhaseContent()}
        </div>

        <button className={styles.closeBtn} onClick={onClose}>Close</button>
      </div>
    </div>
  );
}

export default FullScorecard;
