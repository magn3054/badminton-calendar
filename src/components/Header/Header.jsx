// src/components/Header/Header.jsx
import { useLocation, useNavigate } from "react-router-dom";
import { useRef, useEffect } from "react";
import { useUser } from "../../context/UserContext";
import styles from "./Header.module.css";
import Burger from "./Burger";
import Profile from "./Profile";

function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const lastMainRoute = useRef("/");

  const { username } = useUser();

  const isMenu = location.pathname === "/menu";
  const isProfile = location.pathname === "/profile";

  // Track last main page to navigate back
  useEffect(() => {
    if (!isMenu && !isProfile) lastMainRoute.current = location.pathname;
  }, [location.pathname, isMenu, isProfile]);

  // Dynamic titles for nested routes
  const routeTitles = [
    { path: "/playerprofiles", title: "Spillere" },
    { path: "/fines", title: "Bødekasse" },
    { path: "/admin", title: "Admin" },
    { path: "/menu", title: "Menu" },
    { path: "/tournaments", title: "Turnering" },
    { path: "/", title: "Kalender" }, // root last
  ];

  const pageTitle =
    routeTitles.find(r => location.pathname === r.path || location.pathname.startsWith(r.path + "/"))?.title
    || "Badminton";

  const titleText = isProfile ? username : pageTitle;
  const titleClass = isMenu || isProfile ? styles.title2 : styles.title;

  return (
    <header className={styles.header}>
      {!isProfile && (
        <Burger
          isOpen={isMenu}
          onClick={() =>
            navigate(isMenu ? lastMainRoute.current : "/menu")
          }
        />
      )}

      <h1 className={titleClass}>{titleText}</h1>

      {!isMenu && (
        <Profile
          isOpen={isProfile}
          onClick={() =>
            navigate(isProfile ? lastMainRoute.current : "/profile")
          }
        />
      )}
    </header>
  );
}

export default Header;
