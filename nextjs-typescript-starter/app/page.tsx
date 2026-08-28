// 首页（Tab 1）：服务端从 books 表获取全部单词书，渲染交给客户端视图
// books 为准静态数据，ISR 缓存页面（60s）
import { HomeView } from '@/app/components/home-view';
import { getBooks } from '@/db/queries';

export const revalidate = 60;

export default async function HomePage() {
  const books = await getBooks();
  return <HomeView books={books} />;
}
