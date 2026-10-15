// pages/book-detail/book-detail.js
const store = require('../../utils/store.js')
const util = require('../../utils/util.js')

Page({
  data: {
    book: null,
    notes: [],
    borrowRecord: null,
    readingProgress: null,
    relatedBooks: [],
    favorited: false
  },

  onLoad(options) {
    const bookId = options.id
    this.loadBook(bookId)
  },

  onShow() {
    if (this.data.book) {
      this.loadBook(this.data.book.id)
    }
  },

  loadBook(bookId) {
    const book = store.getBookById(bookId)
    if (!book) {
      util.showToast('图书不存在')
      setTimeout(() => wx.navigateBack(), 1000)
      return
    }

    const notes = store.getNotes({ bookId })
    const borrows = store.getBorrows({ userId: store.getUser().id })
    let borrowRecord = borrows.find(b => b.bookId === bookId && b.status === 'borrowed')
    if (borrowRecord) {
      const overdue = util.isOverdue(borrowRecord.dueDate)
      const daysLeft = util.daysLeft(borrowRecord.dueDate)
      borrowRecord = {
        ...borrowRecord,
        borrowDateFormatted: util.formatDate(borrowRecord.borrowDate),
        dueDateFormatted: util.formatDate(borrowRecord.dueDate),
        overdue,
        daysLeftText: overdue ? `已逾期${util.overdueDays(borrowRecord.dueDate)}天` : `还剩${daysLeft}天`
      }
    }
    const readingProgress = store.getReadingProgress(bookId)

    // 相关图书（同分类）
    const related = store.getBooks({ category: book.category }).filter(b => b.id !== bookId).slice(0, 4)

    const favorited = store.isFavorited('book', bookId)

    this.setData({ book, notes, borrowRecord, readingProgress, relatedBooks: related, favorited })
    wx.setNavigationBarTitle({ title: book.title })
  },

  // 收藏/取消收藏
  onToggleFavorite() {
    const book = this.data.book
    const res = store.toggleFavorite('book', book)
    this.setData({ favorited: res.favorited })
    util.showToast(res.favorited ? '已加入收藏' : '已取消收藏', 'success')
  },

  // 借阅纸质书
  onEditBook() {
    wx.navigateTo({ url: `/pages/book-edit/book-edit?id=${this.data.book.id}` })
  },

  onBorrow() {
    const book = this.data.book
    if (book.type !== 'physical') {
      util.showToast('电子书无需借阅，可直接阅读')
      return
    }
    if (book.status === 'borrowed') {
      util.showToast('该书已被借出')
      return
    }

    const user = store.getUser()
    const activeBorrows = store.getBorrows({ userId: user.id, status: 'borrowed' })
    const limit = store.getEffectiveBorrowLimit(user.vipLevel)

    if (activeBorrows.length >= limit) {
      wx.showModal({
        title: '借阅上限',
        content: `您当前等级借阅上限为${limit}本，请先归还部分图书或升级VIP等级`,
        confirmText: '升级VIP',
        success: (res) => {
          if (res.confirm) wx.navigateTo({ url: '/pages/vip/vip' })
        }
      })
      return
    }

    wx.showModal({
      title: '确认借阅',
      content: `《${book.title}》\n借阅周期：${store.getEffectiveBorrowDays(user.vipLevel)}天`,
      success: (res) => {
        if (res.confirm) {
          const borrow = store.borrowBook(book.id)
          if (borrow) {
            util.showToast('借阅成功！', 'success')
            this.loadBook(book.id)
          } else {
            util.showToast('借阅失败')
          }
        }
      }
    })
  },

  // 开始阅读电子书
  onRead() {
    const book = this.data.book
    if (book.type === 'electronic') {
      wx.navigateTo({ url: `/pages/reader/reader?id=${book.id}` })
    } else {
      // 纸质书也可以查看试读内容
      wx.navigateTo({ url: `/pages/reader/reader?id=${book.id}` })
    }
  },

  // 继续阅读
  onContinueRead() {
    wx.navigateTo({ url: `/pages/reader/reader?id=${this.data.book.id}` })
  },

  // 归还
  onReturn() {
    if (!this.data.borrowRecord) return
    wx.showModal({
      title: '确认归还',
      content: `确定要归还《${this.data.book.title}》吗？`,
      success: (res) => {
        if (res.confirm) {
          store.returnBook(this.data.borrowRecord.id)
          util.showToast('归还成功！', 'success')
          this.loadBook(this.data.book.id)
        }
      }
    })
  },

  // 写笔记
  onWriteNote() {
    wx.navigateTo({
      url: `/pages/note-edit/note-edit?bookId=${this.data.book.id}`
    })
  },

  // 查看笔记
  onNoteTap(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/note-detail/note-detail?id=${id}` })
  },

  // 相关图书
  onBookTap(e) {
    const book = e.detail.book
    wx.navigateTo({ url: `/pages/book-detail/book-detail?id=${book.id}` })
  },

  // 分享
  onShareAppMessage() {
    return {
      title: `推荐《${this.data.book.title}》 - ${this.data.book.author}`,
      path: `/pages/book-detail/book-detail?id=${this.data.book.id}`
    }
  }
})
