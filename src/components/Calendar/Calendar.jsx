//Calendar/Calendar.jsx
import { useState, useEffect } from "react";
import { auth, db } from "../../firebase";
import { doc, getDoc, collection, addDoc, onSnapshot } from "firebase/firestore";
import { findMatches } from "../../utils/matchUtils";
import styles from "./Calendar.module.css";
import Availability from "../Availability/Availability";
import CalendarView from './CalendarView';
import BookingSwitch from './BookingSwitch';
import CustomHourDropdown from './CustomHourDropdown';

// Stable tournament id: 2025-09-25__17__0
const makeTournamentId = (date, hour, switchIndex = 0) =>
  `${date}__${String(hour).padStart(2, "0")}__${switchIndex}`;

// Build roster (UID+name) for a date/hour from availability rows
function rosterForSlot(date, hour, availability) {
  const h = Number(hour);
  const byUid = new Map();
  for (const row of availability) {
    if (row.date !== date) continue;
    const start = parseInt(String(row.startTime).split(":")[0], 10);
    const end = parseInt(String(row.endTime).split(":")[0], 10);
    if (Number.isNaN(start) || Number.isNaN(end)) continue;
    if (h >= start && h < end) {
      if (!byUid.has(row.uid)) byUid.set(row.uid, { uid: row.uid, name: row.name });
    }
  }
  return Array.from(byUid.values());
}

const rosterHash = (players) => players.map(p => p.uid).sort().join("|");

export default function Calendar() {
    const [date, setDate] = useState("");
    const [startTime, setStartTime] = useState("");
    const [endTime, setEndTime] = useState("");
    const [availability, setAvailability] = useState([]);
    const [matches, setMatches] = useState({});
    const [showAll, setShowAll] = useState(false);
    const [username, setUsername] = useState("");

    const [showPicker, setShowPicker] = useState(false);
    const [selectedDate, setSelectedDate] = useState(null);


    const handleDateSelect = (dateObj) => {
        // Gem datoen præcis som valgt
        const iso = dateObj.toISOString().split('T')[0];
        setSelectedDate(dateObj);
        setDate(iso);
    };

    const addAvailability = async () => {
        if (!date || !startTime || !endTime) return;

        const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
        const username = userDoc.exists() ? userDoc.data().username : auth.currentUser.email;

        await addDoc(collection(db, "availability"), {
            uid: auth.currentUser.uid,
            name: username,
            date,
            startTime,
            endTime,
        });
        setDate("");
        setStartTime("");
        setEndTime("");
        setShowPicker(false);
    };

    useEffect(() => {
        const unsub = onSnapshot(collection(db, "availability"), (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setAvailability(data);
            setMatches(findMatches(data));
        });
        return unsub;
    }, []);

    useEffect(() => {
        const fetchUsername = async () => {
            if (auth.currentUser) {
                const userRef = doc(db, "users", auth.currentUser.uid);
                const userSnap = await getDoc(userRef);
                if (userSnap.exists()) {
                    setUsername(userSnap.data().username);
                } else {
                    setUsername(auth.currentUser.email); // fallback
                }
            }
        };

        fetchUsername();
    }, []);


    return (
        <div className={styles.calendar}>
            <div className={styles.form}>
                {/* Modal Overlay */}
                {showPicker && (
                    <div className={styles.pickerOverlay} onClick={() => setShowPicker(false)}>
                        <div className={styles.pickerContainer} onClick={e => e.stopPropagation()}>
                            <CalendarView
                                value={date}
                                onChange={(isoDate) => handleDateSelect(new Date(isoDate))}
                            />
                            <div className={styles.time}>
                                <CustomHourDropdown
                                    value={startTime}
                                    onChange={setStartTime}
                                    placeholder="Start"
                                    placement="left"
                                />
                                <p>-</p>
                                <CustomHourDropdown
                                    value={endTime}
                                    onChange={setEndTime}
                                    placeholder="Slut"
                                    placement="right"
                                />
                            </div>
                            <div className={styles.calendarButtons}>
                                <button className={styles.closeModal} onClick={() => {
                                    setShowPicker(false);
                                    setStartTime("");
                                    setEndTime("");
                                    setSelectedDate(null);
                                    setDate("");
                                }}>Luk</button>
                                <button onClick={addAvailability} className={styles.addButton}>Tilføj</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <section className={styles.availabilityContainer}>
                <div className={styles.availabilityHeader}>
                    <h3>Dit teams tilgængelighed</h3>
                    <button onClick={() => setShowPicker(true)} className={styles.plusButton}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
                            fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 16 16">
                            <path d="M8 7V1h1v6h6v1H9v6H8V8H2V7h6z" />
                        </svg>
                    </button>
                </div>
                <div className={styles.list}>
                    {[...availability]
                        .sort((a, b) => new Date(a.date) - new Date(b.date))
                        .slice(0, showAll ? availability.length : 4)
                        .map((a) => (
                            <Availability
                                key={a.id}
                                id={a.id}
                                uid={a.uid}
                                ownerName={a.name}
                                date={a.date}
                                startTime={a.startTime}
                                endTime={a.endTime}
                            />
                        ))}

                    {availability.length > 4 && (
                        <button
                            className={styles.toggleButton}
                            onClick={() => setShowAll(!showAll)}
                        >
                            {showAll ? "Vis mindre" : `Vis alle (${availability.length})`}
                        </button>
                    )}
                </div>
            </section>

            <section className={styles.possibleMatchesContainer}>
                <h3>Mulige kampe (4+ spillere)</h3>
                <div className={styles.matches}>
                    {Object.entries(matches)
                        .sort(([dateA], [dateB]) => new Date(dateA) - new Date(dateB))
                        .map(([date, hoursObj]) => {
                            const hourEntries = Object.entries(hoursObj).filter(([_, users]) => users.length > 0);
                            if (hourEntries.length === 0) return null;
                            console.log("Disse mennesker er tilgængelige:", hoursObj);
                            return (
                                <div className={styles.match} key={date}>
                                    <h4>{new Date(date).toLocaleDateString('da-DK', { weekday: 'short', day: '2-digit', month: 'short' })}</h4>
                                    {hourEntries.map(([hour, users]) => {
                                        const numSwitches = Math.floor((users.length - 1) / 4) + 1;
                                        return (
                                            <div className={styles.matchTime} key={hour}>
                                                <div className={styles.timeContainer}>
                                                    <h4>Kl. {hour}:00</h4>
                                                </div>
                                                <div className={styles.usersList}>
                                                    {users.map((user, idx) => (
                                                        <h4 className={styles.user} key={idx}>{user}</h4>
                                                    ))}
                                                </div>

                                                <div className={styles.bookingSwitches}>
                                                    {Array.from({ length: numSwitches }).map((_, idx) => (
                                                        <BookingSwitch
                                                            key={`${date}-${hour}-switch-${idx}`}
                                                            date={date}
                                                            hour={hour}
                                                            switchIndex={idx}
                                                            booker={username}
                                                            players={users}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            );
                        })}
                </div>
            </section>
        </div>
    );
}
