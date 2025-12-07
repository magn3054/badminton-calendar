// PlayerProfiles.jsx
import { useEffect, useState } from "react";
import styles from "./PlayerProfiles.module.css";
import PlayerCard from "./PlayerCard";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { auth, db } from "../../firebase";

export default function PlayerProfiles() {
    const [players, setPlayers] = useState([]);
    const [fines, setFines] = useState([]);
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        const fetchPlayers = async () => {
            const usersCol = collection(db, "users");
            const userSnapshot = await getDocs(usersCol);
            const userList = userSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setPlayers(userList);
        };

        const fetchFines = async () => {
            const finesCol = collection(db, "fines");
            const finesSnapshot = await getDocs(finesCol);
            const fineList = finesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setFines(fineList);
        };

        const fetchAdminStatus = async () => {
            if (auth.currentUser) {
                const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
                if (userDoc.exists()) {
                    setIsAdmin(userDoc.data().admin === true);
                }
            }
        };

        fetchPlayers();
        fetchFines();
        fetchAdminStatus();
    }, []);

    const sortedPlayers = [...players].sort((a, b) => 
        (a.username || "").localeCompare(b.username || "")
    );

    return (
        <div className={styles.playerprofiles}>
            {sortedPlayers.map(player => (
                <PlayerCard
                    key={player.id}
                    player={player}
                    fines={fines}
                    isAdmin={isAdmin}
                />
            ))}
        </div>
    );
}
