import { useState } from "react";

export default function useUndoEngine() {
  const [historyStack, setHistoryStack] = useState([]);

  const saveSnapshot = (snapshot) => {
    setHistoryStack(prev => [...prev, snapshot]);
  };

  const undoLastBall = (restoreState) => {
    setHistoryStack(prev => {
      if (prev.length === 0) return prev;

      const last = prev[prev.length - 1];
      restoreState(last);   // restore everything
      return prev.slice(0, -1);
    });
  };

  return { saveSnapshot, undoLastBall };
}
