// pages/notes/notes.js
const store = require('../../utils/store.js')
const util = require('../../utils/util.js')

Page({
  data: {
    notes: [],
    activeFilter: 'all', // all | following | hot
    filters: [
      { key: 'all', name: '全部' },
      { key: 'hot', name: '热门' },
      { key: 'mine', name: '我的' }
    ],
    searchKeyword: ''
  },

  onLoad() {
    this.loadNotes()
  },

  onShow() {
    this.loadNotes()
  },

  loadNotes() {
    let notes = store.getNotes()

    // 格式化时间
    notes = notes.map(n => ({
      ...n,
      timeAgo: util.timeAgo(n.createdAt)
    }))

    // 过滤
    if (this.data.activeFilter === 'hot') {
      notes.sort((a, b) => b.likes - a.likes)
    } else if (this.data.activeFilter === 'mine') {
      const user = store.getUser()
      notes = notes.filter(n => n.userId === user.id)
    }

    // 搜索
    if (this.data.searchKeyword) {
      const kw = this.data.searchKeyword.toLowerCase()
      notes = notes.filter(n =>
        n.title.toLowerCase().includes(kw) ||
        n.content.toLowerCase().includes(kw) ||
        n.bookTitle.toLowerCase().includes(kw)
      )
    }

    this.setData({ notes })
  },

  onFilterTap(e) {
    this.setData({ activeFilter: e.currentTarget.dataset.key })
    this.loadNotes()
  },

  onSearchInput(e) {
    this.setData({ searchKeyword: e.detail.value })
    this.loadNotes()
  },

  onNoteTap(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/note-detail/note-detail?id=${id}` })
  },

  onLike(e) {
    const id = e.currentTarget.dataset.id
    const updated = store.toggleNoteLike(id)
    if (updated) {
      this.loadNotes()
    }
  },

  onWriteNote() {
    wx.navigateTo({ url: '/pages/note-edit/note-edit' })
  },

  onBookTap(e) {
    const bookId = e.currentTarget.dataset.bookid
    wx.navigateTo({ url: `/pages/book-detail/book-detail?id=${bookId}` })
  }
})
