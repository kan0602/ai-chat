import { describe, it, expect, vi, beforeEach } from "vitest";
import { Hono } from "hono";

// Mock Prisma
vi.mock("@/lib/prisma", () => ({
  prisma: {
    chat: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    message: {
      create: vi.fn(),
    },
  },
}));

// Mock auth middleware
vi.mock("../middleware/auth", () => ({
  authMiddleware: vi.fn(async (c, next) => {
    c.set("userId", "test-user-id");
    await next();
  }),
}));

// Mock chat agent
vi.mock("@/lib/mastra/agents/chat-agent", () => ({
  chatAgent: {
    generate: vi.fn().mockResolvedValue({ text: "AI response" }),
    stream: vi.fn().mockResolvedValue({
      textStream: (async function* () {
        yield "Hello ";
        yield "World";
      })(),
    }),
  },
}));

import { prisma } from "@/lib/prisma";
import { chatRoutes } from "../chat";

describe("Chat API", () => {
  let app: Hono;

  beforeEach(() => {
    vi.clearAllMocks();
    app = new Hono();
    app.route("/chat", chatRoutes);
  });

  describe("GET /chat", () => {
    it("should return list of chats", async () => {
      const mockChats = [
        {
          id: "chat-1",
          title: "Test Chat",
          createdAt: new Date(),
          updatedAt: new Date(),
          _count: { messages: 5 },
        },
      ];

      vi.mocked(prisma.chat.findMany).mockResolvedValue(mockChats as never);

      const res = await app.request("/chat", {
        method: "GET",
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.chats).toHaveLength(1);
      expect(data.chats[0].title).toBe("Test Chat");
    });

    it("should return empty array when no chats exist", async () => {
      vi.mocked(prisma.chat.findMany).mockResolvedValue([]);

      const res = await app.request("/chat", {
        method: "GET",
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.chats).toHaveLength(0);
    });
  });

  describe("POST /chat", () => {
    it("should create a new chat", async () => {
      const mockChat = {
        id: "new-chat-id",
        title: "My Chat",
        userId: "test-user-id",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.chat.create).mockResolvedValue(mockChat as never);

      const res = await app.request("/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "My Chat" }),
      });

      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.chat.title).toBe("My Chat");
    });

    it("should create a chat with default title when not provided", async () => {
      const mockChat = {
        id: "new-chat-id",
        title: "New Chat",
        userId: "test-user-id",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.chat.create).mockResolvedValue(mockChat as never);

      const res = await app.request("/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      expect(res.status).toBe(201);
      expect(prisma.chat.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            title: "New Chat",
          }),
        })
      );
    });
  });

  describe("GET /chat/:id", () => {
    it("should return chat details with messages", async () => {
      const mockChat = {
        id: "chat-1",
        title: "Test Chat",
        userId: "test-user-id",
        createdAt: new Date(),
        updatedAt: new Date(),
        messages: [
          { id: "msg-1", content: "Hello", role: "user", createdAt: new Date() },
          { id: "msg-2", content: "Hi there!", role: "assistant", createdAt: new Date() },
        ],
      };

      vi.mocked(prisma.chat.findFirst).mockResolvedValue(mockChat as never);

      const res = await app.request("/chat/chat-1", {
        method: "GET",
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.chat.id).toBe("chat-1");
      expect(data.chat.messages).toHaveLength(2);
    });

    it("should return 404 when chat not found", async () => {
      vi.mocked(prisma.chat.findFirst).mockResolvedValue(null);

      const res = await app.request("/chat/non-existent", {
        method: "GET",
      });

      expect(res.status).toBe(404);
      const data = await res.json();
      expect(data.error).toBe("Chat not found");
    });
  });

  describe("DELETE /chat/:id", () => {
    it("should delete a chat", async () => {
      const mockChat = {
        id: "chat-1",
        title: "Test Chat",
        userId: "test-user-id",
      };

      vi.mocked(prisma.chat.findFirst).mockResolvedValue(mockChat as never);
      vi.mocked(prisma.chat.delete).mockResolvedValue(mockChat as never);

      const res = await app.request("/chat/chat-1", {
        method: "DELETE",
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
    });

    it("should return 404 when trying to delete non-existent chat", async () => {
      vi.mocked(prisma.chat.findFirst).mockResolvedValue(null);

      const res = await app.request("/chat/non-existent", {
        method: "DELETE",
      });

      expect(res.status).toBe(404);
      const data = await res.json();
      expect(data.error).toBe("Chat not found");
    });
  });

  describe("POST /chat/:id/message", () => {
    it("should send a message and receive AI response", async () => {
      const mockChat = {
        id: "chat-1",
        title: "Test Chat",
        userId: "test-user-id",
        messages: [],
      };

      const mockUserMessage = {
        id: "msg-1",
        content: "Hello",
        role: "user",
        chatId: "chat-1",
        createdAt: new Date(),
      };

      const mockAssistantMessage = {
        id: "msg-2",
        content: "AI response",
        role: "assistant",
        chatId: "chat-1",
        createdAt: new Date(),
      };

      vi.mocked(prisma.chat.findFirst).mockResolvedValue(mockChat as never);
      vi.mocked(prisma.message.create)
        .mockResolvedValueOnce(mockUserMessage as never)
        .mockResolvedValueOnce(mockAssistantMessage as never);
      vi.mocked(prisma.chat.update).mockResolvedValue(mockChat as never);

      const res = await app.request("/chat/chat-1/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: "Hello" }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.userMessage.content).toBe("Hello");
      expect(data.assistantMessage.content).toBe("AI response");
    });

    it("should return 404 when chat not found", async () => {
      vi.mocked(prisma.chat.findFirst).mockResolvedValue(null);

      const res = await app.request("/chat/non-existent/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: "Hello" }),
      });

      expect(res.status).toBe(404);
    });

    it("should validate message content is not empty", async () => {
      const res = await app.request("/chat/chat-1/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: "" }),
      });

      expect(res.status).toBe(400);
    });
  });
});
