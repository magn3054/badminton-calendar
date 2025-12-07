//Calendar/BookingSwitch.jsx
import { useState, useEffect } from "react";
import { doc, setDoc, onSnapshot, collection, getDocs, deleteDoc } from "firebase/firestore";
import { db, auth } from "../../firebase";
import styles from "./BookingSwitch.module.css";
import AddToCalendar from "../Calendar/AddToCalendar";

export default function BookingSwitch({ date, hour, booker, players, switchIndex = 0 }) {
    const [booked, setBooked] = useState(false);
    const docId = `${date}_${hour}_${switchIndex}`;

    useEffect(() => {
        if (date) {
            const today = new Date();
            // Combine date + hour into one Date
            const bookingDateTime = new Date(`${date}T${String(hour).padStart(2, "0")}:00`);

            // If the booking datetime is before now, delete the doc
            if (bookingDateTime < today) {
                // deleteDoc(doc(db, "bookings", `${date}_${hour}`));
                deleteDoc(doc(db, "bookings", docId));
            }
        }
    }, [date, hour, docId]);

    useEffect(() => {
        const ref = doc(db, "bookings", docId);
        const unsub = onSnapshot(ref, (snapshot) => {
            if (snapshot.exists()) {
                setBooked(snapshot.data().booked);
            } else {
                setBooked(false); // reset if doc deleted
            }
        });
        return unsub;
    }, [docId]);

    const toggleBooking = async () => {
        const newBooked = !booked;
        const ref = doc(db, "bookings", docId);

        if (newBooked) {
            // turned ON → create/update the booking
            await setDoc(
                ref,
                {
                    date,
                    hour,
                    switchIndex,
                    booked: true,
                    updatedBy: auth.currentUser?.uid || null,
                },
                { merge: true }
            );
            sendPushNotification(players);
        } else {
            // turned OFF → delete the booking doc
            await deleteDoc(ref);
        }

        setBooked(newBooked);
    };


    const sendPushNotification = async (targetUserIds) => {
        // sikrer at sender ikke notifikation til sig selv
        // targetUserIds = targetUserIds.filter(id => id !== auth.currentUser?.uid);

        const formattedDate = new Date(date).toLocaleDateString('da-DK', { weekday: 'short', day: '2-digit', month: 'short' });
        const title = "Badminton Booket";
        const body = `${booker} har booket bane ${formattedDate} til kl. ${hour}:00`;

        // Fetch subscriptions from Firestore inside the function
        let subs = [];
        const subsSnapshot = await getDocs(collection(db, "pushSubscriptions"));
        subs = subsSnapshot.docs.map(doc => doc.data());

        // Filter by targetUserIds if specified
        if (targetUserIds.length) {
            subs = subs.filter(sub => targetUserIds.includes(sub.userId));
        }

        try {
            const res = await fetch("/api/send-push.php", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title, body, targetUserIds }),
            });
            const data = await res.json();
            console.log(targetUserIds);
            // alert(`Push sent:\n${title}\n${body}`);
        } catch (err) {
            console.error(err);
            alert("Error sending push notification");
        }
    };

    return (
        <div className={styles.bookingWrapper}>
            {/* Only render AddToCalendar when booked */}
            {switchIndex === 0 && booked && (
                <AddToCalendar
                    title="Badminton"
                    description="Badminton booking"
                    startDate={new Date(`${date}T${hour.padStart(2, "0")}:00`)}
                    endDate={new Date(
                        new Date(`${date}T${hour.padStart(2, "0")}:00`).getTime() +
                        60 * 60 * 1000
                    )}
                />
            )}
            <label className={styles.switch}>
                <input
                    type="checkbox"
                    checked={booked}
                    onChange={toggleBooking}
                />
                <span className={styles.slider}>
                    <span className={styles.switchText}>
                        {booked ? "BOOKET" : "BOOK?"}
                    </span>
                </span>
            </label>
        </div>
    );
}
