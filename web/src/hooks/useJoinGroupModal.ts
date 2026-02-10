import { useCallback, useSyncExternalStore } from "react";
import { createExternalStore } from "@utils/externalStore";

const joinGroupModalStore = createExternalStore(false);

/**
 * Hook to control the join group modal visibility globally.
 */
export function useJoinGroupModal() {
  const isOpen = useSyncExternalStore(
    joinGroupModalStore.subscribe,
    joinGroupModalStore.getSnapshot,
    () => false,
  );

  const openJoinGroupModal = useCallback(() => {
    joinGroupModalStore.setSnapshot(true);
  }, []);

  const closeJoinGroupModal = useCallback(() => {
    joinGroupModalStore.setSnapshot(false);
  }, []);

  return {
    isOpen,
    openJoinGroupModal,
    closeJoinGroupModal,
  };
}
