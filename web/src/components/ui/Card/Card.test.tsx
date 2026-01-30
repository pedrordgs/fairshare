import { render, screen } from "@testing-library/react";
import { Card, CardHeader, CardTitle, CardContent } from "./Card";

describe("Card", () => {
  it("renders without crashing", () => {
    render(<Card>Card Content</Card>);
    expect(screen.getByText("Card Content")).toBeInTheDocument();
  });

  it("renders as a div element", () => {
    render(<Card>Test Card</Card>);
    const card = screen.getByText("Test Card").closest("div");
    expect(card).toBeInTheDocument();
    expect(card?.tagName).toBe("DIV");
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

  it("renders as a div element", () => {
    render(<CardHeader>Test Header</CardHeader>);
    const header = screen.getByText("Test Header").closest("div");
    expect(header).toBeInTheDocument();
    expect(header?.tagName).toBe("DIV");
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

  it("is visible as heading element", () => {
    render(<CardTitle>Test Title</CardTitle>);
    const title = screen.getByText("Test Title");
    expect(title).toBeVisible();
    expect(title.tagName).toBe("H2");
  });

  it("applies custom className", () => {
    render(<CardTitle className="custom-title">Custom Title</CardTitle>);
    const title = screen.getByText("Custom Title");
    expect(title).toHaveClass("custom-title");
  });
});

describe("CardContent", () => {
  it("renders without crashing", () => {
    render(<CardContent>Card Description</CardContent>);
    expect(screen.getByText("Card Description")).toBeInTheDocument();
  });

  it("renders as div element", () => {
    render(<CardContent>Test Description</CardContent>);
    const description = screen.getByText("Test Description");
    expect(description.tagName).toBe("DIV");
  });

  it("is visible as div element", () => {
    render(<CardContent>Test Description</CardContent>);
    const description = screen.getByText("Test Description");
    expect(description).toBeVisible();
    expect(description.tagName).toBe("DIV");
  });

  it("applies custom className", () => {
    render(
      <CardContent className="custom-description">
        Custom Description
      </CardContent>,
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
          <CardContent>Test Description</CardContent>
        </CardHeader>
        <div>Card Body Content</div>
      </Card>,
    );

    expect(screen.getByText("Test Title")).toBeInTheDocument();
    expect(screen.getByText("Test Description")).toBeInTheDocument();
    expect(screen.getByText("Card Body Content")).toBeInTheDocument();
  });
});
