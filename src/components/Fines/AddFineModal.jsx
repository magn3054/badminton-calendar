import { useState } from "react";
import styles from "./FineModals.module.css";
import { db } from "../../firebase";
import { doc, updateDoc, arrayUnion } from "firebase/firestore";
import { v4 as uuidv4 } from "uuid";

export default function AddFineModal({ user, fines, onClose, onAddFine }) {
    const [selectedFine, setSelectedFine] = useState(null);
    const [multiplier, setMultiplier] = useState(1);

    const handleFineClick = (fine) => {
        if (fine.multiply) {
            // Gå til trin 2 (multiplier input)
            setSelectedFine(fine);
            setMultiplier(1);
        } else {
            // Tilføj direkte med multiplier = 1
            handleAddFineToUser(fine, 1);
        }
    };

    const handleAddFineToUser = async (fine, multiplierValue) => {
        if (!user || !fine) return;

        try {
            const basePrice = fine.price;
            const totalPrice = basePrice * multiplierValue;

            const userRef = doc(db, "users", user.id);
            await updateDoc(userRef, {
                fines: arrayUnion({
                    id: uuidv4(),
                    fineid: fine.id,
                    basePrice: basePrice,
                    multiplier: multiplierValue,
                    totalPrice: totalPrice,
                    assigned: Date.now(),
                    paid: false
                })
            });

            onAddFine();
            onClose();
        } catch (error) {
            console.error("Error adding fine to user:", error);
        }
    };

    const handleConfirmMultiplier = () => {
        handleAddFineToUser(selectedFine, multiplier);
    };

    return (
        <div className={styles.modalBackdrop} onClick={onClose}>
            <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
                <div className={styles.fineHeader}>
                    <h2>Tilføj bøde til {user.username}</h2>
                    <button className={styles.closeButton} onClick={onClose}>X</button>
                </div>

                {!selectedFine ? (
                    // TRIN 1: Vælg bøde
                    <ul className={styles.userFinesList}>
                        {fines.length > 0 ? (
                            fines.map(fine => (
                                <li
                                    key={fine.id}
                                    className={styles.fineItem}
                                    onClick={() => handleFineClick(fine)}
                                >
                                    <div className={styles.fineInfo}>
                                        <h3>{fine.name}</h3>
                                        <h4>{fine.price},-</h4>
                                    </div>
                                </li>
                            ))
                        ) : (
                            <li>Ingen bøder</li>
                        )}
                    </ul>
                ) : (
                    // TRIN 2: Multiplier hvis multiply === true
                    <div className={styles.multiplierStep}>
                        <h3 className={styles.multiplierFineTitle}>{selectedFine.name}</h3>
                        <h3>Indtast multiplier:</h3>
                        <input
                            type="number"
                            min="1"
                            value={multiplier}
                            onChange={e => setMultiplier(Number(e.target.value))}
                        />
                        <button
                            className={styles.confirmButton}
                            onClick={handleConfirmMultiplier}
                        >
                            Tilføj bøde
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
