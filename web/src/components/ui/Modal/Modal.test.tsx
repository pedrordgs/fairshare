import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Modal } from "./Modal";

describe("Modal", () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset body overflow style
    document.body.style.overflow = "";
  });

  afterEach(() => {
    vi.clearAllMocks();
    document.body.style.overflow = "";
  });

  describe("Rendering", () => {
    it("renders null when isOpen is false", () => {
      const { container } = render(
        <Modal isOpen={false} onClose={mockOnClose}>
          <div>Modal Content</div>
        </Modal>,
      );

      expect(container.firstChild).toBeNull();
    });

    it("renders when isOpen is true", () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose}>
          <div>Modal Content</div>
        </Modal>,
      );

      expect(screen.getByText("Modal Content")).toBeInTheDocument();
    });

    it("renders with role dialog", () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose}>
          <div>Modal Content</div>
        </Modal>,
      );

      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    it("renders with aria-modal attribute", () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose}>
          <div>Modal Content</div>
        </Modal>,
      );

      const dialog = screen.getByRole("dialog");
      expect(dialog).toHaveAttribute("aria-modal", "true");
    });
  });

  describe("Accessibility", () => {
    it("has correct ARIA attributes for accessibility", () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose}>
          <div>Modal Content</div>
        </Modal>,
      );

      const dialog = screen.getByRole("dialog");
      expect(dialog).toHaveAttribute("aria-labelledby", "modal-title");
      expect(dialog).toHaveAttribute("aria-describedby", "modal-description");
    });

    it("is accessible to screen readers", () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose}>
          <div>Modal Content</div>
        </Modal>,
      );

      const dialog = screen.getByRole("dialog");
      expect(dialog).toBeVisible();
    });
  });

  describe("Keyboard Interaction", () => {
    it("closes on Escape key press", async () => {
      const user = userEvent.setup();

      render(
        <Modal isOpen={true} onClose={mockOnClose}>
          <div>Modal Content</div>
        </Modal>,
      );

      await user.keyboard("{Escape}");

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it("does not close on other key presses", async () => {
      const user = userEvent.setup();

      render(
        <Modal isOpen={true} onClose={mockOnClose}>
          <div>Modal Content</div>
        </Modal>,
      );

      await user.keyboard("{Enter}");
      await user.keyboard(" ");
      await user.keyboard("a");

      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  describe("Body Scroll Lock", () => {
    it("prevents body scroll when open", () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose}>
          <div>Modal Content</div>
        </Modal>,
      );

      expect(document.body.style.overflow).toBe("hidden");
    });

    it("restores body scroll when closed", () => {
      const { rerender } = render(
        <Modal isOpen={true} onClose={mockOnClose}>
          <div>Modal Content</div>
        </Modal>,
      );

      expect(document.body.style.overflow).toBe("hidden");

      rerender(
        <Modal isOpen={false} onClose={mockOnClose}>
          <div>Modal Content</div>
        </Modal>,
      );

      expect(document.body.style.overflow).toBe("");
    });

    it("cleans up body scroll style on unmount", () => {
      const { unmount } = render(
        <Modal isOpen={true} onClose={mockOnClose}>
          <div>Modal Content</div>
        </Modal>,
      );

      expect(document.body.style.overflow).toBe("hidden");

      unmount();

      expect(document.body.style.overflow).toBe("");
    });
  });

  describe("Custom ClassName", () => {
    it("applies custom className to modal", () => {
      render(
        <Modal
          isOpen={true}
          onClose={mockOnClose}
          className="custom-modal-class"
        >
          <div>Modal Content</div>
        </Modal>,
      );

      // The className is applied to the inner content div, not the dialog itself
      const dialog = screen.getByRole("dialog");
      expect(
        dialog.querySelector("[class*='custom-modal-class']"),
      ).toBeInTheDocument();
    });
  });

  describe("Children Rendering", () => {
    it("renders complex children correctly", () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose}>
          <div>
            <h2>Modal Title</h2>
            <p>Modal description text</p>
            <button>Action Button</button>
          </div>
        </Modal>,
      );

      expect(screen.getByText("Modal Title")).toBeInTheDocument();
      expect(screen.getByText("Modal description text")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Action Button" }),
      ).toBeInTheDocument();
    });

    it("renders form elements inside modal", () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose}>
          <form>
            <label htmlFor="input">Label</label>
            <input id="input" type="text" />
            <button type="submit">Submit</button>
          </form>
        </Modal>,
      );

      expect(screen.getByLabelText("Label")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Submit" }),
      ).toBeInTheDocument();
    });
  });
});
