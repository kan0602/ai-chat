import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authMiddleware } from "./middleware/auth";
import { chatAgent } from "@/lib/mastra/agents/chat-agent";
import type { Variables } from "./index";

// バリデーションスキーマ
const createChatSchema = z.object({
  title: z.string().optional(),
});

const createMessageSchema = z.object({
  content: z.string().min(1),
});

// Chatルート
export const chatRoutes = new Hono<{ Variables: Variables }>()
  // 全ルートに認証を適用
  .use("*", authMiddleware)

  // GET /api/chat - チャット一覧取得
  .get("/", async (c) => {
    const userId = c.get("userId");

    const chats = await prisma.chat.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        title: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { messages: true },
        },
      },
    });

    return c.json({ chats });
  })

  // POST /api/chat - 新規チャット作成
  .post("/", zValidator("json", createChatSchema), async (c) => {
    const userId = c.get("userId");
    const { title } = c.req.valid("json");

    const chat = await prisma.chat.create({
      data: {
        title: title || "New Chat",
        userId,
      },
    });

    return c.json({ chat }, 201);
  })

  // GET /api/chat/:id - チャット詳細取得
  .get("/:id", async (c) => {
    const userId = c.get("userId");
    const chatId = c.req.param("id");

    const chat = await prisma.chat.findFirst({
      where: {
        id: chatId,
        userId,
      },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!chat) {
      return c.json({ error: "Chat not found" }, 404);
    }

    return c.json({ chat });
  })

  // DELETE /api/chat/:id - チャット削除
  .delete("/:id", async (c) => {
    const userId = c.get("userId");
    const chatId = c.req.param("id");

    const chat = await prisma.chat.findFirst({
      where: {
        id: chatId,
        userId,
      },
    });

    if (!chat) {
      return c.json({ error: "Chat not found" }, 404);
    }

    await prisma.chat.delete({
      where: { id: chatId },
    });

    return c.json({ success: true });
  })

  // POST /api/chat/:id/message - メッセージ送信（非ストリーミング）
  .post("/:id/message", zValidator("json", createMessageSchema), async (c) => {
    const userId = c.get("userId");
    const chatId = c.req.param("id");
    const { content } = c.req.valid("json");

    // チャットの存在確認
    const chat = await prisma.chat.findFirst({
      where: {
        id: chatId,
        userId,
      },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
          take: 20, // 直近20件のメッセージをコンテキストとして使用
        },
      },
    });

    if (!chat) {
      return c.json({ error: "Chat not found" }, 404);
    }

    // ユーザーメッセージを保存
    const userMessage = await prisma.message.create({
      data: {
        content,
        role: "user",
        chatId,
      },
    });

    // 会話履歴を構築（Mastraの形式）
    const conversationHistory = chat.messages
      .map((msg) => `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`)
      .join("\n");
    const prompt = conversationHistory
      ? `${conversationHistory}\nUser: ${content}`
      : content;

    try {
      // AIレスポンスを生成
      const response = await chatAgent.generate(prompt);
      const aiContent = response.text || "申し訳ありません。応答を生成できませんでした。";

      // AIメッセージを保存
      const assistantMessage = await prisma.message.create({
        data: {
          content: aiContent,
          role: "assistant",
          chatId,
        },
      });

      // チャットの更新日時を更新
      await prisma.chat.update({
        where: { id: chatId },
        data: { updatedAt: new Date() },
      });

      return c.json({
        userMessage,
        assistantMessage,
      });
    } catch (error) {
      console.error("AI response error:", error);
      return c.json({ error: "Failed to generate AI response" }, 500);
    }
  })

  // POST /api/chat/:id/message/stream - メッセージ送信（ストリーミング）
  .post(
    "/:id/message/stream",
    zValidator("json", createMessageSchema),
    async (c) => {
      const userId = c.get("userId");
      const chatId = c.req.param("id");
      const { content } = c.req.valid("json");

      // チャットの存在確認
      const chat = await prisma.chat.findFirst({
        where: {
          id: chatId,
          userId,
        },
        include: {
          messages: {
            orderBy: { createdAt: "asc" },
            take: 20,
          },
        },
      });

      if (!chat) {
        return c.json({ error: "Chat not found" }, 404);
      }

      // ユーザーメッセージを保存
      const userMessage = await prisma.message.create({
        data: {
          content,
          role: "user",
          chatId,
        },
      });

      // 会話履歴を構築（Mastraの形式）
      const conversationHistory = chat.messages
        .map((msg) => `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`)
        .join("\n");
      const prompt = conversationHistory
        ? `${conversationHistory}\nUser: ${content}`
        : content;

      return streamSSE(c, async (stream) => {
        let fullContent = "";

        try {
          // ユーザーメッセージIDを送信
          await stream.writeSSE({
            data: JSON.stringify({ type: "userMessage", message: userMessage }),
            event: "message",
          });

          // ストリーミングレスポンスを生成
          const response = await chatAgent.stream(prompt);

          for await (const chunk of response.textStream) {
            fullContent += chunk;
            await stream.writeSSE({
              data: JSON.stringify({ type: "chunk", content: chunk }),
              event: "message",
            });
          }

          // AIメッセージを保存
          const assistantMessage = await prisma.message.create({
            data: {
              content: fullContent || "申し訳ありません。応答を生成できませんでした。",
              role: "assistant",
              chatId,
            },
          });

          // チャットの更新日時を更新
          await prisma.chat.update({
            where: { id: chatId },
            data: { updatedAt: new Date() },
          });

          // 完了メッセージを送信
          await stream.writeSSE({
            data: JSON.stringify({
              type: "done",
              message: assistantMessage,
            }),
            event: "message",
          });
        } catch (error) {
          console.error("Streaming error:", error);
          await stream.writeSSE({
            data: JSON.stringify({ type: "error", error: "Failed to generate response" }),
            event: "error",
          });
        }
      });
    }
  );
