// pages/vip/vip.js
const store = require('../../utils/store.js')
const util = require('../../utils/util.js')

Page({
  data: {
    userInfo: null,
    currentLevel: null,
    nextLevel: null,
    levelProgress: 0,
    allLevels: store.VIP_LEVELS,
    rechargeHistory: [],
    stats: null
  },

  onLoad() {
    this.loadData()
  },

  onShow() {
    this.loadData()
  },

  loadData() {
    const app = getApp()
    const user = store.getUser()
    const currentLevel = store.getVipLevelInfo(user.vipLevel)
    const nextLevel = store.getNextLevel(user.vipLevel)
    const recharges = store.getRecharges(user.id)
    const stats = store.getStats()

    // 计算等级进度
    let levelProgress = 100
    if (nextLevel) {
      const currentMin = currentLevel.minPoints
      const nextMin = nextLevel.minPoints
      const range = nextMin - currentMin
      const earned = user.vipPoints - currentMin
      levelProgress = Math.round(earned / range * 100)
    }

    this.setData({
      userInfo: user,
      currentLevel,
      nextLevel,
      levelProgress,
      rechargeHistory: recharges.slice(0, 10).map(r => ({
        ...r,
        dateFormatted: util.formatDate(r.createdAt, 'YYYY-MM-DD HH:mm')
      })),
      stats
    })
  },

  onRecharge() {
    wx.navigateTo({ url: '/pages/recharge/recharge' })
  },

  onLevelTap(e) {
    const level = e.currentTarget.dataset.level
    const levelInfo = store.VIP_LEVELS.find(l => l.level === level)
    if (levelInfo) {
      wx.showModal({
        title: `${levelInfo.icon} ${levelInfo.name}`,
        content: `需要积分：${levelInfo.minPoints}\n\n权益：\n${levelInfo.benefits.join('\n')}`,
        showCancel: false,
        confirmText: '知道了'
      })
    }
  },

  onShareAppMessage() {
    return {
      title: '阳光读书VIP - 畅享万册好书',
      path: '/pages/vip/vip'
    }
  }
})
