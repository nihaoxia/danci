import './globals.css';

import { GeistSans } from 'geist/font/sans';
import { auth } from 'app/auth';
import { AuthProvider } from '@/app/components/auth-provider';
import { TabBar } from '@/app/components/tab-bar';
import { ThemeProvider } from '@/app/components/theme-provider';

const title = '单词学习';
const description = '移动端单词学习 H5：卡片式背单词，记录学习进度';

// 首屏前同步本地主题，避免刷新时从默认主题闪到已选主题
const themeInitScript = `try{var t=localStorage.getItem('word-theme');document.documentElement.classList.add('theme-'+(t||'green'))}catch(e){document.documentElement.classList.add('theme-green')}`;

export const metadata = {
  title,
  description,
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 服务端获取 session 并作为 SessionProvider 初始值：
  // SSR 首屏即为登录态，避免登录用户刷新页面时先闪现未登录 UI
  const session = await auth();
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className={`${GeistSans.variable} bg-[var(--bg-body)]`}>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <ThemeProvider>
          <AuthProvider session={session}>
            <div
              className="mx-auto min-h-screen max-w-md pb-16 shadow-sm"
              style={{ background: 'var(--bg-page)' }}
            >
              {children}
            </div>
            <TabBar />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
