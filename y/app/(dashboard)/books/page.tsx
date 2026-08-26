"use client";

import { useMemo, useState } from "react";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";

import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type BookStatus = "published" | "draft";

type Book = {
  id: string;
  name: string;
  description: string;
  wordCount: number;
  createdAt: string;
  status: BookStatus;
};

const initialBooks: Book[] = [
  {
    id: "1",
    name: "CET-4 核心词汇",
    description: "大学英语四级高频核心词汇",
    wordCount: 2300,
    createdAt: "2026-07-12",
    status: "published",
  },
  {
    id: "2",
    name: "CET-6 核心词汇",
    description: "大学英语六级高频核心词汇",
    wordCount: 2800,
    createdAt: "2026-07-20",
    status: "published",
  },
  {
    id: "3",
    name: "高考英语 3500",
    description: "高考考纲 3500 词精选",
    wordCount: 3500,
    createdAt: "2026-08-01",
    status: "draft",
  },
  {
    id: "4",
    name: "雅思核心词",
    description: "雅思考试高频学术词汇",
    wordCount: 3100,
    createdAt: "2026-08-10",
    status: "draft",
  },
];

export default function BooksPage() {
  const [books] = useState<Book[]>(initialBooks);
  const [keyword, setKeyword] = useState("");

  const filtered = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    if (!kw) return books;
    return books.filter(
      (b) =>
        b.name.toLowerCase().includes(kw) ||
        b.description.toLowerCase().includes(kw)
    );
  }, [books, keyword]);

  return (
    <>
      <PageHeader
        title="单词书管理"
        description="维护单词书的创建、删除、更新与查询"
        actions={
          <Button size="sm">
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
              placeholder="搜索单词书名称或描述"
              className="pl-8"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
          </div>
          <span className="text-sm text-muted-foreground">
            共 {filtered.length} 本
          </span>
        </div>

        <div className="rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40px]">#</TableHead>
                <TableHead>单词书名称</TableHead>
                <TableHead>描述</TableHead>
                <TableHead className="text-right">单词数</TableHead>
                <TableHead>创建时间</TableHead>
                <TableHead>状态</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-muted-foreground py-10 text-center"
                  >
                    暂无匹配的单词书
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((book, idx) => (
                  <TableRow key={book.id}>
                    <TableCell className="text-muted-foreground">
                      {idx + 1}
                    </TableCell>
                    <TableCell className="font-medium">{book.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {book.description}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {book.wordCount.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {book.createdAt}
                    </TableCell>
                    <TableCell>
                      {book.status === "published" ? (
                        <Badge variant="success">已发布</Badge>
                      ) : (
                        <Badge variant="secondary">草稿</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="编辑"
                          title="编辑"
                        >
                          <Pencil />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          aria-label="删除"
                          title="删除"
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
    </>
  );
}
