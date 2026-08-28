// words.content JSON 的只读类型定义与安全解析（对齐 design.md 2.5）

export interface WordContent {
  word: {
    wordHead: string;
    wordId: string;
    content: {
      usphone?: string; // 美式音标
      ukphone?: string; // 英式音标
      usspeech?: string; // 美式发音参数，如 "science&type=2"
      ukspeech?: string; // 英式发音参数，如 "science&type=1"
      trans?: {
        tranCn: string; // 中文释义
        descCn?: string; // 词性
        tranOther?: string; // 英文释义
        descOther?: string;
      }[];
      sentence?: {
        desc: string;
        sentences?: { sContent: string; sCn: string }[];
      };
      phrase?: {
        desc: string;
        phrases?: { pContent: string; pCn: string }[];
      };
      syno?: {
        desc: string;
        synos?: { pos: string; tran: string; hwds?: { w: string }[] }[];
      };
      relWord?: {
        desc: string;
        rels?: { pos: string; words?: { hwd: string; tran: string }[] }[];
      };
    };
  };
}

/** 安全解析 words.content，异常/缺失时返回 null，渲染层不再处理异常 JSON */
export function parseWordContent(raw: unknown): WordContent | null {
  if (!raw || typeof raw !== 'object') return null;
  const candidate = raw as WordContent;
  if (!candidate.word?.content) return null;
  return candidate;
}
