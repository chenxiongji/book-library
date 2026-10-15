// pages/favorites/favorites.js - 我的收藏
const store = require('../../utils/store.js')
const util = require('../../utils/util.js')

Page({
  data: {
    tab: 'book', // book | note
    counts: { book: 0, note: 0 },
    list: [],
    timeAgoMap: {}
  },

  onShow() {
    this.loadList()
  },

  onTabTap(e) {
    const tab = e.currentTarget.dataset.tab
    if (tab === this.data.tab) return
    this.setData({ tab })
    this.loadList()
  },

  loadList() {
    const tab = this.data.tab
    const list = store.getFavorites({ type: tab })
    const timeAgoMap = {}
    list.forEach(f => { timeAgoMap[f.id] = util.timeAgo(f.createdAt) })
    this.setData({
      list,
      timeAgoMap,
      counts: {
        book: store.getFavorites({ type: 'book' }).length,
        note: store.getFavorites({ type: 'note' }).length
      }
    })
  },

  // 跳转详情
  onItemTap(e) {
    const { id, type } = e.currentTarget.dataset
    if (type === 'book') {
      wx.navigateTo({ url: `/pages/book-detail/book-detail?id=${id}` })
    } else {
      wx.navigateTo({ url: `/pages/note-detail/note-detail?id=${id}` })
    }
  },

  // 取消收藏
  onUnfavorite(e) {
    const { id, type, title } = e.currentTarget.dataset
    wx.showModal({
      title: '取消收藏',
      content: `确定取消收藏「${title}」吗？`,
      success: (res) => {
        if (!res.confirm) return
        // toggleFavorite 需要目标对象，这里直接按记录移除
        const favorites = wx.getStorageSync('lib_favorites') || []
        const kept = favorites.filter(f => !(f.type === type && f.targetId === id))
        wx.setStorageSync('lib_favorites', kept)
        util.showToast('已取消收藏', 'success')
        this.loadList()
      }
    })
  }
})
