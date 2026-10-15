// pages/profile/profile.js
const store = require('../../utils/store.js')
const util = require('../../utils/util.js')

Page({
  data: {
    userInfo: null,
    stats: null,
    levelInfo: null,
    nextLevel: null,
    menuGroups: [
      {
        title: '我的图书',
        items: [
          { id: 'borrows', name: '借阅记录', icon: '📋', color: '#4A6CF7' },
          { id: 'ebooks', name: '我的电子书', icon: '📱', color: '#10B981' },
          { id: 'reading', name: '阅读历史', icon: '📖', color: '#F59E0B' }
        ]
      },
      {
        title: '我的创作',
        items: [
          { id: 'notes', name: '我的笔记', icon: '📝', color: '#8B5CF6' },
          { id: 'favorites', name: '我的收藏', icon: '⭐', color: '#EF4444' }
        ]
      },
      {
        title: '账户',
        items: [
          { id: 'vip', name: 'VIP中心', icon: '👑', color: '#F59E0B' },
          { id: 'settings', name: '设置', icon: '⚙️', color: '#6B7280' },
          { id: 'about', name: '关于我们', icon: 'ℹ️', color: '#6B7280' }
        ]
      }
    ]
  },

  onLoad() {
    this.loadData()
  },

  onShow() {
    this.loadData()
  },

  loadData() {
    const user = store.getUser()
    const stats = store.getStats()
    const levelInfo = store.getVipLevelInfo(user.vipLevel)
    const nextLevel = store.getNextLevel(user.vipLevel)

    // 用户的电子书
    const ebooks = store.getBooks({ type: 'electronic' })
    // 用户的笔记
    const myNotes = store.getNotes({ userId: user.id })

    this.setData({
      userInfo: {
        ...user,
        ebooksCount: ebooks.length,
        myNotesCount: myNotes.length
      },
      stats,
      levelInfo,
      nextLevel
    })
  },

  onMenuTap(e) {
    const id = e.currentTarget.dataset.id

    // 关于我们：直接弹窗，避免跳转到不存在的页面
    if (id === 'about') {
      wx.showModal({
        title: '关于我们',
        content: '阳光读书 v1.0.0\n\n让每个人都能便捷地借阅与阅读，把好书分享给更多人。',
        showCancel: false,
        confirmText: '知道了'
      })
      return
    }

    const routes = {
      borrows: '/pages/borrow/borrow',
      ebooks: '/pages/bookshelf/bookshelf',
      reading: '/pages/bookshelf/bookshelf?tab=history',
      settings: '/pages/settings/settings',
      vip: '/pages/vip/vip',
      notes: '/pages/notes/notes',
      favorites: '/pages/favorites/favorites'
    }

    if (routes[id]) {
      if (id === 'notes') {
        wx.switchTab({ url: routes[id] })
      } else {
        wx.navigateTo({ url: routes[id] })
      }
    } else {
      util.showToast('功能开发中')
    }
  },

  onVIP() {
    wx.navigateTo({ url: '/pages/vip/vip' })
  },

  onEditProfile() {
    wx.navigateTo({ url: '/pages/profile-edit/profile-edit' })
  },

  onShareAppMessage() {
    return {
      title: '阳光读书 - 让阅读更美好',
      path: '/pages/index/index'
    }
  }
})
