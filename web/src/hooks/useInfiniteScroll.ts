import { RefObject, useCallback, useEffect, useRef } from "react";

export interface UseInfiniteScrollOptions {
  onIntersect: () => void;
  enabled?: boolean;
  root?: RefObject<HTMLElement | null>;
}

export function useInfiniteScroll({
  onIntersect,
  enabled = true,
  root,
}: UseInfiniteScrollOptions) {
  const observerRef = useRef<IntersectionObserver | null>(null);
  // Keep a stable ref to the latest callback so the observer never needs
  // to be recreated just because the caller passed a new function reference.
  const onIntersectRef = useRef(onIntersect);
  useEffect(() => {
    onIntersectRef.current = onIntersect;
  }, [onIntersect]);

  // Keep a stable ref to the root element so we can safely read it inside
  // useCallback without triggering the React Compiler's memoization warning.
  const rootRef = useRef<HTMLElement | null>(null);
  useEffect(() => {
    rootRef.current = root?.current ?? null;
  });

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
          root: rootRef.current,
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
