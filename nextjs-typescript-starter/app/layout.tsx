import './globals.css';

import { GeistSans } from 'geist/font/sans';
import { auth } from 'app/auth';
import { AuthProvider } from '@/app/components/auth-provider';
import { TabBar } from '@/app/components/tab-bar';

const title = '单词学习';
const description = '移动端单词学习 H5：卡片式背单词，记录学习进度';

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
    <html lang="zh-CN">
      <body className={`${GeistSans.variable} bg-gray-100`}>
        {/* 预连接有道发音 CDN：提前完成 DNS + TLS，首次点击发音无需建连等待 */}
        <link rel="preconnect" href="https://dict.youdao.com" />
        <AuthProvider session={session}>
          <div className="mx-auto min-h-screen max-w-md bg-gray-50 pb-16 shadow-sm">
            {children}
          </div>
          <TabBar />
        </AuthProvider>
      </body>
    </html>
  );
}
