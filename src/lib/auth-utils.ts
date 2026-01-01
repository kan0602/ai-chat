import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

/**
 * サーバーコンポーネントでセッションを取得
 */
export async function getSession() {
  return await auth();
}

/**
 * 認証が必要なページで使用
 * 未認証の場合はホームページにリダイレクト
 */
export async function requireAuth() {
  const session = await auth();

  if (!session?.user) {
    redirect("/");
  }

  return session;
}

/**
 * 現在のユーザーIDを取得
 * 未認証の場合はnullを返す
 */
export async function getCurrentUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}
