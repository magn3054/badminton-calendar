// PlayerCard.jsx
import { useState } from "react";
import { doc, updateDoc, Timestamp } from "firebase/firestore";
import { db } from "../../firebase";
import styles from "./PlayerCard.module.css";
import unknownUser from "../../assets/unknown-user.svg";

const PlayerCard = ({ player, fines, isAdmin }) => {
    const { username, email, image, details = [], fines: userFines = [], admin = false, finesMaster = false } = player;

    // Extract details safely
    const {
        birth = null,
        signaturemove = "Har intet",
        trashtalk = 0
    } = details[0] || {};

    // Convert Firestore Timestamp to string for input
    const birthValue = birth?.toDate ? birth.toDate().toISOString().substr(0, 10) : "";

    // Local editable state
    const [editablePlayer, setEditablePlayer] = useState({
        username: username || "",
        email: email || "",
        signaturemove: signaturemove,
        trashtalk: trashtalk,
        birth: birthValue,
        admin,
        finesMaster
    });

    const [saving, setSaving] = useState(false);

    // Match user fines with fines collection
    const resolvedFines = userFines
        .map(userFine => {
            const fineData = fines.find(f => f.id === userFine.fineid);
            return fineData ? { ...fineData, quantity: userFine.quantity || 1 } : null;
        })
        .filter(Boolean);

    const totalFines = resolvedFines.reduce(
        (sum, fine) => sum + fine.price * fine.quantity,
        0
    );

    // Handle save
    const handleSave = async () => {
        setSaving(true);
        try {
            const userRef = doc(db, "users", player.id);
            await updateDoc(userRef, {
                username: editablePlayer.username,
                email: editablePlayer.email,
                admin: editablePlayer.admin,
                finesMaster: editablePlayer.finesMaster,
                details: [{
                    signaturemove: editablePlayer.signaturemove,
                    trashtalk: Number(editablePlayer.trashtalk),
                    birth: editablePlayer.birth ? Timestamp.fromDate(new Date(editablePlayer.birth)) : null
                }]
            });
            alert("Bruger opdateret!");
        } catch (err) {
            console.error(err);
            alert("Kunne ikke opdatere bruger");
        } finally {
            setSaving(false);
        }
    };

    return (
        <section className={styles.playerCard}>
            <div className={styles.playerInfo}>
                <img
                    src={image || unknownUser}
                    alt={username || "Ukendt Spiller"}
                    className={styles.playerImage}
                />

                {/* Username */}
                <div className={styles.playerName}>
                    {isAdmin ? (
                        <input
                            type="text"
                            value={editablePlayer.username}
                            onChange={(e) => setEditablePlayer({ ...editablePlayer, username: e.target.value })}
                        />
                    ) : (
                        <h3>{username || "Ukendt Spiller"}</h3>
                    )}
                </div>

                <div className={styles.details}>
                    {/* Birth */}
                    <div className={styles.birthdate}>
                        <h4>Fødselsdag:</h4>
                        {isAdmin ? (
                            <input
                                type="date"
                                value={editablePlayer.birth}
                                onChange={(e) => setEditablePlayer({ ...editablePlayer, birth: e.target.value })}
                            />
                        ) : (
                            <h4>{birthValue ? new Date(birthValue).toLocaleDateString("da-DK").replace(/\./g, "/") : "Ukendt"}</h4>
                        )}
                    </div>

                    {/* Signature Move */}
                    <div className={styles.signatureMove}>
                        <h4>Signature move:</h4>
                        {isAdmin ? (
                            <input
                                type="text"
                                value={editablePlayer.signaturemove}
                                onChange={(e) => setEditablePlayer({ ...editablePlayer, signaturemove: e.target.value })}
                            />
                        ) : (
                            <h4>{signaturemove}</h4>
                        )}
                    </div>

                    {/* Trashtalk */}
                    <div className={styles.trashtalkSection}>
                        <h4>Trashtalk:</h4>
                        {isAdmin ? (
                            <label className={styles.labelTrashtalk}>
                                <div className={styles.bubbles}>
                                    {[...Array(5)].map((_, i) => (
                                        <div
                                            key={i}
                                            className={`${styles.trashNiveau} ${i < editablePlayer.trashtalk ? styles.ttActive : ""}`}
                                            onClick={() =>
                                                setEditablePlayer((prev) => ({ ...prev, trashtalk: i + 1 }))
                                            }
                                        />
                                    ))}
                                </div>
                            </label>

                        ) : (
                            <div className={styles.bubbles}>
                                {[...Array(5)].map((_, i) => (
                                    <div
                                        key={i}
                                        className={`${styles.trashNiveau} ${i < trashtalk ? styles.ttActive : ''}`}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Total fines */}
                    <div className={styles.fines}>
                        <h4>Samlet bødekasse beløb:</h4>
                        <h4>{totalFines},-</h4>
                    </div>

                    <div className={styles.specialRights}>
                        {/* Fines Master toggle - only visible to logged-in admins */}
                        {isAdmin && (
                            <label className={styles.labelAdmin} >
                                <h4>Bødekasse Mester:</h4>
                                <input
                                    className={styles.inputAdmin}
                                    type="checkbox"
                                    checked={editablePlayer.finesMaster}
                                    onChange={(e) =>
                                        setEditablePlayer({ ...editablePlayer, finesMaster: e.target.checked })
                                    }
                                    onClick={(e) => e.stopPropagation()}
                                />
                                <div className={styles.adminIndicator}></div>
                            </label>
                        )}
                        {/* Admin toggle - only visible to logged-in admins */}
                        {isAdmin && (
                            <label className={styles.labelAdmin} >
                                <h4>Admin:</h4>
                                <input
                                    className={styles.inputAdmin}
                                    type="checkbox"
                                    checked={editablePlayer.admin}
                                    onChange={(e) => {
                                        setEditablePlayer({ ...editablePlayer, admin: e.target.checked });
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                />
                                <div className={styles.adminIndicator}></div>
                            </label>
                        )}
                    </div>
                </div>
                {/* Save button */}
                {isAdmin && (
                    <button type="button" className={styles.adminSave} onClick={handleSave} disabled={saving}>
                        {saving ? "Gemmer..." : "Gem ændringer"}
                    </button>
                )}
            </div>
        </section>
    );
};

export default PlayerCard;
