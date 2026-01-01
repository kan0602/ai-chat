import { createMiddleware } from "hono/factory";
import { auth } from "@/lib/auth";
import type { Variables } from "../index";

/**
 * Hono用認証ミドルウェア
 * NextAuthのセッションを検証し、userIdをコンテキストに設定
 */
export const authMiddleware = createMiddleware<{ Variables: Variables }>(
  async (c, next) => {
    const session = await auth();

    if (!session?.user?.id) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    c.set("userId", session.user.id);
    await next();
  }
);
