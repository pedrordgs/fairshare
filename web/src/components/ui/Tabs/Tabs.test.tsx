import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Tabs, TabItem } from "./Tabs";

describe("Tabs", () => {
  const renderTabs = () => {
    return render(
      <Tabs defaultTab="tab1">
        <TabItem label="Tab 1" value="tab1">
          Content 1
        </TabItem>
        <TabItem label="Tab 2" value="tab2">
          Content 2
        </TabItem>
        <TabItem label="Tab 3" value="tab3">
          Content 3
        </TabItem>
      </Tabs>,
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Basic Rendering", () => {
    it("renders all tab labels", () => {
      renderTabs();
      expect(screen.getByRole("tab", { name: "Tab 1" })).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: "Tab 2" })).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: "Tab 3" })).toBeInTheDocument();
    });

    it("renders active tab content", () => {
      renderTabs();
      expect(screen.getByText("Content 1")).toBeVisible();
    });
  });

  describe("Keyboard Navigation", () => {
    it("moves focus to next tab on ArrowRight", async () => {
      const user = userEvent.setup();
      renderTabs();

      const tab1 = screen.getByRole("tab", { name: "Tab 1" });
      tab1.focus();

      await user.keyboard("{ArrowRight}");

      expect(screen.getByRole("tab", { name: "Tab 2" })).toHaveFocus();
    });

    it("moves focus to previous tab on ArrowLeft", async () => {
      const user = userEvent.setup();
      renderTabs();

      // First focus Tab 2
      const tab2 = screen.getByRole("tab", { name: "Tab 2" });
      tab2.focus();

      await user.keyboard("{ArrowLeft}");

      expect(screen.getByRole("tab", { name: "Tab 1" })).toHaveFocus();
    });

    it("wraps to first tab from last tab on ArrowRight", async () => {
      const user = userEvent.setup();
      renderTabs();

      // Focus Tab 3 (last tab)
      const tab3 = screen.getByRole("tab", { name: "Tab 3" });
      tab3.focus();

      await user.keyboard("{ArrowRight}");

      expect(screen.getByRole("tab", { name: "Tab 1" })).toHaveFocus();
    });

    it("wraps to last tab from first tab on ArrowLeft", async () => {
      const user = userEvent.setup();
      renderTabs();

      // Focus Tab 1
      const tab1 = screen.getByRole("tab", { name: "Tab 1" });
      tab1.focus();

      await user.keyboard("{ArrowLeft}");

      expect(screen.getByRole("tab", { name: "Tab 3" })).toHaveFocus();
    });

    it("moves focus to first tab on Home key", async () => {
      const user = userEvent.setup();
      renderTabs();

      // Focus Tab 3
      const tab3 = screen.getByRole("tab", { name: "Tab 3" });
      tab3.focus();

      await user.keyboard("{Home}");

      expect(screen.getByRole("tab", { name: "Tab 1" })).toHaveFocus();
    });

    it("moves focus to last tab on End key", async () => {
      const user = userEvent.setup();
      renderTabs();

      // Focus Tab 1
      const tab1 = screen.getByRole("tab", { name: "Tab 1" });
      tab1.focus();

      await user.keyboard("{End}");

      expect(screen.getByRole("tab", { name: "Tab 3" })).toHaveFocus();
    });

    it("switches active tab content on keyboard navigation", async () => {
      const user = userEvent.setup();
      renderTabs();

      const tab1 = screen.getByRole("tab", { name: "Tab 1" });
      tab1.focus();

      await user.keyboard("{ArrowRight}");

      // Content should switch to Tab 2
      expect(screen.getByText("Content 2")).toBeVisible();
    });
  });

  describe("ARIA Attributes", () => {
    it("sets correct aria-selected on active tab", () => {
      renderTabs();
      expect(screen.getByRole("tab", { name: "Tab 1" })).toHaveAttribute(
        "aria-selected",
        "true",
      );
      expect(screen.getByRole("tab", { name: "Tab 2" })).toHaveAttribute(
        "aria-selected",
        "false",
      );
    });

    it("sets correct tabIndex on tabs", () => {
      renderTabs();
      expect(screen.getByRole("tab", { name: "Tab 1" })).toHaveAttribute(
        "tabIndex",
        "0",
      );
      expect(screen.getByRole("tab", { name: "Tab 2" })).toHaveAttribute(
        "tabIndex",
        "-1",
      );
    });

    it("associates tabs with panels via aria-controls", () => {
      renderTabs();
      const tab1 = screen.getByRole("tab", { name: "Tab 1" });
      const panelId = tab1.getAttribute("aria-controls");
      const panel = document.getElementById(panelId!);
      expect(panel).toHaveAttribute("role", "tabpanel");
    });
  });

  describe("Click Interaction", () => {
    it("switches tabs on click", async () => {
      const user = userEvent.setup();
      renderTabs();

      await user.click(screen.getByRole("tab", { name: "Tab 2" }));

      expect(screen.getByText("Content 2")).toBeVisible();
      expect(screen.getByRole("tab", { name: "Tab 2" })).toHaveAttribute(
        "aria-selected",
        "true",
      );
    });
  });
});
