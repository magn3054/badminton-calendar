//Availability/Availability.jsx
import React, { useState, useEffect } from "react";
import { doc, deleteDoc, updateDoc } from "firebase/firestore";
import { db, auth } from "../../firebase";
import styles from "./Availability.module.css";
import CustomHourDropdown from '../Calendar/CustomHourDropdown';
import PushButton from "../Diverse/PushButton";


export default function Availability({ id, uid, ownerName, date, startTime, endTime }) {
    const [isEditing, setIsEditing] = useState(false);
    const [newStartTime, setNewStartTime] = useState(startTime);
    const [newEndTime, setNewEndTime] = useState(endTime);

    const currentUser = auth.currentUser;
    const isOwner = currentUser && currentUser.uid === uid;

    useEffect(() => {
        if (date) {
            const today = new Date();
            const availabilityDate = new Date(date);

            // If the availability date is before today, delete it
            if (availabilityDate < today.setHours(0, 0, 0, 0)) {
                deleteDoc(doc(db, "availability", id));
            }
        }
    }, [date, id]);

    const handleDelete = async () => {
        await deleteDoc(doc(db, "availability", id));
    };

    const handleEdit = async () => {
        if (!isEditing) {
            setIsEditing(true);
        } else {
            await updateDoc(doc(db, "availability", id), {
                startTime: newStartTime,
                endTime: newEndTime,
            });
            setIsEditing(false);
        }
    };

    return (
        <div className={styles.available}>
            <div className={styles.ownerName}>
                {isOwner ? "Dig" : ownerName}
                {isOwner && (
                    <PushButton title="Badminton 🏸" body={`${ownerName} er klar til at spille ${date}`}>
                        🔔
                    </PushButton>
                )}
            </div>

            <div className={styles.dateTime}>
                <div className={styles.date}>
                    {date
                        ? new Date(date).toLocaleDateString('da-DK', { weekday: 'short', day: '2-digit', month: 'short' })
                        : ''}
                </div>
                <div className={styles.time}>
                    {isEditing ? (
                        <>
                            <CustomHourDropdown
                                value={startTime}
                                onChange={setNewStartTime}
                                placeholder="Start"
                                placement="left"
                            />
                            <p>-</p>
                            <CustomHourDropdown
                                value={endTime}
                                onChange={setNewEndTime}
                                placeholder="Slut"
                                placement="right"
                            />
                        </>
                    ) : (
                        <>
                            {startTime.split(":")[0]} - {endTime.split(":")[0]}
                        </>
                    )}
                </div>
            </div>

            {isOwner && (
                <div className={styles.actions}>
                    <button className={styles.editButton} onClick={() => (isEditing ? handleEdit() : setIsEditing(true))}>
                        {isEditing ? "Gem" : "Edit"}
                    </button>
                    <button className={styles.deleteButton} onClick={handleDelete}>Slet</button>
                </div>
            )}
        </div>
    );
}