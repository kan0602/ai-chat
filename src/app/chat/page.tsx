"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { chatApi, type Chat } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Sidebar } from "@/components/layout/sidebar";
import { CardSkeleton, SidebarSkeleton } from "@/components/ui/skeleton";
import { ErrorMessage, EmptyState } from "@/components/ui/error-message";
import { useToast } from "@/components/ui/toast";

export default function ChatListPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [chats, setChats] = useState<Chat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { addToast } = useToast();

  const fetchChats = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { chats } = await chatApi.list();
      setChats(chats);
    } catch (err) {
      const message = err instanceof Error ? err.message : "チャットの取得に失敗しました";
      setError(message);
      addToast(message, "error");
    } finally {
      setIsLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetchChats();
    }
  }, [session, fetchChats]);

  const handleNewChat = async () => {
    try {
      const { chat } = await chatApi.create();
      addToast("新しいチャットを作成しました", "success");
      router.push(`/chat/${chat.id}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "チャットの作成に失敗しました";
      setError(message);
      addToast(message, "error");
    }
  };

  const handleDeleteChat = async (id: string) => {
    try {
      await chatApi.delete(id);
      setChats((prev) => prev.filter((chat) => chat.id !== id));
      addToast("チャットを削除しました", "success");
    } catch (err) {
      const message = err instanceof Error ? err.message : "チャットの削除に失敗しました";
      addToast(message, "error");
    }
  };

  const handleSelectChat = (id: string) => {
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

  return (
    <div className="flex min-h-screen">
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        {isLoading ? (
          <aside className="flex h-full w-64 flex-col border-r border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
            <div className="p-4">
              <div className="h-10 w-full animate-pulse rounded-md bg-gray-200 dark:bg-gray-700" />
            </div>
            <SidebarSkeleton />
          </aside>
        ) : (
          <Sidebar
            chats={chats}
            onNewChat={handleNewChat}
            onSelectChat={handleSelectChat}
            onDeleteChat={handleDeleteChat}
          />
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              チャット一覧
            </h1>
            <Button onClick={handleNewChat}>新しいチャット</Button>
          </div>

          {error && (
            <div className="mb-4">
              <ErrorMessage message={error} onRetry={fetchChats} />
            </div>
          )}

          {isLoading ? (
            <div className="grid gap-4">
              {[1, 2, 3].map((i) => (
                <CardSkeleton key={i} />
              ))}
            </div>
          ) : chats.length === 0 ? (
            <Card className="p-8">
              <EmptyState
                icon={
                  <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                }
                title="チャットがありません"
                description="新しいチャットを作成して会話を始めましょう"
                action={<Button onClick={handleNewChat}>新しいチャットを作成</Button>}
              />
            </Card>
          ) : (
            <div className="grid gap-4">
              {chats.map((chat) => (
                <Card
                  key={chat.id}
                  className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  onClick={() => handleSelectChat(chat.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                        {chat.title || "無題のチャット"}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(chat.createdAt).toLocaleDateString("ja-JP", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                      {chat._count && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {chat._count.messages} メッセージ
                        </p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteChat(chat.id);
                      }}
                      className="ml-4 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                      aria-label="チャットを削除"
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
