// utils/ebook.js — 电子书内容加载、章节解析、分页引擎
const CONTENT_KEY_PREFIX = 'lib_ebook_content_'

// 内置示例书内容（原始故事，多章节，用于演示与兜底）
const SAMPLE_STORY = `序章 旧书铺的灯

青石巷的尽头有一家旧书铺，门口挂着一盏昏黄的灯。老板是个沉默的老人，只管收书、修书、卖书，从不与客人多话。

镇上的人都说，那盏灯亮了几十年，从没熄过。有人说灯下压着一张泛黄的地图，也有人说老人在等一位从未归来的读者。

少年阿澄第一次推开那扇木门，是为了躲雨。他不会想到，这一步迈出去，他的人生便与满屋子的旧书再也无法分开。

第一章 雨夜来客

那晚的雨下得很急，屋檐上的水连成了线。阿澄抖着身上的雨水，才发现书铺里竟没有一丝潮气，连空气里都是干燥的纸墨香。

老人从柜台后抬起眼，指了指角落的旧藤椅，示意他坐下等雨停。阿澄注意到，老人右手的食指和中指上，覆着一层薄薄的茧。

雨声里，阿澄随手抽出一本没有书名的书。翻开第一页，上面只有一行小字：所有的路，都始于翻开的那一刻。

他觉得有趣，想问老人这本书的名字，抬头时老人却已背对着他，继续修补另一本残卷。灯影把老人的影子拉得很长。

第二章 无名之书

阿澄把那本无名之书带回了家。夜里他再翻开时，发现第一页那行小字下面，多出了一行新的字：读下去，路就会展开。

更奇怪的是，第二天再翻，字又多了一行。书里的字像是活物，一页一页，随着他的阅读慢慢生长。

阿澄试着把书带到学堂问先生。先生扶着眼镜看了半天，只说这是普通的空白装订本，什么字都没有。

可阿澄分明看见了字。从那天起，他每天夜里都读这本书，书也每天夜里多写一行，像是有一个看不见的人，在陪他一起走。

第三章 灯下的约定

半个月后，阿澄忍不住又去了旧书铺。老人一见到他，便从柜台下取出一个小木盒，推到他面前。

盒子里是一枚黄铜书签，背面刻着一个"澄"字。老人开口了，声音沙哑得像很久没说过话：这书认人，它等你等了很多年。

原来老人的祖父曾是位行脚书生，一生修书无数，晚年留下这本无名之书，说书里封着一部没写完的游记，要等一个"看得见字的人"来续上。

老人说：我不行，我眼睛里只有纸。你既然看得见，就替我把它读完。阿澄握着书签，重重地点了头。

第四章 字里行间

从那以后，无名之书生长得越来越快。阿澄跟着书里的文字走过雪山，渡过冰河，在沙漠的星光下听商队讲故事。

他渐渐发现，书里每多一行字，现实中的他也会多懂得一点东西——是书里那位旅人的从容，还是他自己在字里行间悟出的勇气，已经分不清了。

同窗笑他整日抱着一本"空白本子"发呆。阿澄不辩解，只是笑笑。有些路，只有走在上面的人才看得见风景。

第五章 迷路

入冬后，书里的旅人走到了一片浓雾笼罩的林子。文字忽然变得艰涩，有几夜甚至整页空白，一个字也不生长。

阿澄慌了。他每晚坐得更久，眼睛熬得发酸，书却像停摆的钟。他第一次意识到，也许书不是在写旅人，而是在写他自己。

他去找老人。老人听完只是笑：雾里的人不是迷路，是在等一颗定下来的心。你这些日子读书，是不是只顾着往前赶了？

阿澄怔住了。那晚回家，他没有翻开书，而是给自己沏了壶热茶，认认真真回想了这一年的每一步。茶凉时，他听见书页轻轻动了一下。

第六章 雾散

再翻开书，浓雾散了。旅人走出林子，在出口的石碑上刻了一行字：行路不难，难的是知道自己为何而行。

那一夜之后，书里的字迹变了，不再是旅人的语气，倒像是阿澄自己的声音在纸上落笔。

他试着提笔在书页空白处写字。第二天清晨，他写的字竟没有被书"吃掉"，而是稳稳地留在了纸上，与旅人的文字排在一起。

书认下他了。从读者，变成了同行的人。

第七章 最后一页

春天来的时候，书忽然开始加速收尾。旅人的旅程一条街一条巷地缩短，像一段终于要靠岸的航行。

阿澄反而平静了。他每天照旧读几页，然后帮家里做事，去旧书铺帮老人晒书、修书。他不再害怕读完，因为他已经成了那个写字的人。

最后一页只有一个日期，是老人的祖父出发那天。日期下面写着：书没有最后一页，除非读书的人停下来。

第八章 新的灯

阿澄把读完的书送回书铺。老人摩挲着封皮，眼里有泪光，却笑着把柜台后的灯罩摘下来，递给了他。

从今天起，灯归你守。老人说，守灯不是守着它不灭，是等下一个进来躲雨的人。

多年以后，青石巷尽头的灯还亮着。只是柜台后坐着的人，换成了一个眼里有光的年轻人。他面前摊着一本没有名字的书，正等着下一位读者翻开第一页。`

function getStoredContent(bookId) {
  try {
    return wx.getStorageSync(CONTENT_KEY_PREFIX + bookId) || ''
  } catch (e) {
    return ''
  }
}

function saveStoredContent(bookId, content) {
  try {
    wx.setStorageSync(CONTENT_KEY_PREFIX + bookId, content)
    return true
  } catch (e) {
    return false
  }
}

// 从本地临时文件读取 TXT 内容（上限约 60 万字符，超出截断）
function readTxtFile(filePath, callback) {
  if (!filePath) {
    callback(new Error('no file'), '')
    return
  }
  const fs = wx.getFileSystemManager()
  fs.readFile({
    filePath,
    encoding: 'utf8',
    success: (res) => {
      let text = String(res.data || '')
      if (text.length > 600000) text = text.slice(0, 600000) + '\n\n（内容过长，已截断显示前 60 万字符）'
      callback(null, text)
    },
    fail: (err) => callback(err, '')
  })
}

// 加载一本书的可读内容：优先已存内容 → TXT文件 → 示例内容
function loadBookContent(book, callback) {
  const stored = getStoredContent(book.id)
  if (stored) {
    callback(null, stored, 'stored')
    return
  }
  // 注意：文件格式统一按小写比较（util.getFileFormat 返回小写）
  if (book.type === 'electronic' && String(book.fileFormat).toLowerCase() === 'txt' && book.filePath) {
    readTxtFile(book.filePath, (err, text) => {
      if (!err && text && text.trim()) {
        saveStoredContent(book.id, text)
        callback(null, text, 'file')
      } else {
        // 临时文件已失效，退回示例内容
        callback(null, buildSampleContent(book), 'sample')
      }
    })
    return
  }
  callback(null, buildSampleContent(book), 'sample')
}

function buildSampleContent(book) {
  return `《${book.title}》\n\n作者：${book.author || '佚名'}\n\n（当前为演示内容。正式版支持导入 TXT 全文阅读，PDF/EPUB 需接入云解析服务。）\n\n` + SAMPLE_STORY
}

// 章节标题正则
const CHAPTER_RE = /^\s{0,4}((第\s*[0-9０-９一二三四五六七八九十百千两零〇]+\s*[章节回卷部篇])|(序章|序言|自序|前言|引子|楔子|尾声|后记|附录|番外|终章)|(Chapter\s+\d+|CHAPTER\s+\d+)).{0,24}$/

function isChapterTitle(line) {
  const t = line.trim()
  if (!t || t.length > 32) return false
  return CHAPTER_RE.test(t)
}

// 解析章节：返回 chapters:[{title, paraIndex}], paragraphs:[{text, isChapter}]
function parseContent(content) {
  const rawLines = String(content || '').split(/\r?\n/)
  const paragraphs = []
  const chapters = []
  // 合并连续空行，保留章节行
  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i].replace(/\s+$/, '')
    if (!line.trim()) continue
    if (isChapterTitle(line)) {
      chapters.push({ title: line.trim(), paraIndex: paragraphs.length })
      paragraphs.push({ text: line.trim(), isChapter: true })
    } else {
      paragraphs.push({ text: line.trim(), isChapter: false })
    }
  }
  if (chapters.length === 0 && paragraphs.length > 0) {
    chapters.push({ title: '正文', paraIndex: 0 })
  }
  return { paragraphs, chapters }
}

// 分页引擎
// opts: { paragraphs, chapters, containerWidthPx, containerHeightPx, fontPx, lineHeightRatio }
// 返回: pages:[{chapter, lines:[{t, p, first, hlPara}], chapterTitle}], 同时回填 chapter.page
function paginate(opts) {
  const {
    paragraphs, chapters,
    containerWidthPx, containerHeightPx,
    fontPx, lineHeightRatio, pageFooterPx
  } = opts

  const contentW = Math.max(containerWidthPx, 100)
  const contentH = Math.max(containerHeightPx - (pageFooterPx || 24), 100)
  const charsPerLine = Math.max(Math.floor(contentW / fontPx), 8)
  const lineH = fontPx * lineHeightRatio
  const linesPerPage = Math.max(Math.floor(contentH / lineH), 6)

  const pages = []
  let curLines = []
  let curChapter = 0
  let curChapterTitle = chapters.length ? chapters[0].title : ''

  function flushPage() {
    if (curLines.length === 0) return
    pages.push({ chapter: curChapter, chapterTitle: curChapterTitle, lines: curLines })
    curLines = []
  }

  // 章节跳页：标题单独成页的开头
  function newChapter(ci, title) {
    flushPage()
    curChapter = ci
    curChapterTitle = title
    chapters[ci].page = pages.length
  }

  for (let ci = 0; ci < chapters.length; ci++) {
    const chap = chapters[ci]
    const nextStart = ci + 1 < chapters.length ? chapters[ci + 1].paraIndex : paragraphs.length
    if (typeof chap.page !== 'number' || chap.page === 0) newChapter(ci, chap.title)

    for (let pi = chap.paraIndex; pi < nextStart; pi++) {
      const para = paragraphs[pi]
      if (!para) continue
      if (para.isChapter) continue // 章节标题已由 newChapter 处理

      let remain = para.text
      let first = true
      while (remain.length > 0) {
        const avail = first ? charsPerLine - 2 : charsPerLine // 首行缩进两字
        const take = Math.min(avail, remain.length)
        curLines.push({ t: remain.slice(0, take), p: pi, first })
        remain = remain.slice(take)
        first = false
        if (curLines.length >= linesPerPage) flushPage()
      }
      // 段后空一行
      curLines.push({ t: '', p: pi, first: false })
      if (curLines.length >= linesPerPage) flushPage()
    }
  }
  flushPage()

  if (pages.length === 0) {
    pages.push({ chapter: 0, chapterTitle: '', lines: [{ t: '暂无内容', p: 0, first: true }] })
  }
  // 兜底回填未设置的章节页码
  chapters.forEach((c) => {
    if (typeof c.page !== 'number') c.page = 0
  })
  return { pages, chapters }
}

module.exports = {
  CONTENT_KEY_PREFIX,
  SAMPLE_STORY,
  getStoredContent,
  saveStoredContent,
  readTxtFile,
  loadBookContent,
  buildSampleContent,
  isChapterTitle,
  parseContent,
  paginate
}
