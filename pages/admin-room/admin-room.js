// pages/admin-room/admin-room.js - 书房管理
const adminData = require('../../utils/admin-data.js')

const KEY = 'lib_rooms'

Page({
  data: {
    rooms: [],
    editor: null // { id, name, address, openTime, seats, isNew }
  },

  onShow() {
    this.load()
  },

  load() {
    const seed = [{
      id: 'r1',
      name: '阳光读书·总馆',
      address: '幸福路 88 号文化中心 2 层',
      openTime: '09:00 - 21:00',
      seats: 60,
      status: 'open'
    }]
    const rooms = adminData.getList(KEY, seed)
    this.setData({ rooms })
  },

  onAdd() {
    this.setData({ editor: { id: null, name: '', address: '', openTime: '09:00 - 21:00', seats: '', isNew: true } })
  },

  onEdit(e) {
    const id = e.currentTarget.dataset.id
    const r = this.data.rooms.find(x => x.id === id)
    if (!r) return
    this.setData({ editor: { id: r.id, name: r.name, address: r.address, openTime: r.openTime, seats: String(r.seats), isNew: false } })
  },

  bindField(e) {
    const field = e.currentTarget.dataset.field
    this.setData({ ['editor.' + field]: e.detail.value })
  },

  onSave() {
    const ed = this.data.editor
    if (!ed.name.trim()) return wx.showToast({ title: '请输入书房名称', icon: 'none' })
    const rooms = wx.getStorageSync(KEY) || []
    const seats = parseInt(ed.seats, 10)
    const record = {
      name: ed.name.trim(),
      address: ed.address.trim(),
      openTime: ed.openTime.trim() || '09:00 - 21:00',
      seats: isNaN(seats) || seats < 0 ? 0 : seats
    }
    if (ed.isNew) {
      rooms.push({ id: 'r' + Date.now(), ...record, status: 'open' })
    } else {
      const target = rooms.find(r => r.id === ed.id)
      if (target) Object.assign(target, record)
    }
    adminData.save(KEY, rooms)
    this.setData({ editor: null })
    this.load()
    wx.showToast({ title: '已保存', icon: 'success' })
  },

  onCancel() {
    this.setData({ editor: null })
  },

  onItemTap(e) {
    const id = e.currentTarget.dataset.id
    const room = this.data.rooms.find(x => x.id === id)
    if (!room) return
    wx.showActionSheet({
      itemList: [room.status === 'open' ? '临时闭馆' : '恢复开放', '编辑', '删除'],
      success: res => {
        if (res.tapIndex === 0) this.toggleStatus(room)
        else if (res.tapIndex === 1) this.onEdit(e)
        else this.remove(room)
      }
    })
  },

  toggleStatus(room) {
    const rooms = wx.getStorageSync(KEY) || []
    const target = rooms.find(r => r.id === room.id)
    if (target) target.status = target.status === 'open' ? 'closed' : 'open'
    adminData.save(KEY, rooms)
    this.load()
    wx.showToast({ title: target.status === 'open' ? '已恢复开放' : '已临时闭馆', icon: 'none' })
  },

  remove(room) {
    wx.showModal({
      title: '删除书房',
      content: `确定删除「${room.name}」吗？`,
      confirmColor: '#E02020',
      success: res => {
        if (!res.confirm) return
        adminData.save(KEY, (wx.getStorageSync(KEY) || []).filter(r => r.id !== room.id))
        this.load()
        wx.showToast({ title: '已删除', icon: 'success' })
      }
    })
  }
})
