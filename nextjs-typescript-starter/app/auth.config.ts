import { NextAuthConfig } from 'next-auth';

export const authConfig = {
  pages: {
    // 未登录访问受保护页面时重定向到「我的」页，由 popup 完成登录
    signIn: '/me',
  },
  providers: [
    // added later in auth.ts since it requires bcrypt which is only compatible with Node.js
    // while this file is also used in non-Node.js environments
  ],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      // 仅学习页需要登录；未登录 → 我的页并自动弹出登录 popup
      const isOnStudy = nextUrl.pathname.startsWith('/study');

      if (isOnStudy) {
        if (isLoggedIn) return true;
        return Response.redirect(new URL('/me?login=1', nextUrl));
      }

      return true;
    },
  },
} satisfies NextAuthConfig;
