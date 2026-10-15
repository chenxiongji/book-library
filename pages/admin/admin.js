// pages/admin/admin.js
const store = require('../../utils/store.js')
const util = require('../../utils/util.js')

Page({
  data: {
    groups: [
      {
        title: '图书管理',
        items: [
          { id: 'add', name: '录入图书', icon: '➕' },
          { id: 'circulation', name: '借还图书', icon: '🔍' },
          { id: 'operate', name: '操作图书', icon: '🔧' },
          { id: 'allbooks', name: '全部图书', icon: '📚' },
          { id: 'category', name: '图书分类', icon: '🍀' },
          { id: 'tags', name: '图书标签', icon: '🏷️' }
        ]
      },
      {
        title: '记录与权限',
        items: [
          { id: 'users', name: '用户管理', icon: '👥' },
          { id: 'reserve', name: '预借记录', icon: '📋', dotKey: 'reserve' },
          { id: 'borrowRecords', name: '借阅记录', icon: '📄', dotKey: 'borrow' },
          { id: 'readRecords', name: '阅读记录', icon: '📖' },
          { id: 'permission', name: '借阅权限', icon: '💳' },
          { id: 'fields', name: '登记字段', icon: '✏️' }
        ]
      },
      {
        title: '书房运营',
        items: [
          { id: 'roomMgr', name: '书房管理', icon: '📚' },
          { id: 'roomSetting', name: '书房设置', icon: '🎚️' },
          { id: 'notice', name: '公告', icon: '📢' },
          { id: 'contact', name: '联系方式', icon: '📞' },
          { id: 'official', name: '关联公众号', icon: '💬' }
        ]
      },
      {
        title: '系统',
        items: [
          { id: 'admin', name: '管理员', icon: '👤' },
          { id: 'export', name: '导出数据', icon: '⬇️' },
          { id: 'import', name: '导入数据', icon: '⬆️' },
          { id: 'stats', name: '数据统计', icon: '📊' }
        ]
      }
    ],
    dots: {}
  },

  onShow() {
    this.loadDots()
  },

  // 红点：借阅中有在借记录、预借有等待确认记录时显示
  loadDots() {
    const borrows = wx.getStorageSync('lib_borrows') || []
    const dots = {
      borrow: borrows.some(b => b.status === 'borrowed'),
      reserve: borrows.some(b => b.status === 'pending')
    }
    this.setData({ dots })
  },

  onItemTap(e) {
    const id = e.currentTarget.dataset.id
    const routes = {
      add: { url: '/pages/scan/scan' },
      circulation: { url: '/pages/borrow/borrow' },
      operate: { url: '/pages/add-book/add-book' },
      allbooks: { url: '/pages/library/library', type: 'tab' },
      readRecords: { url: '/pages/bookshelf/bookshelf?tab=history' },
      borrowRecords: { url: '/pages/borrow/borrow' },
      permission: { url: '/pages/vip/vip' },
      users: { url: '/pages/admin-users/admin-users' },
      category: { url: '/pages/admin-categories/admin-categories' },
      tags: { url: '/pages/admin-tags/admin-tags' },
      fields: { url: '/pages/admin-fields/admin-fields' },
      roomMgr: { url: '/pages/admin-room/admin-room' },
      roomSetting: { url: '/pages/admin-settings/admin-settings' },
      notice: { url: '/pages/admin-notices/admin-notices' },
      contact: { url: '/pages/admin-contact/admin-contact' },
      official: { url: '/pages/admin-official/admin-official' },
      admin: { url: '/pages/admin-admins/admin-admins' }
    }

    const r = routes[id]
    if (r) {
      if (r.type === 'tab') {
        wx.switchTab({ url: r.url })
      } else {
        wx.navigateTo({ url: r.url })
      }
      return
    }

    if (id === 'export') return this.onExport()
    if (id === 'import') return this.onImport()
    if (id === 'stats') return this.onStats()

    util.showToast('功能开发中')
  },

  // 导出：把本地全部 lib_ 开头的存储打包 JSON 复制到剪贴板
  onExport() {
    const info = wx.getStorageInfoSync()
    const bundle = {}
    info.keys.filter(k => k.indexOf('lib_') === 0).forEach(k => {
      bundle[k] = wx.getStorageSync(k)
    })
    const json = JSON.stringify(bundle)
    wx.setClipboardData({
      data: json,
      success: () => {
        wx.showModal({
          title: '导出成功',
          content: `共导出 ${Object.keys(bundle).length} 个数据项（${Math.round(json.length / 1024)}KB），JSON 已复制到剪贴板，请粘贴保存。`,
          showCancel: false
        })
      }
    })
  },

  // 导入：粘贴此前导出的 JSON 恢复数据
  onImport() {
    wx.showModal({
      title: '导入数据',
      content: '请粘贴导出的数据 JSON（将覆盖当前全部数据）',
      editable: true,
      placeholderText: '粘贴 JSON...',
      success: res => {
        if (!res.confirm || !res.content) return
        try {
          const bundle = JSON.parse(res.content)
          const keys = Object.keys(bundle)
          if (!keys.length || keys.some(k => k.indexOf('lib_') !== 0)) {
            throw new Error('格式不正确')
          }
          keys.forEach(k => wx.setStorageSync(k, bundle[k]))
          wx.showModal({
            title: '导入成功',
            content: `已恢复 ${keys.length} 个数据项。`,
            showCancel: false,
            success: () => this.loadDots()
          })
        } catch (err) {
          util.showToast('JSON 格式不正确', 'error')
        }
      }
    })
  },

  // 数据统计弹窗
  onStats() {
    const s = store.getStats()
    wx.showModal({
      title: '数据统计',
      content:
        `图书总数：${s.totalBooks}（纸质 ${s.physicalCount} / 电子 ${s.electronicCount}）\n` +
        `可借图书：${s.availableCount}\n` +
        `借出中：${s.borrowedCount}\n` +
        `在借记录：${s.activeBorrows.length}（逾期 ${s.overdueBorrows.length}）\n` +
        `阅读笔记：${s.notesCount !== undefined ? s.notesCount : (wx.getStorageSync('lib_notes') || []).length}`,
      showCancel: false,
      confirmText: '知道了'
    })
  },

  onContact() {
    util.showToast('客服功能开发中')
  },

  onShareAppMessage() {
    return {
      title: '阳光读书 - 管理界面',
      path: '/pages/profile/profile'
    }
  }
})
