// pages/admin-notices/admin-notices.js - 公告管理
const adminData = require('../../utils/admin-data.js')

const KEY = 'lib_notices'

Page({
  data: {
    notices: [],
    editor: null // { id, title, content, pinned, isNew }
  },

  onShow() {
    this.load()
  },

  load() {
    const seed = [{
      id: 'n1',
      title: '阳光读书开馆公告',
      content: '阳光读书图书借阅服务已正式开放，欢迎大家前来借阅！',
      pinned: true,
      published: true,
      createdAt: '2024-01-15'
    }]
    const list = adminData.getList(KEY, seed)
    // 置顶优先，其次按时间倒序
    const notices = [...list].sort((a, b) => (b.pinned - a.pinned) || (b.createdAt < a.createdAt ? -1 : 1))
    this.setData({ notices })
  },

  onAdd() {
    this.setData({ editor: { id: null, title: '', content: '', pinned: false, isNew: true } })
  },

  onEdit(e) {
    const id = e.currentTarget.dataset.id
    const n = this.data.notices.find(x => x.id === id)
    if (!n) return
    this.setData({ editor: { id: n.id, title: n.title, content: n.content, pinned: n.pinned, isNew: false } })
  },

  bindTitle(e) { this.setData({ 'editor.title': e.detail.value }) },
  bindContent(e) { this.setData({ 'editor.content': e.detail.value }) },
  bindPinned(e) { this.setData({ 'editor.pinned': e.detail.value }) },

  onSave() {
    const ed = this.data.editor
    if (!ed.title.trim()) return wx.showToast({ title: '请输入公告标题', icon: 'none' })
    if (!ed.content.trim()) return wx.showToast({ title: '请输入公告内容', icon: 'none' })
    const list = wx.getStorageSync(KEY) || []
    if (ed.isNew) {
      list.push({
        id: 'n' + Date.now(),
        title: ed.title.trim(),
        content: ed.content.trim(),
        pinned: ed.pinned,
        published: true,
        createdAt: new Date().toISOString().slice(0, 10)
      })
    } else {
      const target = list.find(n => n.id === ed.id)
      if (target) Object.assign(target, { title: ed.title.trim(), content: ed.content.trim(), pinned: ed.pinned })
    }
    adminData.save(KEY, list)
    this.setData({ editor: null })
    this.load()
    wx.showToast({ title: '已保存', icon: 'success' })
  },

  onCancel() {
    this.setData({ editor: null })
  },

  onTogglePublish(e) {
    const id = e.currentTarget.dataset.id
    const list = wx.getStorageSync(KEY) || []
    const target = list.find(n => n.id === id)
    if (!target) return
    target.published = !target.published
    adminData.save(KEY, list)
    this.load()
    wx.showToast({ title: target.published ? '已发布' : '已下架', icon: 'none' })
  },

  onItemTap(e) {
    const id = e.currentTarget.dataset.id
    const n = this.data.notices.find(x => x.id === id)
    if (!n) return
    wx.showActionSheet({
      itemList: [n.pinned ? '取消置顶' : '置顶', '编辑', '删除'],
      success: res => {
        if (res.tapIndex === 0) this.togglePin(n)
        else if (res.tapIndex === 1) this.onEdit(e)
        else this.remove(n)
      }
    })
  },

  togglePin(n) {
    const list = wx.getStorageSync(KEY) || []
    const target = list.find(x => x.id === n.id)
    if (target) target.pinned = !target.pinned
    adminData.save(KEY, list)
    this.load()
  },

  remove(n) {
    wx.showModal({
      title: '删除公告',
      content: `确定删除「${n.title}」吗？`,
      confirmColor: '#E02020',
      success: res => {
        if (!res.confirm) return
        adminData.save(KEY, (wx.getStorageSync(KEY) || []).filter(x => x.id !== n.id))
        this.load()
        wx.showToast({ title: '已删除', icon: 'success' })
      }
    })
  }
})
