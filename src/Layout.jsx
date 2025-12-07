// Layout.jsx
import { Outlet } from "react-router-dom";
import Header from "./components/Header/Header";

function Layout() {
  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", height: "100%" }}>
      <Header />
      <main>
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;


