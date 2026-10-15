// pages/admin-categories/admin-categories.js - 图书分类
const adminData = require('../../utils/admin-data.js')
const store = require('../../utils/store.js')
const util = require('../../utils/util.js')

const KEY = 'lib_categories'
const ICONS = ['📚', '🚀', '💻', '🏛️', '🧸', '🎨', '🔬', '🌍', '🍳', '💼']

Page({
  data: {
    categories: []
  },

  onShow() {
    this.load()
  },

  load() {
    // 与录入/筛选共用同一个数据源 util.DEFAULT_CATEGORIES，避免两处默认值不一致
    const cats = adminData.getList(KEY, util.DEFAULT_CATEGORIES.map((c, i) => ({
      id: 'c' + (i + 1), name: c.name, icon: c.icon || ICONS[i % ICONS.length]
    })))
    const books = store.getBooks()
    const categories = cats.map(c => ({
      ...c,
      count: books.filter(b => b.category === c.name).length
    }))
    this.setData({ categories })
  },

  onAdd() {
    wx.showModal({
      title: '新增分类',
      content: '请输入分类名称',
      editable: true,
      placeholderText: '如：心理学',
      success: res => {
        if (!res.confirm || !res.content || !res.content.trim()) return
        const name = res.content.trim()
        const cats = wx.getStorageSync(KEY) || []
        if (cats.some(c => c.name === name)) return wx.showToast({ title: '分类已存在', icon: 'none' })
        cats.push({ id: 'c' + Date.now(), name, icon: ICONS[cats.length % ICONS.length] })
        adminData.save(KEY, cats)
        this.load()
        wx.showToast({ title: '已添加', icon: 'success' })
      }
    })
  },

  onItemTap(e) {
    const id = e.currentTarget.dataset.id
    const cat = this.data.categories.find(c => c.id === id)
    if (!cat) return
    wx.showActionSheet({
      itemList: ['重命名', '删除'],
      success: res => {
        if (res.tapIndex === 0) this.rename(cat)
        else this.remove(cat)
      }
    })
  },

  rename(cat) {
    wx.showModal({
      title: '重命名分类',
      content: '请输入新的分类名称',
      editable: true,
      placeholderText: cat.name,
      success: res => {
        if (!res.confirm || !res.content || !res.content.trim()) return
        const name = res.content.trim()
        const cats = wx.getStorageSync(KEY) || []
        // 重名校验（排除自身），否则会产生同名重复分类，让按分类筛选结果错乱
        if (cats.some(c => c.name === name && c.id !== cat.id)) {
          return wx.showToast({ title: '该分类名已存在', icon: 'none' })
        }
        const target = cats.find(c => c.id === cat.id)
        if (!target) return
        const oldName = target.name
        target.name = name
        adminData.save(KEY, cats)
        // 同步图书数据里的分类名
        store.getBooks().forEach(b => {
          if (b.category === oldName) store.updateBook(b.id, { category: name })
        })
        this.load()
        wx.showToast({ title: '已保存', icon: 'success' })
      }
    })
  },

  remove(cat) {
    if (cat.count > 0) {
      return wx.showModal({
        title: '无法删除',
        content: `「${cat.name}」下还有 ${cat.count} 本图书，请先移动这些图书到其他分类。`,
        showCancel: false
      })
    }
    wx.showModal({
      title: '删除分类',
      content: `确定删除「${cat.name}」吗？`,
      confirmColor: '#E02020',
      success: res => {
        if (!res.confirm) return
        adminData.save(KEY, (wx.getStorageSync(KEY) || []).filter(c => c.id !== cat.id))
        this.load()
        wx.showToast({ title: '已删除', icon: 'success' })
      }
    })
  }
})
