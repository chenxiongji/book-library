// utils/store.js - 本地数据存储管理（模拟后端API）
// 后续可无缝替换为云函数或远程API调用

const STORAGE_KEYS = {
  USER: 'lib_user',
  BOOKS: 'lib_books',
  BORROWS: 'lib_borrows',
  NOTES: 'lib_notes',
  RECHARGES: 'lib_recharges',
  READING_PROGRESS: 'lib_reading_progress',
  FAVORITES: 'lib_favorites',
  INITIALIZED: 'lib_initialized'
}

// VIP等级配置
const VIP_LEVELS = [
  { level: 0, name: '普通会员', minPoints: 0, color: '#9CA3AF', icon: '📚',
    benefits: ['借阅上限5本', '借阅周期14天', '基础书库'] },
  { level: 1, name: '青铜读者', minPoints: 100, color: '#CD7F32', icon: '🥉',
    benefits: ['借阅上限10本', '借阅周期21天', '全书库', '笔记特权'] },
  { level: 2, name: '白银读者', minPoints: 500, color: '#C0C0C0', icon: '🥈',
    benefits: ['借阅上限15本', '借阅周期30天', '优先借阅', '电子书不限量'] },
  { level: 3, name: '黄金读者', minPoints: 2000, color: '#FFD700', icon: '🥇',
    benefits: ['借阅上限20本', '借阅周期45天', 'VIP专享书库', '免逾期提醒'] },
  { level: 4, name: '钻石读者', minPoints: 5000, color: '#B9F2FF', icon: '💎',
    benefits: ['借阅不限量', '借阅周期60天', '专属客服', '线下活动优先'] },
  { level: 5, name: '至尊读者', minPoints: 10000, color: '#E8B4B8', icon: '👑',
    benefits: ['全部权益解锁', '永久借阅', '名家签名书', '年度礼品'] }
]

// 充值套餐
const RECHARGE_PLANS = [
  { id: 1, name: '体验套餐', amount: 9.9, points: 100, bonus: 0, popular: false },
  { id: 2, name: '月度套餐', amount: 29.9, points: 350, bonus: 50, popular: true },
  { id: 3, name: '季度套餐', amount: 88, points: 1000, bonus: 200, popular: false },
  { id: 4, name: '年度套餐', amount: 299, points: 4000, bonus: 1000, popular: false },
  { id: 5, name: '至尊套餐', amount: 999, points: 15000, bonus: 5000, popular: false }
]

// 示例图书数据
const SAMPLE_BOOKS = [
  {
    id: 'b001',
    title: '三体',
    author: '刘慈欣',
    isbn: '9787536692930',
    cover: 'https://img3.doubanio.com/view/subject/l/public/s2768378.jpg',
    category: '科幻',
    type: 'physical',
    status: 'available',
    description: '文化大革命如火如荼地进行的同时，军方探寻外星文明的绝秘计划"红岸工程"取得了突破性进展...',
    publisher: '重庆出版社',
    publishDate: '2008-01',
    pages: 302,
    location: 'A区-科幻-001',
    createdAt: '2024-01-15T08:00:00Z'
  },
  {
    id: 'b002',
    title: '活着',
    author: '余华',
    isbn: '9787506365437',
    cover: 'https://img2.doubanio.com/view/subject/l/public/s29053580.jpg',
    category: '文学',
    type: 'physical',
    status: 'borrowed',
    description: '讲述了一个人和他命运之间的友情，这是最为感人的友情...',
    publisher: '作家出版社',
    publishDate: '2012-08',
    pages: 191,
    location: 'B区-文学-012',
    createdAt: '2024-01-15T08:00:00Z'
  },
  {
    id: 'b003',
    title: 'JavaScript高级程序设计',
    author: 'Nicholas C. Zakas',
    isbn: '9787115545381',
    cover: 'https://img9.doubanio.com/view/subject/l/public/s32319607.jpg',
    category: '技术',
    type: 'electronic',
    status: 'available',
    description: '全书从JavaScript的语言基础开始，逐步深入到面向对象、函数式编程...',
    publisher: '人民邮电出版社',
    publishDate: '2020-09',
    pages: 906,
    fileFormat: 'pdf',
    fileSize: '15.6MB',
    filePath: '',
    createdAt: '2024-02-01T08:00:00Z'
  },
  {
    id: 'b004',
    title: '小王子',
    author: '安托万·德·圣-埃克苏佩里',
    isbn: '9787020042494',
    cover: 'https://img1.doubanio.com/view/subject/l/public/s1103152.jpg',
    category: '文学',
    type: 'electronic',
    status: 'available',
    description: '小王子是一个超凡脱俗的仙童，他住在一颗只比他大一丁点儿的小行星上...',
    publisher: '人民文学出版社',
    publishDate: '2003-08',
    pages: 102,
    fileFormat: 'txt',
    fileSize: '0.3MB',
    filePath: '',
    createdAt: '2024-02-05T08:00:00Z'
  },
  {
    id: 'b005',
    title: '人类简史',
    author: '尤瓦尔·赫拉利',
    isbn: '9787508647357',
    cover: 'https://img3.doubanio.com/view/subject/l/public/s27814883.jpg',
    category: '历史',
    type: 'physical',
    status: 'available',
    description: '十万年前，地球上至少有六种不同的人。但今日，世界舞台为什么只剩下了我们自己？',
    publisher: '中信出版社',
    publishDate: '2014-11',
    pages: 440,
    location: 'C区-历史-008',
    createdAt: '2024-02-10T08:00:00Z'
  },
  {
    id: 'b006',
    title: '深入理解计算机系统',
    author: 'Randal E. Bryant',
    isbn: '9787111544937',
    cover: 'https://img1.doubanio.com/view/subject/l/public/s29281103.jpg',
    category: '技术',
    type: 'electronic',
    status: 'available',
    description: '从程序员的视角讲解计算机系统，涵盖数据表示、程序结构、存储器层次结构...',
    publisher: '机械工业出版社',
    publishDate: '2016-11',
    pages: 768,
    fileFormat: 'epub',
    fileSize: '12.2MB',
    filePath: '',
    createdAt: '2024-02-15T08:00:00Z'
  }
]

// 示例笔记
const SAMPLE_NOTES = [
  {
    id: 'n001',
    userId: 'u001',
    userName: '书虫小明',
    userAvatar: '',
    bookId: 'b001',
    bookTitle: '三体',
    bookCover: 'https://img3.doubanio.com/view/subject/l/public/s2768378.jpg',
    title: '黑暗森林法则的震撼',
    content: '看完三体II，黑暗森林法则让我彻底重新思考宇宙文明的图景。宇宙就是一座黑暗森林，每个文明都是带枪的猎人...',
    chapter: '第二部 黑暗森林',
    likes: 128,
    liked: false,
    comments: 23,
    createdAt: '2024-03-01T10:00:00Z'
  },
  {
    id: 'n002',
    userId: 'u002',
    userName: '阅读者阿芳',
    userAvatar: '',
    bookId: 'b002',
    bookTitle: '活着',
    bookCover: 'https://img2.doubanio.com/view/subject/l/public/s29053580.jpg',
    title: '活着本身就是意义',
    content: '福贵的一生让我明白，活着本身就是活着的意义。余华用最平静的语气讲述最残忍的故事，这种反差带来的力量是巨大的...',
    chapter: '全本',
    likes: 256,
    liked: false,
    comments: 45,
    createdAt: '2024-03-05T14:00:00Z'
  },
  {
    id: 'n003',
    userId: 'u003',
    userName: '技术宅老王',
    userAvatar: '',
    bookId: 'b003',
    bookTitle: 'JavaScript高级程序设计',
    bookCover: 'https://img9.doubanio.com/view/subject/l/public/s32319607.jpg',
    title: '闭包与作用域链的最佳讲解',
    content: '第7章对闭包的讲解是我读过最清晰的。通过作用域链的可视化，终于理解了闭包不是"魔法"，而是词法作用域的自然结果...',
    chapter: '第7章 函数表达式',
    likes: 89,
    liked: false,
    comments: 12,
    createdAt: '2024-03-10T09:00:00Z'
  }
]

// ========== 初始化 ==========
function initData() {
  const initialized = wx.getStorageSync(STORAGE_KEYS.INITIALIZED)
  if (!initialized) {
    // 写入示例用户
    wx.setStorageSync(STORAGE_KEYS.USER, {
      id: 'u001',
      name: '书虫小明',
      avatar: '',
      phone: '138****8888',
      vipLevel: 1,
      vipPoints: 350,
      balance: 29.9,
      totalBorrowed: 12,
      totalRead: 8,
      totalNotes: 5,
      createdAt: '2024-01-01T00:00:00Z'
    })
    // 写入示例图书
    wx.setStorageSync(STORAGE_KEYS.BOOKS, SAMPLE_BOOKS)
    // 写入示例借阅记录
    wx.setStorageSync(STORAGE_KEYS.BORROWS, [
      {
        id: 'br001',
        userId: 'u001',
        bookId: 'b002',
        bookTitle: '活着',
        bookCover: 'https://img2.doubanio.com/view/subject/l/public/s29053580.jpg',
        borrowDate: '2024-08-01T00:00:00Z',
        dueDate: '2024-08-22T00:00:00Z',
        returnDate: null,
        status: 'borrowed'
      }
    ])
    // 写入示例笔记
    wx.setStorageSync(STORAGE_KEYS.NOTES, SAMPLE_NOTES)
    // 写入示例充值记录
    wx.setStorageSync(STORAGE_KEYS.RECHARGES, [
      {
        id: 'r001',
        userId: 'u001',
        planId: 2,
        planName: '月度套餐',
        amount: 29.9,
        points: 400,
        levelBefore: 0,
        levelAfter: 1,
        createdAt: '2024-07-01T10:00:00Z'
      }
    ])
    // 阅读进度
    wx.setStorageSync(STORAGE_KEYS.READING_PROGRESS, {})
    wx.setStorageSync(STORAGE_KEYS.INITIALIZED, true)
  }
}

// ========== 用户 ==========
function getUser() {
  return wx.getStorageSync(STORAGE_KEYS.USER) || null
}

function updateUser(updates) {
  const user = getUser()
  if (!user) return null
  const updated = { ...user, ...updates }
  wx.setStorageSync(STORAGE_KEYS.USER, updated)

  // 昵称/头像变更时，同步已发布笔记里的作者快照，
  // 否则笔记广场与笔记详情会一直显示旧昵称、旧头像
  if (updates && (updates.name !== undefined || updates.avatar !== undefined)) {
    const notes = wx.getStorageSync(STORAGE_KEYS.NOTES) || []
    let changed = false
    const next = notes.map(n => {
      if (n.userId === updated.id) {
        changed = true
        return { ...n, userName: updated.name, userAvatar: updated.avatar }
      }
      return n
    })
    if (changed) wx.setStorageSync(STORAGE_KEYS.NOTES, next)
  }

  return updated
}

// ========== 图书 ==========
function getBooks(filter) {
  let books = wx.getStorageSync(STORAGE_KEYS.BOOKS) || []
  if (filter) {
    if (filter.type) books = books.filter(b => b.type === filter.type)
    if (filter.category) books = books.filter(b => b.category === filter.category)
    if (filter.status) books = books.filter(b => b.status === filter.status)
    if (filter.keyword) {
      const kw = filter.keyword.toLowerCase()
      books = books.filter(b =>
        b.title.toLowerCase().includes(kw) ||
        b.author.toLowerCase().includes(kw) ||
        (b.isbn && b.isbn.includes(kw))
      )
    }
  }
  return books
}

function getBookById(id) {
  const books = wx.getStorageSync(STORAGE_KEYS.BOOKS) || []
  return books.find(b => b.id === id) || null
}

function addBook(book) {
  const books = wx.getStorageSync(STORAGE_KEYS.BOOKS) || []
  const newBook = {
    id: 'b' + Date.now(),
    status: 'available',
    createdAt: new Date().toISOString(),
    ...book
  }
  books.unshift(newBook)
  wx.setStorageSync(STORAGE_KEYS.BOOKS, books)
  return newBook
}

function updateBook(id, updates) {
  const books = wx.getStorageSync(STORAGE_KEYS.BOOKS) || []
  const idx = books.findIndex(b => b.id === id)
  if (idx === -1) return null
  books[idx] = { ...books[idx], ...updates }
  wx.setStorageSync(STORAGE_KEYS.BOOKS, books)
  return books[idx]
}

function deleteBook(id) {
  let books = wx.getStorageSync(STORAGE_KEYS.BOOKS) || []
  books = books.filter(b => b.id !== id)
  wx.setStorageSync(STORAGE_KEYS.BOOKS, books)
  // 清理该书的阅读进度（电子书删除后进度无意义）
  const progress = wx.getStorageSync(STORAGE_KEYS.READING_PROGRESS) || {}
  if (progress[id]) {
    delete progress[id]
    wx.setStorageSync(STORAGE_KEYS.READING_PROGRESS, progress)
  }

  // 级联清理该书相关笔记（先算出 noteIds，笔记与其收藏一起删，避免「收藏没了但笔记还在」）
  const allNotes = wx.getStorageSync(STORAGE_KEYS.NOTES) || []
  const noteIds = allNotes.filter(n => n.bookId === id).map(n => n.id)
  if (noteIds.length) {
    wx.setStorageSync(STORAGE_KEYS.NOTES, allNotes.filter(n => n.bookId !== id))
  }

  // 清理收藏：该书本身 + 上述被删除的笔记
  const favorites = wx.getStorageSync(STORAGE_KEYS.FAVORITES) || []
  const kept = favorites.filter(f =>
    !((f.type === 'book' && f.targetId === id) ||
      (f.type === 'note' && noteIds.indexOf(f.targetId) >= 0))
  )
  if (kept.length !== favorites.length) {
    wx.setStorageSync(STORAGE_KEYS.FAVORITES, kept)
  }

  // 清理借阅记录，避免借阅页残留「已删除图书」的断链记录
  const borrows = wx.getStorageSync(STORAGE_KEYS.BORROWS) || []
  const keptBorrows = borrows.filter(b => b.bookId !== id)
  if (keptBorrows.length !== borrows.length) {
    wx.setStorageSync(STORAGE_KEYS.BORROWS, keptBorrows)
  }

  // 从用户「已读书目」中剔除，避免个人统计引用不存在的书
  const user = getUser()
  if (user && Array.isArray(user.readBooks) && user.readBooks.indexOf(id) >= 0) {
    updateUser({ readBooks: user.readBooks.filter(x => x !== id) })
  }
}

// 置顶/取消置顶图书（纸质书与电子书通用）
// 返回置顶后的状态 { top: true|false }
function toggleBookTop(id) {
  const books = wx.getStorageSync(STORAGE_KEYS.BOOKS) || []
  const idx = books.findIndex(b => b.id === id)
  if (idx === -1) return null
  books[idx].top = !books[idx].top
  books[idx].topAt = books[idx].top ? new Date().toISOString() : ''
  wx.setStorageSync(STORAGE_KEYS.BOOKS, books)
  return { top: books[idx].top }
}

// ========== 借阅 ==========
function getBorrows(filter) {
  let borrows = wx.getStorageSync(STORAGE_KEYS.BORROWS) || []
  if (filter) {
    if (filter.userId) borrows = borrows.filter(b => b.userId === filter.userId)
    if (filter.status) borrows = borrows.filter(b => b.status === filter.status)
  }
  return borrows.sort((a, b) => new Date(b.borrowDate) - new Date(a.borrowDate))
}

function borrowBook(bookId) {
  const book = getBookById(bookId)
  if (!book || book.type !== 'physical') return null
  if (book.status === 'borrowed') return null

  const user = getUser()
  const borrowDays = getEffectiveBorrowDays(user.vipLevel)
  const now = new Date()
  const due = new Date(now.getTime() + borrowDays * 24 * 60 * 60 * 1000)

  const borrow = {
    id: 'br' + Date.now(),
    userId: user.id,
    bookId: bookId,
    bookTitle: book.title,
    bookCover: book.cover,
    borrowDate: now.toISOString(),
    dueDate: due.toISOString(),
    returnDate: null,
    status: 'borrowed'
  }

  const borrows = wx.getStorageSync(STORAGE_KEYS.BORROWS) || []
  borrows.push(borrow)
  wx.setStorageSync(STORAGE_KEYS.BORROWS, borrows)

  // 更新图书状态
  updateBook(bookId, { status: 'borrowed' })

  // 更新用户统计
  updateUser({ totalBorrowed: (user.totalBorrowed || 0) + 1 })

  return borrow
}

function returnBook(borrowId) {
  const borrows = wx.getStorageSync(STORAGE_KEYS.BORROWS) || []
  const idx = borrows.findIndex(b => b.id === borrowId)
  if (idx === -1) return null

  borrows[idx].returnDate = new Date().toISOString()
  borrows[idx].status = 'returned'
  wx.setStorageSync(STORAGE_KEYS.BORROWS, borrows)

  // 更新图书状态
  updateBook(borrows[idx].bookId, { status: 'available' })

  return borrows[idx]
}

// 根据VIP等级获取借阅天数
// 与 VIP_LEVELS.benefits 文案保持一致：钻石「借阅周期60天」、至尊「永久借阅」
function getBorrowDaysByLevel(level) {
  const days = [14, 21, 30, 45, 60, 36500]
  return days[level] || 14
}

// 根据VIP等级获取借阅上限
// 与权益文案保持一致：钻石（level 4）为「借阅不限量」，故取 999
function getBorrowLimitByLevel(level) {
  const limits = [5, 10, 15, 20, 999, 999]
  return limits[level] || 5
}

// ========== 书房设置（管理端「书房设置」维护的借阅规则） ==========
const ROOM_SETTINGS_KEY = 'lib_room_settings'

function getRoomSettings() {
  const s = wx.getStorageSync(ROOM_SETTINGS_KEY)
  return (s && typeof s === 'object') ? s : {}
}

// 生效借阅天数 = 书房设置基础值 与 VIP 等级权益 取较高者
// 说明：管理端调大规则时立即对所有人生效；同时不剥夺 VIP 承诺的更长期限
function getEffectiveBorrowDays(level) {
  const base = Number(getRoomSettings().borrowDays)
  return Math.max(base > 0 ? base : 0, getBorrowDaysByLevel(level))
}

// 生效借阅上限，规则同上
function getEffectiveBorrowLimit(level) {
  const base = Number(getRoomSettings().maxBorrow)
  return Math.max(base > 0 ? base : 0, getBorrowLimitByLevel(level))
}

// 逾期罚金（元/天），由书房设置决定
function getFinePerDay() {
  const v = Number(getRoomSettings().finePerDay)
  return v > 0 ? v : 0
}

// ========== 笔记 ==========
function getNotes(filter) {
  let notes = wx.getStorageSync(STORAGE_KEYS.NOTES) || []
  if (filter) {
    if (filter.userId) notes = notes.filter(n => n.userId === filter.userId)
    if (filter.bookId) notes = notes.filter(n => n.bookId === filter.bookId)
  }
  return notes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
}

function getNoteById(id) {
  const notes = wx.getStorageSync(STORAGE_KEYS.NOTES) || []
  return notes.find(n => n.id === id) || null
}

function addNote(note) {
  const notes = wx.getStorageSync(STORAGE_KEYS.NOTES) || []
  const user = getUser()
  const newNote = {
    id: 'n' + Date.now(),
    userId: user.id,
    userName: user.name,
    userAvatar: user.avatar,
    likes: 0,
    liked: false,
    comments: 0,
    createdAt: new Date().toISOString(),
    ...note
  }
  notes.unshift(newNote)
  wx.setStorageSync(STORAGE_KEYS.NOTES, notes)

  // 更新用户统计
  updateUser({ totalNotes: (user.totalNotes || 0) + 1 })

  return newNote
}

function toggleNoteLike(noteId) {
  const notes = wx.getStorageSync(STORAGE_KEYS.NOTES) || []
  const idx = notes.findIndex(n => n.id === noteId)
  if (idx === -1) return null

  notes[idx].liked = !notes[idx].liked
  notes[idx].likes += notes[idx].liked ? 1 : -1
  wx.setStorageSync(STORAGE_KEYS.NOTES, notes)
  return notes[idx]
}

function deleteNote(id) {
  let notes = wx.getStorageSync(STORAGE_KEYS.NOTES) || []
  notes = notes.filter(n => n.id !== id)
  wx.setStorageSync(STORAGE_KEYS.NOTES, notes)
  // 清理该笔记的收藏
  let favorites = wx.getStorageSync(STORAGE_KEYS.FAVORITES) || []
  const kept = favorites.filter(f => !(f.type === 'note' && f.targetId === id))
  if (kept.length !== favorites.length) {
    wx.setStorageSync(STORAGE_KEYS.FAVORITES, kept)
  }
}

// ========== 收藏 ==========
// type: 'book' 图书 | 'note' 笔记
function getFavorites(filter) {
  let favorites = wx.getStorageSync(STORAGE_KEYS.FAVORITES) || []
  if (filter) {
    if (filter.type) favorites = favorites.filter(f => f.type === filter.type)
  }
  return favorites.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
}

function isFavorited(type, targetId) {
  const favorites = wx.getStorageSync(STORAGE_KEYS.FAVORITES) || []
  return favorites.some(f => f.type === type && f.targetId === targetId)
}

// 切换收藏状态，返回 { favorited: true|false }
// target: 图书或笔记对象（含 id/title/cover 等，做展示快照，删除源数据后收藏仍可显示）
function toggleFavorite(type, target) {
  let favorites = wx.getStorageSync(STORAGE_KEYS.FAVORITES) || []
  const idx = favorites.findIndex(f => f.type === type && f.targetId === target.id)
  if (idx >= 0) {
    favorites.splice(idx, 1)
    wx.setStorageSync(STORAGE_KEYS.FAVORITES, favorites)
    return { favorited: false }
  }
  favorites.unshift({
    id: 'fav' + Date.now(),
    type,
    targetId: target.id,
    title: target.title || '',
    cover: target.cover || target.bookCover || '',
    author: target.author || target.userName || '',
    extra: target.content ? target.content.slice(0, 60) : (target.bookTitle || ''),
    createdAt: new Date().toISOString()
  })
  wx.setStorageSync(STORAGE_KEYS.FAVORITES, favorites)
  return { favorited: true }
}

// ========== 充值 ==========
function getRecharges(userId) {
  let recharges = wx.getStorageSync(STORAGE_KEYS.RECHARGES) || []
  if (userId) recharges = recharges.filter(r => r.userId === userId)
  return recharges.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
}

function recharge(planId) {
  const plan = RECHARGE_PLANS.find(p => p.id === planId)
  if (!plan) return null

  const user = getUser()
  const oldPoints = user.vipPoints || 0
  const oldLevel = user.vipLevel || 0
  const totalPoints = oldPoints + plan.points + plan.bonus
  const newLevel = getLevelByPoints(totalPoints)

  const record = {
    id: 'r' + Date.now(),
    userId: user.id,
    planId: plan.id,
    planName: plan.name,
    amount: plan.amount,
    points: plan.points + plan.bonus,
    levelBefore: oldLevel,
    levelAfter: newLevel,
    createdAt: new Date().toISOString()
  }

  const recharges = wx.getStorageSync(STORAGE_KEYS.RECHARGES) || []
  recharges.push(record)
  wx.setStorageSync(STORAGE_KEYS.RECHARGES, recharges)

  // 更新用户信息
  updateUser({
    vipPoints: totalPoints,
    vipLevel: newLevel,
    balance: (user.balance || 0) + plan.amount
  })

  return { record, leveledUp: newLevel > oldLevel, newLevel }
}

function getLevelByPoints(points) {
  let level = 0
  for (let i = VIP_LEVELS.length - 1; i >= 0; i--) {
    if (points >= VIP_LEVELS[i].minPoints) {
      level = VIP_LEVELS[i].level
      break
    }
  }
  return level
}

function getVipLevelInfo(level) {
  return VIP_LEVELS.find(l => l.level === level) || VIP_LEVELS[0]
}

function getNextLevel(level) {
  if (level >= VIP_LEVELS.length - 1) return null
  return VIP_LEVELS[level + 1]
}

// ========== 阅读进度 ==========
function getReadingProgress(bookId) {
  const progress = wx.getStorageSync(STORAGE_KEYS.READING_PROGRESS) || {}
  return progress[bookId] || null
}

function saveReadingProgress(bookId, progress) {
  const all = wx.getStorageSync(STORAGE_KEYS.READING_PROGRESS) || {}
  all[bookId] = { ...all[bookId], ...progress, updatedAt: new Date().toISOString() }
  wx.setStorageSync(STORAGE_KEYS.READING_PROGRESS, all)
}

// 全部阅读进度（按 bookId 索引），用于书架/阅读历史
function getAllReadingProgress() {
  return wx.getStorageSync(STORAGE_KEYS.READING_PROGRESS) || {}
}

// ========== 阅读器：设置 / 书签 / 划线想法 / 阅读时长 ==========
const READER_SETTINGS_KEY = 'lib_reader_settings'

function getReaderSettings() {
  return wx.getStorageSync(READER_SETTINGS_KEY) || null
}

function saveReaderSettings(settings) {
  wx.setStorageSync(READER_SETTINGS_KEY, settings)
}

function getBookmarks(bookId) {
  return wx.getStorageSync('lib_bookmarks_' + bookId) || []
}

// 返回当前页是否已被收藏
function toggleBookmark(bookId, page) {
  const list = getBookmarks(bookId)
  const idx = list.findIndex(b => b.page === page)
  if (idx >= 0) {
    list.splice(idx, 1)
    wx.setStorageSync('lib_bookmarks_' + bookId, list)
    return false
  }
  list.unshift({ id: 'bm' + Date.now(), page, createdAt: new Date().toISOString() })
  wx.setStorageSync('lib_bookmarks_' + bookId, list)
  return true
}

function getHighlights(bookId) {
  return wx.getStorageSync('lib_highlights_' + bookId) || []
}

// type: 'highlight' 划线 | 'note' 想法
function addHighlight(bookId, item) {
  const list = getHighlights(bookId)
  const record = {
    id: 'hl' + Date.now(),
    paraIndex: item.paraIndex,
    text: item.text || '',
    note: item.note || '',
    type: item.type || 'highlight',
    page: item.page || 0,
    createdAt: new Date().toISOString()
  }
  list.unshift(record)
  wx.setStorageSync('lib_highlights_' + bookId, list)
  return record
}

function deleteHighlight(bookId, hlId) {
  const list = getHighlights(bookId).filter(h => h.id !== hlId)
  wx.setStorageSync('lib_highlights_' + bookId, list)
}

// 累计阅读秒数（记到用户与图书两个维度）
function addReadingDuration(bookId, seconds) {
  const user = getUser()
  if (user) {
    updateUser({ totalReadMinutes: Math.round(((user.totalReadMinutes || 0) + seconds / 60) * 10) / 10 })
  }
  const book = getBookById(bookId)
  if (book) {
    updateBook(bookId, { readMinutes: Math.round((((book.readMinutes) || 0) + seconds / 60) * 10) / 10 })
  }
}

// ========== 统计 ==========
function getStats() {
  const books = wx.getStorageSync(STORAGE_KEYS.BOOKS) || []
  const borrows = wx.getStorageSync(STORAGE_KEYS.BORROWS) || []
  const notes = wx.getStorageSync(STORAGE_KEYS.NOTES) || []
  const user = getUser()

  const activeBorrows = borrows.filter(b => b.status === 'borrowed')
  const overdueBorrows = activeBorrows.filter(b => new Date(b.dueDate) < new Date())
  const physicalBooks = books.filter(b => b.type === 'physical')
  const electronicBooks = books.filter(b => b.type === 'electronic')

  return {
    totalBooks: books.length,
    physicalCount: physicalBooks.length,
    electronicCount: electronicBooks.length,
    availableCount: books.filter(b => b.status === 'available').length,
    borrowedCount: books.filter(b => b.status === 'borrowed').length,
    activeBorrows: activeBorrows.length,
    overdueBorrows: overdueBorrows.length,
    totalNotes: notes.length,
    totalLikes: notes.reduce((sum, n) => sum + n.likes, 0)
  }
}

module.exports = {
  STORAGE_KEYS,
  VIP_LEVELS,
  RECHARGE_PLANS,
  initData,
  getUser,
  updateUser,
  getBooks,
  getBookById,
  addBook,
  updateBook,
  deleteBook,
  toggleBookTop,
  getBorrows,
  borrowBook,
  returnBook,
  getBorrowDaysByLevel,
  getBorrowLimitByLevel,
  getRoomSettings,
  getEffectiveBorrowDays,
  getEffectiveBorrowLimit,
  getFinePerDay,
  getNotes,
  getNoteById,
  addNote,
  toggleNoteLike,
  deleteNote,
  getRecharges,
  recharge,
  getFavorites,
  isFavorited,
  toggleFavorite,
  getLevelByPoints,
  getVipLevelInfo,
  getNextLevel,
  getReadingProgress,
  getAllReadingProgress,
  saveReadingProgress,
  getReaderSettings,
  saveReaderSettings,
  getBookmarks,
  toggleBookmark,
  getHighlights,
  addHighlight,
  deleteHighlight,
  addReadingDuration,
  getStats
}
