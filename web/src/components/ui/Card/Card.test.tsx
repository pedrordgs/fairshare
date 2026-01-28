import { render, screen } from "@testing-library/react";
import { Card, CardHeader, CardTitle, CardDescription } from "./Card";

describe("Card", () => {
  it("renders without crashing", () => {
    render(<Card>Card Content</Card>);
    expect(screen.getByText("Card Content")).toBeInTheDocument();
  });

  it("applies default styling classes", () => {
    render(<Card>Test Card</Card>);
    const card = screen.getByText("Test Card").closest("div");
    expect(card).toHaveClass("bg-white");
    expect(card).toHaveClass("p-6");
    expect(card).toHaveClass("rounded-xl");
  });

  it("applies custom className", () => {
    render(<Card className="custom-class">Custom Card</Card>);
    const card = screen.getByText("Custom Card").closest("div");
    expect(card).toHaveClass("custom-class");
    expect(card).toHaveClass("bg-white", "p-6", "rounded-xl");
  });

  it("renders children correctly", () => {
    render(
      <Card>
        <div>Child Element 1</div>
        <div>Child Element 2</div>
      </Card>,
    );
    expect(screen.getByText("Child Element 1")).toBeInTheDocument();
    expect(screen.getByText("Child Element 2")).toBeInTheDocument();
  });
});

describe("CardHeader", () => {
  it("renders without crashing", () => {
    render(<CardHeader>Header Content</CardHeader>);
    expect(screen.getByText("Header Content")).toBeInTheDocument();
  });

  it("applies default styling classes", () => {
    render(<CardHeader>Test Header</CardHeader>);
    const header = screen.getByText("Test Header").closest("div");
    expect(header).toHaveClass("mb-6");
  });

  it("applies custom className", () => {
    render(<CardHeader className="custom-header">Custom Header</CardHeader>);
    const header = screen.getByText("Custom Header").closest("div");
    expect(header).toHaveClass("custom-header");
  });
});

describe("CardTitle", () => {
  it("renders without crashing", () => {
    render(<CardTitle>Card Title</CardTitle>);
    expect(screen.getByText("Card Title")).toBeInTheDocument();
  });

  it("renders as h2 element", () => {
    render(<CardTitle>Test Title</CardTitle>);
    const title = screen.getByText("Test Title");
    expect(title.tagName).toBe("H2");
  });

  it("applies default styling classes", () => {
    render(<CardTitle>Test Title</CardTitle>);
    const title = screen.getByText("Test Title");
    expect(title).toHaveClass("text-xl", "font-semibold", "text-slate-900");
  });

  it("applies custom className", () => {
    render(<CardTitle className="custom-title">Custom Title</CardTitle>);
    const title = screen.getByText("Custom Title");
    expect(title).toHaveClass("custom-title");
  });
});

describe("CardDescription", () => {
  it("renders without crashing", () => {
    render(<CardDescription>Card Description</CardDescription>);
    expect(screen.getByText("Card Description")).toBeInTheDocument();
  });

  it("renders as p element", () => {
    render(<CardDescription>Test Description</CardDescription>);
    const description = screen.getByText("Test Description");
    expect(description.tagName).toBe("P");
  });

  it("applies default styling classes", () => {
    render(<CardDescription>Test Description</CardDescription>);
    const description = screen.getByText("Test Description");
    expect(description).toHaveClass(
      "text-slate-600",
      "mt-2",
      "leading-relaxed",
    );
  });

  it("applies custom className", () => {
    render(
      <CardDescription className="custom-description">
        Custom Description
      </CardDescription>,
    );
    const description = screen.getByText("Custom Description");
    expect(description).toHaveClass("custom-description");
  });
});

describe("Card Components Integration", () => {
  it("renders all card components together", () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Test Title</CardTitle>
          <CardDescription>Test Description</CardDescription>
        </CardHeader>
        <div>Card Body Content</div>
      </Card>,
    );

    expect(screen.getByText("Test Title")).toBeInTheDocument();
    expect(screen.getByText("Test Description")).toBeInTheDocument();
    expect(screen.getByText("Card Body Content")).toBeInTheDocument();
  });
});
