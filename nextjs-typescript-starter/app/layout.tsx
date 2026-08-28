import './globals.css';

import { GeistSans } from 'geist/font/sans';
import { MockAuthProvider } from '@/app/components/mock-auth';
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
        <MockAuthProvider>
          <div className="mx-auto min-h-screen max-w-md bg-gray-50 pb-16 shadow-sm">
            {children}
          </div>
          <TabBar />
        </MockAuthProvider>
      </body>
    </html>
  );
}
