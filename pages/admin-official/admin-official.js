// pages/admin-official/admin-official.js - 关联公众号
const adminData = require('../../utils/admin-data.js')

const KEY = 'lib_official'

Page({
  data: {
    official: { name: '', originId: '', bound: false, boundAt: '' },
    nameInput: '',
    originIdInput: ''
  },

  onShow() {
    const official = adminData.getObject(KEY, this.data.official)
    this.setData({
      official,
      nameInput: official.name,
      originIdInput: official.originId
    })
  },

  bindName(e) { this.setData({ nameInput: e.detail.value }) },
  bindOriginId(e) { this.setData({ originIdInput: e.detail.value }) },

  onBind() {
    const name = this.data.nameInput.trim()
    const originId = this.data.originIdInput.trim()
    if (!name || !originId) return wx.showToast({ title: '请填写公众号名称和原始ID', icon: 'none' })
    if (!/^gh_[a-zA-Z0-9]+$/.test(originId)) {
      return wx.showToast({ title: '原始ID格式应为 gh_ 开头', icon: 'none' })
    }
    const official = {
      name,
      originId,
      bound: true,
      boundAt: new Date().toISOString().slice(0, 10)
    }
    adminData.save(KEY, official)
    this.setData({ official })
    wx.showModal({
      title: '关联成功',
      content: `已记录公众号「${name}」的关联信息。正式生效需在小程序管理后台完成同主体配置。`,
      showCancel: false
    })
  },

  onUnbind() {
    wx.showModal({
      title: '取消关联',
      content: `确定取消与「${this.data.official.name}」的关联吗？`,
      confirmColor: '#E02020',
      success: res => {
        if (!res.confirm) return
        const official = { name: '', originId: '', bound: false, boundAt: '' }
        adminData.save(KEY, official)
        this.setData({ official, nameInput: '', originIdInput: '' })
        wx.showToast({ title: '已取消关联', icon: 'none' })
      }
    })
  },

  onCopyId() {
    if (!this.data.official.originId) return
    wx.setClipboardData({
      data: this.data.official.originId,
      success: () => wx.showToast({ title: '已复制', icon: 'success' })
    })
  }
})
