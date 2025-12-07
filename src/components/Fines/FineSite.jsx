// FineSite.jsx
import { useState, useEffect } from "react";
import { auth, db } from "../../firebase";
import { getDoc, getDocs, doc, collection, onSnapshot } from "firebase/firestore";
import FineDescriptionModal from "./FineDescriptionModal";
import UserFinesModal from "./UserFinesModal";
import AddFineModal from "./AddFineModal";
import AddFineFormModal from "./AddFineFormModal";
import styles from "./FineSite.module.css";

export default function FineSite() {
    const [fines, setFines] = useState([]);
    const [users, setUsers] = useState([]);
    const [isFineMaster, setIsFineMaster] = useState(false);

    const [activeFine, setActiveFine] = useState(null);
    const [activeUser, setActiveUser] = useState(null);
    const [addFineUser, setAddFineUser] = useState(null);

    const [addFineModal, setAddFineModal] = useState(false);

    // ✅ Check logged in user's role
    const fetchFineMasterStatus = async () => {
        if (auth.currentUser) {
            const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
            if (userDoc.exists()) {
                setIsFineMaster(
                    userDoc.data().finesMaster === true || userDoc.data().admin === true
                );
            }
        }
    };

    // ✅ Real-time listener for fines & users
    useEffect(() => {
        fetchFineMasterStatus();

        // Fines snapshot
        const unsubFines = onSnapshot(collection(db, "fines"), (snapshot) => {
            const finesList = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));
            setFines(finesList);
        });

        // Users snapshot
        const unsubUsers = onSnapshot(collection(db, "users"), (snapshot) => {
            const usersList = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));
            setUsers(usersList);
        });

        return () => {
            unsubFines();
            unsubUsers();
        };
    }, []);

    // Calculates total fine value for a user
    const getUserTotalFines = (user) => {
        if (!user.fines || user.fines.length === 0) return 0;

        return user.fines.reduce((total, userFine) => {
        // totalPrice er allerede beregnet ved tildeling
        const finePrice = userFine.totalPrice ?? userFine.basePrice ?? 0;
        return total + finePrice;
    }, 0);
    };

    // Handlers
    const handleFineClick = (fine) => setActiveFine(fine);

    const handleUserClick = (user) => {
        const userFines = (user.fines || [])
            .map(userFine => {
                const fineData = fines.find(f => f.id === userFine.fineid);
                return fineData ? { ...fineData, ...userFine } : null;
            })
            .filter(Boolean);


        setActiveUser({ ...user, userFines });
    };

    const handleFineUpdate = (updatedFine, deletedId) => {
        if (deletedId) {
            // Remove fine from state
            setFines(prev => prev.filter(f => f.id !== deletedId));
        } else if (updatedFine) {
            // Update fine in state
            setFines(prev => prev.map(f => f.id === updatedFine.id ? updatedFine : f));
        }
    };

    // ✅ Now no need to refetch, snapshot handles it
    const handleFineAdded = async () => { };
    const handleFineRemoved = async () => { };


    return (
        <div className={styles.fineSite}>
            <div className={styles.finesMain}>
                {/* All fines */}
                <section className={styles.allFines}>
                    <div className={styles.allFinesStandard}>
                        <h3>Alle bøder</h3>
                        <ul>
                            {fines.length > 0 ? (
                                fines.map((fine) => (
                                    <li
                                        key={fine.id}
                                        className={styles.fineItem}
                                        onClick={() => handleFineClick(fine)}
                                    >
                                        <h3 className={styles.fineName}>{fine.name}</h3>
                                        <h3 className={styles.finePrice}>{fine.price},-</h3>
                                    </li>
                                ))
                            ) : (
                                <li>Ingen bøder fundet</li>
                            )}
                            {/* Admin Add Fine Button */}
                            {isFineMaster && (
                                <li
                                    className={`${styles.fineItem} ${styles.adminAddFine}`}
                                    onClick={() => setAddFineModal(true)}
                                >
                                    Tilføj ny bøde
                                </li>
                            )}
                        </ul>
                    </div>
                </section>

                {/* Users and their fines */}
                <section className={styles.playerFines}>
                    <h3>Spillerbøder</h3>
                    <ul>
                        {users.length > 0 ? (
                            [...users]
                                .sort((a, b) => (a.username || "").localeCompare(b.username || ""))
                                .map((user) => (
                                    <li key={user.id} className={styles.userItem} onClick={() => handleUserClick(user)}>
                                        <h4>{user.username || "Ukendt spiller"}</h4>
                                        <h4>{getUserTotalFines(user)},-</h4>
                                    </li>
                                ))
                        ) : (
                            <li>Ingen spillere fundet</li>
                        )}
                    </ul>
                </section>

                {/* Total fines */}
                <section className={styles.totalFine}>
                    <h2>
                        {users.reduce((total, user) => total + getUserTotalFines(user), 0)},-
                    </h2>
                </section>
            </div>

            {/* Modals */}
            {activeFine && (
                <FineDescriptionModal
                    fine={activeFine}
                    onClose={() => setActiveFine(null)}
                    isAdmin={isFineMaster} // ✅ pass this
                    onUpdate={handleFineUpdate}
                />
            )}


            {activeUser && (
                <UserFinesModal
                    user={activeUser}
                    allFines={fines}
                    onClose={() => setActiveUser(null)}
                    isAdmin={isFineMaster} // ✅ pass here
                    onAddFineClick={(user) => {
                        setActiveUser(null); // close user modal
                        setAddFineUser(user); // open AddFineModal
                    }}
                    onFineRemoved={handleFineRemoved}
                />
            )}

            {addFineUser && (
                <AddFineModal
                    user={addFineUser}
                    fines={fines}
                    onClose={() => setAddFineUser(null)}
                    onAddFine={handleFineAdded}
                />
            )}

            {addFineModal && (
                <AddFineFormModal
                    onClose={() => setAddFineModal(false)}
                    onFineAdded={() => {}}
                />
            )}
        </div>
    );
}
