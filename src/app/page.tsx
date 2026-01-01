"use client";

import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session) {
      router.push("/chat");
    }
  }, [session, router]);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Hero Section */}
      <section className="flex flex-1 flex-col items-center justify-center px-4 py-16 text-center">
        <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          AI Chat
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-2xl">
          エンターテイメント向けAIチャットボット。
          Claude AIと楽しく会話しましょう。
        </p>
        <Button size="lg" onClick={() => signIn("google")}>
          Googleでログイン
        </Button>
      </section>

      {/* Features Section */}
      <section className="px-4 py-16 bg-white dark:bg-gray-800">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900 dark:text-white">
            特徴
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="p-6">
              <div className="text-4xl mb-4">💬</div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
                自然な会話
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Claude AIによる自然で流暢な会話を楽しめます。
              </p>
            </Card>
            <Card className="p-6">
              <div className="text-4xl mb-4">⚡</div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
                リアルタイム応答
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                ストリーミングによるリアルタイムな応答を実現。
              </p>
            </Card>
            <Card className="p-6">
              <div className="text-4xl mb-4">📝</div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
                履歴管理
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                会話履歴を保存し、いつでも振り返ることができます。
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-4 py-8 text-center text-gray-600 dark:text-gray-400">
        <p>&copy; 2025 AI Chat. All rights reserved.</p>
      </footer>
    </div>
  );
}
