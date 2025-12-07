// AddFineFormModal.jsx
import { useState } from "react";
import { db } from "../../firebase";
import { collection, addDoc } from "firebase/firestore";
import styles from "./FineModals.module.css";

export default function AddFineFormModal({ onClose, onFineAdded }) {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [price, setPrice] = useState("");
    const [multiplier, setMultiplier] = useState(false); // true/false, default false

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name || !price) return;

        try {
            await addDoc(collection(db, "fines"), {
                name,
                description,
                price: parseFloat(price),
                multiplier, // true/false state
            });
            onFineAdded(); // Opdater parent state
            onClose(); // Luk modal
        } catch (error) {
            console.error("Error adding fine:", error);
        }
    };

    return (
        <div className={styles.modalBackdrop} onClick={onClose}>
            <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
                <div className={styles.fineHeader}>
                    <h2>Tilføj ny bøde</h2>
                    <button className={styles.closeButton} onClick={onClose}>X</button>
                </div>

                <form className={styles.addFineForm} onSubmit={handleSubmit}>
                    <div className={styles.formContent}>
                        <div className={styles.titleContainer}>
                            <label>Titel:</label>
                            <input value={name} onChange={e => setName(e.target.value)} required />
                        </div>

                        <div className={styles.descriptionContainer}>
                            <label>Beskrivelse:</label>
                            <input value={description} onChange={e => setDescription(e.target.value)} required />
                        </div>

                        <div className={styles.priceContainer}>
                            <label>Pris:</label>
                            <input
                                type="number"
                                value={price}
                                onChange={e => setPrice(e.target.value)}
                                required
                            />
                        </div>

                        <div className={styles.multiplyContainer}>
                            <label className={styles.labelMultiply}>
                                {/* <h4>Multiplier?</h4> */}
                                Multiplier:
                                <input
                                    className={styles.inputMultiply}
                                    name="multiply"
                                    type="checkbox"
                                    checked={multiplier}
                                    onChange={e => setMultiplier(e.target.checked)}
                                />
                                <div className={styles.multiplyIndicator}></div>
                            </label>
                        </div>
                    </div>
                    <button type="submit" className={styles.addButton}>Tilføj bøde</button>
                </form>
            </div>
        </div>
    );
}
