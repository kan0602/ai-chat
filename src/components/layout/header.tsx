"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export function Header() {
  const { data: session, status } = useSession();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur-sm dark:border-gray-700 dark:bg-gray-900/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-bold text-gray-900 dark:text-gray-100">
            AI Chat
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-4 md:flex">
          <ThemeToggle />
          {status === "loading" ? (
            <div className="h-8 w-20 animate-pulse rounded-md bg-gray-200 dark:bg-gray-700" />
          ) : session ? (
            <>
              <Link href="/chat">
                <Button variant="ghost" size="sm">
                  チャット
                </Button>
              </Link>
              <div className="flex items-center gap-3">
                <Avatar
                  src={session.user?.image || undefined}
                  fallback={session.user?.name || "User"}
                  size="sm"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => signOut({ callbackUrl: "/" })}
                >
                  ログアウト
                </Button>
              </div>
            </>
          ) : (
            <Link href="/api/auth/signin">
              <Button size="sm">ログイン</Button>
            </Link>
          )}
        </nav>

        {/* Mobile Menu Button */}
        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
          >
            {isMobileMenuOpen ? (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMobileMenuOpen && (
        <div className="border-t border-gray-200 bg-white px-4 py-4 dark:border-gray-700 dark:bg-gray-900 md:hidden">
          {status === "loading" ? (
            <div className="h-8 w-full animate-pulse rounded-md bg-gray-200 dark:bg-gray-700" />
          ) : session ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 pb-4 border-b border-gray-200 dark:border-gray-700">
                <Avatar
                  src={session.user?.image || undefined}
                  fallback={session.user?.name || "User"}
                  size="md"
                />
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {session.user?.name}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {session.user?.email}
                  </p>
                </div>
              </div>
              <Link
                href="/chat"
                className="block rounded-lg px-4 py-2 text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                チャット
              </Link>
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  signOut({ callbackUrl: "/" });
                }}
                className="block w-full rounded-lg px-4 py-2 text-left text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
              >
                ログアウト
              </button>
            </div>
          ) : (
            <Link
              href="/api/auth/signin"
              className="block"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <Button className="w-full">ログイン</Button>
            </Link>
          )}
        </div>
      )}
    </header>
  );
}
