import { Navigate } from "react-router";
import { App } from "./App";
import { ErrorPage } from "./components/layout/ErrorPage";
import { Spinner } from "./components/sharedComponents/Spinner";
import { HomeLayout } from "./components/layout/HomeLayout";
import { UnifiedSearch } from "./components/Search/UnifiedSearch";
import { UniversityDetailPage } from "./components/entityDetails/UniversityDetailPage";
import { FacultyDetailPage } from "./components/entityDetails/FacultyDetailPage";

// The public search and detail pages stay in the main bundle - they are the
// landing pages. Everything else splits into route chunks, but all of them
// are warmed right after the landing page goes idle (prefetchLazyRoutes), so
// navigation never waits on a download; route.lazy stays as the fallback for
// direct deep links before the prefetch finishes.
const routeImports = {
  about: () => import("./components/About/About"),
  api: () => import("./components/Api/Api"),
  contributionDashboard: () =>
    import("./components/ContributionDashboard/ContributionDashboard"),
  addDataTab: () => import("./components/ContributionDashboard/AddDataTab"),
  pendingChangesTab: () =>
    import("./components/ContributionDashboard/PendingChangesTab"),
  adminDashboard: () => import("./components/AdminDashboard/AdminDashboard"),
  pendingChangesAdmin: () =>
    import("./components/AdminDashboard/PendingChangesAdmin"),
  adminRequests: () => import("./components/AdminDashboard/AdminRequests"),
  profile: () => import("./components/Profile/Profile"),
  login: () => import("./components/LogIn/LogIn"),
  signup: () => import("./components/SignUp/SignUp"),
};

// a failed warm-up is harmless - the route.lazy import retries on navigation
function prefetchLazyRoutes() {
  const warm = () => {
    for (const importRoute of Object.values(routeImports)) {
      void importRoute().catch(() => undefined);
    }
  };

  // typeof check: lib.dom types the API as always present, but Safari
  // still ships without it
  if (typeof window.requestIdleCallback === "function") {
    window.requestIdleCallback(warm, { timeout: 5000 });
  } else {
    window.setTimeout(warm, 2000);
  }
}

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
          Component: (await routeImports.about()).About,
        }),
      },
      {
        path: "api-docs",
        lazy: async () => ({
          Component: (await routeImports.api()).Api,
        }),
      },
      {
        path: "improve-data",
        lazy: async () => ({
          Component: (await routeImports.contributionDashboard())
            .ContributionDashboard,
        }),
        children: [
          { index: true, element: <Navigate to="add" replace /> },
          {
            path: "add",
            lazy: async () => ({
              Component: (await routeImports.addDataTab()).AddDataTab,
            }),
          },
          {
            path: "pending",
            lazy: async () => ({
              Component: (await routeImports.pendingChangesTab())
                .PendingChangesTab,
            }),
          },
        ],
      },
      {
        path: "admin-dashboard",
        lazy: async () => ({
          Component: (await routeImports.adminDashboard()).AdminDashboard,
        }),
        children: [
          {
            index: true,
            element: <Navigate to="pending-changes" replace />,
          },
          {
            path: "pending-changes",
            lazy: async () => ({
              Component: (await routeImports.pendingChangesAdmin())
                .PendingChangesAdmin,
            }),
          },
          {
            path: "admin-requests",
            lazy: async () => ({
              Component: (await routeImports.adminRequests()).AdminRequests,
            }),
          },
        ],
      },
      {
        path: "profile",
        lazy: async () => ({
          Component: (await routeImports.profile()).Profile,
        }),
      },
      {
        path: "login",
        lazy: async () => ({
          Component: (await routeImports.login()).LogIn,
        }),
      },
      {
        path: "signup",
        lazy: async () => ({
          Component: (await routeImports.signup()).SignUp,
        }),
      },
    ],
  },
];

export { routes, prefetchLazyRoutes };
