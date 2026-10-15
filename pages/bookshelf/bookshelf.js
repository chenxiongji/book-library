// pages/bookshelf/bookshelf.js
const store = require('../../utils/store.js')
const util = require('../../utils/util.js')

Page({
  data: {
    tab: 'shelf', // shelf 书架 | history 最近阅读
    shelfBooks: [],
    historyBooks: [],
    totalMinutes: 0
  },

  onLoad(options) {
    if (options && options.tab === 'history') {
      this.setData({ tab: 'history' })
      wx.setNavigationBarTitle({ title: '阅读历史' })
    }
  },

  onShow() {
    this.loadData()
  },

  loadData() {
    const ebooks = store.getBooks({ type: 'electronic' })
    const allProgress = store.getAllReadingProgress()

    // 书架：全部电子书，附阅读进度
    const shelfBooks = ebooks.map(b => ({
      ...b,
      ...this.decorate(b, allProgress[b.id] || null)
    }))

    // 最近阅读：有进度记录的，按时间倒序
    const historyBooks = shelfBooks
      .filter(b => b.started)
      .sort((a, b) => new Date(b.updatedAtRaw) - new Date(a.updatedAtRaw))

    this.setData({
      shelfBooks,
      historyBooks,
      totalMinutes: Math.round(store.getUser().totalReadMinutes || 0)
    })
  },

  decorate(book, p) {
    if (!p) {
      return { percent: 0, chapter: '', progressText: '未开始阅读', lastText: '', updatedAtRaw: '', started: false }
    }
    return {
      percent: p.percent,
      chapter: p.chapter || '',
      progressText: `已读 ${p.percent}%`,
      lastText: this.formatTime(p.updatedAt),
      updatedAtRaw: p.updatedAt,
      started: true
    }
  },

  formatTime(iso) {
    if (!iso) return ''
    const d = new Date(iso)
    const now = new Date()
    const diff = (now - d) / 1000
    const pad = n => (n < 10 ? '0' + n : '' + n)
    const hm = `${pad(d.getHours())}:${pad(d.getMinutes())}`
    const ymd = `${d.getMonth() + 1}月${d.getDate()}日`
    if (diff < 60) return '刚刚'
    if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`
    if (d.toDateString() === now.toDateString()) return `今天 ${hm}`
    if (diff < 86400 * 2) return `昨天 ${hm}`
    return `${ymd} ${hm}`
  },

  switchTab(e) {
    const tab = e.currentTarget.dataset.tab
    this.setData({ tab })
    wx.setNavigationBarTitle({ title: tab === 'shelf' ? '我的电子书' : '阅读历史' })
  },

  // 点击图书 → 直接进阅读器继续阅读
  onBookTap(e) {
    const { id, started } = e.currentTarget.dataset
    if (!id) return
    if (started) {
      wx.navigateTo({ url: `/pages/reader/reader?id=${id}` })
    } else {
      // 未读过的先去详情页看一眼
      wx.navigateTo({ url: `/pages/book-detail/book-detail?id=${id}` })
    }
  },

  // 详情入口
  onDetailTap(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/book-detail/book-detail?id=${id}` })
  },

  // 长按删除：会连同阅读进度、收藏、相关笔记一起删除，文案需如实告知
  onBookLongPress(e) {
    const id = e.currentTarget.dataset.id
    const title = e.currentTarget.dataset.title
    wx.showModal({
      title: '删除图书',
      content: `确定删除《${title || '该图书'}》吗？阅读进度与相关收藏会一并删除，且不可恢复。`,
      confirmText: '删除',
      confirmColor: '#EF4444',
      success: res => {
        if (res.confirm) {
          store.deleteBook(id)
          util.showToast('已删除', 'success')
          this.loadData()
        }
      }
    })
  },

  goUpload() {
    wx.navigateTo({ url: '/pages/upload/upload' })
  },

  onShareAppMessage() {
    return {
      title: '阳光读书 - 我的书架',
      path: '/pages/profile/profile'
    }
  }
})
