// pages/reader/reader.js — 微信读书风格阅读器
const store = require('../../utils/store.js')
const util = require('../../utils/util.js')
const ebook = require('../../utils/ebook.js')

// 微信读书风格排版参数：大字号 + 宽行距
const FONT_SIZES = [32, 36, 40, 44, 48]        // rpx
const LINE_HEIGHTS = [{ ratio: 1.7, label: '紧凑' }, { ratio: 1.95, label: '标准' }, { ratio: 2.25, label: '宽松' }]

const THEMES = {
  white: { name: '白色', bg: '#FFFFFF', text: '#333333', sub: '#999999', line: '#EBEBEB', panel: '#FFFFFF', panelText: '#1F2937', navBg: '#FFFFFF', navText: 'black' },
  paper: { name: '纸张', bg: '#F6F3EC', text: '#33302B', sub: '#A2987F', line: '#E6E0D2', panel: '#F9F6EF', panelText: '#33302B', navBg: '#F6F3EC', navText: 'black' },
  green: { name: '护眼', bg: '#CCE8CF', text: '#2E4A2E', sub: '#6B8E6B', line: '#B5D8BA', panel: '#D8EEDB', panelText: '#2E4A2E', navBg: '#CCE8CF', navText: 'black' },
  dark:  { name: '夜间', bg: '#1E2126', text: '#A8A8A8', sub: '#666B73', line: '#33363B', panel: '#26292F', panelText: '#C8C8C8', navBg: '#1E2126', navText: 'white' }
}

Page({
  data: {
    book: null,
    bookId: '',
    loading: true,

    // 内容
    pages: [],
    chapters: [],
    currentPage: 0,
    totalPages: 0,
    percent: 0,
    chapterTitle: '',

    // 版式设置（微信读书默认 20px 字号）
    fontSize: 40,
    lineHeightIdx: 1,
    themeKey: 'paper',
    theme: THEMES.paper,
    brightness: 1,
    pageAnim: true,

    // 面板
    showMenu: false,
    showSettings: false,
    showCatalog: false,
    catalogTab: 'chapters', // chapters | bookmarks | notes

    // 书签 / 划线
    isBookmarked: false,
    bookmarkMap: {},
    bookmarkPages: [],
    hlMap: {},
    highlights: [],

    // 进度预览
    percentPreview: null,
    previewPage: null,

    // 笔记编辑
    showNoteEditor: false,
    noteText: '',
    noteQuote: '',
    editingQuote: false,

    // 尺寸（分页参数缓存）
    fontSizeOptions: FONT_SIZES,
    lineHeightOptions: LINE_HEIGHTS,
    themeOptions: THEMES
  },

  onLoad(options) {
    const bookId = options.id
    this.paraTexts = []       // 全文段落数组
    this.container = { w: 0, h: 0 }
    this.readSeconds = 0
    this.setData({ bookId })

    // 恢复阅读设置
    const saved = store.getReaderSettings()
    if (saved) {
      this.setData({
        // 旧版本默认字号偏小（<36），自动升级到微信读书风格默认值
        fontSize: saved.fontSize && saved.fontSize >= 36 ? saved.fontSize : 40,
        lineHeightIdx: saved.lineHeightIdx == null ? 1 : saved.lineHeightIdx,
        themeKey: saved.themeKey || 'paper',
        brightness: saved.brightness == null ? 1 : saved.brightness,
        pageAnim: saved.pageAnim !== false
      })
    }
    this.setData({ theme: THEMES[this.data.themeKey] })
    this.applyNavBar()

    this.loadBook(bookId)
    this.startReadingTimer()
  },

  onReady() {
    this.measureContainer(() => {
      if (this.pendingRebuild) {
        this.pendingRebuild = false
        this.buildPages()
      }
    })
  },

  // .page-body 内边距（rpx）：上32 左右44 下30 —— 分页需按内容区计算
  getBodyPaddingPx() {
    const info = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync()
    const pxPerRpx = info.windowWidth / 750
    return { h: 88 * pxPerRpx, v: 62 * pxPerRpx }
  },

  measureContainer(done) {
    const query = wx.createSelectorQuery()
    query.select('.page-body').boundingClientRect()
    query.exec((res) => {
      if (res && res[0] && res[0].width) {
        const pad = this.getBodyPaddingPx()
        this.container = { w: res[0].width - pad.h, h: res[0].height - pad.v }
      }
      if (done) done()
    })
  },

  // ========== 加载书籍 ==========
  loadBook(bookId) {
    const book = store.getBookById(bookId)
    if (!book) {
      util.showToast('图书不存在')
      setTimeout(() => wx.navigateBack(), 1000)
      return
    }
    this.setData({ book, loading: true })
    wx.setNavigationBarTitle({ title: book.title || '阅读' })

    ebook.loadBookContent(book, (err, content, source) => {
      this.bookSource = source
      const parsed = ebook.parseContent(content)
      this.paraTexts = parsed.paragraphs.map(p => p.text)
      this.parsedParagraphs = parsed.paragraphs
      this.chapters = parsed.chapters

      // 计算分页（onReady 前先用估算尺寸，onReady 后精确重建）
      if (this.container.w > 0) {
        this.buildPages()
      } else {
        this.pendingRebuild = true
        this.buildPages(true) // 先按估算渲染，避免白屏
      }

      // 加载书签与划线
      this.loadAnnotations()

      // 记录已读书目
      const user = store.getUser()
      if (user) {
        const readBooks = user.readBooks || []
        if (!readBooks.includes(bookId)) {
          readBooks.push(bookId)
          store.updateUser({ readBooks, totalRead: (user.totalRead || 0) + 1 })
        }
      }
    })
  },

  estimateSize() {
    const info = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync()
    const pxPerRpx = info.windowWidth / 750
    return {
      w: info.windowWidth - 88 * pxPerRpx,
      h: info.windowHeight - 62 * pxPerRpx,
      fontPx: this.data.fontSize * pxPerRpx
    }
  },

  buildPages(estimate) {
    let size
    if (estimate || !this.container.w) {
      const est = this.estimateSize()
      size = { containerWidthPx: est.w, containerHeightPx: est.h, fontPx: est.fontPx }
    } else {
      const est = this.estimateSize()
      size = {
        containerWidthPx: this.container.w,
        containerHeightPx: this.container.h,
        fontPx: est.fontPx
      }
    }

    const result = ebook.paginate({
      paragraphs: this.parsedParagraphs,
      // 传入副本并清除旧页码，避免重复分页时章节状态残留
      chapters: this.chapters.map(c => ({ title: c.title, paraIndex: c.paraIndex })),
      containerWidthPx: size.containerWidthPx,
      containerHeightPx: size.containerHeightPx,
      fontPx: size.fontPx,
      lineHeightRatio: LINE_HEIGHTS[this.data.lineHeightIdx].ratio,
      pageFooterPx: 30
    })

    this.chapters = result.chapters
    const saved = store.getReadingProgress(this.data.bookId)
    let target = 0
    if (!this.restoredFromProgress && saved) {
      // 首次进入：按比例还原进度
      this.restoredFromProgress = true
      if (typeof saved.percent === 'number' && saved.totalPages) {
        const ratio = saved.percent / 100
        target = Math.min(Math.round(ratio * (result.pages.length - 1)), result.pages.length - 1)
      } else if (saved.page) {
        target = Math.min(saved.page, result.pages.length - 1)
      }
    } else {
      const ratio = this.data.totalPages > 0 ? (this.data.currentPage + 1) / this.data.totalPages : 0
      target = Math.min(Math.round(ratio * (result.pages.length - 1)), result.pages.length - 1)
    }

    this.setData({
      pages: result.pages,
      chapters: result.chapters,
      totalPages: result.pages.length,
      currentPage: target,
      loading: false
    })
    this.syncPageState()
  },

  loadAnnotations() {
    const bookmarks = store.getBookmarks(this.data.bookId)
    const highlights = store.getHighlights(this.data.bookId)
    const bookmarkMap = {}
    bookmarks.forEach(b => { bookmarkMap[b.page] = true })
    this.refreshHlMap(highlights)
    this.setData({
      bookmarkMap,
      bookmarkPages: bookmarks.map(b => b.page).sort((a, b) => a - b),
      highlights
    })
    this.syncPageState()
  },

  refreshHlMap(highlights) {
    const hlMap = {}
    ;(highlights || this.data.highlights).forEach(h => { hlMap[h.paraIndex] = true })
    this.setData({ hlMap })
  },

  syncPageState() {
    const { currentPage, totalPages, pages } = this.data
    const percent = totalPages > 0 ? Math.round(((currentPage + 1) / totalPages) * 100) : 0
    const page = pages[currentPage] || { chapterTitle: '' }
    const bookmarkMap = this.data.bookmarkMap
    this.setData({
      percent,
      chapterTitle: page.chapterTitle || '',
      isBookmarked: !!bookmarkMap[currentPage]
    })
  },

  // ========== 翻页 ==========
  onSwiperChange(e) {
    if (e.detail.source !== 'touch' && e.detail.source !== 'drag') return
    this.gotoPage(e.detail.current)
  },

  onLeftTap() {
    if (this.data.currentPage > 0) this.gotoPage(this.data.currentPage - 1)
    else util.showToast('已经是第一页')
  },

  onRightTap() {
    if (this.data.currentPage < this.data.totalPages - 1) this.gotoPage(this.data.currentPage + 1)
    else util.showToast('已经是最后一页')
  },

  onCenterTap() {
    this.toggleMenu()
  },

  gotoPage(page) {
    const p = Math.max(0, Math.min(page, this.data.totalPages - 1))
    if (p === this.data.currentPage) return
    this.setData({ currentPage: p })
    this.syncPageState()
    this.persistProgress()
  },

  jumpToPage(page) {
    this.setData({ showCatalog: false, showMenu: false })
    this.gotoPage(page)
  },

  // 章节跳转
  onChapterTap(e) {
    const idx = e.currentTarget.dataset.index
    const chap = this.data.chapters[idx]
    if (chap) this.jumpToPage(chap.page || 0)
  },

  onPrevChapter() {
    const cur = this.data.pages[this.data.currentPage]
    const curChapter = cur ? cur.chapter : 0
    if (curChapter > 0) {
      const target = this.data.chapters[curChapter - 1]
      this.jumpToPage(target.page || 0)
    } else {
      util.showToast('已经是第一章')
    }
  },

  onNextChapter() {
    const cur = this.data.pages[this.data.currentPage]
    const curChapter = cur ? cur.chapter : 0
    if (curChapter < this.data.chapters.length - 1) {
      const target = this.data.chapters[curChapter + 1]
      this.jumpToPage(target.page || 0)
    } else {
      util.showToast('已经是最后一章')
    }
  },

  // 进度滑杆
  onSliderChanging(e) {
    const page = Math.round(e.detail.value / 100 * (this.data.totalPages - 1))
    this.setData({ percentPreview: e.detail.value, previewPage: page })
  },

  onSliderChange(e) {
    const page = Math.round(e.detail.value / 100 * (this.data.totalPages - 1))
    this.setData({ percentPreview: null })
    this.gotoPage(page)
  },

  // 点击分区翻页：左 1/3 上一页，右 1/3 下一页，中间呼出菜单
  onPageTap(e) {
    const info = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync()
    const x = e.detail.x
    if (x < info.windowWidth * 0.3) {
      this.onLeftTap()
    } else if (x > info.windowWidth * 0.7) {
      this.onRightTap()
    } else {
      this.onCenterTap()
    }
  },

  // ========== 面板 ==========
  toggleMenu() {
    const show = !this.data.showMenu
    this.setData({ showMenu: show, showSettings: false, showCatalog: false })
  },

  toggleSettings() {
    const show = !this.data.showSettings
    this.setData({ showSettings: show, showCatalog: false })
  },

  toggleCatalog(e) {
    const tab = (e && e.currentTarget && e.currentTarget.dataset.tab) || 'chapters'
    this.setData({ showCatalog: !this.data.showCatalog, showSettings: false, catalogTab: tab })
  },

  onCatalogTab(e) {
    this.setData({ catalogTab: e.currentTarget.dataset.tab })
  },

  closeAll() {
    this.setData({ showMenu: false, showSettings: false, showCatalog: false, showNoteEditor: false })
  },

  // ========== 设置 ==========
  saveSettings() {
    store.saveReaderSettings({
      fontSize: this.data.fontSize,
      lineHeightIdx: this.data.lineHeightIdx,
      themeKey: this.data.themeKey,
      brightness: this.data.brightness,
      pageAnim: this.data.pageAnim
    })
  },

  onFontSizeChange(e) {
    const dir = e.currentTarget.dataset.dir
    const sizes = FONT_SIZES
    let idx = sizes.indexOf(this.data.fontSize)
    if (dir === 'add' && idx < sizes.length - 1) idx++
    if (dir === 'sub' && idx > 0) idx--
    if (sizes[idx] === this.data.fontSize) return
    this.setData({ fontSize: sizes[idx] })
    this.saveSettings()
    this.rebuildKeepRatio()
  },

  onLineHeightChange(e) {
    const idx = Number(e.currentTarget.dataset.index)
    if (idx === this.data.lineHeightIdx) return
    this.setData({ lineHeightIdx: idx })
    this.saveSettings()
    this.rebuildKeepRatio()
  },

  onThemeChange(e) {
    const key = e.currentTarget.dataset.theme
    if (!THEMES[key]) return
    this.setData({ themeKey: key, theme: THEMES[key] })
    this.saveSettings()
    this.applyNavBar()
  },

  onBrightnessChange(e) {
    this.setData({ brightness: e.detail.value })
  },

  onBrightnessEnd() {
    this.saveSettings()
  },

  onPageAnimChange() {
    const v = !this.data.pageAnim
    this.setData({ pageAnim: v })
    this.saveSettings()
  },

  onToggleNight() {
    if (this.data.themeKey === 'dark') {
      const back = this.lastLightTheme || 'paper'
      this.setData({ themeKey: back, theme: THEMES[back] })
    } else {
      this.lastLightTheme = this.data.themeKey
      this.setData({ themeKey: 'dark', theme: THEMES.dark })
    }
    this.saveSettings()
    this.applyNavBar()
  },

  onPageAnimToggle() {
    const v = !this.data.pageAnim
    this.setData({ pageAnim: v })
    this.saveSettings()
  },

  applyNavBar() {
    const t = THEMES[this.data.themeKey]
    wx.setNavigationBarColor({
      frontColor: t.navText === 'black' ? '#000000' : '#ffffff',
      backgroundColor: t.navBg,
      fail: () => {}
    })
  },

  rebuildKeepRatio() {
    if (this.container.w > 0) {
      this.buildPages()
    } else {
      this.buildPages(true)
    }
  },

  // ========== 书签 ==========
  toggleBookmark() {
    const isBm = store.toggleBookmark(this.data.bookId, this.data.currentPage)
    const bookmarks = store.getBookmarks(this.data.bookId)
    const bookmarkMap = {}
    bookmarks.forEach(b => { bookmarkMap[b.page] = true })
    this.setData({
      isBookmarked: isBm,
      bookmarkMap,
      bookmarkPages: bookmarks.map(b => b.page).sort((a, b) => a - b)
    })
    util.showToast(isBm ? '已添加书签' : '已移除书签', 'success')
  },

  onBookmarkTap(e) {
    this.jumpToPage(Number(e.currentTarget.dataset.page))
  },

  // ========== 长按划线 / 笔记 ==========
  onLineLongPress(e) {
    const paraIndex = e.currentTarget.dataset.p
    const text = this.paraTexts[paraIndex]
    if (!text) return
    const already = this.data.hlMap[paraIndex]
    const actions = ['复制全文段落', already ? '取消划线' : '划线', '写想法']
    wx.showActionSheet({
      itemList: actions,
      success: (res) => {
        if (res.tapIndex === 0) {
          wx.setClipboardData({ data: text })
        } else if (res.tapIndex === 1) {
          if (already) this.removeHighlightByPara(paraIndex)
          else this.addHl(paraIndex, text, '', 'highlight')
        } else {
          this.setData({
            showNoteEditor: true,
            noteQuote: text,
            noteText: '',
            editingQuote: false,
            editingParaIndex: paraIndex
          })
        }
      }
    })
  },

  addHl(paraIndex, text, note, type) {
    store.addHighlight(this.data.bookId, {
      paraIndex, text, note, type,
      page: this.data.currentPage
    })
    const highlights = store.getHighlights(this.data.bookId)
    this.setData({ highlights })
    this.refreshHlMap(highlights)
    util.showToast(type === 'note' ? '想法已保存' : '划线成功', 'success')
  },

  removeHighlightByPara(paraIndex) {
    const hl = this.data.highlights.find(h => h.paraIndex === paraIndex)
    if (!hl) return
    store.deleteHighlight(this.data.bookId, hl.id)
    const highlights = store.getHighlights(this.data.bookId)
    this.setData({ highlights })
    this.refreshHlMap(highlights)
    util.showToast('已取消划线')
  },

  onHighlightTap(e) {
    this.jumpToPage(Number(e.currentTarget.dataset.page) || 0)
  },

  onDeleteHighlight(e) {
    const id = e.currentTarget.dataset.id
    wx.showModal({
      title: '删除',
      content: '确定删除这条划线/想法吗？',
      success: (res) => {
        if (res.confirm) {
          store.deleteHighlight(this.data.bookId, id)
          const highlights = store.getHighlights(this.data.bookId)
          this.setData({ highlights })
          this.refreshHlMap(highlights)
        }
      }
    })
  },

  // ========== 笔记编辑 ==========
  onNoteInput(e) {
    this.setData({ noteText: e.detail.value })
  },

  onNoteCancel() {
    this.setData({ showNoteEditor: false, noteText: '', noteQuote: '' })
  },

  onNoteSave() {
    const text = this.data.noteText.trim()
    if (!text) {
      util.showToast('请输入想法内容')
      return
    }
    this.addHl(this.data.editingParaIndex, this.data.noteQuote, text, 'note')
    this.setData({ showNoteEditor: false, noteText: '', noteQuote: '' })
  },

  // ========== 阅读时长 ==========
  startReadingTimer() {
    this.readTimer = setInterval(() => {
      this.readSeconds += 5
      if (this.readSeconds > 0 && this.readSeconds % 60 === 0) {
        store.addReadingDuration(this.data.bookId, 60)
        this.readSeconds -= 60
      }
    }, 5000)
  },

  persistProgress() {
    const { currentPage, totalPages, percent, chapterTitle } = this.data
    store.saveReadingProgress(this.data.bookId, {
      page: currentPage,
      totalPages,
      percent,
      chapter: chapterTitle
    })
  },

  onHide() {
    if (this.readSeconds > 0) {
      store.addReadingDuration(this.data.bookId, this.readSeconds)
      this.readSeconds = 0
    }
    this.persistProgress()
  },

  onUnload() {
    if (this.readTimer) clearInterval(this.readTimer)
    if (this.readSeconds > 0) {
      store.addReadingDuration(this.data.bookId, this.readSeconds)
    }
    this.persistProgress()
  },

  // ========== 分享 ==========
  onShareAppMessage() {
    const { book, percent } = this.data
    return {
      title: `我正在阅读《${book.title}》，已读 ${percent}%`,
      path: `/pages/reader/reader?id=${this.data.bookId}`
    }
  },

  onShareTimeline() {
    return { title: `我正在阅读《${this.data.book.title}》` }
  }
})
