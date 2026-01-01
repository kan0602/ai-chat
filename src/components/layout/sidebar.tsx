"use client";

import { Button } from "@/components/ui/button";

interface Chat {
  id: string;
  title: string | null;
  updatedAt: string;
}

interface SidebarProps {
  chats: Chat[];
  currentChatId?: string;
  onNewChat: () => void;
  onSelectChat: (id: string) => void;
  onDeleteChat?: (id: string) => void;
  isLoading?: boolean;
}

export function Sidebar({
  chats,
  currentChatId,
  onNewChat,
  onSelectChat,
  onDeleteChat,
  isLoading = false,
}: SidebarProps) {
  return (
    <aside className="flex h-full w-64 flex-col border-r border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
      <div className="p-4">
        <Button onClick={onNewChat} className="w-full" isLoading={isLoading}>
          新規チャット
        </Button>
      </div>

      <nav className="flex-1 overflow-y-auto px-2">
        <ul className="space-y-1">
          {chats.map((chat) => {
            const isActive = currentChatId === chat.id;
            return (
              <li key={chat.id}>
                <button
                  onClick={() => onSelectChat(chat.id)}
                  className={`
                    w-full text-left rounded-lg px-3 py-2 text-sm transition-colors
                    ${
                      isActive
                        ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200"
                        : "text-gray-700 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700"
                    }
                  `}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="truncate font-medium">
                        {chat.title || "新しいチャット"}
                      </div>
                      <div className="truncate text-xs text-gray-500 dark:text-gray-400">
                        {new Date(chat.updatedAt).toLocaleDateString("ja-JP")}
                      </div>
                    </div>
                    {onDeleteChat && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteChat(chat.id);
                        }}
                        className="ml-2 p-1 text-gray-400 hover:text-red-500 dark:hover:text-red-400"
                        title="削除"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    )}
                  </div>
                </button>
              </li>
            );
          })}
        </ul>

        {chats.length === 0 && (
          <p className="px-3 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
            チャット履歴がありません
          </p>
        )}
      </nav>
    </aside>
  );
}
