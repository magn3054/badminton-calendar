//Calendar/CalendarView.jsx
import { useState } from "react";
import styles from "./CalendarView.module.css";

export default function CalendarView({ value, onChange }) {
    const today = new Date();
    const [currentMonth, setCurrentMonth] = useState(today.getMonth());
    const [currentYear, setCurrentYear] = useState(today.getFullYear());

    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();

    const handlePrevMonth = () => {
        if (currentMonth === 0) {
            setCurrentMonth(11);
            setCurrentYear(currentYear - 1);
        } else {
            setCurrentMonth(currentMonth - 1);
        }
    };

    const handleNextMonth = () => {
        if (currentMonth === 11) {
            setCurrentMonth(0);
            setCurrentYear(currentYear + 1);
        } else {
            setCurrentMonth(currentMonth + 1);
        }
    };

    const handleDateClick = (day) => {
        const selectedDate = new Date(currentYear, currentMonth, day);
        const year = selectedDate.getFullYear();
        const month = String(selectedDate.getMonth() + 1).padStart(2, "0");
        const dag = String(day).padStart(2, "0");
        onChange(`${year}-${month}-${dag}`);
    };

    const monthNames = [
        "Januar", "Februar", "Marts", "April", "Maj", "Juni",
        "Juli", "August", "September", "Oktober", "November", "December"
    ];

    return (
        <div className={styles.calendarWrapper}>
            <div className={styles.header}>
                <button onClick={handlePrevMonth}>&lt;</button>
                <span>{monthNames[currentMonth]} {currentYear}</span>
                <button onClick={handleNextMonth}>&gt;</button>
            </div>
            <div className={styles.weekdays}>
                {["Man", "Tir", "Ons", "Tor", "Fre", "Lør", "Søn"].map(d => (
                    <div key={d} className={styles.weekday}>{d}</div>
                ))}
            </div>
            <div className={styles.daysGrid}>
                {Array(firstDay === 0 ? 6 : firstDay - 1).fill(null).map((_, i) => (
                    <div key={`empty-${i}`} className={styles.empty}></div>
                ))}
                {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
                    const dayIso = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

                    return (
                        <div
                            key={day}
                            className={`${styles.day} ${value === dayIso ? styles.selected : ""}`}
                            onClick={() => handleDateClick(day)}
                        >
                            {day}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
