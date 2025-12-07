// Tournaments/Game.jsx
import { useState, useEffect } from "react";
import {
    doc,
    updateDoc,
    onSnapshot,
    getDoc,
    writeBatch,
    increment,
    setDoc,
} from "firebase/firestore";
import { db } from "../../firebase";
import styles from "./Tournament.module.css";

export default function Game({ tournamentId, gameId, round, matchups }) {
  const [scoreLeft, setScoreLeft] = useState("");
  const [scoreRight, setScoreRight] = useState("");
  const [finalized, setFinalized] = useState(false);

  const isSitout = matchups?.type === "sitout" || (Array.isArray(matchups?.team2) && matchups.team2.length === 0);
  const isPlayable = !isSitout;

  const gameRef = doc(db, "tournaments", tournamentId, "games", gameId);

  useEffect(() => {
    if (!isPlayable) {
      // No Firestore doc for sitouts → ensure clean local UI
      setScoreLeft("");
      setScoreRight("");
      setFinalized(true);
      return;
    }
    const unsub = onSnapshot(gameRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setScoreLeft(data.scoreLeft ?? "");
        setScoreRight(data.scoreRight ?? "");
        setFinalized(!!data.finalized);
      } else {
        setScoreLeft("");
        setScoreRight("");
        setFinalized(false);
      }
    });
    return () => unsub();
  }, [tournamentId, gameId, isPlayable]);

  const handleScoreChange = async (side, value) => {
    if (!isPlayable) return;
    const num = value === "" ? "" : parseInt(value, 10) || 0;
    if (side === "left") setScoreLeft(num);
    else setScoreRight(num);

    const payload = {};
    if (side === "left") payload.scoreLeft = num === "" ? 0 : num;
    else payload.scoreRight = num === "" ? 0 : num;
    await updateDoc(gameRef, payload);
  };

  function calculateHybridPoints(scoreA, scoreB) {
    const winnerScore = Math.max(scoreA, scoreB);
    const loserScore = Math.min(scoreA, scoreB);
    const margin = winnerScore - loserScore;
    const winnerPoints = winnerScore + margin;
    const loserPoints = loserScore;
    if (scoreA > scoreB) {
      return { team1Points: winnerPoints, team2Points: loserPoints, team1Win: true };
    } else {
      return { team1Points: loserPoints, team2Points: winnerPoints, team1Win: false };
    }
  }

  const finalizeGame = async () => {
    if (!isPlayable) return;
    const snap = await getDoc(gameRef);
    if (!snap.exists()) return;
    const data = snap.data();
    if (data.aggregated) {
      setFinalized(true);
      await updateDoc(gameRef, { finalized: true });
      return;
    }

    const left = data.scoreLeft ?? 0;
    const right = data.scoreRight ?? 0;

    const { team1Points, team2Points, team1Win } = calculateHybridPoints(left, right);

    // Use matchups as source of truth for players (supports 1v1 / 1v2 / 2v2)
    const team1 = matchups.team1 || [];
    const team2 = matchups.team2 || [];

    const batch = writeBatch(db);

    const addStatFor = (playerObj, points, won, lost) => {
      if (!playerObj?.uid) return; // ignore placeholders (not used here)
      const uid = playerObj.uid;
      const statRef = doc(db, "tournaments", tournamentId, "stats", uid);
      batch.set(
        statRef,
        {
          uid,
          username: playerObj.name,
          gamesPlayed: increment(1),
          gamesWon: won ? increment(1) : increment(0),
          gamesLost: lost ? increment(1) : increment(0),
          totalPoints: increment(points),
        },
        { merge: true }
      );
    };

    team1.forEach(p => addStatFor(p, team1Points, team1Win, !team1Win));
    team2.forEach(p => addStatFor(p, team2Points, !team1Win, team1Win));

    batch.set(gameRef, { aggregated: true, finalized: true }, { merge: true });

    await batch.commit();
    setFinalized(true);
  };

  const getPic = (player, fallback) => player?.profilePic || fallback;

  // ----------- RENDER -----------
  if (isSitout) {
    const p = matchups.team1?.[0];
    return (
      <div className={styles.gameContainer}>
        <div className={styles.gameBody}>
          <div className={styles.gameTeams}>
            <div className={styles.teamLeft}>
              <div className={styles.pairedAvatar}>
                <div className={`${styles.half} ${styles.left}`}>
                  <img
                    src={getPic(p, "src/assets/unknown-user.svg")}
                    alt={p?.name || "Player"}
                  />
                </div>
              </div>
              <h2>{p?.name || "Spiller"}</h2>
            </div>
          </div>
          <button className={`${styles.finalizeBtn} ${styles.finalized}`} disabled>
            Sidder over
          </button>
        </div>
      </div>
    );
  }

  // helper to render any team (1 or 2 players)
  const TeamBlock = ({ team, leftSide }) => {
    const [p0, p1] = team;
    return (
      <div className={leftSide ? styles.teamLeft : styles.teamRight}>
        <div className={styles.pairedAvatar}>
          <div className={`${styles.half} ${styles.left}`}>
            {p0 && (
              <img
                src={getPic(p0, "src/assets/unknown-user.svg")}
                alt={p0?.name || "Player"}
              />
            )}
          </div>
          <div className={`${styles.half} ${styles.right}`}>
            {p1 && (
              <img
                src={getPic(p1, "src/assets/unknown-user2.svg")}
                alt={p1?.name || "Player"}
              />
            )}
          </div>
        </div>
        {p0 && <h2>{p0.name}</h2>}
        {p1 && <h2>{p1.name}</h2>}
      </div>
    );
  };

  return (
    <div className={styles.gameContainer}>
      <div className={styles.gameHeader}>
        <input
          type="number"
          className={styles.scoreInput}
          placeholder="-"
          value={scoreLeft ?? ""}
          onChange={(e) => handleScoreChange("left", e.target.value)}
          disabled={finalized}
        />
        <h3 style={{ width: "fit-content" }}>:</h3>
        <input
          type="number"
          className={styles.scoreInput}
          placeholder="-"
          value={scoreRight ?? ""}
          onChange={(e) => handleScoreChange("right", e.target.value)}
          disabled={finalized}
        />
      </div>

      <div className={styles.gameBody}>
        <div className={styles.gameTeams}>
          <TeamBlock team={matchups.team1 || []} leftSide />
          <TeamBlock team={matchups.team2 || []} />
        </div>

        <button
          className={`${styles.finalizeBtn} ${finalized ? styles.finalized : ""}`}
          onClick={finalizeGame}
          disabled={finalized}
        >
          {finalized ? "Afsluttet" : (matchups.type === "1v1" ? "Afslut 1v1" : matchups.type === "1v2" ? "Afslut 1v2" : "Afslut kamp")}
        </button>
      </div>
    </div>
  );
}