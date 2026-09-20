import { Navigate } from "react-router";
import { App } from "./App";
import { ErrorPage } from "./components/ErrorPage";
import { About } from "./components/About/About";
import { HomeLayout } from "./components/Home/HomeLayout";
import { UnifiedSearch } from "./components/Home/UnifiedSearch";
import { UniversityDetailPage } from "./components/Home/UniversityDetailPage";
import { FacultyDetailPage } from "./components/Home/FacultyDetailPage";
import { LogIn } from "./components/LogIn/LogIn";
import { SignUp } from "./components/SignUp/SignUp";
import { ContributionDashboard } from "./components/ContributionDashboard/ContributionDashboard";
import { AddDataTab } from "./components/ContributionDashboard/AddDataTab";
import { PendingChangesTab } from "./components/ContributionDashboard/PendingChangesTab";
import { AdminDashboard } from "./components/AdminDashboard/AdminDashboard";
import { PendingChangesAdmin } from "./components/AdminDashboard/PendingChangesAdmin";
import { AdminRequests } from "./components/AdminDashboard/AdminRequests";
import { Profile } from "./components/Profile/Profile";
import { Api } from "./components/Api/Api";

const routes = [
  {
    path: "/",
    element: <App />,
    errorElement: <ErrorPage />,
    children: [
      {
        element: <HomeLayout />,
        children: [
          { index: true, element: <Navigate to="search" replace /> },
          { path: "search", element: <UnifiedSearch /> },
        ],
      },
      {
        element: <Navigate to="/search" replace />,
        path: "home",
      },
      {
        element: <UniversityDetailPage />,
        path: "universities/:id",
      },
      {
        element: <FacultyDetailPage />,
        path: "faculties/:id",
      },
      {
        element: <About />,
        path: "about",
      },
      {
        element: <Api />,
        path: "api-docs",
      },
      {
        element: <ContributionDashboard />,
        path: "improve-data",
        children: [
          { index: true, element: <Navigate to="add" replace /> },
          { path: "add", element: <AddDataTab /> },
          { path: "pending", element: <PendingChangesTab /> },
        ],
      },
      {
        element: <AdminDashboard />,
        path: "admin-dashboard",
        children: [
          {
            index: true,
            element: <Navigate to="pending-changes" replace />,
          },
          { path: "pending-changes", element: <PendingChangesAdmin /> },
          { path: "admin-requests", element: <AdminRequests /> },
        ],
      },
      { element: <Profile />, path: "profile" },
      {
        element: <LogIn />,
        path: "login",
      },
      {
        element: <SignUp />,
        path: "signup",
      },
    ],
  },
];

export { routes };
