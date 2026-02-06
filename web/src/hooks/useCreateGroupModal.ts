import { useCallback, useSyncExternalStore } from "react";
import { createExternalStore } from "@utils/externalStore";

const createGroupModalStore = createExternalStore(false);

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
    createGroupModalStore.getSnapshot,
    () => false,
  );

  const openCreateGroupModal = useCallback(() => {
    createGroupModalStore.setSnapshot(true);
  }, []);

  const closeCreateGroupModal = useCallback(() => {
    createGroupModalStore.setSnapshot(false);
  }, []);

  return {
    isOpen,
    openCreateGroupModal,
    closeCreateGroupModal,
  };
}
