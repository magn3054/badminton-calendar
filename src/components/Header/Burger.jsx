//Burger.jsx
import styles from "./Burger.module.css";

function Burger({ isOpen, onClick }) {
    return (
        <button
            className={`${styles.burger} ${isOpen ? styles.open : ""}`}
            onClick={onClick}
            aria-label="Skift til menu"
        >
            <div className={styles.topLine}><div className={styles.topBall}></div></div>
            <div className={styles.midLine}><div className={styles.midBall}></div></div>
            <div className={styles.botLine}><div className={styles.botBall}></div></div>
        </button>
    );
}

export default Burger;
