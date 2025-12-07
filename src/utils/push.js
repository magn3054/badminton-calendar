// src/utils/push.js
import { db, auth } from "../firebase";
import { doc, setDoc } from "firebase/firestore";

// Convert base64 public key to Uint8Array
function urlBase64ToUint8Array(base64String) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
        .replace(/-/g, "+")
        .replace(/_/g, "/");

    const rawData = atob(base64);
    return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

// Ask for permission + subscribe
export async function subscribeUser() {
    if (!("serviceWorker" in navigator)) {
        alert("Service workers not supported in this browser.");
        return;
    }

    const registration = await navigator.serviceWorker.ready;

    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
        alert("Notifications permission denied.");
        return;
    }

    try {
        const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(
                "BOXO6bM5hem8RUNhw32pFDov8KZ9dT0YK4ePu2lnNheyNHU4Psg1oi1VvO1AgvD-juSBAH-MEe3Tgeu6a_e0fRs"
            ),
        });

        // Save to Firebase under current user UID
        if (auth.currentUser) {
            await setDoc(doc(db, "pushSubscriptions", auth.currentUser.uid), {
                userId: auth.currentUser.uid,
                ...subscription.toJSON(),
            });
        }

        // Also send to PHP backend if you like
        await fetch("/api/save-subscriptions.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(subscription),
        });

        alert("✅ You are now subscribed to notifications!");
        
    } catch (err) {
        console.error("Failed to subscribe:", err);
        alert("❌ Subscription failed. See console.");
    }
}
