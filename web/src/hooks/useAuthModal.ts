import { useCallback, useSyncExternalStore } from "react";

/**
 * State type for the authentication modal
 * @property isOpen - Whether the modal is currently visible
 * @property initialTab - Which tab to show initially ('login' or 'register')
 * @property redirectTo - Where to redirect after successful authentication
 */
type AuthModalState =
  | { isOpen: false; initialTab?: undefined; redirectTo?: undefined }
  | { isOpen: true; initialTab?: "login" | "register"; redirectTo?: string };

/**
 * Creates a global store for the auth modal state following React best practices.
 * This uses the external store pattern with useSyncExternalStore for proper React integration.
 */
function createAuthModalStore() {
  let state: AuthModalState = { isOpen: false };
  const listeners = new Set<() => void>();

  return {
    getState: () => state,
    setState: (newState: AuthModalState) => {
      state = newState;
      listeners.forEach((listener) => listener());
    },
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

// Singleton store instance
const authModalStore = createAuthModalStore();

/**
 * Hook for managing the authentication modal state globally.
 *
 * This hook provides a way to open/close the auth modal from anywhere in the app
 * and ensures all components stay in sync with the modal state.
 *
 * @example
 * ```tsx
 * const { isOpen, openAuthModal, closeAuthModal } = useAuthModal();
 *
 * // Open modal with login tab
 * openAuthModal({ tab: 'login' });
 *
 * // Open modal with redirect after login
 * openAuthModal({ tab: 'register', redirectTo: '/dashboard' });
 *
 * // Close modal
 * closeAuthModal();
 * ```
 */
export const useAuthModal = () => {
  // Subscribe to the external store using React's recommended pattern
  const state = useSyncExternalStore(
    authModalStore.subscribe,
    authModalStore.getState,
    authModalStore.getState, // Server snapshot (same as client for this case)
  );

  const openAuthModal = useCallback(
    (options?: { redirectTo?: string; tab?: "login" | "register" }) => {
      authModalStore.setState({
        isOpen: true,
        initialTab: options?.tab,
        redirectTo: options?.redirectTo,
      });
    },
    [],
  );

  const closeAuthModal = useCallback(() => {
    authModalStore.setState({ isOpen: false });
  }, []);

  return {
    isOpen: state.isOpen,
    initialTab: state.initialTab,
    redirectTo: state.redirectTo,
    openAuthModal,
    closeAuthModal,
  };
};

/**
 * Hook for subscribing to auth modal state changes.
 *
 * This is useful for components that need to react to modal state changes
 * but don't need to control the modal (like the AuthModal component itself).
 *
 * @example
 * ```tsx
 * const { getState, subscribe } = useAuthModalSubscription();
 *
 * useEffect(() => {
 *   const unsubscribe = subscribe(() => {
 *     const state = getState();
 *     // React to state change
 *   });
 *   return unsubscribe;
 * }, [subscribe, getState]);
 * ```
 */
export const useAuthModalSubscription = () => {
  return {
    getState: authModalStore.getState,
    subscribe: authModalStore.subscribe,
  };
};
