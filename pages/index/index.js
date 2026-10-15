// pages/index/index.js
const store = require('../../utils/store.js')
const util = require('../../utils/util.js')

Page({
  data: {
    banners: [
      { id: 1, title: '读书是最好的投资', subtitle: '开通VIP，畅享万册好书', color: '#667eea', image: '' },
      { id: 2, title: '电子书全新上线', subtitle: 'TXT/EPUB/PDF 多格式支持', color: '#f093fb', image: '' },
      { id: 3, title: '阅读笔记广场', subtitle: '分享你的阅读感悟', color: '#4facfe', image: '' }
    ],
    quickActions: [
      { id: 'scan', name: '扫码录入', icon: '📷', color: '#4A6CF7' },
      { id: 'upload', name: '电子书上传', icon: '📤', color: '#10B981' },
      { id: 'borrow', name: '借阅管理', icon: '📋', color: '#F59E0B' },
      { id: 'vip', name: 'VIP中心', icon: '👑', color: '#EF4444' }
    ],
    categories: [{ name: '全部', icon: '📚' }].concat(util.getBookCategories()).slice(0, 8),
    recommendBooks: [],
    newBooks: [],
    hotNotes: [],
    userInfo: null,
    stats: null
  },

  onLoad() {
    this.loadData()
  },

  onShow() {
    // 每次显示时刷新数据
    this.setData({ categories: [{ name: '全部', icon: '📚' }].concat(util.getBookCategories()).slice(0, 8) })
    this.loadData()
  },

  loadData() {
    const app = getApp()
    const user = store.getUser()
    const stats = store.getStats()
    const allBooks = store.getBooks()

    // 推荐图书（随机选4本）
    const shuffled = [...allBooks].sort(() => Math.random() - 0.5)
    const recommend = shuffled.slice(0, 4)

    // 最新图书
    const newBooks = [...allBooks].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 6)

    // 热门笔记
    const notes = store.getNotes().slice(0, 3)

    this.setData({
      userInfo: user,
      stats,
      recommendBooks: recommend,
      newBooks,
      hotNotes: notes
    })
  },

  onQuickAction(e) {
    const id = e.currentTarget.dataset.id
    const routes = {
      scan: '/pages/scan/scan',
      upload: '/pages/upload/upload',
      borrow: '/pages/borrow/borrow',
      vip: '/pages/vip/vip'
    }
    if (routes[id]) {
      wx.navigateTo({ url: routes[id] })
    }
  },

  onCategoryTap(e) {
    const category = e.currentTarget.dataset.category
    wx.switchTab({
      url: '/pages/library/library',
      success: () => {
        const page = getCurrentPages().find(p => p.route === 'pages/library/library')
        if (page) {
          page.setData({ activeCategory: category })
          page.loadBooks()
        }
      }
    })
  },

  onSearchTap() {
    wx.switchTab({ url: '/pages/library/library' })
  },

  onBookTap(e) {
    const book = e.detail.book
    if (book) {
      wx.navigateTo({ url: `/pages/book-detail/book-detail?id=${book.id}` })
    }
  },

  onNoteTap(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/note-detail/note-detail?id=${id}` })
  },

  onMoreBooks() {
    wx.switchTab({ url: '/pages/library/library' })
  },

  onMoreNotes() {
    wx.switchTab({ url: '/pages/notes/notes' })
  },

  onPullDownRefresh() {
    this.loadData()
    wx.stopPullDownRefresh()
  }
})
