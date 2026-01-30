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
import { Header, Footer } from "@components/layout";
import { AuthModal } from "@components/auth/AuthModal";
import { getAuthToken } from "@services/auth";

// Create the root route with layout
const rootRoute = createRootRoute({
  component: () => {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50">
        <div id="modal-root" />
        <Header />
        <main>
          <Outlet />
        </main>
        <Footer showAuth={true} />

        {/* Global auth modal */}
        <AuthModal />
      </div>
    );
  },
});

// Create the index route (landing page)
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: HomePage,
});

// Create dashboard route with auth guard
const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/dashboard",
  component: DashboardPage,
  beforeLoad: () => {
    const token = getAuthToken();
    if (!token) {
      throw redirect({ to: "/" });
    }
  },
});

// Create styleguide route
const styleguideRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/styleguide",
  component: StyleguidePage,
});

// Create the router
export const router = createRouter({
  routeTree: rootRoute.addChildren([
    indexRoute,
    dashboardRoute,
    styleguideRoute,
  ]),
});

// Register the router for TypeScript
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
