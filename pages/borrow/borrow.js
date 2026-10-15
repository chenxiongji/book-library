// pages/borrow/borrow.js
const store = require('../../utils/store.js')
const util = require('../../utils/util.js')

Page({
  data: {
    activeTab: 'borrowing', // borrowing | returned | all
    tabs: [
      { key: 'borrowing', name: '借阅中' },
      { key: 'returned', name: '已归还' },
      { key: 'all', name: '全部' }
    ],
    borrowList: [],
    stats: {
      total: 0,
      active: 0,
      overdue: 0,
      returned: 0
    }
  },

  onLoad() {
    this.loadData()
  },

  onShow() {
    this.loadData()
  },

  loadData() {
    const user = store.getUser()
    let borrows = store.getBorrows({ userId: user.id })

    // 格式化数据
    const finePerDay = store.getFinePerDay()
    borrows = borrows.map(b => {
      const daysLeft = util.daysLeft(b.dueDate)
      const overdue = util.isOverdue(b.dueDate) && b.status === 'borrowed'
      const overdueN = overdue ? util.overdueDays(b.dueDate) : 0
      return {
        ...b,
        borrowDateFormatted: util.formatDate(b.borrowDate),
        dueDateFormatted: util.formatDate(b.dueDate),
        returnDateFormatted: b.returnDate ? util.formatDate(b.returnDate) : '',
        daysLeft,
        overdue,
        daysLeftText: b.status === 'returned' ? '已归还' : (overdue ? `已逾期${overdueN}天` : `还剩${daysLeft}天`),
        // 逾期罚金按书房设置计算（未设置罚金则不展示）
        fineText: (overdue && finePerDay > 0) ? `应缴罚金 ¥${(overdueN * finePerDay).toFixed(2)}` : ''
      }
    })

    // 统计
    const stats = {
      total: borrows.length,
      active: borrows.filter(b => b.status === 'borrowed').length,
      overdue: borrows.filter(b => b.overdue).length,
      returned: borrows.filter(b => b.status === 'returned').length
    }

    // 过滤
    let filtered = borrows
    if (this.data.activeTab === 'borrowing') {
      filtered = borrows.filter(b => b.status === 'borrowed')
    } else if (this.data.activeTab === 'returned') {
      filtered = borrows.filter(b => b.status === 'returned')
    }

    this.setData({ borrowList: filtered, stats })
  },

  onTabTap(e) {
    this.setData({ activeTab: e.currentTarget.dataset.key })
    this.loadData()
  },

  onReturn(e) {
    const id = e.currentTarget.dataset.id
    const bookTitle = e.currentTarget.dataset.title
    wx.showModal({
      title: '确认归还',
      content: `确定要归还《${bookTitle}》吗？`,
      success: (res) => {
        if (res.confirm) {
          store.returnBook(id)
          util.showToast('归还成功！', 'success')
          this.loadData()
        }
      }
    })
  },

  onBookTap(e) {
    const bookId = e.currentTarget.dataset.bookid
    wx.navigateTo({ url: `/pages/book-detail/book-detail?id=${bookId}` })
  }
})
