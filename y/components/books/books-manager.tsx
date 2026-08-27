"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useActionState,
  useState,
} from "react";
import { Plus, Search, Pencil, Trash2, Book, Loader2 } from "lucide-react";

import {
  createBookAction,
  deleteBookAction,
  updateBookAction,
  type BookActionState,
} from "@/app/actions/books";
import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export type BookPublic = {
  id: string;
  title: string;
  wordCount: number;
  actualCount: number;
  coverUrl: string;
  bookId: string;
  tags: string[];
  createdAt: string;
};

export type AvailableBookId = { bookId: string; count: number };

function formatDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function Cover({ url, title }: { url: string; title: string }) {
  if (url) {
    return (
      /* eslint-disable-next-line @next/next/no-img-element */
      <img
        src={url}
        alt={title}
        className="h-12 w-9 rounded object-cover"
      />
    );
  }
  return (
    <div className="flex h-12 w-9 items-center justify-center rounded bg-muted">
      <Book className="text-muted-foreground size-4" />
    </div>
  );
}

function BookIdInput({
  available,
  defaultValue,
  disabled,
}: {
  available: AvailableBookId[];
  defaultValue?: string;
  disabled?: boolean;
}) {
  const [bookId, setBookId] = useState(defaultValue || "");

  return (
    <div className="flex flex-col gap-2">
      <Label>bookId</Label>
      <div className="flex min-h-9 flex-wrap items-center gap-1 rounded-md border p-1.5">
        {bookId ? (
          <Badge variant="default" className="gap-1 text-[11px]">
            {bookId}
            <button
              type="button"
              onClick={() => setBookId("")}
              disabled={disabled}
              className="hover:text-foreground/60 -mr-1 ml-0.5 size-3.5 cursor-pointer leading-none disabled:cursor-not-allowed"
              aria-label="清除 bookId"
            >
              ×
            </button>
          </Badge>
        ) : (
          <span className="text-muted-foreground px-1 text-sm">未选择</span>
        )}
      </div>
      <Input
        value={bookId}
        onChange={(e) => setBookId(e.target.value)}
        placeholder="输入或点选下方真实 bookId"
        disabled={disabled}
      />
      {available.length > 0 && (
        <div className="flex flex-wrap gap-1">
          <span className="text-muted-foreground text-xs">可选：</span>
          {available.map((a) => (
            <button
              key={a.bookId}
              type="button"
              onClick={() => setBookId(a.bookId)}
              disabled={disabled}
              className={
                "cursor-pointer rounded border px-1.5 py-0.5 text-[11px] disabled:cursor-not-allowed disabled:opacity-50 " +
                (bookId === a.bookId
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-muted text-foreground/80 hover:bg-muted/70")
              }
            >
              {a.bookId}{" "}
              <span className="text-muted-foreground">({a.count})</span>
            </button>
          ))}
        </div>
      )}
      <p className="text-muted-foreground text-xs">
        关联 words 表中相同 bookId 的单词；实际单词数按此实时统计。
      </p>
      <input type="hidden" name="bookId" value={bookId} />
    </div>
  );
}

function TagsInput({
  defaultValue,
  disabled,
}: {
  defaultValue?: string[];
  disabled?: boolean;
}) {
  const [text, setText] = useState((defaultValue ?? []).join(", "));

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor="b-tags">标签</Label>
      <Input
        id="b-tags"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="多个标签用逗号隔开，如：小学, 六年级, 人教版"
        disabled={disabled}
      />
      <p className="text-muted-foreground text-xs">
        自定义标签，用逗号分隔；用于分类和搜索。
      </p>
      <input type="hidden" name="tags" value={text} />
    </div>
  );
}

function BookForm({
  action,
  defaultValues,
  availableBookIds,
  submitLabel,
  onDone,
}: {
  action: (prev: BookActionState, formData: FormData) => Promise<BookActionState>;
  defaultValues?: Partial<BookPublic>;
  availableBookIds: AvailableBookId[];
  submitLabel: string;
  onDone: () => void;
}) {
  const [state, formAction, pending] = useActionState(action, {
    error: undefined,
    ok: undefined,
  });

  useEffect(() => {
    if (state.ok) onDone();
  }, [state.ok, onDone]);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {defaultValues?.id && (
        <input type="hidden" name="id" value={defaultValues.id} />
      )}
      <div className="flex flex-col gap-2">
        <Label htmlFor="b-title">标题</Label>
        <Input
          id="b-title"
          name="title"
          required
          defaultValue={defaultValues?.title}
          disabled={pending}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="b-count">单词数量</Label>
        <Input
          id="b-count"
          name="wordCount"
          type="number"
          min={0}
          step={1}
          required
          defaultValue={defaultValues?.wordCount ?? 0}
          disabled={pending}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="b-cover">封面 URL</Label>
        <Input
          id="b-cover"
          name="coverUrl"
          type="url"
          inputMode="url"
          placeholder="https://..."
          defaultValue={defaultValues?.coverUrl}
          disabled={pending}
        />
      </div>
      <BookIdInput
        available={availableBookIds}
        defaultValue={defaultValues?.bookId}
        disabled={pending}
      />
      <TagsInput
        defaultValue={defaultValues?.tags}
        disabled={pending}
      />
      {state.error && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}
      <DialogFooter>
        <Button type="submit" disabled={pending}>
          {pending && <Loader2 className="animate-spin" />}
          {submitLabel}
        </Button>
      </DialogFooter>
    </form>
  );
}

function DeleteBookForm({
  target,
  onDone,
}: {
  target: BookPublic;
  onDone: () => void;
}) {
  const [state, formAction, pending] = useActionState(deleteBookAction, {
    error: undefined,
    ok: undefined,
  });

  useEffect(() => {
    if (state.ok) onDone();
  }, [state.ok, onDone]);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="id" value={target.id} />
      <p className="text-sm">
        确认删除单词书
        <span className="font-medium"> {target.title} </span>
        ？该操作不可撤销。
      </p>
      <p className="text-destructive text-sm">
        将同时删除 words 表中 bookId 为
        <span className="font-medium"> {target.bookId} </span>
        的全部单词数据（{target.actualCount} 条）。
      </p>
      {state.error && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}
      <DialogFooter>
        <Button type="submit" variant="destructive" disabled={pending}>
          {pending && <Loader2 className="animate-spin" />}
          确认删除
        </Button>
      </DialogFooter>
    </form>
  );
}

export function BooksManager({
  initialBooks,
  availableBookIds,
}: {
  initialBooks: BookPublic[];
  availableBookIds: AvailableBookId[];
}) {
  const [keyword, setKeyword] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<BookPublic | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BookPublic | null>(null);

  const filtered = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    if (!kw) return initialBooks;
    return initialBooks.filter(
      (b) =>
        b.title.toLowerCase().includes(kw) ||
        b.bookId.toLowerCase().includes(kw) ||
        b.tags.some((t) => t.toLowerCase().includes(kw))
    );
  }, [initialBooks, keyword]);

  const closeCreate = useCallback(() => setCreateOpen(false), []);
  const closeEdit = useCallback(() => setEditTarget(null), []);
  const closeDelete = useCallback(() => setDeleteTarget(null), []);

  return (
    <>
      <PageHeader
        title="单词书管理"
        description="维护单词书的创建、编辑与查询"
        actions={
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus />
            新建单词书
          </Button>
        }
      />
      <div className="flex flex-1 flex-col gap-4 overflow-auto p-6">
        <div className="flex items-center justify-between gap-3">
          <div className="relative w-full max-w-xs">
            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
            <Input
              placeholder="搜索标题、bookId 或标签"
              className="pl-8"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
          </div>
          <span className="text-muted-foreground text-sm">
            共 {filtered.length} 本
          </span>
        </div>

        <div className="bg-card rounded-xl border">
          <Table className="table-fixed">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[7%]">封面</TableHead>
                <TableHead className="w-[19%]">标题</TableHead>
                <TableHead className="w-[10%] text-center">单词数量</TableHead>
                <TableHead className="w-[10%] text-center">实际单词数</TableHead>
                <TableHead className="w-[17%] text-center">bookId</TableHead>
                <TableHead className="w-[18%]">标签</TableHead>
                <TableHead className="w-[11%]">创建时间</TableHead>
                <TableHead className="w-[8%] text-center">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-muted-foreground py-10 text-center"
                  >
                    暂无匹配的单词书
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((book) => (
                  <TableRow key={book.id}>
                    <TableCell>
                      <Cover url={book.coverUrl} title={book.title} />
                    </TableCell>
                    <TableCell className="font-medium">
                      <div className="truncate">{book.title}</div>
                    </TableCell>
                    <TableCell className="text-center tabular-nums">
                      {book.wordCount.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-center tabular-nums">
                      {book.actualCount > 0 ? (
                        book.actualCount.toLocaleString()
                      ) : (
                        <span className="text-muted-foreground">0</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {book.bookId ? (
                        <Badge variant="secondary" className="text-[11px]">
                          {book.bookId}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {book.tags.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {book.tags.map((tag) => (
                            <Badge
                              key={tag}
                              variant="outline"
                              className="text-[11px]"
                            >
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(book.createdAt)}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="编辑"
                          title="编辑"
                          onClick={() => setEditTarget(book)}
                        >
                          <Pencil />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          aria-label="删除"
                          title="删除"
                          onClick={() => setDeleteTarget(book)}
                        >
                          <Trash2 />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* 新建单词书 */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新建单词书</DialogTitle>
            <DialogDescription>
              填写标题、单词数量、封面、bookId 与标签
            </DialogDescription>
          </DialogHeader>
          <BookForm
            action={createBookAction}
            availableBookIds={availableBookIds}
            submitLabel="创建"
            onDone={closeCreate}
          />
        </DialogContent>
      </Dialog>

      {/* 编辑单词书 */}
      <Dialog open={!!editTarget} onOpenChange={(v) => !v && closeEdit()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑单词书</DialogTitle>
            <DialogDescription>修改单词书信息</DialogDescription>
          </DialogHeader>
          {editTarget && (
            <BookForm
              key={editTarget.id}
              action={updateBookAction}
              availableBookIds={availableBookIds}
              defaultValues={editTarget}
              submitLabel="保存"
              onDone={closeEdit}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* 删除确认 */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && closeDelete()}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>删除单词书</DialogTitle>
            <DialogDescription>此操作不可撤销</DialogDescription>
          </DialogHeader>
          {deleteTarget && (
            <DeleteBookForm
              key={deleteTarget.id}
              target={deleteTarget}
              onDone={closeDelete}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
