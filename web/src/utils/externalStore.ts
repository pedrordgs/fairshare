export type ExternalStore<T> = {
  getSnapshot: () => T;
  setSnapshot: (next: T) => void;
  subscribe: (listener: () => void) => () => void;
};

export function createExternalStore<T>(initialSnapshot: T): ExternalStore<T> {
  let snapshot = initialSnapshot;
  const listeners = new Set<() => void>();

  return {
    getSnapshot: () => snapshot,
    setSnapshot: (next: T) => {
      snapshot = next;
      listeners.forEach((listener) => listener());
    },
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
