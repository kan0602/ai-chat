"use client";

import { useState, useCallback } from "react";
import { messageApi, type Message } from "@/lib/api-client";

export function useStreamingMessage() {
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(
    async (
      chatId: string,
      content: string,
      onUserMessage: (message: Message) => void,
      onComplete: (message: Message) => void
    ) => {
      setIsStreaming(true);
      setStreamingContent("");
      setError(null);

      try {
        await messageApi.sendStream(
          chatId,
          content,
          // onChunk
          (chunk) => {
            setStreamingContent((prev) => prev + chunk);
          },
          // onUserMessage
          (message) => {
            onUserMessage(message);
          },
          // onComplete
          (message) => {
            setStreamingContent("");
            onComplete(message);
            setIsStreaming(false);
          },
          // onError
          (err) => {
            setError(err);
            setIsStreaming(false);
          }
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to send message");
        setIsStreaming(false);
      }
    },
    []
  );

  return {
    isStreaming,
    streamingContent,
    error,
    sendMessage,
  };
}
