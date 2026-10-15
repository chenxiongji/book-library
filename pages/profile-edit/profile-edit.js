// pages/profile-edit/profile-edit.js - 编辑个人资料
const store = require('../../utils/store.js')
const util = require('../../utils/util.js')

Page({
  data: {
    form: { name: '', phone: '', avatar: '' },
    saving: false
  },

  onLoad() {
    const user = store.getUser()
    if (!user) {
      util.showToast('请先登录')
      setTimeout(() => wx.navigateBack(), 1000)
      return
    }
    this.setData({
      form: {
        name: user.name || '',
        phone: user.phone || '',
        avatar: user.avatar || ''
      }
    })
  },

  onInput(e) {
    this.setData({ [`form.${e.currentTarget.dataset.field}`]: e.detail.value })
  },

  // 更换头像（保存到本地用户目录，避免临时文件失效）
  onChooseAvatar() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sizeType: ['compressed'],
      success: (res) => {
        const tempPath = res.tempFiles[0].tempFilePath
        const fs = wx.getFileSystemManager()
        fs.saveFile({
          tempFilePath: tempPath,
          success: (saved) => {
            this.setData({ 'form.avatar': saved.savedFilePath })
            util.showToast('头像已更换', 'success')
          },
          fail: () => {
            // 保存失败时退回临时路径
            this.setData({ 'form.avatar': tempPath })
          }
        })
      }
    })
  },

  onSave() {
    if (this.data.saving) return
    const form = this.data.form
    const name = (form.name || '').trim()
    if (!name) { util.showToast('请输入昵称'); return }
    const phone = (form.phone || '').trim()
    if (phone && !/^1[3-9]\d{9}$/.test(phone.replace(/\*/g, '0'))) {
      util.showToast('手机号格式不正确')
      return
    }

    this.setData({ saving: true })
    store.updateUser({ name, phone, avatar: form.avatar })
    util.showToast('保存成功', 'success')
    // saving 保持 true 直到返回，避免重复点击造成重复保存
    setTimeout(() => wx.navigateBack(), 800)
  }
})
