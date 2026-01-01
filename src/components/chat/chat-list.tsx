"use client";

import { useEffect, useRef } from "react";
import { ChatMessage } from "./chat-message";

interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  createdAt: string;
}

interface ChatListProps {
  messages: Message[];
  userName?: string;
  userImage?: string;
  streamingContent?: string;
}

export function ChatList({
  messages,
  userName,
  userImage,
  streamingContent,
}: ChatListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  return (
    <div className="flex-1 overflow-y-auto">
      {messages.length === 0 && !streamingContent ? (
        <div className="flex h-full items-center justify-center">
          <div className="text-center">
            <h2 className="mb-2 text-xl font-semibold text-gray-900 dark:text-gray-100">
              AI Chat へようこそ
            </h2>
            <p className="text-gray-500 dark:text-gray-400">
              メッセージを送信して会話を始めましょう
            </p>
          </div>
        </div>
      ) : (
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {messages.map((message) => (
            <ChatMessage
              key={message.id}
              content={message.content}
              role={message.role as "user" | "assistant"}
              userName={userName}
              userImage={userImage}
            />
          ))}

          {streamingContent && (
            <ChatMessage
              content={streamingContent}
              role="assistant"
              isStreaming={true}
            />
          )}
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  );
}
