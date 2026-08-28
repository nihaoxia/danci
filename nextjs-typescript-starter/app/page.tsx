// 首页（Tab 1）：服务端从 books 表获取全部单词书，渲染交给客户端视图
import { HomeView } from '@/app/components/home-view';
import { getBooks } from '@/db/queries';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const books = await getBooks();
  return <HomeView books={books} />;
}
