// src/context/UserContext.jsx
import { createContext, useContext, useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null); // Firebase user object
  const [username, setUsername] = useState(""); // from Firestore
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (u) => {
      setUser(u);
      if (u) {
        try {
          const userRef = doc(db, "users", u.uid);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) setUsername(userSnap.data().username);
        } catch (err) {
          console.error("Error fetching username:", err);
        }
      } else {
        setUsername("");
      }
      setLoading(false);
    });

    return unsub;
  }, []);

  return (
    <UserContext.Provider value={{ user, username, loading, setUser }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
