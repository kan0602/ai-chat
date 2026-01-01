import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Card, CardHeader, CardTitle, CardContent } from "../card";

describe("Card", () => {
  it("renders children correctly", () => {
    render(<Card>Card content</Card>);
    expect(screen.getByText("Card content")).toBeInTheDocument();
  });

  it("applies custom className", () => {
    const { container } = render(<Card className="custom-class">Content</Card>);
    const cardElement = container.firstChild as HTMLElement;

    expect(cardElement.className).toContain("custom-class");
  });

  it("handles click events", () => {
    const handleClick = vi.fn();
    render(<Card onClick={handleClick}>Clickable Card</Card>);

    fireEvent.click(screen.getByText("Clickable Card"));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("applies base styles", () => {
    const { container } = render(<Card>Content</Card>);
    const cardElement = container.firstChild as HTMLElement;

    // Check that base classes are present in the className
    expect(cardElement.className).toContain("rounded-xl");
    expect(cardElement.className).toContain("border");
    expect(cardElement.className).toContain("bg-white");
  });

  it("applies hover styles when hover prop is true", () => {
    const { container } = render(<Card hover>Content</Card>);
    const cardElement = container.firstChild as HTMLElement;

    expect(cardElement.className).toContain("cursor-pointer");
    expect(cardElement.className).toContain("hover:shadow-md");
  });
});

describe("CardHeader", () => {
  it("renders children correctly", () => {
    render(<CardHeader>Header content</CardHeader>);
    expect(screen.getByText("Header content")).toBeInTheDocument();
  });

  it("applies custom className", () => {
    const { container } = render(
      <CardHeader className="custom-header">Header</CardHeader>
    );
    const element = container.firstChild as HTMLElement;

    expect(element.className).toContain("custom-header");
  });
});

describe("CardTitle", () => {
  it("renders as h3 element", () => {
    render(<CardTitle>Title</CardTitle>);
    expect(screen.getByRole("heading", { level: 3 })).toBeInTheDocument();
  });

  it("renders children correctly", () => {
    render(<CardTitle>Card Title</CardTitle>);
    expect(screen.getByText("Card Title")).toBeInTheDocument();
  });
});

describe("CardContent", () => {
  it("renders children correctly", () => {
    render(<CardContent>Content here</CardContent>);
    expect(screen.getByText("Content here")).toBeInTheDocument();
  });

  it("applies custom className", () => {
    const { container } = render(
      <CardContent className="custom-content">Content</CardContent>
    );
    const element = container.firstChild as HTMLElement;

    expect(element.className).toContain("custom-content");
  });
});

describe("Card composition", () => {
  it("renders composed card correctly", () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Test Title</CardTitle>
        </CardHeader>
        <CardContent>Test content</CardContent>
      </Card>
    );

    expect(screen.getByRole("heading", { level: 3 })).toHaveTextContent("Test Title");
    expect(screen.getByText("Test content")).toBeInTheDocument();
  });
});
