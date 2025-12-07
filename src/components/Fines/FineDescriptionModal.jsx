// FineDescriptionModal.jsx
import React, { useState } from "react";
import { doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "../../firebase";
import styles from "./FineModals.module.css";

export default function FineDescriptionModal({ fine, onClose, isAdmin, onUpdate }) {
    if (!fine) return null;

    const [editableFine, setEditableFine] = useState({
        name: fine.name || "",
        price: fine.price || 0,
        description: fine.description || ""
    });

    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        setSaving(true);
        try {
            const fineRef = doc(db, "fines", fine.id);
            await updateDoc(fineRef, {
                name: editableFine.name,
                price: Number(editableFine.price),
                description: editableFine.description
            });

            onUpdate({ ...fine, ...editableFine });

            alert("Bøde opdateret!");
        } catch (err) {
            console.error(err);
            alert("Kunne ikke opdatere bøden");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (window.confirm("Er du sikker på, at du vil slette denne bøde?")) {
            try {
                const fineRef = doc(db, "fines", fine.id);
                await deleteDoc(fineRef);

                onUpdate(null, fine.id);

                // alert("Bøde slettet!");
                onClose();
            } catch (err) {
                console.error(err);
                alert("Kunne ikke slette bøden");
            }
        }
    };

    return (
        <div className={styles.modalBackdrop} onClick={onClose}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                <div className={styles.fineHeader}>
                    {isAdmin ? (
                        <input
                            type="text"
                            value={editableFine.name}
                            onChange={(e) =>
                                setEditableFine({ ...editableFine, name: e.target.value })
                            }
                            className={styles.fineTitle}
                        />
                    ) : (
                        <h2>{fine.name}</h2>
                    )}
                    <button className={styles.closeButton} onClick={onClose}>X</button>
                </div>

                <div className={styles.fineDetails}>
                    <div className={styles.descriptionSection}>
                        {isAdmin ? (
                            <textarea
                                className={styles.fineDescription}
                                value={editableFine.description}
                                onChange={(e) =>
                                    setEditableFine({ ...editableFine, description: e.target.value })
                                }
                                rows="3"
                            />
                        ) : (
                            <h4>{fine.description}</h4>
                        )}
                    </div>
                    {isAdmin && (
                        <div className={styles.priceSection}>
                            <input
                                type="number"
                                value={editableFine.price}
                                onChange={(e) =>
                                    setEditableFine({ ...editableFine, price: e.target.value })
                                }
                            />
                            <h4>,-</h4>
                        </div>
                    )}
                </div>


                {isAdmin && (
                    <div className={styles.adminActions}>
                        <button
                            className={styles.deleteFineButton}
                            onClick={handleDelete}
                        >
                            Slet
                        </button>
                        <button
                            className={styles.saveButton}
                            onClick={handleSave}
                            disabled={saving}
                        >
                            {saving ? "Gemmer..." : "Gem ændringer"}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}