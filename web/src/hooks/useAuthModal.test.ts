import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAuthModal, useAuthModalSubscription } from "./useAuthModal";

describe("useAuthModal", () => {
  beforeEach(() => {
    // Reset the store state before each test
    const { result } = renderHook(() => useAuthModal());
    act(() => {
      result.current.closeAuthModal();
    });
  });

  describe("Initial State", () => {
    it("starts with closed state", () => {
      const { result } = renderHook(() => useAuthModal());
      expect(result.current.isOpen).toBe(false);
      expect(result.current.initialTab).toBeUndefined();
      expect(result.current.redirectTo).toBeUndefined();
    });
  });

  describe("openAuthModal", () => {
    it("opens modal with default state", () => {
      const { result } = renderHook(() => useAuthModal());

      act(() => {
        result.current.openAuthModal();
      });

      expect(result.current.isOpen).toBe(true);
    });

    it("opens modal with login tab", () => {
      const { result } = renderHook(() => useAuthModal());

      act(() => {
        result.current.openAuthModal({ tab: "login" });
      });

      expect(result.current.isOpen).toBe(true);
      expect(result.current.initialTab).toBe("login");
    });

    it("opens modal with register tab", () => {
      const { result } = renderHook(() => useAuthModal());

      act(() => {
        result.current.openAuthModal({ tab: "register" });
      });

      expect(result.current.isOpen).toBe(true);
      expect(result.current.initialTab).toBe("register");
    });

    it("opens modal with redirectTo", () => {
      const { result } = renderHook(() => useAuthModal());

      act(() => {
        result.current.openAuthModal({ redirectTo: "/dashboard" });
      });

      expect(result.current.isOpen).toBe(true);
      expect(result.current.redirectTo).toBe("/dashboard");
    });

    it("opens modal with both tab and redirectTo", () => {
      const { result } = renderHook(() => useAuthModal());

      act(() => {
        result.current.openAuthModal({
          tab: "login",
          redirectTo: "/profile",
        });
      });

      expect(result.current.isOpen).toBe(true);
      expect(result.current.initialTab).toBe("login");
      expect(result.current.redirectTo).toBe("/profile");
    });
  });

  describe("closeAuthModal", () => {
    it("closes the modal", () => {
      const { result } = renderHook(() => useAuthModal());

      // First open it
      act(() => {
        result.current.openAuthModal({
          tab: "login",
          redirectTo: "/dashboard",
        });
      });

      // Then close it
      act(() => {
        result.current.closeAuthModal();
      });

      expect(result.current.isOpen).toBe(false);
    });

    it("clears initialTab when closing", () => {
      const { result } = renderHook(() => useAuthModal());

      act(() => {
        result.current.openAuthModal({ tab: "login" });
      });

      act(() => {
        result.current.closeAuthModal();
      });

      expect(result.current.initialTab).toBeUndefined();
    });

    it("clears redirectTo when closing", () => {
      const { result } = renderHook(() => useAuthModal());

      act(() => {
        result.current.openAuthModal({ redirectTo: "/dashboard" });
      });

      act(() => {
        result.current.closeAuthModal();
      });

      expect(result.current.redirectTo).toBeUndefined();
    });
  });

  describe("Multiple Components", () => {
    it("shares state across multiple hook instances", () => {
      const { result: result1 } = renderHook(() => useAuthModal());
      const { result: result2 } = renderHook(() => useAuthModal());

      // Open modal from first instance
      act(() => {
        result1.current.openAuthModal({ tab: "register" });
      });

      // Second instance should see the same state
      expect(result2.current.isOpen).toBe(true);
      expect(result2.current.initialTab).toBe("register");
    });

    it("updates all instances when closed from any instance", () => {
      const { result: result1 } = renderHook(() => useAuthModal());
      const { result: result2 } = renderHook(() => useAuthModal());

      // Open and then close from second instance
      act(() => {
        result2.current.openAuthModal();
      });

      act(() => {
        result1.current.closeAuthModal();
      });

      // Both should be closed
      expect(result1.current.isOpen).toBe(false);
      expect(result2.current.isOpen).toBe(false);
    });
  });

  describe("useAuthModalSubscription", () => {
    it("provides access to getState and subscribe", () => {
      const { result } = renderHook(() => useAuthModalSubscription());

      expect(result.current.getState).toBeDefined();
      expect(result.current.subscribe).toBeDefined();
      expect(typeof result.current.getState).toBe("function");
      expect(typeof result.current.subscribe).toBe("function");
    });

    it("returns current state via getState", () => {
      const { result } = renderHook(() => useAuthModalSubscription());

      const state = result.current.getState();
      expect(state.isOpen).toBe(false);
    });

    it("notifies subscribers on state changes", () => {
      const { result: subscription } = renderHook(() =>
        useAuthModalSubscription(),
      );
      const { result: modal } = renderHook(() => useAuthModal());

      const listener = vi.fn();

      // Subscribe
      act(() => {
        subscription.current.subscribe(listener);
      });

      // Trigger state change
      act(() => {
        modal.current.openAuthModal();
      });

      expect(listener).toHaveBeenCalled();
    });
  });
});
