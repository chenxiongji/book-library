// pages/admin-fields/admin-fields.js - 登记字段（录入图书的自定义字段）
const adminData = require('../../utils/admin-data.js')

const KEY = 'lib_fields'
const TYPES = ['文本', '数字', '单选', '开关']

Page({
  data: {
    fields: [],
    types: TYPES,
    editor: null, // { id, name, typeIndex, required, isNew }
    typeNames: TYPES
  },

  onShow() {
    this.load()
  },

  load() {
    const seed = [
      { id: 'f1', name: '译者', type: '文本', required: false },
      { id: 'f2', name: '定价', type: '数字', required: true }
    ]
    const fields = adminData.getList(KEY, seed)
    this.setData({ fields })
  },

  onAdd() {
    this.setData({ editor: { id: null, name: '', typeIndex: 0, required: false, isNew: true } })
  },

  onEdit(e) {
    const id = e.currentTarget.dataset.id
    const f = this.data.fields.find(x => x.id === id)
    if (!f) return
    this.setData({
      editor: { id: f.id, name: f.name, typeIndex: TYPES.indexOf(f.type), required: !!f.required, isNew: false }
    })
  },

  onEditorName(e) {
    this.setData({ 'editor.name': e.detail.value })
  },

  onEditorType(e) {
    this.setData({ 'editor.typeIndex': Number(e.detail.value) })
  },

  onEditorRequired(e) {
    this.setData({ 'editor.required': e.detail.value })
  },

  onSave() {
    const ed = this.data.editor
    if (!ed || !ed.name.trim()) return wx.showToast({ title: '请输入字段名称', icon: 'none' })
    const name = ed.name.trim()
    const fields = wx.getStorageSync(KEY) || []
    if (fields.some(f => f.name === name && f.id !== ed.id)) {
      return wx.showToast({ title: '字段名称已存在', icon: 'none' })
    }
    if (ed.isNew) {
      fields.push({ id: 'f' + Date.now(), name, type: TYPES[ed.typeIndex], required: ed.required })
    } else {
      const target = fields.find(f => f.id === ed.id)
      if (target) Object.assign(target, { name, type: TYPES[ed.typeIndex], required: ed.required })
    }
    adminData.save(KEY, fields)
    this.setData({ editor: null })
    this.load()
    wx.showToast({ title: '已保存', icon: 'success' })
  },

  onCancel() {
    this.setData({ editor: null })
  },

  onDelete(e) {
    const id = e.currentTarget.dataset.id
    const f = this.data.fields.find(x => x.id === id)
    if (!f) return
    wx.showModal({
      title: '删除字段',
      content: `确定删除登记字段「${f.name}」吗？`,
      confirmColor: '#E02020',
      success: res => {
        if (!res.confirm) return
        adminData.save(KEY, (wx.getStorageSync(KEY) || []).filter(x => x.id !== id))
        this.load()
        wx.showToast({ title: '已删除', icon: 'success' })
      }
    })
  }
})
