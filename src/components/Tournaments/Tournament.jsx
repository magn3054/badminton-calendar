import { useEffect, useMemo, useState, useCallback } from "react";
import {
  collection, onSnapshot, query, where, getDocs, doc,
  setDoc, getDoc, deleteDoc, serverTimestamp
} from "firebase/firestore";
import { db } from "../../firebase";
import styles from "./Tournament.module.css";
import Games from "./Games";
import Scoreboard from "./Scoreboard";
import { generateRounds } from "./generateRounds";
import { groupAvailabilityByHour } from "./slots";
import { makeTournamentId } from "./tournamentId";

export default function Tournament() {
  const [view, setView] = useState("games");
  const [userProfiles, setUserProfiles] = useState({});
  const [ongoingGame, setOngoingGame] = useState(null);
  const [availability, setAvailability] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [selected, setSelected] = useState(null);
  const [isSelectOpen, setIsSelectOpen] = useState(false);

  // ---------------------- pick upcoming
  function pickUpcoming(groups) {
    const all = [...groups.notBooked, ...groups.booked].sort((a, b) =>
      new Date(a.date) - new Date(b.date) || a.hour - b.hour
    );
    if (!all.length) return null;

    const now = new Date();
    const next = all.find(
      (opt) => new Date(`${opt.date}T${String(opt.hour).padStart(2, "0")}:00`) >= now
    );
    return next || all[0]; // fallback to earliest if everything is in the past
  }
  // ----------------------

  // users
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "users"), (snapshot) => {
      const profiles = {};
      snapshot.forEach((docSnap) => {
        const d = docSnap.data();
        profiles[docSnap.id] = {
          username: d.username,
          image: d.image || "src/assets/unknown-user.svg",
        };
      });
      setUserProfiles(profiles);
    });
    return () => unsub();
  }, []);

  // availability (>= today)
  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    const qAvail = query(collection(db, "availability"), where("date", ">=", today));
    const unsub = onSnapshot(qAvail, (snap) => {
      setAvailability(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  // bookings
  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    const unsub = onSnapshot(collection(db, "bookings"), (snap) => {
      const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() })).filter((b) => b.date >= today);
      setBookings(rows);
    });
    return () => unsub();
  }, []);

  // Build dropdown options (grouped) — collapse all switchIndex into one slot per (date,hour)
  const dropdownGroups = useMemo(() => {
    const slots = groupAvailabilityByHour(availability);

    // helper: is any switch for this (date,hour) booked?
    const isAnyBooked = (date, hour, switchCount) => {
      for (let s = 0; s < switchCount; s++) {
        const id = `${date}|${Number(hour)}|${s}`;
        if (bookings.some(b => `${b.date}|${Number(b.hour)}|${b.switchIndex ?? 0}` === id)) {
          return true;
        }
      }
      return false;
    };

    const options = { booked: [], notBooked: [] };

    // sort dates then hours
    const dateKeys = Object.keys(slots).sort((a, b) => new Date(a) - new Date(b));
    for (const date of dateKeys) {
      const hourEntries = Object.entries(slots[date])
        .map(([h, list]) => [parseInt(h, 10), list])
        .sort((a, b) => a[0] - b[0]);

      for (const [hour, list] of hourEntries) {
        // unique roster for this (date,hour)
        const uniquePlayers = Array.from(new Map(list.map((p) => [p.uid, p])).values());
        if (uniquePlayers.length < 4) continue;

        // how many parallel courts are reasonable for this roster size
        const switchCount = Math.floor((uniquePlayers.length - 1) / 4) + 1;

        // ONE tournamentId per (date,hour) — always use switchIndex 0
        const tournamentId = makeTournamentId(date, hour, 0);

        const label = `${new Date(date).toLocaleDateString("da-DK", {
          weekday: "short",
          day: "2-digit",
          month: "short",
        })} · ${String(hour).padStart(2, "0")}:00 · ${uniquePlayers.length} spillere`;

        const players = uniquePlayers.map((p) => ({
          uid: p.uid,
          name: p.name,
          profilePic: userProfiles[p.uid]?.image || "src/assets/unknown-user.svg",
        }));

        const opt = { tournamentId, date, hour, switchIndex: 0, label, players, courtCount: switchCount };

        // If ANY of the switches for this slot is booked, show under “Booket”
        (isAnyBooked(date, hour, switchCount) ? options.booked : options.notBooked).push(opt);
      }
    }

    const sorter = (a, b) =>
      new Date(a.date) - new Date(b.date) ||
      a.hour - b.hour;

    options.booked.sort(sorter);
    options.notBooked.sort(sorter);
    return options;
  }, [availability, bookings, userProfiles]);

  // Auto-select the next upcoming tournament (by date+hour).
  // If the current selection disappears, switch to the next upcoming.
  useEffect(() => {
    const next = pickUpcoming(dropdownGroups);
    if (!next) return;

    setSelected((prev) => {
      if (!prev) return next; // nothing selected yet → pick upcoming

      // keep current if it still exists in the list
      const all = [...dropdownGroups.notBooked, ...dropdownGroups.booked];
      const stillExists = all.some((o) => o.tournamentId === prev.tournamentId);
      return stillExists ? prev : next;
    });
  }, [dropdownGroups]);

  // 🔒 STABLE callback (prevents effect-loop in Games)
  const handleSetOngoingGame = useCallback(
    (og) => {
      setOngoingGame((prev) => {
        if (
          prev?.tournamentId === selected?.tournamentId &&
          prev?.gameId === og?.gameId
        ) {
          return prev; // no change
        }
        return {
          ...og,
          date: selected?.date,
          hour: selected?.hour,
          tournamentId: selected?.tournamentId,
        };
      });
    },
    [selected?.date, selected?.hour, selected?.tournamentId]
  );

  // ensure game doc
  const ensureGameDocForTournament = async (tournamentId, gameId, matchups) => {
    const ref = doc(db, "tournaments", tournamentId, "games", gameId);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(
        ref,
        {
          team1: matchups.team1.map((p) => p.uid),
          team2: matchups.team2.map((p) => p.uid),
          scoreLeft: null,
          scoreRight: null,
          createdAt: serverTimestamp(),
          finalized: false,
          aggregated: false,
        },
        { merge: true }
      );
    }
  };

  const clearTournament = async (tournamentId) => {
    const gamesCol = collection(db, "tournaments", tournamentId, "games");
    const gSnap = await getDocs(gamesCol);
    for (const d of gSnap.docs) await deleteDoc(d.ref);

    const statsCol = collection(db, "tournaments", tournamentId, "stats");
    const sSnap = await getDocs(statsCol);
    for (const d of sSnap.docs) await deleteDoc(d.ref);
  };

  return (
    <div className={styles.tournamentContainer}>
      <div className={styles.displayOptions}>
        <button
          className={`${styles.gamesViewBtn} ${view === "games" ? styles.chosenViewBtn : ""}`}
          onClick={() => setView("games")}
        >
          Kampe
        </button>
        <button
          className={`${styles.scoreViewBtn} ${view === "scoreboard" ? styles.chosenViewBtn : ""}`}
          onClick={() => setView("scoreboard")}
        >
          Scoreboard
        </button>
      </div>

      {(dropdownGroups.booked.length + dropdownGroups.notBooked.length) > 1 && (
        <div className={styles.selectorRow}>
          <div
            className={`${styles.selectWrap} ${isSelectOpen ? styles.open : ""}`}
            onPointerDown={() => setIsSelectOpen(o => !o)}   // flip on every press
          >
            <select
              className={styles.selector}
              value={selected?.tournamentId || ""}
              onChange={(e) => {
                const id = e.target.value;
                const all = [...dropdownGroups.notBooked, ...dropdownGroups.booked];
                const pick = all.find((o) => o.tournamentId === id) || null;
                setSelected(pick);
                setOngoingGame(null);
                setIsSelectOpen(false);                      // close after choosing
              }}
              onBlur={() => setIsSelectOpen(false)}          // close when focus leaves
              onKeyDown={(e) => {                            // keyboard support
                if (e.key === "Escape") setIsSelectOpen(false);
                if (e.key === "Enter" || e.key === " ") setIsSelectOpen(o => !o);
                if (e.altKey && (e.key === "ArrowDown" || e.key === "ArrowUp"))
                  setIsSelectOpen(o => !o);
              }}
            >
              {dropdownGroups.booked.length > 0 && (
                <optgroup label="Booket">
                  {dropdownGroups.booked.map((opt) => (
                    <option key={opt.tournamentId} value={opt.tournamentId}>{opt.label}</option>
                  ))}
                </optgroup>
              )}
              {dropdownGroups.notBooked.length > 0 && (
                <optgroup label="Ikke booket">
                  {dropdownGroups.notBooked.map((opt) => (
                    <option key={opt.tournamentId} value={opt.tournamentId}>{opt.label}</option>
                  ))}
                </optgroup>
              )}
            </select>

            <svg className={styles.chevron} viewBox="0 0 10 5" aria-hidden="true">
              <polyline
                points="2,1 5,4 8,1"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
      )}

      {selected && view === "games" && (
        <Games
          tournamentId={selected.tournamentId}
          // 💡 ensure pics are always up to date
          players={selected.players.map(p => ({
            ...p,
            profilePic: userProfiles[p.uid]?.image || "src/assets/unknown-user.svg",
          }))}
          generateRounds={generateRounds}
          ensureGameDoc={(tId, gameId, m) => ensureGameDocForTournament(tId, gameId, m)}
          onSetOngoingGame={handleSetOngoingGame}
        />
      )}

      {selected && view === "scoreboard" && (
        <Scoreboard
          ongoingGame={{
            date: selected.date,
            hour: selected.hour,
            tournamentId: selected.tournamentId,
          }}
        />
      )}

      <button
        className={styles.clearBtn}
        onClick={() => selected ? clearTournament(selected.tournamentId) : alert("Vælg en turnering først")}
      >
        Ryd kampe
      </button>
    </div>
  );
}
