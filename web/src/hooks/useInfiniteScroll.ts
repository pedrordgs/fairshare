import { useCallback, useEffect, useRef } from "react";

export interface UseInfiniteScrollOptions {
  onIntersect: () => void;
  enabled?: boolean;
}

export function useInfiniteScroll({
  onIntersect,
  enabled = true,
}: UseInfiniteScrollOptions) {
  const observerRef = useRef<IntersectionObserver | null>(null);
  // Keep a stable ref to the latest callback so the observer never needs
  // to be recreated just because the caller passed a new function reference.
  const onIntersectRef = useRef(onIntersect);
  useEffect(() => {
    onIntersectRef.current = onIntersect;
  }, [onIntersect]);

  useEffect(() => {
    return () => {
      observerRef.current?.disconnect();
      observerRef.current = null;
    };
  }, []);

  const loadMoreRef = useCallback(
    (node: HTMLElement | null) => {
      if (!enabled) return;

      if (observerRef.current) {
        observerRef.current.disconnect();
      }

      observerRef.current = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            onIntersectRef.current();
          }
        },
        {
          rootMargin: "100px",
        },
      );

      if (node) {
        observerRef.current.observe(node);
      }
    },
    // onIntersect is intentionally excluded: it is accessed through the ref,
    // so changes to the callback never force the observer to be recreated.
    [enabled],
  );

  return loadMoreRef;
}
