// pages/admin-tags/admin-tags.js - 图书标签
const adminData = require('../../utils/admin-data.js')
const store = require('../../utils/store.js')

const KEY = 'lib_tags'

Page({
  data: {
    tags: []
  },

  onShow() {
    this.load()
  },

  load() {
    const seed = [
      { id: 't1', name: '热门', color: '#EF4444' },
      { id: 't2', name: '新书', color: '#22C55E' },
      { id: 't3', name: '推荐', color: '#4A6CF7' },
      { id: 't4', name: '值得反复读', color: '#F59E0B' }
    ]
    const tags = adminData.getList(KEY, seed)
    this.setData({ tags, palette: adminData.PALETTE })
  },

  onAdd() {
    wx.showModal({
      title: '新增标签',
      content: '请输入标签名称',
      editable: true,
      placeholderText: '如：馆藏珍品',
      success: res => {
        if (!res.confirm || !res.content || !res.content.trim()) return
        const name = res.content.trim()
        const tags = wx.getStorageSync(KEY) || []
        if (tags.some(t => t.name === name)) return wx.showToast({ title: '标签已存在', icon: 'none' })
        tags.push({ id: 't' + Date.now(), name, color: adminData.pickColor(tags.length) })
        adminData.save(KEY, tags)
        this.load()
        wx.showToast({ title: '已添加', icon: 'success' })
      }
    })
  },

  onItemTap(e) {
    const id = e.currentTarget.dataset.id
    const tag = this.data.tags.find(t => t.id === id)
    if (!tag) return
    wx.showActionSheet({
      itemList: ['更换颜色', '重命名', '删除'],
      success: res => {
        if (res.tapIndex === 0) this.cycleColor(tag)
        else if (res.tapIndex === 1) this.rename(tag)
        else this.remove(tag)
      }
    })
  },

  cycleColor(tag) {
    const palette = adminData.PALETTE
    const tags = wx.getStorageSync(KEY) || []
    const target = tags.find(t => t.id === tag.id)
    if (target) target.color = palette[(palette.indexOf(target.color) + 1) % palette.length]
    adminData.save(KEY, tags)
    this.load()
  },

  rename(tag) {
    wx.showModal({
      title: '重命名标签',
      content: '请输入新的标签名称',
      editable: true,
      placeholderText: tag.name,
      success: res => {
        if (!res.confirm || !res.content || !res.content.trim()) return
        const name = res.content.trim()
        const tags = wx.getStorageSync(KEY) || []
        // 重名校验（排除自身）
        if (tags.some(t => t.name === name && t.id !== tag.id)) {
          return wx.showToast({ title: '该标签名已存在', icon: 'none' })
        }
        const target = tags.find(t => t.id === tag.id)
        if (target) target.name = name
        adminData.save(KEY, tags)
        this.load()
        wx.showToast({ title: '已保存', icon: 'success' })
      }
    })
  },

  remove(tag) {
    wx.showModal({
      title: '删除标签',
      content: `确定删除标签「${tag.name}」吗？`,
      confirmColor: '#E02020',
      success: res => {
        if (!res.confirm) return
        adminData.save(KEY, (wx.getStorageSync(KEY) || []).filter(t => t.id !== tag.id))
        this.load()
        wx.showToast({ title: '已删除', icon: 'success' })
      }
    })
  }
})
