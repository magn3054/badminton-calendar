// PushButton.jsx
import React from "react";

export default function PushButton({ title, body, targetUserIds = [], children }) {
    const handleClick = async () => {
        try {
            const res = await fetch("/api/send-push.php", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title, body, targetUserIds: [] }),
            });
            const data = await res.json();
            console.log(data);
            // alert(`Push sent:\n${title}\n${body}`);
        } catch (err) {
            console.error(err);
            alert("Error sending push notification");
        }
    };

    return (
        <button
            onClick={handleClick}
            style={{
                padding: "0.25rem",
                border: "none",
                cursor: "pointer",
            }}
        >
            {children || "Send Push"}
        </button>
    );
}
