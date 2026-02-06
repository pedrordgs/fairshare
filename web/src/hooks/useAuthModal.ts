import { useCallback, useSyncExternalStore } from "react";
import { createExternalStore } from "@utils/externalStore";

/**
 * State type for the authentication modal
 * @property isOpen - Whether the modal is currently visible
 * @property initialTab - Which tab to show initially ('login' or 'register')
 * @property redirectTo - Where to redirect after successful authentication
 */
type AuthModalState =
  | { isOpen: false; initialTab?: undefined; redirectTo?: undefined }
  | { isOpen: true; initialTab?: "login" | "register"; redirectTo?: string };

const authModalStore = createExternalStore<AuthModalState>({ isOpen: false });

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
    authModalStore.getSnapshot,
    authModalStore.getSnapshot,
  );

  const openAuthModal = useCallback(
    (options?: { redirectTo?: string; tab?: "login" | "register" }) => {
      authModalStore.setSnapshot({
        isOpen: true,
        initialTab: options?.tab,
        redirectTo: options?.redirectTo,
      });
    },
    [],
  );

  const closeAuthModal = useCallback(() => {
    authModalStore.setSnapshot({ isOpen: false });
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
    getState: authModalStore.getSnapshot,
    subscribe: authModalStore.subscribe,
  };
};
