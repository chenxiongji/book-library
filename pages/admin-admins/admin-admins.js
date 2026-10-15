// pages/admin-admins/admin-admins.js - 管理员管理
const adminData = require('../../utils/admin-data.js')

const KEY = 'lib_admins'
const ROLES = ['超级管理员', '管理员', '录入员']
const ROLE_COLORS = ['#E02020', '#4A6CF7', '#16A34A']

Page({
  data: {
    admins: [],
    roles: ROLES,
    roleColors: ROLE_COLORS,
    editor: null // { id, name, roleIndex, isNew }
  },

  onShow() {
    this.load()
  },

  load() {
    const seed = [
      { id: 'a1', name: '书虫小明', role: '超级管理员', phone: '138****8888', isSelf: true, createdAt: '2024-01-01' },
      { id: 'a2', name: '图书馆小张', role: '录入员', phone: '136****9911', createdAt: '2024-03-05' }
    ]
    const admins = adminData.getList(KEY, seed)
    this.setData({ admins })
  },

  onAdd() {
    this.setData({ editor: { id: null, name: '', roleIndex: 1, isNew: true } })
  },

  onEdit(e) {
    const id = e.currentTarget.dataset.id
    const a = this.data.admins.find(x => x.id === id)
    if (!a) return
    this.setData({ editor: { id: a.id, name: a.name, roleIndex: ROLES.indexOf(a.role), isNew: false } })
  },

  bindName(e) { this.setData({ 'editor.name': e.detail.value }) },
  bindRole(e) { this.setData({ 'editor.roleIndex': Number(e.detail.value) }) },

  onSave() {
    const ed = this.data.editor
    if (!ed.name.trim()) return wx.showToast({ title: '请输入管理员名称', icon: 'none' })
    const admins = wx.getStorageSync(KEY) || []
    const name = ed.name.trim()
    if (admins.some(a => a.name === name && a.id !== ed.id)) {
      return wx.showToast({ title: '该管理员已存在', icon: 'none' })
    }
    if (ed.isNew) {
      admins.push({ id: 'a' + Date.now(), name, role: ROLES[ed.roleIndex], phone: '', createdAt: new Date().toISOString().slice(0, 10) })
    } else {
      const target = admins.find(a => a.id === ed.id)
      if (target) {
        target.name = name
        target.role = ROLES[ed.roleIndex]
      }
    }
    adminData.save(KEY, admins)
    this.setData({ editor: null })
    this.load()
    wx.showToast({ title: '已保存', icon: 'success' })
  },

  onCancel() {
    this.setData({ editor: null })
  },

  onItemTap(e) {
    const id = e.currentTarget.dataset.id
    const a = this.data.admins.find(x => x.id === id)
    if (!a) return
    if (a.isSelf) {
      return this.onEdit(e)
    }
    const actions = ['编辑', '设为超级管理员', '设为管理员', '设为录入员', '移除']
    wx.showActionSheet({
      itemList: actions,
      success: res => {
        if (res.tapIndex === 0) this.onEdit(e)
        else if (res.tapIndex === 4) this.remove(a)
        else this.setRole(a, ROLES[res.tapIndex - 1])
      }
    })
  },

  setRole(a, role) {
    const admins = wx.getStorageSync(KEY) || []
    const target = admins.find(x => x.id === a.id)
    if (target) target.role = role
    adminData.save(KEY, admins)
    this.load()
    wx.showToast({ title: `已设为${role}`, icon: 'none' })
  },

  remove(a) {
    wx.showModal({
      title: '移除管理员',
      content: `确定移除「${a.name}」的管理权限吗？`,
      confirmColor: '#E02020',
      success: res => {
        if (!res.confirm) return
        adminData.save(KEY, (wx.getStorageSync(KEY) || []).filter(x => x.id !== a.id))
        this.load()
        wx.showToast({ title: '已移除', icon: 'success' })
      }
    })
  }
})
