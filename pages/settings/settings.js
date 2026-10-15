// pages/settings/settings.js - 用户设置（阅读偏好 / 通知 / 通用）
const store = require('../../utils/store.js')
const util = require('../../utils/util.js')

// 与阅读器保持一致的排版参数
const FONT_SIZES = [32, 36, 40, 44, 48]
const FONT_LABELS = ['小', '较小', '标准', '较大', '大']
const LINE_HEIGHTS = [
  { ratio: 1.7, label: '紧凑' },
  { ratio: 1.95, label: '标准' },
  { ratio: 2.25, label: '宽松' }
]
const THEMES = [
  { key: 'white', name: '白色', bg: '#FFFFFF', border: '#E5E7EB' },
  { key: 'paper', name: '纸张', bg: '#F6F3EC', border: '#E6E0D2' },
  { key: 'green', name: '护眼', bg: '#CCE8CF', border: '#B5D8BA' },
  { key: 'dark', name: '夜间', bg: '#1E2126', border: '#33363B' }
]

const NOTIFY_KEY = 'lib_notify_settings'
const VERSION = 'v1.0.0'

Page({
  data: {
    userInfo: null,
    version: VERSION,

    fontSizeOptions: FONT_SIZES,
    fontSizeLabels: FONT_LABELS,
    fontSizeIndex: 2,
    lineHeightLabels: LINE_HEIGHTS.map(i => i.label),
    lineHeightIndex: 1,
    themeOptions: THEMES,
    themeKey: 'paper',

    notify: { dueRemind: true, newBook: true },
    cacheSize: '—'
  },

  onLoad() {
    this.loadReaderSettings()
    this.loadNotify()
    this.calcCacheSize()
  },

  onShow() {
    const user = store.getUser()
    if (user) {
      this.setData({
        userInfo: {
          name: user.name,
          phone: user.phone || '',
          avatar: user.avatar || ''
        }
      })
    }
  },

  // 读取阅读偏好（与阅读器共用 lib_reader_settings）
  loadReaderSettings() {
    const saved = store.getReaderSettings() || {}
    const fontSize = saved.fontSize || 40
    let fi = FONT_SIZES.indexOf(fontSize)
    if (fi === -1) fi = 2
    this.setData({
      fontSizeIndex: fi,
      lineHeightIndex: saved.lineHeightIdx == null ? 1 : saved.lineHeightIdx,
      themeKey: saved.themeKey || 'paper'
    })
  },

  loadNotify() {
    const saved = wx.getStorageSync(NOTIFY_KEY)
    if (saved && typeof saved === 'object') {
      this.setData({ notify: { dueRemind: !!saved.dueRemind, newBook: !!saved.newBook } })
    }
  },

  // 估算本地缓存占用
  calcCacheSize() {
    try {
      const info = wx.getStorageInfoSync()
      const kb = info.currentSize || 0
      const size = kb >= 1024 ? (kb / 1024).toFixed(2) + ' MB' : kb + ' KB'
      this.setData({ cacheSize: size })
    } catch (e) {
      this.setData({ cacheSize: '—' })
    }
  },

  // 保存阅读偏好
  persistReader() {
    store.saveReaderSettings({
      fontSize: FONT_SIZES[this.data.fontSizeIndex],
      lineHeightIdx: this.data.lineHeightIndex,
      themeKey: this.data.themeKey
    })
  },

  onFontSizeChange(e) {
    this.setData({ fontSizeIndex: Number(e.detail.value) })
    this.persistReader()
  },

  onLineHeightChange(e) {
    this.setData({ lineHeightIndex: Number(e.detail.value) })
    this.persistReader()
  },

  onThemeTap(e) {
    this.setData({ themeKey: e.currentTarget.dataset.key })
    this.persistReader()
  },

  onNotifyChange(e) {
    const field = e.currentTarget.dataset.field
    const notify = { ...this.data.notify, [field]: e.detail.value }
    this.setData({ notify })
    wx.setStorageSync(NOTIFY_KEY, notify)
  },

  onEditProfile() {
    wx.navigateTo({ url: '/pages/profile-edit/profile-edit' })
  },

  // 清除缓存：只清阅读进度/设置等缓存类数据，不动图书、笔记、用户资料
  onClearCache() {
    wx.showModal({
      title: '清除缓存',
      content: '将清除阅读进度、阅读偏好与临时文件缓存。图书、笔记、收藏与账户数据不会被删除。',
      confirmColor: '#4A6CF7',
      success: res => {
        if (!res.confirm) return
        wx.removeStorageSync('lib_reader_settings')
        wx.removeStorageSync(NOTIFY_KEY)
        try {
          const progress = wx.getStorageSync('lib_reading_progress') || {}
          Object.keys(progress).forEach(k => {
            if (progress[k]) {
              progress[k] = { page: 0, totalPages: progress[k].totalPages || 0, percent: 0, chapter: '' }
            }
          })
          wx.setStorageSync('lib_reading_progress', progress)
        } catch (e) {}
        this.loadReaderSettings()
        this.loadNotify()
        this.calcCacheSize()
        util.showToast('缓存已清除', 'success')
      }
    })
  },

  onAbout() {
    const info = wx.getAccountInfoSync ? wx.getAccountInfoSync() : null
    const ver = (info && info.miniProgram && info.miniProgram.version) || ''
    wx.showModal({
      title: '关于我们',
      content: `阳光读书 ${VERSION}${ver ? '（体验版 ' + ver + '）' : ''}\n\n让每个人都能便捷地借阅与阅读，把好书分享给更多人。`,
      showCancel: false,
      confirmText: '知道了'
    })
  },

  onContact() {
    wx.navigateTo({ url: '/pages/admin-contact/admin-contact' })
  },

  onShareAppMessage() {
    return {
      title: '阳光读书 - 让阅读更美好',
      path: '/pages/index/index'
    }
  }
})
