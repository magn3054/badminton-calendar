// Tournaments/Scoreboard.jsx
import { useState, useEffect } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../../firebase";
import styles from "./Tournament.module.css";

export default function Scoreboard({ ongoingGame }) {
  const [stats, setStats] = useState([]);

  useEffect(() => {
    if (!ongoingGame?.tournamentId) {
      setStats([]);
      return;
    }
    const statsCol = collection(db, "tournaments", ongoingGame.tournamentId, "stats");
    const unsub = onSnapshot(statsCol, (snapshot) => {
      const arr = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      arr.sort((a, b) => {
        if ((b.totalPoints || 0) !== (a.totalPoints || 0))
          return (b.totalPoints || 0) - (a.totalPoints || 0);
        return (b.gamesWon || 0) - (a.gamesWon || 0);
      });
      setStats(arr);
    });
    return () => unsub();
  }, [ongoingGame?.tournamentId]);

  if (!ongoingGame?.tournamentId) {
    return <div className={styles.scoreboard}><p>⚠️ Ingen igangværende kampe valgt.</p></div>;
  }

  return (
    <div className={styles.scoreboard}>
      <div className={styles.scoreboardHeader}>
        <h2>Scoreboard</h2>
        <h2>
          {(() => {
            const d = new Date(ongoingGame.date);
            const hh = String(ongoingGame.hour ?? "").padStart(2, "0");
            return `${d.toLocaleDateString("da-DK", { day: "2-digit", month: "2-digit" })} · ${hh}:00`;
          })()}
        </h2>
      </div>
      <table className={styles.scoreTable}>
        <thead>
          <tr>
            <th>Spillere</th>
            <th>K</th>
            <th>W</th>
            <th>L</th>
            <th>Points</th>
          </tr>
        </thead>
        <tbody>
          {stats.map((s) => (
            <tr key={s.id}>
              <td>{s.username || s.uid || s.id}</td>
              <td>{s.gamesPlayed || 0}</td>
              <td>{s.gamesWon || 0}</td>
              <td>{s.gamesLost || 0}</td>
              <td>{s.totalPoints || 0}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
