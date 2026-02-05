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
            onIntersect();
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
    [onIntersect, enabled],
  );

  return loadMoreRef;
}
