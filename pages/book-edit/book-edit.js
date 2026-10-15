// pages/book-edit/book-edit.js - 修改图书（纸质书与电子书通用）
const store = require('../../utils/store.js')
const util = require('../../utils/util.js')

Page({
  data: {
    bookId: '',
    bookType: 'physical',
    bookForm: {
      title: '', author: '', isbn: '', category: '文学',
      publisher: '', publishDate: '', pages: '', description: '',
      location: '', cover: '', price: '', indexNo: ''
    },
    categories: util.getBookCategories(),
    fileInfo: '',        // 电子书文件信息（格式/大小，只读展示）
    saving: false
  },

  onLoad(options) {
    const book = store.getBookById(options.id)
    if (!book) {
      util.showToast('图书不存在')
      setTimeout(() => wx.navigateBack(), 1000)
      return
    }
    wx.setNavigationBarTitle({ title: '修改图书' })
    this.setData({
      bookId: book.id,
      bookType: book.type || 'physical',
      fileInfo: book.fileFormat ? `${String(book.fileFormat).toUpperCase()} · ${book.fileSize || '未知大小'}` : '',
      bookForm: {
        title: book.title || '',
        author: book.author || '',
        isbn: book.isbn || '',
        category: book.category || '文学',
        publisher: book.publisher || '',
        publishDate: book.publishDate || '',
        pages: book.pages ? String(book.pages) : '',
        description: book.description || '',
        location: book.location || '',
        cover: book.cover || '',
        price: book.price !== undefined && book.price !== null && book.price !== '' ? String(book.price) : '',
        indexNo: book.indexNo || ''
      }
    })
  },

  onInput(e) {
    const field = e.currentTarget.dataset.field
    this.setData({ [`bookForm.${field}`]: e.detail.value })
  },

  onCategoryChange(e) {
    this.setData({ 'bookForm.category': this.data.categories[e.detail.value].name })
  },

  onChooseCover() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      success: (res) => {
        this.setData({ 'bookForm.cover': res.tempFiles[0].tempFilePath })
      }
    })
  },

  onSave() {
    const form = this.data.bookForm
    if (!form.title.trim()) { util.showToast('请输入书名'); return }
    if (!form.author.trim()) { util.showToast('请输入作者'); return }

    this.setData({ saving: true })
    store.updateBook(this.data.bookId, {
      title: form.title.trim(),
      author: form.author.trim(),
      category: form.category,
      publisher: form.publisher.trim(),
      publishDate: form.publishDate.trim(),
      pages: parseInt(form.pages) || 0,
      description: form.description.trim(),
      location: this.data.bookType === 'physical' ? form.location.trim() : '',
      cover: form.cover,
      price: form.price === '' ? '' : (parseFloat(form.price) || 0),
      indexNo: form.indexNo.trim()
    })
    this.setData({ saving: false })
    util.showToast('保存成功', 'success')
    setTimeout(() => wx.navigateBack(), 800)
  }
})
