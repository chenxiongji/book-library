// pages/admin-settings/admin-settings.js - 书房设置（借阅规则全局配置）
const adminData = require('../../utils/admin-data.js')

const KEY = 'lib_room_settings'
const DEFAULTS = {
  borrowDays: 14,        // 默认借阅期限（天）
  maxBorrow: 5,          // 每人可借数量（本）
  renewTimes: 1,         // 可续借次数
  finePerDay: 0.5,       // 逾期罚金（元/天）
  reserveHours: 48,      // 预约保留时长（小时）
  remindDays: 3,         // 到期前几天提醒
  allowReserve: true,    // 允许预借
  allowRegister: true    // 开放新用户注册
}

Page({
  data: {
    settings: DEFAULTS
  },

  onShow() {
    const settings = adminData.getObject(KEY, DEFAULTS)
    this.setData({ settings })
  },

  bindNum(e) {
    const field = e.currentTarget.dataset.field
    const raw = parseFloat(e.detail.value)
    if (isNaN(raw)) return this.setData({ ['settings.' + field]: 0 })
    // 罚金支持小数，其余取整；所有数值项不允许为负
    const v = field === 'finePerDay' ? raw : Math.round(raw)
    this.setData({ ['settings.' + field]: Math.max(0, v) })
  },

  bindSwitch(e) {
    const field = e.currentTarget.dataset.field
    this.setData({ ['settings.' + field]: e.detail.value })
  },

  onSave() {
    const s = this.data.settings
    if (!s.borrowDays || s.borrowDays < 1) return wx.showToast({ title: '借阅期限至少 1 天', icon: 'none' })
    if (!s.maxBorrow || s.maxBorrow < 1) return wx.showToast({ title: '可借数量至少 1 本', icon: 'none' })
    adminData.save(KEY, this.data.settings)
    wx.showToast({ title: '设置已保存', icon: 'success' })
  },

  onReset() {
    wx.showModal({
      title: '恢复默认',
      content: '将所有设置恢复为默认值，确定吗？',
      success: res => {
        if (!res.confirm) return
        adminData.save(KEY, DEFAULTS)
        this.setData({ settings: { ...DEFAULTS } })
        wx.showToast({ title: '已恢复默认', icon: 'success' })
      }
    })
  }
})
