//Burger.jsx
import styles from "./Profile.module.css";

function Profile({ isOpen, onClick }) {
    return (
        <button
            className={`${styles.profile} ${isOpen ? styles.open : ""}`}
            onClick={onClick}
            aria-label="Skift til profil side"
        >
            <div className={styles.outerRing}>
                <div className={styles.profileHead}></div>
                <div className={styles.profileBody}></div>
                <div className={styles.profileCrossLeft}></div>
                <div className={styles.profileCrossRight}></div>
            </div>
        </button>
    );
}

export default Profile;