// 我的（Tab 2）：服务端获取全部单词书（进度分母用真实 wordCount）；?login=1 时自动弹出登录 popup
// 用户进度由客户端组件经 /api/progress 拉取，页面本身可用 ISR 缓存
import { MeView } from '@/app/components/me-view';
import { getBooks } from '@/db/queries';

export const revalidate = 60;

export default async function MePage({
  searchParams,
}: {
  searchParams?: { login?: string };
}) {
  const books = await getBooks();
  return (
    <MeView books={books} autoOpenLogin={searchParams?.login === '1'} />
  );
}
