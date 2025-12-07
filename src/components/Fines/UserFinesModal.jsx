import { doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "../../firebase";
import styles from "./FineModals.module.css";
import { useState } from "react";

export default function UserFinesModal({ user, allFines, onClose, isAdmin, onAddFineClick, onFineRemoved }) {
    if (!user) return null;

    // Start med de bøder brugeren har
    const [fines, setFines] = useState(user.userFines || []);

    const handleRemoveFine = async (fineToRemove) => {
        if (!isAdmin) return;

        try {
            const userRef = doc(db, "users", user.id);
            const userSnap = await getDoc(userRef);

            if (userSnap.exists()) {
                const currentFines = userSnap.data().fines || [];

                // Fjern bøden med matching id
                const newFines = currentFines.filter(f => f.id !== fineToRemove.id);

                await updateDoc(userRef, { fines: newFines });

                // Genopbyg UI med basePrice, multiplier og totalPrice
                const augmentedFines = newFines.map(f => {
                    const fineData = allFines.find(fd => fd.id === f.fineid);
                    if (!fineData) return f;

                    const basePrice = fineData.price;
                    const multiplier = f.multiplier ?? 1;
                    const totalPrice = basePrice * multiplier;

                    return { ...f, name: fineData.name, basePrice, multiplier, totalPrice };
                });

                setFines(augmentedFines);
                if (onFineRemoved) onFineRemoved();
            }
        } catch (error) {
            console.error("Error removing fine:", error);
        }
    };

    return (
        <div className={styles.modalBackdrop} onClick={onClose}>
            <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
                <div className={styles.fineHeader}>
                    <h2>{user.username || "Ukendt spiller"}</h2>
                    <button className={styles.closeButton} onClick={onClose}>X</button>
                </div>

                <ul className={styles.userFinesList}>
                    {isAdmin && (
                        <li className={styles.fineItem}>
                            <button
                                className={styles.newFineButton}
                                onClick={() => onAddFineClick(user)}
                            >
                                Giv ny bøde
                            </button>
                        </li>
                    )}

                    {fines.length > 0 ? (
                        fines.map((fine, i) => (
                            <li key={i} className={styles.fineItem}>
                                <div className={styles.fineInfo}>
                                    <h3>{fine.name}</h3>
                                    {fine.multiplier && fine.multiplier !== 1 && (
                                        <h4 style={{ marginRight: "auto", marginLeft: "0.5ch" }}>x{fine.multiplier}</h4>
                                    )}
                                    <h4>{fine.totalPrice ?? fine.basePrice},-</h4>
                                </div>
                                {isAdmin && (
                                    <button
                                        className={styles.deleteFineButton}
                                        onClick={() => handleRemoveFine(fine)}
                                    >
                                        X
                                    </button>
                                )}
                            </li>
                        ))
                    ) : (
                        <li>Ingen bøder</li>
                    )}
                </ul>
            </div>
        </div>
    );
}
