import { useCallback, useSyncExternalStore } from "react";

/**
 * Creates a global store for the create group modal state following React best practices.
 * This uses the external store pattern with useSyncExternalStore for proper React integration.
 */
function createCreateGroupModalStore() {
  let isOpen = false;
  const listeners = new Set<() => void>();

  return {
    getState: () => isOpen,
    setState: (value: boolean) => {
      isOpen = value;
      listeners.forEach((listener) => listener());
    },
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

// Singleton store instance
const createGroupModalStore = createCreateGroupModalStore();

/**
 * Hook to control the create group modal visibility globally.
 *
 * This hook provides a way to open/close the create group modal from anywhere in the app
 * and ensures all components stay in sync with the modal state.
 *
 * @example
 * ```tsx
 * const { isOpen, openCreateGroupModal, closeCreateGroupModal } = useCreateGroupModal();
 *
 * <Button onClick={openCreateGroupModal}>Create Group</Button>
 * ```
 */
export function useCreateGroupModal() {
  const isOpen = useSyncExternalStore(
    createGroupModalStore.subscribe,
    createGroupModalStore.getState,
    () => false,
  );

  const openCreateGroupModal = useCallback(() => {
    createGroupModalStore.setState(true);
  }, []);

  const closeCreateGroupModal = useCallback(() => {
    createGroupModalStore.setState(false);
  }, []);

  return {
    isOpen,
    openCreateGroupModal,
    closeCreateGroupModal,
  };
}
