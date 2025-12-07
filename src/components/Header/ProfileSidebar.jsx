// Header/ProfileSidebar.jsx
import { useEffect, useState } from "react";
import { auth, db } from "../../firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { sendPasswordResetEmail } from "firebase/auth";
import styles from "./ProfileSidebar.module.css";
import unknownUser from "../../assets/unknown-user.svg";
import { subscribeUser } from "../../utils/push";
import { initGIS, requestAccessToken, uploadToDrive } from "../../utils/googleDrive";

const CLIENT_ID = "739511584644-t9gp68edpmqhk1icci243rpms9ejj58t.apps.googleusercontent.com"; // GIS client ID

function ProfileSidebar({ open, onClose }) {
    const [userData, setUserData] = useState(null);
    const [fineDetails, setFineDetails] = useState([]);
    const [gisToken, setGisToken] = useState(null);
    const [isSubscribed, setIsSubscribed] = useState(false);

    const DRIVE_FOLDER_ID = "1Z2deHLZfOGm-ej1osZFPV0QZ35QcZhtJ";

    // Fetch user data from Firestore
    useEffect(() => {
        const fetchUserData = async () => {
            if (!auth.currentUser) return;
            const userRef = doc(db, "users", auth.currentUser.uid);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) setUserData(userSnap.data());
        };
        fetchUserData();
        // Initialize GIS for Google Drive uploads
        // initGIS(CLIENT_ID);
    }, []);


    // Notification subscription state
    useEffect(() => {
        async function checkSubscription() {
            if (!("serviceWorker" in navigator)) return;

            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();

            if (subscription && Notification.permission === "granted") {
                setIsSubscribed(true);
            }
        }

        checkSubscription();
    }, []);

    const handleNotificationToggle = async () => {
        if (isSubscribed) {
            // Disable notifications
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();
            if (subscription) {
                await subscription.unsubscribe();
                setIsSubscribed(false);
                alert("🔕 Notifications disabled");
            }
        } else {
            // Enable notifications
            await subscribeUser();
            setIsSubscribed(true);
        }
    };


    // Authenticate with Google Drive if needed
    const handleAuthenticate = async () => {
        if (gisToken) return true; // already authenticated

        try {
            initGIS(CLIENT_ID);  // set up GIS client
            const token = await requestAccessToken(); // request token via popup
            setGisToken(token);
            return true;
        } catch (error) {
            console.error("Google authentication failed:", error);
            alert("Kunne ikke logge ind med Google. Prøv igen.");
            return false;
        }
    };

    // Fetch fine details when userData is loaded
    useEffect(() => {
        const loadFineDetails = async () => {
            if (!userData?.fines) return;

            const details = await Promise.all(
                userData.fines.map(async (fine) => {
                    const fineRef = doc(db, "fines", fine.fineid);
                    const fineSnap = await getDoc(fineRef);
                    if (fineSnap.exists()) {
                        const basePrice = fineSnap.data().price;
                        const multiplier = fine.multiplier ?? 1;
                        const totalPrice = basePrice * multiplier;
                        return {
                            ...fine,
                            ...fineSnap.data(),
                            basePrice,
                            multiplier,
                            totalPrice,
                        };
                    }
                    return fine; // fallback if fine not found
                })
            );
            setFineDetails(details);
        };
        loadFineDetails();
    }, [userData]);

    // Handle profile image change
    const handleChangeProfileImage = async (e) => {
        const file = e.target.files[0];
        if (!file) return;


        const convertToJpeg = async (file) => {
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const img = new Image();
                    img.onload = () => {
                        const canvas = document.createElement("canvas");
                        canvas.width = img.width;
                        canvas.height = img.height;
                        const ctx = canvas.getContext("2d");
                        ctx.drawImage(img, 0, 0);
                        canvas.toBlob((blob) => {
                            resolve(new File([blob], file.name.replace(/\.\w+$/, ".jpg"), { type: "image/jpeg" }));
                        }, "image/jpeg", 0.95);
                    };
                    img.src = event.target.result;
                };
                reader.readAsDataURL(file);
            });
        };

        const fileToUpload = await convertToJpeg(file);

        try {
            if (!auth.currentUser) {
                alert("Bruger ikke logget ind");
                return;
            }

            // Use UID as filename to overwrite previous upload
            const url = await uploadToDrive(fileToUpload, DRIVE_FOLDER_ID, auth.currentUser.uid);

            // Update Firestore
            const userRef = doc(db, "users", auth.currentUser.uid);
            await updateDoc(userRef, { image: url });

            // Update local state
            setUserData((prev) => ({ ...prev, image: url }));

            alert("Profilbillede opdateret!");
        } catch (error) {
            console.error("Fejl ved upload:", error);
            alert("Kunne ikke opdatere billedet. Prøv igen senere.");
        }
    };

    // Click handler for profile image
    const handleProfileImageClick = async () => {
        if (!gisToken) {
            const authenticated = await handleAuthenticate();
            if (authenticated) {
                alert("Godkendelse gennemført ✅ Klik igen for at vælge billede.");
            }
        } else {
            document.getElementById("profileImageInput").click();
        }
    };

    if (!userData) return null;

    // Extract birth date if present
    const userDetails = userData.details?.[0] || {};
    const birthDate = userDetails.birth ? userDetails.birth.toDate().toLocaleDateString() : "Unknown";

    // Trigger password reset
    const handlePasswordReset = async () => {
        if (!auth.currentUser?.email) return alert("Ingen email fundet.");

        try {
            await sendPasswordResetEmail(auth, auth.currentUser.email);
            alert("En email til nulstilling af adgangskoden er sendt.");
        } catch (error) {
            console.error("Fejl ved nulstilling af adgangskode:", error);
            alert("Kunne ikke sende nulstillingsmail.");
        }
    };

    return (
        <div className={`${styles.sidebar} ${open ? styles.open : ""}`}>
            <nav>
                <div className={styles.userInfo}>
                    <img
                        src={userData.image || unknownUser}
                        alt="Profile"
                        className={styles.profileImage}
                        onClick={handleProfileImageClick}
                    />
                    <input
                        id="profileImageInput"
                        type="file"
                        accept="image/*"
                        style={{ display: "none" }}
                        onChange={handleChangeProfileImage}
                    />

                    <div className={styles.birthDateContainer}>
                        <svg className={styles.calendarIcon} viewBox="0 0 64 59.25">
                            <path d="M64,21.24s0,0,0,0v-8.01c0-1.66-.68-3.17-1.77-4.26-1.09-1.09-2.6-1.77-4.26-1.77h-5.01V1.23c0-.68-.55-1.23-1.23-1.23s-1.23.55-1.23,1.23v5.97H13.51V1.23c0-.68-.55-1.23-1.23-1.23s-1.23.55-1.23,1.23v5.97h-5.01c-1.66,0-3.17.68-4.26,1.77-1.09,1.09-1.77,2.6-1.77,4.26v39.98c0,1.66.68,3.17,1.77,4.26,1.09,1.09,2.6,1.77,4.26,1.77h51.94c1.66,0,3.17-.68,4.26-1.77,1.09-1.09,1.77-2.6,1.77-4.26v-31.97s0,0,0,0ZM3.52,10.72c.65-.65,1.54-1.05,2.52-1.05h5.01v1.21c-.65.2-1.24.54-1.71,1.01-.75.75-1.22,1.79-1.22,2.94s.47,2.19,1.22,2.94,1.79,1.22,2.94,1.22,2.19-.47,2.94-1.22c.75-.75,1.22-1.79,1.22-2.94s-.47-2.19-1.22-2.94c-.47-.47-1.06-.81-1.71-1.01v-1.21h36.97v1.21c-.65.2-1.24.54-1.71,1.01-.75.75-1.22,1.79-1.22,2.94s.47,2.19,1.22,2.94c.75.75,1.79,1.22,2.94,1.22s2.19-.47,2.94-1.22,1.22-1.79,1.22-2.94-.47-2.19-1.22-2.94c-.47-.47-1.06-.81-1.71-1.01v-1.21h5.01c.98,0,1.87.4,2.52,1.05.65.65,1.05,1.54,1.05,2.52v6.77H2.47v-6.77c0-.98.4-1.87,1.05-2.52ZM11.08,13.64c.3-.3.72-.49,1.18-.49,0,0,.01,0,.02,0s.01,0,.02,0c.46,0,.88.19,1.18.49s.5.73.5,1.2-.19.89-.5,1.2-.73.5-1.2.5-.89-.19-1.2-.5-.5-.73-.5-1.2.19-.89.5-1.2ZM50.52,13.64c.3-.3.72-.49,1.18-.49,0,0,.01,0,.02,0s.01,0,.02,0c.46,0,.88.19,1.18.49s.5.73.5,1.2-.19.89-.5,1.2c-.31.31-.73.5-1.2.5s-.89-.19-1.2-.5c-.31-.31-.5-.73-.5-1.2s.19-.89.5-1.2ZM60.48,55.73c-.65.65-1.54,1.05-2.52,1.05H6.03c-.98,0-1.87-.4-2.52-1.05-.65-.65-1.05-1.54-1.05-2.52v-30.74h59.06v30.74c0,.98-.4,1.87-1.05,2.52Z" /> <path d="M33.01,26.4h-4.41c-.68,0-1.23.55-1.23,1.23s.55,1.23,1.23,1.23h4.41c.68,0,1.23-.55,1.23-1.23s-.55-1.23-1.23-1.23Z" /> <path d="M44.81,26.4h-4.41c-.68,0-1.23.55-1.23,1.23s.55,1.23,1.23,1.23h4.41c.68,0,1.23-.55,1.23-1.23s-.55-1.23-1.23-1.23Z" /> <path d="M56,26.4h-4.41c-.68,0-1.23.55-1.23,1.23s.55,1.23,1.23,1.23h4.41c.68,0,1.23-.55,1.23-1.23s-.55-1.23-1.23-1.23Z" /> <path d="M12.41,34.4h-4.41c-.68,0-1.23.55-1.23,1.23s.55,1.23,1.23,1.23h4.41c.68,0,1.23-.55,1.23-1.23s-.55-1.23-1.23-1.23Z" /> <path d="M22.71,34.4h-4.41c-.68,0-1.23.55-1.23,1.23s.55,1.23,1.23,1.23h4.41c.68,0,1.23-.55,1.23-1.23s-.55-1.23-1.23-1.23Z" /> <path d="M33.01,34.4h-4.41c-.68,0-1.23.55-1.23,1.23s.55,1.23,1.23,1.23h4.41c.68,0,1.23-.55,1.23-1.23s-.55-1.23-1.23-1.23Z" /> <path d="M44.81,34.4h-4.41c-.68,0-1.23.55-1.23,1.23s.55,1.23,1.23,1.23h4.41c.68,0,1.23-.55,1.23-1.23s-.55-1.23-1.23-1.23Z" /> <path d="M56,34.4h-4.41c-.68,0-1.23.55-1.23,1.23s.55,1.23,1.23,1.23h4.41c.68,0,1.23-.55,1.23-1.23s-.55-1.23-1.23-1.23Z" /> <path d="M12.41,42.39h-4.41c-.68,0-1.23.55-1.23,1.23s.55,1.23,1.23,1.23h4.41c.68,0,1.23-.55,1.23-1.23s-.55-1.23-1.23-1.23Z" /> <path d="M22.71,42.39h-4.41c-.68,0-1.23.55-1.23,1.23s.55,1.23,1.23,1.23h4.41c.68,0,1.23-.55,1.23-1.23s-.55-1.23-1.23-1.23Z" /> <path d="M33.01,42.39h-4.41c-.68,0-1.23.55-1.23,1.23s.55,1.23,1.23,1.23h4.41c.68,0,1.23-.55,1.23-1.23s-.55-1.23-1.23-1.23Z" /> <path d="M44.81,42.39h-4.41c-.68,0-1.23.55-1.23,1.23s.55,1.23,1.23,1.23h4.41c.68,0,1.23-.55,1.23-1.23s-.55-1.23-1.23-1.23Z" /> <path d="M56,42.39h-4.41c-.68,0-1.23.55-1.23,1.23s.55,1.23,1.23,1.23h4.41c.68,0,1.23-.55,1.23-1.23s-.55-1.23-1.23-1.23Z" /> <path d="M12.41,50.39h-4.41c-.68,0-1.23.55-1.23,1.23s.55,1.23,1.23,1.23h4.41c.68,0,1.23-.55,1.23-1.23s-.55-1.23-1.23-1.23Z" /> <path d="M22.71,50.39h-4.41c-.68,0-1.23.55-1.23,1.23s.55,1.23,1.23,1.23h4.41c.68,0,1.23-.55,1.23-1.23s-.55-1.23-1.23-1.23Z" /> <path d="M33.01,50.39h-4.41c-.68,0-1.23.55-1.23,1.23s.55,1.23,1.23,1.23h4.41c.68,0,1.23-.55,1.23-1.23s-.55-1.23-1.23-1.23Z" />
                        </svg>
                        <h2>{birthDate}</h2>
                    </div>

                    <p className={styles.email}>{userData.email}</p>
                    <p className={styles.password} onClick={handlePasswordReset}>
                        Skift adgangskode
                    </p>
                    <button onClick={handleNotificationToggle}>
                        {isSubscribed ? "🔕 Slå Notifikationer Fra" : "🔔 Slå Notifikationer Til"}
                    </button>
                </div>
                {/* Render the fines */}
                <div className={styles.finesContainer}>
                    <div className={styles.finesHeader}>
                        <h2>Dine Bøder</h2>
                        <h3>{fineDetails.reduce((acc, fine) => acc + fine.totalPrice, 0)},-</h3>
                    </div>
                    <div className={styles.fines}>
                        {fineDetails.length > 0 ? (
                            [...fineDetails]
                                .sort((a, b) => {
                                    // Først: ubetalte før betalte
                                    if (a.paid !== b.paid) return a.paid ? 1 : -1;

                                    // Dernæst: nyeste dato først
                                    const dateA = new Date(a.assigned);
                                    const dateB = new Date(b.assigned);
                                    return dateB - dateA; // nyeste først
                                })
                                .map((fine, index) => (
                                    <div
                                        key={index}
                                        className={`${styles.fineItem} ${!fine.paid ? styles.fineStatusNotPaid : ""}`}
                                    >
                                        <h2 className={styles.fineName}>{fine.name}</h2>
                                        {fine.multiplier && fine.multiplier > 1 && (
                                            <h5 style={{ textAlign: "left" }}>{fine.basePrice} x {fine.multiplier}</h5>
                                        )}
                                        <h2 className={styles.finePrice}>{fine.totalPrice ?? fine.basePrice},-</h2>
                                        <h2 className={styles.fineAssigned}>
                                            {new Date(fine.assigned).toLocaleDateString()}
                                        </h2>
                                    </div>
                                ))
                                
                        ) : (
                            <h2>Ingen bøder</h2>
                        )}
                    </div>
                </div>
            </nav>
        </div>
    );
}

export default ProfileSidebar;
