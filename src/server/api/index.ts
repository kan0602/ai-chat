import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { chatRoutes } from "./chat";

// 型定義
export type Variables = {
  userId: string;
};

// Honoアプリケーション作成
const app = new Hono<{ Variables: Variables }>().basePath("/api");

// ミドルウェア
app.use("*", logger());
app.use(
  "*",
  cors({
    origin: ["http://localhost:3000"],
    credentials: true,
  })
);

// ヘルスチェック
app.get("/health", (c) => {
  return c.json({ status: "ok" });
});

// ルート登録
app.route("/chat", chatRoutes);

export default app;
export type AppType = typeof app;
