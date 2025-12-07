import { signOut } from "firebase/auth";
import { auth } from "../../firebase";
import styles from "./LogoutButton.module.css";

export default function LogoutButton() {
    const handleLogout = async () => {
        try {
            await signOut(auth);
            console.log("User signed out");
        } catch (error) {
            console.error("Error signing out:", error);
        }
    };

    return (
        <button className={styles.logoutButton} onClick={handleLogout}>
            Log ud
        </button>
    );
}
