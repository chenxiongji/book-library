// pages/admin-users/admin-users.js - 用户管理
const adminData = require('../../utils/admin-data.js')
const store = require('../../utils/store.js')

const USERS_KEY = 'lib_users'

function seedUsers() {
  const cur = store.getUser()
  return [
    {
      id: cur ? cur.id : 'u001',
      name: cur ? cur.name : '书虫小明',
      phone: cur ? (cur.phone || '') : '138****8888',
      vipLevel: cur ? (cur.vipLevel || 0) : 1,
      vipPoints: cur ? (cur.vipPoints || 0) : 350,
      totalBorrowed: cur ? (cur.totalBorrowed || 0) : 12,
      status: 'normal',
      isSelf: true,
      createdAt: '2024-01-01'
    },
    { id: 'u002', name: '阅读者阿芳', phone: '139****6677', vipLevel: 2, vipPoints: 860, totalBorrowed: 21, status: 'normal', createdAt: '2024-02-12' },
    { id: 'u003', name: '技术宅老王', phone: '137****2233', vipLevel: 0, vipPoints: 60, totalBorrowed: 3, status: 'banned', createdAt: '2024-03-20' }
  ]
}

Page({
  data: {
    keyword: '',
    users: [],
    shown: []
  },

  onShow() {
    this.load()
  },

  load() {
    const users = adminData.getList(USERS_KEY, seedUsers()).map(u => ({
      ...u,
      avatar: u.name.slice(0, 1),
      vipName: store.getVipLevelInfo(u.vipLevel).name,
      statusName: u.status === 'banned' ? '已禁用' : '正常',
      vipColor: store.getVipLevelInfo(u.vipLevel).color
    }))
    this.setData({ users, bannedCount: users.filter(u => u.status === 'banned').length })
    this.filter()
  },

  filter() {
    const kw = (this.data.keyword || '').trim().toLowerCase()
    const shown = kw
      ? this.data.users.filter(u => u.name.toLowerCase().includes(kw) || (u.phone || '').includes(kw))
      : this.data.users
    this.setData({ shown })
  },

  onSearch(e) {
    this.setData({ keyword: e.detail.value })
    this.filter()
  },

  onUserTap(e) {
    const id = e.currentTarget.dataset.id
    const user = this.data.users.find(u => u.id === id)
    if (!user) return
    const actions = ['调整积分', user.status === 'banned' ? '解除禁用' : '禁用账号']
    if (!user.isSelf) actions.push('删除用户')
    wx.showActionSheet({
      itemList: actions,
      success: res => {
        if (res.tapIndex === 0) this.adjustPoints(user)
        else if (res.tapIndex === 1) this.toggleBan(user)
        else this.removeUser(user)
      }
    })
  },

  adjustPoints(user) {
    wx.showModal({
      title: `调整 ${user.name} 的积分`,
      content: `当前积分 ${user.vipPoints}，请输入新的积分值`,
      editable: true,
      placeholderText: String(user.vipPoints),
      success: res => {
        if (!res.confirm) return
        const n = parseInt(res.content, 10)
        if (isNaN(n) || n < 0) return wx.showToast({ title: '请输入有效积分', icon: 'none' })
        const users = wx.getStorageSync(USERS_KEY) || []
        const target = users.find(u => u.id === user.id)
        if (target) {
          target.vipPoints = n
          target.vipLevel = store.getLevelByPoints(n)
        }
        adminData.save(USERS_KEY, users)
        // 同步当前登录用户
        const cur = store.getUser()
        if (cur && cur.id === user.id) store.updateUser({ vipPoints: n, vipLevel: store.getLevelByPoints(n) })
        this.load()
        wx.showToast({ title: '已调整', icon: 'success' })
      }
    })
  },

  toggleBan(user) {
    const users = wx.getStorageSync(USERS_KEY) || []
    const target = users.find(u => u.id === user.id)
    if (target) target.status = target.status === 'banned' ? 'normal' : 'banned'
    adminData.save(USERS_KEY, users)
    this.load()
    wx.showToast({ title: target.status === 'banned' ? '已禁用' : '已解除禁用', icon: 'none' })
  },

  removeUser(user) {
    wx.showModal({
      title: '删除用户',
      content: `确定删除「${user.name}」吗？该操作不可恢复。`,
      confirmColor: '#E02020',
      success: res => {
        if (!res.confirm) return
        adminData.save(USERS_KEY, (wx.getStorageSync(USERS_KEY) || []).filter(u => u.id !== user.id))
        this.load()
        wx.showToast({ title: '已删除', icon: 'success' })
      }
    })
  },

  onAdd() {
    wx.showModal({
      title: '新增用户',
      content: '请输入用户昵称',
      editable: true,
      placeholderText: '昵称',
      success: res => {
        if (!res.confirm || !res.content || !res.content.trim()) return
        const users = wx.getStorageSync(USERS_KEY) || []
        users.push({
          id: 'u' + Date.now(),
          name: res.content.trim(),
          phone: '',
          vipLevel: 0,
          vipPoints: 0,
          totalBorrowed: 0,
          status: 'normal',
          createdAt: new Date().toISOString().slice(0, 10)
        })
        adminData.save(USERS_KEY, users)
        this.load()
        wx.showToast({ title: '已添加', icon: 'success' })
      }
    })
  }
})
