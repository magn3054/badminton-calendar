import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../../firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, getDoc, Timestamp } from "firebase/firestore";
import styles from "./Admin.module.css";
import unknownUser from "../../assets/unknown-user.svg";

export default function Admin() {
    const navigate = useNavigate();

    useEffect(() => {
        const checkAdmin = async () => {
            if (!auth.currentUser) {
                navigate("/menu");
                return;
            }

            const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
            if (!userDoc.exists() || !userDoc.data().admin) {
                // Not an admin
                navigate("/menu");
            }
        };

        checkAdmin();
    }, [navigate]);

    const initialProfile = {
        username: "",
        email: "",
        password: "",
        admin: false,
        finesMaster: false,
        image: "",
        birth: "",
        signaturemove: "",
        trashtalk: 0
    };

    const [profile, setProfile] = useState(initialProfile);
    const [status, setStatus] = useState("");

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setProfile((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : (name === "trashtalk" ? Math.min(Math.max(Number(value), 0), 5) : value)
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus("Creating user...");

        try {
            const passwordToUse = profile.password || "Qwerty";
            const imageToUse = profile.image.trim() || unknownUser;
            const capitalizedUsername = profile.username.charAt(0).toUpperCase() + profile.username.slice(1);

            // 1. Create user in Firebase Auth
            const userCredential = await createUserWithEmailAndPassword(
                auth,
                profile.email,
                passwordToUse
            );
            const uid = userCredential.user.uid;

            // 2. Convert birth to Firestore timestamp (if provided)
            const birthTimestamp = profile.birth
                ? Timestamp.fromDate(new Date(profile.birth))
                : null;

            // 3. Create Firestore document
            await setDoc(doc(db, "users", uid), {
                admin: profile.admin,
                email: profile.email,
                image: imageToUse,
                details: [
                    {
                        birth: birthTimestamp,
                        signaturemove: profile.signaturemove,
                        trashtalk: profile.trashtalk
                    }
                ],
                fines: [],
                username: capitalizedUsername
            });

            setStatus("User created successfully!");
            setProfile(initialProfile);
        } catch (err) {
            console.error(err);
            setStatus(`Error: ${err.message}`);
        }
    };

    return (
        <div>
            <div className={styles.adminContainer}>
                <h2>Create New User</h2>
                <form className={styles.addUserForm} onSubmit={handleSubmit}>
                    {/* <label className={styles.labelAdmin}>
                        <h4>Admin:</h4>
                        <input
                            className={styles.inputAdmin}
                            name="admin"
                            type="checkbox"
                            checked={profile.admin}
                            onChange={handleChange}
                        />
                        <div className={styles.adminIndicator}></div>
                    </label> */}
                    <label className={styles.labelName}>
                        <h4>Username:</h4>
                        <input
                            className={styles.inputName}
                            name="username"
                            value={profile.username}
                            onChange={handleChange}
                            required
                        />
                    </label>
                    <label className={styles.labelEmail}>
                        <h4>Email:</h4>
                        <input
                            className={styles.inputEmail}
                            name="email"
                            type="email"
                            value={profile.email}
                            onChange={handleChange}
                            required
                        />
                    </label>
                    <label className={styles.labelPassword}>
                        <h4>Password:</h4>
                        <input
                            className={styles.inputPassword}
                            name="password"
                            type="password"
                            value={profile.password}
                            onChange={handleChange}
                        // required
                        // minLength={6}
                        />
                    </label>
                    {/* <label className={styles.labelImage}> */}
                        {/* <h4>Image URL:</h4> */}
                        {/* <input
                            className={styles.inputImage}
                            name="image"
                            //value={profile.image}
                            //onChange={handleChange}
                        /> */}
                    {/* </label> */}
                    <label className={styles.labelBirth}>
                        <h4>Birthday:</h4>
                        <input
                            className={styles.inputBirth}
                            name="birth"
                            type="date"
                            value={profile.birth}
                            onChange={handleChange}
                            required
                        />
                    </label>
                    <label className={styles.labelSignatureMove}>
                        <h4>Signature Move:</h4>
                        <input
                            className={styles.inputSignatureMove}
                            name="signaturemove"
                            value={profile.signaturemove}
                            onChange={handleChange}
                        />
                    </label>
                    <label className={styles.labelTrashtalk}>
                        <h4>Trashtalk:</h4>
                        <div className={styles.radioGroup}>
                            {[1, 2, 3, 4, 5].map((level) => (
                                <div
                                    key={level}
                                    className={`${styles.radioButton} ${profile.trashtalk >= level ? styles.checked : ""}`}
                                    onClick={() =>
                                        setProfile((prev) => ({ ...prev, trashtalk: level }))
                                    }
                                ></div>
                            ))}
                        </div>
                    </label>

                    <button className={styles.submitButton} type="submit">Create User</button>
                </form>
                {status && <p>{status}</p>}
            </div>
            <div>

                
            </div>
        </div>
    );
}
