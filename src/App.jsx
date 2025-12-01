//App.jsx
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import { useUser } from "./context/UserContext";

import Layout from "./Layout";
import Calendar from "./components/Calendar/Calendar";
import PlayerProfiles from "./components/PlayerProfiles/PlayerProfiles";
import Fines from "./components/Fines/FineSite";
import Auth from "./components/Auth/Auth";
import Admin from "./components/Admin/Admin";
import Sidebar from "./components/Header/Sidebar";
import ProfileSidebar from "./components/Header/ProfileSidebar";
import Tournament from "./components/Tournaments/Tournament";

function App() {
  const { user, loading } = useUser();

  if (loading) return <p>Loading...</p>;
  if (!user) return <Auth />;

  const router = createBrowserRouter([
    {
      path: "/",
      element: <Layout />, 
      children: [
        {
          index: true,
          element: <Calendar />,
        },
        {
          path: "/playerprofiles",
          element: <PlayerProfiles />,
        },
        {
          path: "/fines",
          element: <Fines />,
        },
        {
          path: "/menu",
          element: <Sidebar />,
        },
        {
          path: "/profile",
          element: <ProfileSidebar />,
        },
        {
          path: "/tournaments",
          element: <Tournament />,
        },
        {
          path: "/admin",
          element: <Admin />,
        },
        // {
        //   path: "*",
        //   element: <NotFound />,
        // },
      ],
    },
  ]);

  return <RouterProvider router={router} />;
}

export default App;

