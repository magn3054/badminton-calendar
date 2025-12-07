// Sidebar.jsx
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { auth, db } from "../../firebase";
import { getDoc, doc } from "firebase/firestore";
import styles from "./Sidebar.module.css";
import LogoutButton from "../Header/LogoutButton";

function Sidebar() {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);

  const handleClose = () => navigate("/"); // back to main

  const fetchAdminStatus = async () => {
    if (auth.currentUser) {
      const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
      if (userDoc.exists()) {
        setIsAdmin(userDoc.data().admin === true);
      }
    }
  };

  useEffect(() => {
    fetchAdminStatus();

  }, []);

  return (
    <div className={styles.sidebar}>
      <nav>
        <ul>
          <li><Link to="/" onClick={handleClose}>Kalender</Link></li>
          <li><Link to="/playerprofiles" onClick={handleClose}>Spillerprofiler</Link></li>
          <li><Link to="/fines" onClick={handleClose}>Bødekasse</Link></li>
          <li><Link to="/tournaments" onClick={handleClose}>Turneringer</Link></li>
          {isAdmin && (
            <li><Link to="/admin" onClick={handleClose}>Admin</Link></li>
          )}
        </ul>
        <LogoutButton />
      </nav>
    </div>
  );
}

export default Sidebar;
