import { render, screen } from "@testing-library/react";
import { Button } from "./Button";

describe("Button", () => {
  it("renders without crashing", () => {
    render(<Button>Test Button</Button>);
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("displays the correct text", () => {
    render(<Button>Click Me</Button>);
    expect(screen.getByRole("button")).toHaveTextContent("Click Me");
  });

  it("applies primary variant by default", () => {
    render(<Button>Default Button</Button>);
    const button = screen.getByRole("button");
    expect(button).toHaveClass("from-accent-500", "to-accent-600");
  });

  it("applies secondary variant when specified", () => {
    render(<Button variant="secondary">Secondary Button</Button>);
    const button = screen.getByRole("button");
    expect(button).toHaveClass("bg-primary-100");
  });

  it("applies ghost variant when specified", () => {
    render(<Button variant="ghost">Ghost Button</Button>);
    const button = screen.getByRole("button");
    expect(button).toHaveClass("bg-transparent");
  });

  it("applies medium size by default", () => {
    render(<Button>Medium Button</Button>);
    const button = screen.getByRole("button");
    expect(button).toHaveClass("py-3", "px-6");
  });

  it("applies small size when specified", () => {
    render(<Button size="sm">Small Button</Button>);
    const button = screen.getByRole("button");
    expect(button).toHaveClass("py-2", "px-4", "text-sm");
  });

  it("applies large size when specified", () => {
    render(<Button size="lg">Large Button</Button>);
    const button = screen.getByRole("button");
    expect(button).toHaveClass("py-4", "px-8", "text-lg");
  });

  it("passes through additional props", () => {
    render(<Button data-testid="custom-button">Custom Button</Button>);
    expect(screen.getByTestId("custom-button")).toBeInTheDocument();
  });

  it("applies custom className", () => {
    render(<Button className="custom-class">Custom Class Button</Button>);
    const button = screen.getByRole("button");
    expect(button).toHaveClass("custom-class");
  });
});
