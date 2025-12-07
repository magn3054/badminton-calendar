import { useState } from "react";
import { auth, db } from "../../firebase";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import styles from "./Auth.module.css";

export default function Auth({ setUser }) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [username, setUsername] = useState("");
    const [isLogin, setIsLogin] = useState(true);
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        try {
            if (isLogin) {
                const res = await signInWithEmailAndPassword(auth, email, password);
                setUser(res.user);
            } else {
                const res = await createUserWithEmailAndPassword(auth, email, password);
                await setDoc(doc(db, "users", res.user.uid), {
                    username,
                    email
                });
                setUser(res.user);
            }
        } catch (err) {
            console.error(err);
            setError("Forkert email eller adgangskode");
        }
    };

    return (
        <div className={styles.authContainer}>
            <div className={`${styles.flipCard} ${isLogin ? "" : styles.flipped}`}>
                {/* Front - Login */}
                <form onSubmit={handleSubmit} className={`${styles.form} ${styles.front}`}>
                    <h2 className={styles.title}>Login</h2>
                    <div className={styles.inputs}>
                        <input
                            type="email"
                            placeholder="Email"
                            className={styles.input}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                        <input
                            type="password"
                            placeholder="Password"
                            className={styles.input}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                    <div className={styles.actions}>
                        <button type="submit" className={styles.button}>
                            Login
                        </button>
                        {/* <p onClick={() => setIsLogin(false)} className={styles.toggle}>
                            Ingen konto? Opret dig her
                        </p> */}
                        {error && <p style={{ color: "red" }}>{error}</p>}
                    </div>
                </form>

                {/* Back - Register */}
                <form onSubmit={handleSubmit} className={`${styles.form} ${styles.back}`}>
                    <h2 className={styles.title}>Registrer</h2>
                    <div className={styles.inputs}>
                        <input
                            type="text"
                            placeholder="Username"
                            className={styles.input}
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                        />
                        <input
                            type="email"
                            placeholder="Email"
                            className={styles.input}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                        <input
                            type="password"
                            placeholder="Password"
                            className={styles.input}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                    <div className={styles.actions}>
                        <button type="submit" className={styles.button}>
                            Opret konto
                        </button>
                        <p onClick={() => setIsLogin(true)} className={styles.toggle}>
                            Er du medlem? Login
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
}
