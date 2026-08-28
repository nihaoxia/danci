// Mock 数据层：数据结构与 docs/design.md 中的表结构保持一致，
// 后续接入真实数据库时，用 db/queries.ts 中的同名查询替换本文件的导出即可。
import type { WordContent } from '@/db/word-content';

// ---------- 表结构类型（对齐 design.md 2.2 / 2.3） ----------

export interface Book {
  id: string; // uuid 主键
  bookId: string; // 数据源 bookId，唯一，关联 words.bookId
  title: string;
  wordCount: number;
  coverUrl: string | null;
  tags: string[];
}

export interface Word {
  id: number; // bigint identity
  wordRank: number; // 学习顺序依据
  headWord: string;
  content: WordContent | null; // 词典完整数据
  bookId: string;
}

export interface MockUser {
  id: number;
  email: string;
}

export interface StudyProgress {
  id: number;
  userEmail: string;
  bookId: string;
  lastWordRank: number;
  updatedAt: string; // ISO 时间
}

// ---------- Mock：books ----------

export const mockBooks: Book[] = [
  {
    id: 'a1b2c3d4-0001',
    bookId: 'PEPXiaoXue6_1',
    title: '人教版小学英语六年级上册',
    wordCount: 24,
    coverUrl: null,
    tags: ['小学', '六年级'],
  },
  {
    id: 'a1b2c3d4-0002',
    bookId: 'PEPXiaoXue3_2',
    title: '人教版小学英语三年级下册',
    wordCount: 19,
    coverUrl: null,
    tags: ['小学', '三年级'],
  },
  {
    id: 'a1b2c3d4-0003',
    bookId: 'PEPXiaoXue4_1',
    title: '人教版小学英语四年级上册',
    wordCount: 16,
    coverUrl: null,
    tags: ['小学', '四年级'],
  },
  {
    id: 'a1b2c3d4-0004',
    bookId: 'PEPXiaoXue4_2',
    title: '人教版小学英语四年级下册',
    wordCount: 12,
    coverUrl: null,
    tags: ['小学', '四年级'],
  },
  {
    id: 'a1b2c3d4-0005',
    bookId: 'PEPXiaoXue5_1',
    title: '人教版小学英语五年级上册',
    wordCount: 12,
    coverUrl: null,
    tags: ['小学', '五年级'],
  },
];

// ---------- Mock：words ----------

// 单词紧凑描述：w=单词 p=美式音标 t=中文释义 pos=词性（缺省 n. 名词）
// s=例句[en, cn] ph=短语 sy=同近义词 rl=同根词
interface WordSpec {
  w: string;
  p?: string;
  t: string;
  pos?: string;
  s?: [string, string][];
  ph?: [string, string][];
  sy?: { pos: string; tran: string; ws: string[] }[];
  rl?: { pos: string; ws: [string, string][] }[];
}

function buildWordContent(
  headWord: string,
  data: {
    usphone?: string;
    trans: WordContent['word']['content']['trans'];
    sentences?: { sContent: string; sCn: string }[];
    phrases?: { pContent: string; pCn: string }[];
    synos?: { pos: string; tran: string; hwds?: { w: string }[] }[];
    rels?: { pos: string; words?: { hwd: string; tran: string }[] }[];
  }
): WordContent {
  return {
    word: {
      wordHead: headWord,
      wordId: headWord,
      content: {
        usphone: data.usphone,
        ukphone: data.usphone,
        usspeech: `${headWord}&type=2`,
        ukspeech: `${headWord}&type=1`,
        trans: data.trans,
        sentence: data.sentences
          ? { desc: '例句', sentences: data.sentences }
          : undefined,
        phrase: data.phrases ? { desc: '短语', phrases: data.phrases } : undefined,
        syno: data.synos ? { desc: '同近义词', synos: data.synos } : undefined,
        relWord: data.rels ? { desc: '同根词', rels: data.rels } : undefined,
      },
    },
  };
}

function expand(bookId: string, specs: WordSpec[]): Word[] {
  return specs.map((spec, i) =>
    word(
      bookId,
      i + 1,
      spec.w,
      buildWordContent(spec.w, {
        usphone: spec.p,
        trans: [{ tranCn: spec.t, descCn: spec.pos ?? 'n. 名词' }],
        sentences: spec.s?.map(([sContent, sCn]) => ({ sContent, sCn })),
        phrases: spec.ph?.map(([pContent, pCn]) => ({ pContent, pCn })),
        synos: spec.sy?.map(({ pos, tran, ws }) => ({
          pos,
          tran,
          hwds: ws.map((w) => ({ w })),
        })),
        rels: spec.rl?.map(({ pos, ws }) => ({
          pos,
          words: ws.map(([hwd, tran]) => ({ hwd, tran })),
        })),
      })
    )
  );
}

const book6_1: WordSpec[] = [
  {
    w: 'science',
    p: "'saɪəns",
    t: '科学',
    pos: 'n. 名词',
    s: [
      ['Developments in science and technology', '科学技术的发展'],
      ['Many leading scientists do not think science is the only way to know the world.', '许多杰出科学家都不认为科学是认识世界的唯一方式。'],
    ],
    ph: [
      ['science and technology', '科学与技术'],
      ['computer science', '计算机科学'],
      ['science fiction', '科幻小说'],
    ],
    sy: [{ pos: 'n.', tran: '科学；技术；学科', ws: ['technology', 'mechanics', 'discipline'] }],
    rl: [
      { pos: 'adj.', ws: [['scientific', '科学的']] },
      { pos: 'adv.', ws: [['scientifically', '系统地；科学地']] },
      { pos: 'n.', ws: [['scientist', '科学家']] },
    ],
  },
  {
    w: 'museum',
    p: 'mjuˈzɪəm',
    t: '博物馆',
    s: [['the Museum of Modern Art', '现代艺术博物馆']],
    ph: [
      ['science museum', '科学博物馆'],
      ['art museum', '美术馆'],
      ['palace museum', '故宫博物院'],
    ],
  },
  { w: 'postcard', p: 'ˈpəʊstkɑːd', t: '明信片', s: [['I sent my friend a postcard from Beijing.', '我从北京给朋友寄了一张明信片。']] },
  { w: 'dictionary', p: 'ˈdɪkʃənri', t: '词典', s: [['Look up the word in the dictionary.', '在词典里查一下这个单词。']] },
  { w: 'comic book', t: '连环画册', pos: 'n. 短语', s: [['He reads comic books every weekend.', '他每个周末都看连环画册。']] },
  { w: 'word book', t: '单词书', pos: 'n. 短语' },
  { w: 'supermarket', p: 'ˈsuːpəmɑːkɪt', t: '超市', s: [['Mum buys fruit at the supermarket.', '妈妈在超市买水果。']] },
  { w: 'cinema', p: 'ˈsɪnəmə', t: '电影院', s: [["Let's go to the cinema tonight.", '我们今晚去看电影吧。']] },
  { w: 'hospital', p: 'ˈhɒspɪtl', t: '医院', s: [['His father works in a hospital.', '他爸爸在医院工作。']] },
  { w: 'bookstore', p: 'ˈbʊkstɔː(r)', t: '书店', ph: [['next to the bookstore', '在书店旁边']] },
  { w: 'crossing', p: 'ˈkrɒsɪŋ', t: '十字路口', s: [['Turn right at the second crossing.', '在第二个十字路口右转。']] },
  { w: 'turn left', t: '向左转', pos: 'v. 短语', s: [['Turn left at the cinema.', '在电影院向左转。']] },
  { w: 'turn right', t: '向右转', pos: 'v. 短语' },
  { w: 'go straight', t: '直行', pos: 'v. 短语', s: [['Go straight and you can see the park.', '直走你就能看到公园。']] },
  { w: 'taxi', p: 'ˈtæksi', t: '出租车', s: [['We take a taxi to the airport.', '我们乘出租车去机场。']] },
  { w: 'subway', p: 'ˈsʌbweɪ', t: '地铁', s: [['I go to school by subway.', '我坐地铁上学。']] },
  { w: 'train', p: 'treɪn', t: '火车', ph: [['by train', '乘火车'], ['train station', '火车站']] },
  { w: 'ship', p: 'ʃɪp', t: '轮船', s: [['The ship is very big.', '这艘轮船非常大。']] },
  { w: 'plane', p: 'pleɪn', t: '飞机', s: [["The plane lands at ten o'clock.", '飞机十点着陆。']] },
  { w: 'on foot', t: '步行', pos: 'adv. 短语', s: [['My home is near, so I go to school on foot.', '我家很近，所以我步行上学。']] },
  { w: 'by bus', t: '乘公交车', pos: 'adv. 短语' },
  {
    w: 'hobby',
    p: 'ˈhɒbi',
    t: '业余爱好',
    s: [['My hobby is reading stories.', '我的爱好是读故事书。']],
    rl: [{ pos: 'n.', ws: [['hobbies', 'hobby 的复数']] }],
  },
  { w: 'pen pal', t: '笔友', s: [['I have a pen pal in Australia.', '我有一个澳大利亚的笔友。']] },
  { w: 'hiking', p: 'ˈhaɪkɪŋ', t: '远足', pos: 'n. 名词', s: [['We go hiking in the mountains.', '我们去山里远足。']] },
];

const book3_2: WordSpec[] = [
  { w: 'apple', p: "'æpl", t: '苹果', s: [['I eat an apple every day.', '我每天吃一个苹果。']] },
  { w: 'banana', p: "'bə'nɑːnə", t: '香蕉', s: [['The monkey likes bananas.', '猴子喜欢香蕉。']] },
  { w: 'orange', p: "'ɒrɪndʒ", t: '橙子；橘子' },
  { w: 'grape', p: "'greɪp", t: '葡萄' },
  { w: 'pear', p: "'peə(r)", t: '梨' },
  { w: 'thin', p: 'θɪn', t: '瘦的', pos: 'adj. 形容词', s: [['The cat is thin.', '这只猫很瘦。']] },
  { w: 'fat', p: 'fæt', t: '胖的', pos: 'adj. 形容词' },
  { w: 'tall', p: 'tɔːl', t: '高的', pos: 'adj. 形容词', s: [['My brother is tall.', '我哥哥很高。']] },
  { w: 'short', p: 'ʃɔːt', t: '矮的；短的', pos: 'adj. 形容词' },
  { w: 'long', p: 'lɒŋ', t: '长的', pos: 'adj. 形容词' },
  { w: 'big', p: 'bɪɡ', t: '大的', pos: 'adj. 形容词', s: [['The elephant is big.', '大象很大。']] },
  { w: 'small', p: 'smɔːl', t: '小的', pos: 'adj. 形容词' },
  { w: 'giraffe', p: 'dʒəˈrɑːf', t: '长颈鹿', s: [['The giraffe has a long neck.', '长颈鹿有长长的脖子。']] },
  { w: 'elephant', p: 'ˈelɪfənt', t: '大象', s: [['An elephant has a long nose.', '大象有长长的鼻子。']] },
  { w: 'monkey', p: 'ˈmʌŋki', t: '猴子', s: [['The monkey can climb trees.', '猴子会爬树。']] },
  { w: 'panda', p: 'ˈpændə', t: '熊猫', s: [['Pandas love bamboo.', '熊猫喜欢竹子。']] },
  { w: 'eleven', p: 'ɪˈlevn', t: '十一', pos: 'num. 数词' },
  { w: 'twelve', p: 'twelv', t: '十二', pos: 'num. 数词' },
  { w: 'thirteen', p: 'ˌθɜːˈtiːn', t: '十三', pos: 'num. 数词' },
];

const book4_1: WordSpec[] = [
  { w: 'classroom', p: 'ˈklɑːsruːm', t: '教室', s: [['Our classroom is big and clean.', '我们的教室又大又干净。']] },
  { w: 'window', p: 'ˈwɪndəʊ', t: '窗户', s: [['Open the window, please.', '请打开窗户。']] },
  { w: 'door', p: 'dɔː(r)', t: '门', s: [['Close the door, please.', '请关门。']] },
  { w: 'desk', p: 'desk', t: '书桌', s: [['There is a book on the desk.', '书桌上有一本书。']] },
  { w: 'chair', p: 'tʃeə(r)', t: '椅子', s: [['Sit on your chair, please.', '请坐在你的椅子上。']] },
  { w: 'blackboard', p: 'ˈblækbɔːd', t: '黑板', s: [['The teacher writes on the blackboard.', '老师在黑板上写字。']] },
  { w: 'light', p: 'laɪt', t: '灯', s: [['Turn on the light, please.', '请开灯。']] },
  { w: 'picture', p: 'ˈpɪktʃə(r)', t: '图画；照片', s: [['There are two pictures on the wall.', '墙上有两幅画。']] },
  { w: 'fan', p: 'fæn', t: '风扇；扇子', s: [["It's hot. Let's turn on the fan.", '天很热，我们开风扇吧。']] },
  { w: 'computer', p: 'kəmˈpjuːtə(r)', t: '计算机', s: [['I have a new computer.', '我有一台新电脑。']] },
  { w: 'wall', p: 'wɔːl', t: '墙', s: [['The wall is white.', '墙是白色的。']] },
  {
    w: 'floor', p: 'flɔː(r)', t: '地板', s: [["Let's sweep the floor.", '我们来扫地吧。']]
  },
  { w: 'schoolbag', p: 'ˈskuːlbæɡ', t: '书包', s: [['My schoolbag is heavy.', '我的书包很重。']] },
  { w: 'storybook', p: 'ˈstɔːribʊk', t: '故事书', s: [['I like this storybook very much.', '我非常喜欢这本故事书。']] },
  { w: 'notebook', p: 'ˈnəʊtbʊk', t: '笔记本', s: [['Write it down in your notebook.', '把它写进你的笔记本里。']] },
  { w: 'candy', p: 'ˈkændi', t: '糖果', s: [["Don't eat too much candy.", '不要吃太多糖果。']] },
];

const book4_2: WordSpec[] = [
  { w: 'breakfast', p: 'ˈbrekfəst', t: '早餐', s: [['I have breakfast at seven.', '我七点吃早餐。']] },
  { w: 'lunch', p: 'lʌntʃ', t: '午餐', s: [['We have lunch at school.', '我们在学校吃午餐。']] },
  { w: 'dinner', p: 'ˈdɪnə(r)', t: '晚餐', s: [["It's time for dinner.", '该吃晚餐了。']] },
  { w: 'English class', t: '英语课', pos: 'n. 短语', s: [['We have English class today.', '我们今天有英语课。']] },
  { w: 'music class', t: '音乐课', pos: 'n. 短语' },
  { w: 'PE class', t: '体育课', pos: 'n. 短语' },
  { w: 'get up', t: '起床', pos: 'v. 短语', s: [['I get up at six every day.', '我每天六点起床。']] },
  { w: 'go to school', t: '去上学', pos: 'v. 短语' },
  { w: 'sunny', p: 'ˈsʌni', t: '晴朗的', pos: 'adj. 形容词', s: [["It's sunny today.", '今天天气晴朗。']] },
  { w: 'rainy', p: 'ˈreɪni', t: '下雨的', pos: 'adj. 形容词' },
  { w: 'windy', p: 'ˈwɪndi', t: '刮风的', pos: 'adj. 形容词' },
  {
    w: 'cold', p: 'kəʊld', t: '寒冷的', pos: 'adj. 形容词', s: [["It's cold outside. Put on your coat.", '外面很冷，穿上外套。']]
  },
];

const book5_1: WordSpec[] = [
  { w: 'old', p: 'əʊld', t: '老的；旧的', pos: 'adj. 形容词', s: [['My grandpa is old but healthy.', '我爷爷年纪大了但很健康。']] },
  { w: 'young', p: 'jʌŋ', t: '年轻的', pos: 'adj. 形容词' },
  { w: 'funny', p: 'ˈfʌni', t: '滑稽的；有趣的', pos: 'adj. 形容词', s: [['The monkey is very funny.', '这只猴子非常滑稽。']] },
  { w: 'kind', p: 'kaɪnd', t: '和蔼的；亲切的', pos: 'adj. 形容词', s: [['Our teacher is kind to us.', '我们老师对我们很和蔼。']] },
  { w: 'strict', p: 'strɪkt', t: '严格的', pos: 'adj. 形容词' },
  { w: 'polite', p: 'pəˈlaɪt', t: '有礼貌的', pos: 'adj. 形容词', s: [['He is a polite boy.', '他是个有礼貌的男孩。']] },
  { w: 'helpful', p: 'ˈhelpfl', t: '有帮助的；乐于助人的', pos: 'adj. 形容词' },
  { w: 'clever', p: 'ˈklevə(r)', t: '聪明的', pos: 'adj. 形容词', s: [['She is a clever girl.', '她是个聪明的女孩。']] },
  { w: 'shy', p: 'ʃaɪ', t: '害羞的', pos: 'adj. 形容词' },
  { w: 'Monday', p: 'ˈmʌndeɪ', t: '星期一', pos: 'n. 名词', s: [['We have art class on Monday.', '我们星期一有美术课。']] },
  { w: 'Tuesday', p: 'ˈtjuːzdeɪ', t: '星期二', pos: 'n. 名词' },
  { w: 'weekend', p: 'ˌwiːkˈend', t: '周末', pos: 'n. 名词', s: [['I often read books on the weekend.', '我周末经常看书。']] },
];

let wordId = 0;
function word(bookId: string, wordRank: number, headWord: string, content: WordContent | null): Word {
  return { id: ++wordId, wordRank, headWord, content, bookId };
}

export const mockWords: Word[] = [
  ...expand('PEPXiaoXue6_1', book6_1),
  ...expand('PEPXiaoXue3_2', book3_2),
  ...expand('PEPXiaoXue4_1', book4_1),
  ...expand('PEPXiaoXue4_2', book4_2),
  ...expand('PEPXiaoXue5_1', book5_1),
];

// ---------- Mock：study_progress ----------
// 注意：不再预置假进度，进度完全来自用户真实学习记录（localStorage）

// 演示账号（mock 认证中预置，任意密码可登录）
export const seededEmails = ['demo@example.com'];

// ---------- 查询函数（签名对齐 design.md 3.2，便于后续替换为真实 DB 查询） ----------

export function getBook(bookId: string): Book | null {
  return mockBooks.find((b) => b.bookId === bookId) ?? null;
}

export function getWordsByBookId(bookId: string): Word[] {
  return mockWords
    .filter((w) => w.bookId === bookId)
    .sort((a, b) => a.wordRank - b.wordRank);
}

export function getWordByRank(bookId: string, rank: number): Word | null {
  return mockWords.find((w) => w.bookId === bookId && w.wordRank === rank) ?? null;
}
