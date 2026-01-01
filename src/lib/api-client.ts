// Types
export interface Chat {
  id: string;
  title: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    messages: number;
  };
}

export interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  chatId: string;
  createdAt: string;
}

export interface ChatWithMessages extends Chat {
  messages: Message[];
}

// API Base URL
const API_BASE = "/api";

// Error handling
class ApiError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new ApiError(error.error || "An error occurred", response.status);
  }
  return response.json();
}

// Chat API
export const chatApi = {
  // チャット一覧取得
  async list(): Promise<{ chats: Chat[] }> {
    const response = await fetch(`${API_BASE}/chat`, {
      credentials: "include",
    });
    return handleResponse(response);
  },

  // チャット作成
  async create(title?: string): Promise<{ chat: Chat }> {
    const response = await fetch(`${API_BASE}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ title }),
    });
    return handleResponse(response);
  },

  // チャット詳細取得
  async get(id: string): Promise<{ chat: ChatWithMessages }> {
    const response = await fetch(`${API_BASE}/chat/${id}`, {
      credentials: "include",
    });
    return handleResponse(response);
  },

  // チャット削除
  async delete(id: string): Promise<{ success: boolean }> {
    const response = await fetch(`${API_BASE}/chat/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    return handleResponse(response);
  },
};

// Message API
export const messageApi = {
  // メッセージ送信（非ストリーミング）
  async send(
    chatId: string,
    content: string
  ): Promise<{ userMessage: Message; assistantMessage: Message }> {
    const response = await fetch(`${API_BASE}/chat/${chatId}/message`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ content }),
    });
    return handleResponse(response);
  },

  // メッセージ送信（ストリーミング）
  async sendStream(
    chatId: string,
    content: string,
    onChunk: (chunk: string) => void,
    onUserMessage: (message: Message) => void,
    onComplete: (message: Message) => void,
    onError: (error: string) => void
  ): Promise<void> {
    const response = await fetch(`${API_BASE}/chat/${chatId}/message/stream`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ content }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new ApiError(error.error || "An error occurred", response.status);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error("No response body");
    }

    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          try {
            const data = JSON.parse(line.slice(6));

            switch (data.type) {
              case "userMessage":
                onUserMessage(data.message);
                break;
              case "chunk":
                onChunk(data.content);
                break;
              case "done":
                onComplete(data.message);
                break;
              case "error":
                onError(data.error);
                break;
            }
          } catch {
            // Ignore parse errors
          }
        }
      }
    }
  },
};
