// utils/isbn.js
// 公共图书数据源查询：根据 ISBN 自动获取书名、作者、出版社、简介、封面等资料
// 查询链：Open Library → Google Books → 本地样本库
// 说明：
// 1. 开发者工具中 urlCheck 已关闭，可直接请求外部域名
// 2. 正式发布前需在小程序管理后台将 openlibrary.org、books.googleapis.com 加入 request 合法域名
// 3. 谷歌接口在大陆网络可能不可达，作为第二数据源自动降级

const PROMISE_TIMEOUT = 8000

function request(opts) {
  return new Promise((resolve, reject) => {
    wx.request({
      url: opts.url,
      method: 'GET',
      timeout: opts.timeout || PROMISE_TIMEOUT,
      header: opts.header || {},
      dataType: opts.dataType || 'json',
      success: (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) resolve(res.data)
        else {
          const err = new Error('HTTP ' + res.statusCode)
          err.statusCode = res.statusCode
          reject(err)
        }
      },
      fail: (err) => reject(new Error(err.errMsg || 'request fail'))
    })
  })
}

function normalizeISBN(isbn) {
  return String(isbn || '').replace(/[-\s]/g, '')
}

/* ---------------- 数据源 1：Open Library ---------------- */

function fetchFromOpenLibrary(isbn) {
  return request({ url: 'https://openlibrary.org/isbn/' + isbn + '.json', timeout: PUBLIC_TIMEOUT })
    .then((data) => {
      if (!data || data.error || !data.title) throw new Error('not found')

      const book = {
        source: 'Open Library',
        title: data.title || '',
        author: '',
        publisher: (data.publishers || []).join('、'),
        publishDate: normalizeDate(data.publish_date),
        pages: String(data.number_of_pages || data.number_of_pages_median || ''),
        description: typeof data.description === 'string'
          ? data.description
          : (data.description && data.description.value) || '',
        cover: 'https://covers.openlibrary.org/b/isbn/' + isbn + '-L.jpg'
      }

      const tasks = []

      // 作者需要二次请求 /authors/OLxxxA.json
      if (data.authors && data.authors.length) {
        tasks.push(
          Promise.all(
            data.authors.map((a) =>
              request({ url: 'https://openlibrary.org' + a.key + '.json' })
                .then((r) => (r && r.name) || '')
                .catch(() => '')
            )
          ).then((names) => { book.author = names.filter(Boolean).join('、') })
        )
      }

      // 简介补充 + 作者兜底：请求 works（works 的简介通常更完整，且 edition 缺作者时可从 works 取）
      if (data.works && data.works.length) {
        tasks.push(
          request({ url: 'https://openlibrary.org' + data.works[0].key + '.json' })
            .then((w) => {
              if (!w) return
              const d = typeof w.description === 'string' ? w.description : (w.description && w.description.value) || ''
              if (d) book.description = d
              if (!book.author && w.authors && w.authors.length) {
                return Promise.all(
                  w.authors.map((a) =>
                    request({ url: 'https://openlibrary.org' + (a.author ? a.author.key : a.key) + '.json' })
                      .then((r) => (r && r.name) || '')
                      .catch(() => '')
                  )
                ).then((names) => { book.author = names.filter(Boolean).join('、') })
              }
            })
            .catch(() => {})
        )
      }

      return Promise.all(tasks).then(() => {
        if (!book.title) throw new Error('not found')
        return book
      })
    })
}

/* ---------------- 数据源 2：Google Books ---------------- */

function fetchFromGoogleBooks(isbn) {
  return request({ url: 'https://www.googleapis.com/books/v1/volumes?q=isbn:' + isbn, timeout: PUBLIC_TIMEOUT })
    .then((data) => {
      if (!data || !data.items || !data.items.length) throw new Error('not found')
      const v = data.items[0].volumeInfo || {}
      if (!v.title) throw new Error('not found')

      let cover = ''
      if (v.imageLinks && v.imageLinks.thumbnail) {
        cover = v.imageLinks.thumbnail.replace('http://', 'https://')
      }

      return {
        source: 'Google Books',
        title: v.title || '',
        author: (v.authors || []).join('、'),
        publisher: v.publisher || '',
        publishDate: String(v.publishedDate || '').slice(0, 7),
        pages: String(v.pageCount || ''),
        description: v.description || '',
        cover: cover
      }
    })
}

/* ---------------- 数据源 3：豆瓣 ---------------- */
// 主查询：https://www.douban.com/j/search_suggest?q={isbn}（JSON，含书名/作者/年份/出版社/封面）
// 补充查询：https://www.douban.com/isbn/{isbn}/（图书详情页，用于补齐完整简介与页数）
// 详情页会按 UA 返回桌面版或移动版，两种版式都做了兼容解析；详情页失败不影响主查询结果。
// 若该书豆瓣未收录，详情页返回 404，整体视为未查到。

const DESKTOP_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

function decodeEntities(str) {
  return String(str || '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#x([0-9a-fA-F]+);/g, (m, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (m, dec) => String.fromCharCode(parseInt(dec, 10)))
}

function cleanText(html) {
  return decodeEntities(String(html || '').replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, ''))
    .replace(/[ \t\u00a0]+/g, ' ')
    .replace(/\n{2,}/g, '\n')
    .trim()
}

// 出版日期归一化为 YYYY-MM（如 2021-1-1 → 2021-01）
function normalizeDate(str) {
  const m = String(str || '').match(/(\d{4})\D*(\d{1,2})?/)
  if (!m) return ''
  const year = m[1]
  if (!m[2]) return year
  const month = String(parseInt(m[2], 10))
  return year + '-' + (month.length < 2 ? '0' + month : month)
}

// 过滤豆瓣的占位/无效字段值（如「目前无人评价」）
function cleanField(str) {
  const s = String(str || '').trim()
  if (!s) return ''
  if (/^(目前无人评价|暂无|暂无评分|未知|匿名|无|--|-|null|undefined)$/.test(s)) return ''
  return s
}

// 清理简介里的页面残留：分隔线、「(展开全部)」等
function cleanDescription(str) {
  return String(str || '')
    .replace(/^\s*[-—=*·\s]{6,}$/gm, '')      // 纯分隔线整行
    .replace(/[-—=*·]{10,}/g, '')             // 行内长分隔线
    .replace(/[（(]\s*展开全部\s*[)）]/g, '')
    .replace(/[（(]\s*收起\s*[)）]/g, '')
    .replace(/[ \t\u00a0]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

// 解析 search_suggest 的 card_subtitle，形如 "8.9分 / 刘慈欣 / 2008 / 重庆出版社"
function parseSuggestSubtitle(subtitle) {
  const result = { author: '', publishDate: '', publisher: '' }
  const parts = String(subtitle || '')
    .split('/')
    .map((s) => s.trim())
    .filter(Boolean)
    .filter((p) => !/(\d+(\.\d+)?分|暂无评分|评价人数不足)$/.test(p))
  if (!parts.length) return result

  const dateIdx = parts.findIndex((p) => /^\d{4}(-\d{1,2})?$/.test(p))
  if (dateIdx >= 0) {
    result.author = parts.slice(0, dateIdx).join('、')
    result.publishDate = normalizeDate(parts[dateIdx])
    result.publisher = parts.slice(dateIdx + 1).join('、')
  } else {
    result.author = parts[0]
    result.publisher = parts.length > 1 ? parts[parts.length - 1] : ''
  }
  return result
}

function fetchDoubanSuggest(isbn) {
  return request({
    url: 'https://www.douban.com/j/search_suggest?q=' + isbn,
    dataType: 'json',
    timeout: 10000,
    // 豆瓣要求带 UA，否则返回 403
    header: { 'User-Agent': DESKTOP_UA, 'Accept-Language': 'zh-CN,zh;q=0.9' }
  }).then((data) => {
    const cards = (data && data.cards) || []
    const card = cards.filter((c) => c && c.type === 'book' && c.title)[0]
    if (!card) throw new Error('not found')
    const sub = parseSuggestSubtitle(card.card_subtitle)
    return {
      source: '豆瓣',
      title: card.title,
      author: cleanField(sub.author),
      publisher: cleanField(sub.publisher),
      publishDate: sub.publishDate,
      pages: '',
      description: card.abstract || '',
      cover: card.cover_url ? card.cover_url.replace('/m/public/', '/l/public/') : ''
    }
  })
}

// 详情页解析（桌面版）
function parseDoubanDesktop(html) {
  const t = html.match(/<span property="v:itemreviewed">([\s\S]*?)<\/span>/)
  if (!t) return null
  const title = cleanText(t[1])
  if (!title) return null

  const info = (html.match(/<div id="info">([\s\S]*?)<div id="intro">/) ||
    html.match(/<div id="info">([\s\S]*?)<\/div>/) || [, ''])[1]

  const fields = {}
  const re = /<span class="pl">\s*([^<]+?)\s*[:：]?\s*<\/span>([\s\S]*?)(?=<span class="pl">|<br\s*\/?>|<\/div>|$)/g
  let m
  while ((m = re.exec(info))) {
    const key = m[1].trim().replace(/[:：]\s*$/, '')
    const val = cleanText(m[2]).replace(/^[:：]\s*/, '').replace(/\n/g, ' ').trim()
    if (key && val && !fields[key]) fields[key] = val
  }

  const coverM = html.match(/<div id="mainpic"[\s\S]*?<img[^>]+src="([^"]+)"/)
  const introM = html.match(/<div class="intro">([\s\S]*?)<\/div>/)

  return {
    title: title,
    author: cleanField(fields['作者']),
    publisher: cleanField(fields['出版社']),
    publishDate: normalizeDate(fields['出版年']),
    pages: (fields['页数'] || '').replace(/[^\d]/g, ''),
    description: introM ? cleanText(introM[1]) : '',
    cover: coverM ? coverM[1] : ''
  }
}

// 详情页解析（移动版，无作者/页数字段）
function parseDoubanMobile(html) {
  const t = html.match(/<div class="sub-title">([\s\S]*?)<\/div>/) ||
    html.match(/<meta itemprop="name" content="([^"]*)"/)
  if (!t) return null
  const title = cleanText(t[1]).replace(/\s*-\s*图书\s*$/, '')
  if (!title) return null

  const metaM = html.match(/<div class="sub-meta">([\s\S]*?)<\/div>/)
  let publisher = ''
  let publishDate = ''
  if (metaM) {
    const parts = cleanText(metaM[1]).split('/').map((s) => s.trim()).filter(Boolean)
    publisher = parts[0] || ''
    publishDate = (parts[1] || '').replace(/出版$/, '').trim()
  }

  const coverM = html.match(/<meta itemprop="image" content="([^"]+)"/) ||
    html.match(/<meta property="og:image" content="([^"]+)"/)
  const introM = html.match(/<p class="section-intro_desc"[^>]*>([\s\S]*?)<\/p>/)

  return {
    title: title,
    author: '',
    publisher: cleanField(publisher),
    publishDate: normalizeDate(publishDate),
    pages: '',
    description: introM ? cleanText(introM[1]) : '',
    cover: coverM ? coverM[1] : ''
  }
}

function fetchDoubanDetail(isbn) {
  return request({
    url: 'https://www.douban.com/isbn/' + isbn + '/',
    dataType: 'text',
    timeout: 10000,
    header: {
      'User-Agent': DESKTOP_UA,
      'Accept-Language': 'zh-CN,zh;q=0.9'
    }
  }).then((html) => {
    const text = typeof html === 'string' ? html : ''
    if (!text) throw new Error('empty response')
    // 反爬/异常页视为未查到
    if (/检测到有异常请求|请输入验证码|captcha/i.test(text)) throw new Error('blocked')
    const info = parseDoubanDesktop(text) || parseDoubanMobile(text)
    if (!info) throw new Error('not found')
    info.description = cleanDescription(info.description)
    return info
  })
}

function fetchFromDouban(isbn) {
  // 以精确 ISBN 详情页为准（避免 search_suggest 模糊匹配到别的书）；
  // suggest 接口仅用于补齐详情页缺失的字段（如移动版详情页没有作者）。
  return fetchDoubanDetail(isbn)
    .then((detail) => {
      return fetchDoubanSuggest(isbn)
        .then((s) => {
          detail.author = detail.author || s.author
          detail.publisher = detail.publisher || s.publisher
          detail.publishDate = detail.publishDate || s.publishDate
          detail.pages = detail.pages || s.pages
          detail.cover = detail.cover || s.cover
          detail.description = detail.description || s.description
          return detail
        })
        .catch(() => detail)
    })
    .then((detail) => {
      detail.source = '豆瓣'
      // 封面统一取大图（详情页默认是小图）
      if (detail.cover) detail.cover = detail.cover.replace(/\/(s|m)\/public\//, '/l/public/')
      return detail
    })
}

/* ---------------- 按源依次查询 ---------------- */

// 并发竞速：任一数据源成功即采用（避免串行等待）
function raceSuccess(fetchers) {
  return new Promise((resolve, reject) => {
    if (!fetchers.length) return reject(new Error('no source'))
    let pending = fetchers.length
    let settled = false
    fetchers.forEach((f) => {
      f().then((res) => {
        if (!settled) { settled = true; resolve(res) }
      }).catch(() => {
        pending--
        if (pending === 0 && !settled) reject(new Error('all failed'))
      })
    })
  })
}

/**
 * 查询图书信息（优先级：公共数据源 → 豆瓣 → null 转手工录入）
 *
 * 实现说明：公共数据源（openlibrary / googleapis）在国内网络常出现「静默挂起」，
 * 若严格串行等待，每次扫码都要空等满超时（实测 8s+）才回落到豆瓣。
 * 因此改为「三源同时发出 + 优先级窗口」：
 *   - 公共源在 PUBLIC_PREFER_WINDOW 内返回 → 采用公共源（保持优先级语义）
 *   - 公共源窗口内没返回 / 已全部失败 → 采用豆瓣结果
 * 对用户而言顺序与降级路径不变，只是不再傻等。
 *
 * 特殊返回：若请求被「request 合法域名」校验拦截（真机预览/体验版常见），
 * 返回 { domainBlocked: true }，由页面给出针对性提示（区别于「未收录」）。
 *
 * @param {string} rawIsbn
 * @returns {Promise<Object|{domainBlocked:boolean}|null>}
 */
const PUBLIC_PREFER_WINDOW = 2500  // 公共源优先窗口
const PUBLIC_TIMEOUT = 4000        // 公共源单次请求超时（国内常静默挂起，不宜过长）
const MAX_TOTAL_WAIT = 5000        // 整体兜底上限：超时后有多少返回多少，没有则转手工录入

// 识别微信客户端的 request 合法域名校验拦截（真机开发版/预览版/体验版/正式版）
function isDomainBlocked(errMsg) {
  return /url not in domain list|不在以下 request 合法域名|domain list/i.test(String(errMsg || ''))
}

function lookup(rawIsbn) {
  const isbn = normalizeISBN(rawIsbn)
  if (!isbn) return Promise.resolve(null)

  return new Promise((resolve) => {
    let settled = false
    let publicFailed = false
    let doubanDone = false
    let doubanResult = null
    let windowPassed = false
    let domainBlocked = false

    const windowTimer = setTimeout(() => {
      windowPassed = true
      tryFinish()
    }, PUBLIC_PREFER_WINDOW)

    // 兜底：公共源长时间无响应时，不能无限等下去
    const hardTimer = setTimeout(() => finish(doubanResult), MAX_TOTAL_WAIT)

    function finish(info) {
      if (settled) return
      settled = true
      clearTimeout(windowTimer)
      clearTimeout(hardTimer)
      // 全部失败且失败原因是域名校验拦截 → 给页面一个明确信号
      if (!info && domainBlocked) return resolve({ domainBlocked: true })
      resolve(info || null)
    }

    function tryFinish() {
      if (settled) return
      // 公共源已判负 或 优先级窗口已过 → 有豆瓣结果就用豆瓣
      if (doubanResult && (publicFailed || windowPassed)) return finish(doubanResult)
      // 公共源和豆瓣都明确失败 → null（页面提示手工录入）
      if (publicFailed && doubanDone && !doubanResult) return finish(null)
    }

    // 第一级：公共图书数据源（两个源并行竞速）
    raceSuccess([
      () => fetchFromOpenLibrary(isbn),
      () => fetchFromGoogleBooks(isbn)
    ])
      .then((info) => finish(info))
      .catch((err) => {
        publicFailed = true
        if (isDomainBlocked(err && err.message)) domainBlocked = true
        tryFinish()
      })

    // 第二级：豆瓣（提前发出，按优先级窗口决定是否采用）
    fetchFromDouban(isbn)
      .then((info) => {
        doubanResult = info
        doubanDone = true
        tryFinish()
      })
      .catch((err) => {
        doubanDone = true
        if (isDomainBlocked(err && err.message)) domainBlocked = true
        tryFinish()
      })
  })
}

/**
 * 根据书名/简介自动匹配小程序内图书分类
 * 策略：先只看书名（信号最强），书名匹配不到再用「书名+简介+出版社」兜底，
 *       避免简介里的泛化词（如「生活」）把书错分到不相关分类。
 */
function guessCategory(info, categories) {
  const names = (categories || []).map((c) => c.name)
  const keywordMap = [
    ['科幻', ['科幻', '三体', '宇宙', '太空', '星际', '银河']],
    ['技术', ['编程', '程序设计', 'JavaScript', 'Python', '计算机', '代码', '算法', '人工智能', '开发', '架构', '数据']],
    ['历史', ['历史', '史记', '王朝', '文明史', '考古', '战争史']],
    ['传记', ['传记', '自传', '回忆录', '生平', '传略']],
    ['经济', ['经济', '金融', '投资', '管理', '商业', '市场', '营销', '理财']],
    ['心理', ['心理', '情绪', '认知', '潜意识', '人格']],
    ['教育', ['教育', '教学', '学习法', '养育', '育儿', '启蒙']],
    ['哲学', ['哲学', '思想', '道家', '论语', '存在主义', '心学']],
    ['艺术', ['艺术', '绘画', '音乐', '设计', '摄影', '美学']],
    ['科学', ['物理', '化学', '生物学', '科学', '数学', '基因', '天文', '量子']],
    ['生活', ['美食', '健康', '旅行', '家居', '饮食', '养生', '烹饪', '健身']],
    ['文学', ['小说', '文学', '散文', '诗歌', '随笔', '文集', '故事集']]
  ]

  const title = String((info && info.title) || '')
  const fullText = [info && info.title, info && info.description, info && info.publisher].join(' ')

  // 第一轮：只看书名
  for (const [cat, words] of keywordMap) {
    if (names.indexOf(cat) >= 0 && words.some((w) => title.indexOf(w) >= 0)) return cat
  }
  // 第二轮：书名 + 简介 + 出版社
  for (const [cat, words] of keywordMap) {
    if (names.indexOf(cat) >= 0 && words.some((w) => fullText.indexOf(w) >= 0)) return cat
  }
  return '文学'
}

module.exports = {
  lookup,
  guessCategory,
  normalizeISBN
}
