import {
  createRouter,
  createRootRoute,
  createRoute,
  Outlet,
  redirect,
} from "@tanstack/react-router";
import { HomePage } from "@pages/HomePage";
import { DashboardPage } from "@pages/DashboardPage";
import { StyleguidePage } from "@pages/StyleguidePage";
import { GroupDetailPage } from "@pages/GroupDetailPage";
import { HeaderWithAuth } from "@components/layout/Header";
import { FooterWithAuth } from "@components/layout/Footer";
import { getAuthToken } from "@services/auth";

/**
 * Authentication guard for protected routes.
 * Redirects to home page if user is not authenticated.
 */
const requireAuth = () => {
  const token = getAuthToken();
  if (!token) {
    throw redirect({ to: "/" });
  }
};

/**
 * Auth redirect guard for public routes.
 * Redirects to dashboard if user is already authenticated.
 */
const redirectIfAuthenticated = () => {
  const token = getAuthToken();
  if (token) {
    throw redirect({ to: "/dashboard" });
  }
};

// Create the root route with layout
const rootRoute = createRootRoute({
  component: () => {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50">
        <div id="modal-root" />
        <HeaderWithAuth />
        <main>
          <Outlet />
        </main>
        <FooterWithAuth />
      </div>
    );
  },
});

// Create the index route (landing page)
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: HomePage,
  beforeLoad: redirectIfAuthenticated,
});

// Create dashboard route with auth guard
const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/dashboard",
  component: DashboardPage,
  beforeLoad: requireAuth,
});

// Create styleguide route
const styleguideRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/styleguide",
  component: StyleguidePage,
});

// Create group detail route with auth guard
const groupDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/groups/$groupId",
  component: GroupDetailPage,
  beforeLoad: requireAuth,
});

// Create the router
export const router = createRouter({
  routeTree: rootRoute.addChildren([
    indexRoute,
    dashboardRoute,
    styleguideRoute,
    groupDetailRoute,
  ]),
});

// Register the router for TypeScript
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
