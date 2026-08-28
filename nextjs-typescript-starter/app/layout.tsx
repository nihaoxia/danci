import './globals.css';

import { GeistSans } from 'geist/font/sans';
import { AuthProvider } from '@/app/components/auth-provider';
import { TabBar } from '@/app/components/tab-bar';

const title = '单词学习';
const description = '移动端单词学习 H5：卡片式背单词，记录学习进度';

export const metadata = {
  title,
  description,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className={`${GeistSans.variable} bg-gray-100`}>
        {/* 预连接有道发音 CDN：提前完成 DNS + TLS，首次点击发音无需建连等待 */}
        <link rel="preconnect" href="https://dict.youdao.com" />
        <AuthProvider>
          <div className="mx-auto min-h-screen max-w-md bg-gray-50 pb-16 shadow-sm">
            {children}
          </div>
          <TabBar />
        </AuthProvider>
      </body>
    </html>
  );
}
