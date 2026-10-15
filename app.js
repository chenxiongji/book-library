// app.js - 图书借阅管理小程序入口
const store = require('./utils/store.js')

App({
  globalData: {
    userInfo: null,
    vipLevel: 0,
    vipPoints: 0,
    balance: 0,
    theme: 'light',
    systemInfo: null
  },

  onLaunch() {
    // 初始化本地数据（首次启动写入示例数据）
    store.initData()

    // 获取系统信息
    const sysInfo = wx.getSystemInfoSync()
    this.globalData.systemInfo = sysInfo

    // 加载用户信息
    this.loadUserInfo()
  },

  loadUserInfo() {
    const user = store.getUser()
    if (user) {
      this.globalData.userInfo = user
      this.globalData.vipLevel = user.vipLevel || 0
      this.globalData.vipPoints = user.vipPoints || 0
      this.globalData.balance = user.balance || 0
    }
  },

  // 更新用户信息并同步到全局
  updateUserInfo(updates) {
    const user = store.updateUser(updates)
    if (user) {
      this.globalData.userInfo = user
      this.globalData.vipLevel = user.vipLevel || 0
      this.globalData.vipPoints = user.vipPoints || 0
      this.globalData.balance = user.balance || 0
    }
    return user
  }
})
