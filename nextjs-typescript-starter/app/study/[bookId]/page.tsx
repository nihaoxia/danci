// 单词学习页：服务端从数据库查询书籍与单词，渲染交给客户端视图
import Link from 'next/link';
import { StudyView } from '@/app/components/study-view';
import type { CardWord } from '@/app/components/word-card';
import { getBookByBookId, getWordsByBookId } from '@/db/queries';
import { parseWordContent } from '@/db/word-content';

export const dynamic = 'force-dynamic';

export default async function StudyPage({
  params,
}: {
  params: { bookId: string };
}) {
  const { bookId } = params;
  const book = await getBookByBookId(bookId);

  if (!book) {
    return (
      <EmptyState text="单词书不存在">
        <Link href="/" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
          返回首页
        </Link>
      </EmptyState>
    );
  }

  const words = await getWordsByBookId(book.bookId);

  // 服务端预先裁剪的轻量卡片结构，避免传完整 content JSON
  const cardWords: CardWord[] = words.map((w) => {
    const content = parseWordContent(w.content)?.word.content;
    const trans = content?.trans?.[0];
    const sentence = content?.sentence?.sentences?.[0];
    return {
      rank: w.wordRank ?? 0,
      headWord: w.headWord ?? '',
      phone: content?.usphone || content?.ukphone || '',
      pos: trans?.descCn ?? '',
      tranCn: trans?.tranCn ?? '',
      example: sentence ? { en: sentence.sContent, cn: sentence.sCn } : undefined,
    };
  });

  return (
    <StudyView
      book={{ bookId: book.bookId, title: book.title }}
      cardWords={cardWords}
    />
  );
}

function EmptyState({ text, children }: { text: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 p-8 pt-20 text-center">
      <p className="text-sm text-gray-500">{text}</p>
      {children}
    </div>
  );
}
