import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Input } from "./Input";

describe("Input", () => {
  it("renders without crashing", () => {
    render(<Input />);
    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });

  it("renders with label when provided", () => {
    render(<Input label="Email Address" id="email" />);
    expect(screen.getByLabelText("Email Address")).toBeInTheDocument();
  });

  it("associates label with input via htmlFor", () => {
    render(<Input label="Username" id="username" />);
    const label = screen.getByText("Username");
    const input = screen.getByLabelText("Username");
    expect(label).toHaveAttribute("for", "username");
    expect(input).toHaveAttribute("id", "username");
  });

  it("displays error message when error prop is provided", () => {
    render(<Input error="This field is required" id="test" />);
    expect(screen.getByText("This field is required")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent(
      "This field is required",
    );
  });

  it("sets aria-invalid when error is present", () => {
    render(<Input error="Invalid input" id="test" />);
    expect(screen.getByRole("textbox")).toHaveAttribute("aria-invalid", "true");
  });

  it("does not set aria-invalid when no error", () => {
    render(<Input id="test" />);
    expect(screen.getByRole("textbox")).toHaveAttribute(
      "aria-invalid",
      "false",
    );
  });

  it("displays helper text when provided and no error", () => {
    render(<Input helperText="Enter your full name" id="test" />);
    expect(screen.getByText("Enter your full name")).toBeInTheDocument();
  });

  it("prioritizes error over helperText when both provided", () => {
    render(
      <Input error="Invalid input" helperText="Enter your name" id="test" />,
    );
    expect(screen.getByText("Invalid input")).toBeInTheDocument();
    expect(screen.queryByText("Enter your name")).not.toBeInTheDocument();
  });

  it("forwards ref correctly", () => {
    const ref = { current: null as HTMLInputElement | null };
    render(<Input ref={ref} id="test" />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });

  it("generates unique ID when not provided", () => {
    const { container } = render(<Input label="Test" />);
    const input = container.querySelector("input");
    expect(input).toHaveAttribute("id");
    expect(input?.id).toBeTruthy();
    expect(input?.id.length).toBeGreaterThan(0);
  });

  it("uses provided ID when given", () => {
    render(<Input id="custom-id" />);
    expect(screen.getByRole("textbox")).toHaveAttribute("id", "custom-id");
  });

  it("associates error message with input via aria-describedby", () => {
    render(<Input error="Error message" id="test" />);
    const input = screen.getByRole("textbox");
    const errorId = input.getAttribute("aria-describedby");
    expect(errorId).toBe("test-error");
    expect(document.getElementById(errorId!)).toHaveTextContent(
      "Error message",
    );
  });

  it("associates helper text with input via aria-describedby", () => {
    render(<Input helperText="Helper text" id="test" />);
    const input = screen.getByRole("textbox");
    const helperId = input.getAttribute("aria-describedby");
    expect(helperId).toBe("test-helper");
    expect(document.getElementById(helperId!)).toHaveTextContent("Helper text");
  });

  it("applies custom className to input", () => {
    render(<Input className="custom-class" id="test" />);
    expect(screen.getByRole("textbox")).toHaveClass("custom-class");
  });

  it("applies error styling when error is present", () => {
    render(<Input error="Error" id="test" />);
    const input = screen.getByRole("textbox");
    expect(input).toHaveClass("border-red-300");
    expect(input).toHaveClass("focus:ring-red-500");
    expect(input).toHaveClass("focus:border-red-500");
  });

  it("does not apply error styling when no error", () => {
    render(<Input id="test" />);
    const input = screen.getByRole("textbox");
    expect(input).not.toHaveClass("border-red-300");
  });

  it("forwards additional props to input element", () => {
    render(<Input id="test" type="email" placeholder="Enter email" disabled />);
    const input = screen.getByRole("textbox") as HTMLInputElement;
    expect(input).toHaveAttribute("type", "email");
    expect(input).toHaveAttribute("placeholder", "Enter email");
    expect(input).toBeDisabled();
  });

  it("handles user input correctly", async () => {
    const user = userEvent.setup();
    render(<Input id="test" />);
    const input = screen.getByRole("textbox");

    await user.type(input, "Hello World");
    expect(input).toHaveValue("Hello World");
  });

  it("renders with type='password' correctly", () => {
    render(<Input id="password" type="password" />);
    // password inputs don't have role="textbox", so we use the ID
    expect(document.getElementById("password")).toHaveAttribute(
      "type",
      "password",
    );
  });
});
