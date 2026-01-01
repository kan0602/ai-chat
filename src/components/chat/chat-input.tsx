"use client";

import { useState, KeyboardEvent, FormEvent } from "react";
import { Button } from "@/components/ui/button";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({
  onSend,
  disabled = false,
  placeholder = "メッセージを入力...",
}: ChatInputProps) {
  const [message, setMessage] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSend(message.trim());
      setMessage("");
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="border-t border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900"
    >
      <div className="mx-auto flex max-w-3xl gap-3">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          className="
            flex-1 resize-none rounded-lg border border-gray-300 px-4 py-3
            text-gray-900 placeholder-gray-400 transition-colors
            focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500
            disabled:cursor-not-allowed disabled:bg-gray-100
            dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100
            dark:placeholder-gray-500 dark:focus:border-blue-400
          "
          style={{ minHeight: "48px", maxHeight: "200px" }}
        />
        <Button
          type="submit"
          disabled={disabled || !message.trim()}
          isLoading={disabled}
        >
          送信
        </Button>
      </div>
      <p className="mx-auto mt-2 max-w-3xl text-center text-xs text-gray-500 dark:text-gray-400">
        Shift + Enter で改行、Enter で送信
      </p>
    </form>
  );
}
