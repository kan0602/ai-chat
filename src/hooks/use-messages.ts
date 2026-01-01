"use client";

import { useState, useCallback } from "react";
import { chatApi, type Message, type ChatWithMessages } from "@/lib/api-client";

export function useMessages(chatId: string) {
  const [chat, setChat] = useState<ChatWithMessages | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMessages = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { chat } = await chatApi.get(chatId);
      setChat(chat);
      setMessages(chat.messages);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch messages");
    } finally {
      setIsLoading(false);
    }
  }, [chatId]);

  const addMessage = useCallback((message: Message) => {
    setMessages((prev) => [...prev, message]);
  }, []);

  const updateLastMessage = useCallback((content: string) => {
    setMessages((prev) => {
      const newMessages = [...prev];
      const lastIndex = newMessages.length - 1;
      if (lastIndex >= 0 && newMessages[lastIndex].role === "assistant") {
        newMessages[lastIndex] = {
          ...newMessages[lastIndex],
          content,
        };
      }
      return newMessages;
    });
  }, []);

  return {
    chat,
    messages,
    isLoading,
    error,
    fetchMessages,
    addMessage,
    updateLastMessage,
    setMessages,
  };
}
