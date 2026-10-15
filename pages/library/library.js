// pages/library/library.js
const store = require('../../utils/store.js')
const util = require('../../utils/util.js')

Page({
  data: {
    searchKeyword: '',
    activeCategory: '全部',
    activeType: 'all', // all | physical | electronic
    viewMode: 'grid', // grid | list
    sortBy: 'newest', // newest | title | author
    categories: [{ name: '全部', icon: '📚' }].concat(util.getBookCategories()),
    typeTabs: [
      { key: 'all', name: '全部' },
      { key: 'physical', name: '纸质书' },
      { key: 'electronic', name: '电子书' }
    ],
    books: [],
    filteredBooks: [],
    showSortMenu: false,
    sortOptions: [
      { key: 'newest', name: '最新上架' },
      { key: 'title', name: '书名排序' },
      { key: 'author', name: '作者排序' }
    ]
  },

  onLoad() {
    this.loadBooks()
  },

  onShow() {
    // 分类由管理端维护，每次进入都重新读取，保证增删改分类即时生效
    this.setData({ categories: [{ name: '全部', icon: '📚' }].concat(util.getBookCategories()) })
    this.loadBooks()
    // 首次使用引导：告知长按可管理图书
    if (!wx.getStorageSync('lib_tip_book_manage') && this.data.filteredBooks.length > 0) {
      wx.setStorageSync('lib_tip_book_manage', true)
      setTimeout(() => util.showToast('长按图书可修改 / 置顶 / 删除', 'none'), 600)
    }
  },

  loadBooks() {
    let books = store.getBooks()

    // 搜索过滤
    if (this.data.searchKeyword) {
      const kw = this.data.searchKeyword.toLowerCase()
      books = books.filter(b =>
        b.title.toLowerCase().includes(kw) ||
        b.author.toLowerCase().includes(kw) ||
        (b.isbn && b.isbn.includes(kw))
      )
    }

    // 分类过滤
    if (this.data.activeCategory && this.data.activeCategory !== '全部') {
      books = books.filter(b => b.category === this.data.activeCategory)
    }

    // 类型过滤
    if (this.data.activeType !== 'all') {
      books = books.filter(b => b.type === this.data.activeType)
    }

    // 排序（置顶图书始终排在最前，再按所选方式排序）
    const topFlag = (b) => (b.top ? 0 : 1)
    switch (this.data.sortBy) {
      case 'newest':
        books.sort((a, b) => topFlag(a) - topFlag(b) || (new Date(b.topAt || b.createdAt) - new Date(a.topAt || a.createdAt)))
        break
      case 'title':
        books.sort((a, b) => topFlag(a) - topFlag(b) || a.title.localeCompare(b.title, 'zh'))
        break
      case 'author':
        books.sort((a, b) => topFlag(a) - topFlag(b) || a.author.localeCompare(b.author, 'zh'))
        break
    }

    this.setData({ filteredBooks: books })
  },

  onSearchInput(e) {
    this.setData({ searchKeyword: e.detail.value })
    this.loadBooks()
  },

  onSearchClear() {
    this.setData({ searchKeyword: '' })
    this.loadBooks()
  },

  onCategoryTap(e) {
    this.setData({ activeCategory: e.currentTarget.dataset.category })
    this.loadBooks()
  },

  onTypeTap(e) {
    this.setData({ activeType: e.currentTarget.dataset.key })
    this.loadBooks()
  },

  toggleViewMode() {
    this.setData({ viewMode: this.data.viewMode === 'grid' ? 'list' : 'grid' })
  },

  toggleSortMenu() {
    this.setData({ showSortMenu: !this.data.showSortMenu })
  },

  onSortSelect(e) {
    this.setData({
      sortBy: e.currentTarget.dataset.key,
      showSortMenu: false
    })
    this.loadBooks()
  },

  onBookTap(e) {
    const book = e.detail.book
    if (book) {
      wx.navigateTo({ url: `/pages/book-detail/book-detail?id=${book.id}` })
    }
  },

  // 长按图书：修改 / 置顶 / 删除（纸质书与电子书通用）
  onBookLongPress(e) {
    const book = e.detail.book
    if (!book) return
    wx.showActionSheet({
      itemList: ['✏️ 修改图书', book.top ? '📌 取消置顶' : '📌 置顶图书', '🗑 删除图书'],
      success: (res) => {
        if (res.tapIndex === 0) this.onEditBook(book)
        else if (res.tapIndex === 1) this.onToggleTop(book)
        else if (res.tapIndex === 2) this.onDeleteBook(book)
      }
    })
  },

  onEditBook(book) {
    wx.navigateTo({ url: `/pages/book-edit/book-edit?id=${book.id}` })
  },

  onToggleTop(book) {
    const result = store.toggleBookTop(book.id)
    if (!result) return
    util.showToast(result.top ? '已置顶' : '已取消置顶', 'success')
    this.loadBooks()
  },

  onDeleteBook(book) {
    // 借出中的纸质书不允许删除，需先归还
    if (book.type === 'physical' && book.status === 'borrowed') {
      wx.showModal({
        title: '无法删除',
        content: `《${book.title}》正在被借出，请归还后再删除`,
        showCancel: false
      })
      return
    }
    wx.showModal({
      title: '删除图书',
      content: `确定删除《${book.title}》吗？${book.type === 'electronic' ? '该电子书的阅读进度将一并失效。' : '该操作不可恢复。'}`,
      confirmColor: '#EF4444',
      success: (res) => {
        if (!res.confirm) return
        store.deleteBook(book.id)
        util.showToast('已删除', 'success')
        this.loadBooks()
      }
    })
  },

  onAddBook() {
    wx.navigateTo({ url: '/pages/scan/scan' })
  }
})
