import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ChatInput } from "../chat-input";

describe("ChatInput", () => {
  it("renders textarea and send button", () => {
    render(<ChatInput onSend={vi.fn()} />);

    expect(screen.getByPlaceholderText("メッセージを入力...")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /送信/i })).toBeInTheDocument();
  });

  it("calls onSend with message when form is submitted", async () => {
    const handleSend = vi.fn();
    const user = userEvent.setup();

    render(<ChatInput onSend={handleSend} />);

    const textarea = screen.getByPlaceholderText("メッセージを入力...");
    await user.type(textarea, "Hello, AI!");
    await user.click(screen.getByRole("button", { name: /送信/i }));

    expect(handleSend).toHaveBeenCalledWith("Hello, AI!");
  });

  it("clears input after sending", async () => {
    const handleSend = vi.fn();
    const user = userEvent.setup();

    render(<ChatInput onSend={handleSend} />);

    const textarea = screen.getByPlaceholderText("メッセージを入力...");
    await user.type(textarea, "Test message");
    await user.click(screen.getByRole("button", { name: /送信/i }));

    expect(textarea).toHaveValue("");
  });

  it("does not send empty messages", async () => {
    const handleSend = vi.fn();
    const user = userEvent.setup();

    render(<ChatInput onSend={handleSend} />);

    await user.click(screen.getByRole("button", { name: /送信/i }));

    expect(handleSend).not.toHaveBeenCalled();
  });

  it("does not send whitespace-only messages", async () => {
    const handleSend = vi.fn();
    const user = userEvent.setup();

    render(<ChatInput onSend={handleSend} />);

    const textarea = screen.getByPlaceholderText("メッセージを入力...");
    await user.type(textarea, "   ");
    await user.click(screen.getByRole("button", { name: /送信/i }));

    expect(handleSend).not.toHaveBeenCalled();
  });

  it("sends message on Enter key press", async () => {
    const handleSend = vi.fn();
    const user = userEvent.setup();

    render(<ChatInput onSend={handleSend} />);

    const textarea = screen.getByPlaceholderText("メッセージを入力...");
    await user.type(textarea, "Hello{enter}");

    expect(handleSend).toHaveBeenCalledWith("Hello");
  });

  it("does not send on Shift+Enter (allows newline)", async () => {
    const handleSend = vi.fn();

    render(<ChatInput onSend={handleSend} />);

    const textarea = screen.getByPlaceholderText("メッセージを入力...");
    fireEvent.change(textarea, { target: { value: "Line 1" } });
    fireEvent.keyDown(textarea, { key: "Enter", shiftKey: true });

    expect(handleSend).not.toHaveBeenCalled();
  });

  it("disables input when disabled prop is true", () => {
    render(<ChatInput onSend={vi.fn()} disabled />);

    expect(screen.getByPlaceholderText("メッセージを入力...")).toBeDisabled();
    expect(screen.getByRole("button", { name: /送信/i })).toBeDisabled();
  });

  it("uses custom placeholder", () => {
    render(<ChatInput onSend={vi.fn()} placeholder="Type here..." />);

    expect(screen.getByPlaceholderText("Type here...")).toBeInTheDocument();
  });

  it("shows keyboard shortcut hint", () => {
    render(<ChatInput onSend={vi.fn()} />);

    expect(screen.getByText(/Shift \+ Enter/)).toBeInTheDocument();
    expect(screen.getByText(/Enter で送信/)).toBeInTheDocument();
  });
});
