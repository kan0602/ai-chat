import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

// ミドルウェア用のNextAuth設定（Prismaなし）
const { auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    authorized: ({ auth, request }) => {
      const isLoggedIn = !!auth?.user;
      const isProtectedRoute = request.nextUrl.pathname.startsWith("/chat");

      if (isProtectedRoute && !isLoggedIn) {
        return false; // リダイレクト
      }

      return true;
    },
  },
});

export default auth;

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
