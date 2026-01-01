"use client";

import { useState, useCallback } from "react";
import { chatApi, type Chat } from "@/lib/api-client";

export function useChat() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchChats = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { chats } = await chatApi.list();
      setChats(chats);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch chats");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createChat = useCallback(async (title?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const { chat } = await chatApi.create(title);
      setChats((prev) => [chat, ...prev]);
      return chat;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create chat");
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteChat = useCallback(async (id: string) => {
    setError(null);
    try {
      await chatApi.delete(id);
      setChats((prev) => prev.filter((chat) => chat.id !== id));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete chat");
      return false;
    }
  }, []);

  return {
    chats,
    isLoading,
    error,
    fetchChats,
    createChat,
    deleteChat,
  };
}
