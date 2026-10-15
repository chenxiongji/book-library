// pages/note-detail/note-detail.js
const store = require('../../utils/store.js')
const util = require('../../utils/util.js')

Page({
  data: {
    note: null,
    timeAgo: '',
    comments: [],
    favorited: false
  },

  onLoad(options) {
    const id = options.id
    this.loadNote(id)
  },

  onShow() {
    if (this.data.note) {
      this.loadNote(this.data.note.id)
    }
  },

  loadNote(id) {
    const note = store.getNoteById(id)
    if (!note) {
      util.showToast('笔记不存在')
      setTimeout(() => wx.navigateBack(), 1000)
      return
    }
    this.setData({
      note,
      timeAgo: util.timeAgo(note.createdAt),
      favorited: store.isFavorited('note', id)
    })
  },

  onLike() {
    const updated = store.toggleNoteLike(this.data.note.id)
    if (updated) {
      this.setData({ note: updated })
    }
  },

  // 收藏/取消收藏笔记
  onToggleFavorite() {
    const note = this.data.note
    const res = store.toggleFavorite('note', {
      id: note.id,
      title: note.title,
      cover: note.bookCover,
      author: note.userName,
      content: note.content
    })
    this.setData({ favorited: res.favorited })
    util.showToast(res.favorited ? '已加入收藏' : '已取消收藏', 'success')
  },

  onBookTap() {
    if (this.data.note && this.data.note.bookId) {
      wx.navigateTo({ url: `/pages/book-detail/book-detail?id=${this.data.note.bookId}` })
    }
  },

  onShareAppMessage() {
    return {
      title: `${this.data.note.title} - 《${this.data.note.bookTitle}》`,
      path: `/pages/note-detail/note-detail?id=${this.data.note.id}`
    }
  },

  onShareTimeline() {
    const note = this.data.note
    if (!note) return { title: '阳光读书 - 让阅读更美好' }
    return {
      title: `${note.title} - 《${note.bookTitle || ''}》`,
      // 必须带 id，否则好友从朋友圈打开时 onLoad 收不到 id，会提示「笔记不存在」
      query: 'id=' + note.id
    }
  }
})
