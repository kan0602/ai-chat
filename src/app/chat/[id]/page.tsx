"use client";

import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { chatApi, type Chat } from "@/lib/api-client";
import { useMessages } from "@/hooks/use-messages";
import { useStreamingMessage } from "@/hooks/use-streaming-message";
import { ChatList } from "@/components/chat/chat-list";
import { ChatInput } from "@/components/chat/chat-input";
import { Sidebar } from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button";
import { ChatListSkeleton, SidebarSkeleton } from "@/components/ui/skeleton";
import { ErrorMessage } from "@/components/ui/error-message";
import { useToast } from "@/components/ui/toast";

export default function ChatPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const chatId = params.id as string;
  const { addToast } = useToast();

  const {
    chat,
    messages,
    isLoading: isLoadingMessages,
    error: messagesError,
    fetchMessages,
    addMessage,
  } = useMessages(chatId);

  const {
    isStreaming,
    streamingContent,
    error: streamingError,
    sendMessage,
  } = useStreamingMessage();

  const [chats, setChats] = useState<Chat[]>([]);
  const [isLoadingChats, setIsLoadingChats] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const fetchChats = useCallback(async () => {
    setIsLoadingChats(true);
    try {
      const { chats } = await chatApi.list();
      setChats(chats);
    } catch (err) {
      addToast("チャット一覧の取得に失敗しました", "error");
      console.error("Failed to fetch chats:", err);
    } finally {
      setIsLoadingChats(false);
    }
  }, [addToast]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetchMessages();
      fetchChats();
    }
  }, [session, fetchMessages, fetchChats]);

  const handleSendMessage = async (content: string) => {
    await sendMessage(
      chatId,
      content,
      (userMessage) => {
        addMessage(userMessage);
      },
      (assistantMessage) => {
        addMessage(assistantMessage);
      }
    );
  };

  const handleNewChat = async () => {
    try {
      const { chat } = await chatApi.create();
      await fetchChats();
      addToast("新しいチャットを作成しました", "success");
      router.push(`/chat/${chat.id}`);
    } catch (err) {
      addToast("チャットの作成に失敗しました", "error");
      console.error("Failed to create chat:", err);
    }
  };

  const handleDeleteChat = async (id: string) => {
    try {
      await chatApi.delete(id);
      setChats((prev) => prev.filter((chat) => chat.id !== id));
      addToast("チャットを削除しました", "success");
      if (id === chatId) {
        router.push("/chat");
      }
    } catch (err) {
      addToast("チャットの削除に失敗しました", "error");
      console.error("Failed to delete chat:", err);
    }
  };

  const handleSelectChat = (id: string) => {
    setIsSidebarOpen(false);
    router.push(`/chat/${id}`);
  };

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const error = messagesError || streamingError;

  return (
    <div className="flex h-screen">
      {/* Mobile Sidebar Toggle */}
      <Button
        variant="ghost"
        size="sm"
        className="fixed left-4 top-20 z-50 md:hidden"
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        aria-label={isSidebarOpen ? "サイドバーを閉じる" : "サイドバーを開く"}
      >
        {isSidebarOpen ? (
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        )}
      </Button>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          fixed inset-y-0 left-0 z-40 transform transition-transform duration-200 md:relative md:translate-x-0
          ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {isLoadingChats ? (
          <aside className="flex h-full w-64 flex-col border-r border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
            <div className="p-4">
              <div className="h-10 w-full animate-pulse rounded-md bg-gray-200 dark:bg-gray-700" />
            </div>
            <SidebarSkeleton />
          </aside>
        ) : (
          <Sidebar
            chats={chats}
            currentChatId={chatId}
            onNewChat={handleNewChat}
            onSelectChat={handleSelectChat}
            onDeleteChat={handleDeleteChat}
          />
        )}
      </div>

      {/* Main Chat Area */}
      <div className="flex flex-1 flex-col">
        {/* Chat Header */}
        <div className="border-b border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-900">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white ml-10 md:ml-0">
              {chat?.title || "チャット"}
            </h1>
            {isStreaming && (
              <span className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
                応答中...
              </span>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mx-4 mt-4">
            <ErrorMessage
              message={error}
              onRetry={fetchMessages}
            />
          </div>
        )}

        {/* Loading State */}
        {isLoadingMessages ? (
          <div className="flex-1 overflow-hidden">
            <ChatListSkeleton />
          </div>
        ) : (
          <ChatList
            messages={messages}
            userName={session.user?.name || undefined}
            userImage={session.user?.image || undefined}
            streamingContent={streamingContent}
          />
        )}

        {/* Chat Input */}
        <ChatInput onSend={handleSendMessage} disabled={isStreaming} />
      </div>
    </div>
  );
}
