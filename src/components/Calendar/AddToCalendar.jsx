import styles from "./Calendar.module.css";

export default function AddToCalendar({ title, description, startDate, endDate }) {
    const handleDownloadICS = () => {
        // Ensure date format: YYYYMMDDTHHmmssZ (UTC)
        const formatDate = (date) => {
            return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
        };

        const icsContent = [
            "BEGIN:VCALENDAR",
            "VERSION:2.0",
            "CALSCALE:GREGORIAN",
            "PRODID:-//Badminton//CalendarEvent//EN",
            "BEGIN:VEVENT",
            `UID:${Date.now()}@mdamsgaard.dk`,
            `DTSTAMP:${formatDate(new Date())}`,
            `DTSTART:${formatDate(new Date(startDate))}`,
            `DTEND:${formatDate(new Date(endDate))}`,
            `SUMMARY:${title}`,
            `DESCRIPTION:${description}`,
            "END:VEVENT",
            "END:VCALENDAR"
        ].join("\r\n"); // CRLF is required

        const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = url;
        link.download = `${title.replace(/\s+/g, "_")}.ics`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <button className={styles.addToCalendarButton} onClick={handleDownloadICS}>
            <h4>📅</h4>
        </button>
    );
}
