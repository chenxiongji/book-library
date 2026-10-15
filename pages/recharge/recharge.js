// pages/recharge/recharge.js
const store = require('../../utils/store.js')
const util = require('../../utils/util.js')

Page({
  data: {
    plans: store.RECHARGE_PLANS,
    selectedPlan: null,
    userInfo: null,
    paying: false,
    step: 'select' // select | paying | success
  },

  onLoad() {
    const user = store.getUser()
    // 默认选中推荐套餐
    const popular = this.data.plans.find(p => p.popular)
    this.setData({
      userInfo: user,
      selectedPlan: popular || this.data.plans[0]
    })
  },

  onSelectPlan(e) {
    const id = e.currentTarget.dataset.id
    const plan = this.data.plans.find(p => p.id === id)
    this.setData({ selectedPlan: plan })
  },

  onPay() {
    // 防重复支付：支付中直接忽略
    if (this.data.paying) return
    if (!this.data.selectedPlan) {
      util.showToast('请选择充值套餐')
      return
    }

    this.setData({ step: 'paying', paying: true })

    // 模拟微信支付流程
    setTimeout(() => {
      // 模拟支付成功
      const result = store.recharge(this.data.selectedPlan.id)
      const app = getApp()
      // 直接采用 store 落库后的真实值，不要用页面里的旧快照重算，
      // 否则同一会话内二次充值会用旧基数把积分覆盖回去
      const latest = store.getUser() || {}
      app.updateUserInfo({
        vipPoints: latest.vipPoints,
        vipLevel: result.newLevel
      })
      this.setData({ userInfo: latest })

      this.setData({
        paying: false,
        step: 'success'
      })

      // 如果升级了，显示升级提示
      if (result.leveledUp) {
        const levelInfo = store.getVipLevelInfo(result.newLevel)
        setTimeout(() => {
          wx.showToast({
            title: `恭喜升级为${levelInfo.name}！`,
            icon: 'none',
            duration: 3000
          })
        }, 500)
      }
    }, 2000)
  },

  onBack() {
    wx.navigateBack()
  },

  onViewVIP() {
    wx.redirectTo({ url: '/pages/vip/vip' })
  }
})
