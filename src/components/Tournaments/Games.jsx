import { useEffect, useState } from "react";
import Game from "./Game";
import styles from "./Tournament.module.css";

export default function Games({
  tournamentId,
  players,
  generateRounds,
  ensureGameDoc,
  onSetOngoingGame,
}) {
  const [firstGame, setFirstGame] = useState(null);

  const rounds = generateRounds(players || []);

  useEffect(() => {
    if (!rounds.length || firstGame) return;
    // pick first REAL game (not a sitout)
    const firstPlayable = rounds.find(m => m.type !== "sitout");
    if (!firstPlayable) return;
    const gameId = `round-${firstPlayable.round}-0`;
    setFirstGame({ tournamentId, gameId });
  }, [rounds, tournamentId, firstGame]);

  useEffect(() => {
    if (!firstGame) return;
    onSetOngoingGame(firstGame);
  }, [firstGame, onSetOngoingGame]);

  if (!rounds.length) {
    return (
      <section className={styles.gamesSection}>
        <div className={styles.dayContainer}>
          <p>Ingen kampe endnu (kræver mindst 4 spillere).</p>
        </div>
      </section>
    );
  }

  const grouped = rounds.reduce((acc, m, idx) => {
    acc[m.round] ||= [];
    acc[m.round].push({ m, idx });
    return acc;
  }, {});

  return (
    <section className={styles.gamesSection}>
      {Object.entries(grouped).map(([roundNum, entries]) => (
        <div key={`round-${roundNum}`} className={styles.roundContainer}>
          <div className={styles.dateHeader}>
            <h3 className={styles.roundHeader}>Runde {roundNum}</h3>
          </div>
          <div className={styles.games}>
            {entries.map(({ m, idx }) => {
              const gameId = `round-${m.round}-${idx}`;
              // 🛑 Do NOT create a Firestore game for sitout
              if (m.type === "sitout") {
                return (
                  <Game
                    key={`${tournamentId}-round-${m.round}-sitout-${idx}`}
                    tournamentId={tournamentId}
                    gameId={gameId}
                    round={m.round}
                    matchups={m}
                  />
                );
              }
              // ✅ 1v1 / 1v2 / 2v2 create docs as usual
              ensureGameDoc(tournamentId, gameId, m);
              return (
                <Game
                  key={`${tournamentId}-round-${m.round}-match-${idx}`}
                  tournamentId={tournamentId}
                  gameId={gameId}
                  round={m.round}
                  matchups={m}
                />
              );
            })}
          </div>
        </div>
      ))}
    </section>
  );
}