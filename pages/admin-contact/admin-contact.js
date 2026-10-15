// pages/admin-contact/admin-contact.js - 联系方式
const adminData = require('../../utils/admin-data.js')

const KEY = 'lib_contact'
const DEFAULTS = {
  phone: '400-800-8888',
  wechat: 'shuhaige-service',
  email: 'service@shuhaige.com',
  address: '幸福路 88 号文化中心 2 层',
  hours: '周一至周日 09:00 - 21:00'
}

Page({
  data: {
    contact: DEFAULTS
  },

  onShow() {
    this.setData({ contact: adminData.getObject(KEY, DEFAULTS) })
  },

  bindField(e) {
    const field = e.currentTarget.dataset.field
    this.setData({ ['contact.' + field]: e.detail.value })
  },

  onSave() {
    const c = this.data.contact
    if (!c.phone.trim()) return wx.showToast({ title: '请填写客服电话', icon: 'none' })
    adminData.save(KEY, c)
    wx.showToast({ title: '已保存', icon: 'success' })
  },

  onCopy(e) {
    const field = e.currentTarget.dataset.field
    const value = this.data.contact[field]
    if (!value) return
    wx.setClipboardData({
      data: value,
      success: () => wx.showToast({ title: '已复制', icon: 'success' })
    })
  }
})
