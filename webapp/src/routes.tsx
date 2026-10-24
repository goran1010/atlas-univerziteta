import { Navigate } from "react-router";
import { App } from "./App";
import { ErrorPage } from "./components/layout/ErrorPage";
import { Spinner } from "./components/sharedComponents/Spinner";
import { HomeLayout } from "./components/layout/HomeLayout";
import { UnifiedSearch } from "./components/Search/UnifiedSearch";
import { UniversityDetailPage } from "./components/EntityDetails/UniversityDetailPage";
import { FacultyDetailPage } from "./components/EntityDetails/FacultyDetailPage";

// The public search and detail pages stay in the main bundle - they are the
// landing pages. Everything else loads on first navigation via route.lazy,
// which keeps the current page visible while the chunk downloads.
const routes = [
  {
    path: "/",
    element: <App />,
    errorElement: <ErrorPage />,
    // shown while a lazy route's chunk loads on a direct/initial visit
    hydrateFallbackElement: <Spinner page />,
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
        path: "about",
        lazy: async () => ({
          Component: (await import("./components/About/About")).About,
        }),
      },
      {
        path: "api-docs",
        lazy: async () => ({
          Component: (await import("./components/Api/Api")).Api,
        }),
      },
      {
        path: "improve-data",
        lazy: async () => ({
          Component: (
            await import("./components/ContributionDashboard/ContributionDashboard")
          ).ContributionDashboard,
        }),
        children: [
          { index: true, element: <Navigate to="add" replace /> },
          {
            path: "add",
            lazy: async () => ({
              Component: (
                await import("./components/ContributionDashboard/AddDataTab")
              ).AddDataTab,
            }),
          },
          {
            path: "pending",
            lazy: async () => ({
              Component: (
                await import("./components/ContributionDashboard/PendingChangesTab")
              ).PendingChangesTab,
            }),
          },
        ],
      },
      {
        path: "admin-dashboard",
        lazy: async () => ({
          Component: (
            await import("./components/AdminDashboard/AdminDashboard")
          ).AdminDashboard,
        }),
        children: [
          {
            index: true,
            element: <Navigate to="pending-changes" replace />,
          },
          {
            path: "pending-changes",
            lazy: async () => ({
              Component: (
                await import("./components/AdminDashboard/PendingChangesAdmin")
              ).PendingChangesAdmin,
            }),
          },
          {
            path: "admin-requests",
            lazy: async () => ({
              Component: (
                await import("./components/AdminDashboard/AdminRequests")
              ).AdminRequests,
            }),
          },
        ],
      },
      {
        path: "profile",
        lazy: async () => ({
          Component: (await import("./components/Profile/Profile")).Profile,
        }),
      },
      {
        path: "login",
        lazy: async () => ({
          Component: (await import("./components/LogIn/LogIn")).LogIn,
        }),
      },
      {
        path: "signup",
        lazy: async () => ({
          Component: (await import("./components/SignUp/SignUp")).SignUp,
        }),
      },
    ],
  },
];

export { routes };
