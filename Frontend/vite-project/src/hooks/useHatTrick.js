import { useState, useRef } from 'react';

function useHatTrick() {
  const [showHatTrick, setShowHatTrick] = useState(false);
  const [hatTrickBowler, setHatTrickBowler] = useState(null);
  
  // ✅ Map of { bowlerName -> consecutiveWicketCount }
  // Tracks ALL bowlers simultaneously
  const streaksRef = useRef({});

  const trackBall = (bowlerName, isWicket, isRunout = false) => {
    console.log('🎯 Hat-trick tracker:', { bowlerName, isWicket, isRunout, streaks: {...streaksRef.current} });

    const streaks = streaksRef.current;

    if (isWicket && !isRunout) {
      // Increment THIS bowler's streak
      streaks[bowlerName] = (streaks[bowlerName] || 0) + 1;
      const count = streaks[bowlerName];
      console.log(`🔥 ${bowlerName} - ${count} consecutive wickets`);

      if (count === 3) {
        console.log(`🎉 HAT-TRICK! Bowler: ${bowlerName}`);
        streaks[bowlerName] = 0; // reset their streak
        setTimeout(() => {
          setHatTrickBowler(bowlerName);
          setShowHatTrick(true);
        }, 300);
      }
    } else if (!isWicket) {
      // Only reset THIS bowler's streak — everyone else untouched
      if (streaks[bowlerName] > 0) {
        console.log(`❌ ${bowlerName}'s streak broken at ${streaks[bowlerName]} - bowled non-wicket`);
        streaks[bowlerName] = 0;
      }
    }
  };

  const closeHatTrick = () => {
    setShowHatTrick(false);
    setHatTrickBowler(null);
  };

  const resetTracker = () => {
    streaksRef.current = {};
    setShowHatTrick(false);
    setHatTrickBowler(null);
    console.log('🔄 Hat-trick tracker reset');
  };

  return {
    showHatTrick,
    hatTrickBowler,
    trackBall,
    closeHatTrick,
    resetTracker,
  };
}

export default useHatTrick;