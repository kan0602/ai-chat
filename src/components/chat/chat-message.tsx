import { Avatar } from "@/components/ui/avatar";

interface ChatMessageProps {
  content: string;
  role: "user" | "assistant";
  userName?: string;
  userImage?: string;
  isStreaming?: boolean;
}

export function ChatMessage({
  content,
  role,
  userName,
  userImage,
  isStreaming = false,
}: ChatMessageProps) {
  const isUser = role === "user";

  return (
    <div
      className={`flex gap-3 px-4 py-6 ${
        isUser ? "bg-white dark:bg-gray-900" : "bg-gray-50 dark:bg-gray-800"
      }`}
    >
      <Avatar
        src={isUser ? userImage : undefined}
        fallback={isUser ? userName || "You" : "AI"}
        size="sm"
        className={isUser ? "" : "bg-blue-600 text-white"}
      />

      <div className="flex-1 space-y-2">
        <div className="font-medium text-gray-900 dark:text-gray-100">
          {isUser ? userName || "あなた" : "AI アシスタント"}
        </div>
        <div className="prose prose-sm max-w-none text-gray-700 dark:prose-invert dark:text-gray-300">
          {content}
          {isStreaming && (
            <span className="ml-1 inline-block h-4 w-2 animate-pulse bg-gray-400" />
          )}
        </div>
      </div>
    </div>
  );
}
