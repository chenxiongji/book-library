// pages/scan/scan.js
const store = require('../../utils/store.js')
const util = require('../../utils/util.js')
const isbnApi = require('../../utils/isbn.js')

Page({
  data: {
    step: 'scan', // scan | form | success
    scanResult: null,
    bookForm: {
      title: '',
      author: '',
      isbn: '',
      category: '文学',
      publisher: '',
      publishDate: '',
      pages: '',
      description: '',
      location: '',
      cover: ''
    },
    dataSource: '', // 图书资料来源
    querying: false,
    categories: util.getBookCategories(),
    saving: false
  },

  onLoad() {
    // 自动触发扫码
    this.startScan()
  },

  startScan() {
    wx.scanCode({
      onlyFromCamera: false,
      scanType: ['barCode'],
      success: (res) => {
        const isbn = res.result
        this.setData({
          'bookForm.isbn': isbn,
          scanResult: isbn,
          step: 'form'
        })
        // 模拟根据ISBN查询图书信息
        this.fetchBookInfo(isbn)
      },
      fail: () => {
        // 扫码失败，允许手动输入
        this.setData({ step: 'form' })
        util.showToast('扫码取消，可手动输入信息')
      }
    })
  },

  // 通过公共图书数据源（Open Library → Google Books → 本地样本库）查询并自动填充
  fetchBookInfo(isbn) {
    if (!util.isValidISBN(isbn)) {
      util.showToast('ISBN格式不正确，请检查', 'none')
      return
    }

    this.setData({ querying: true })
    util.showLoading('正在查询公共图书数据源...')

    isbnApi.lookup(isbn).then((info) => {
      this.setData({ querying: false })
      util.hideLoading()

      if (info && info.domainBlocked) {
        // 请求被小程序「request 合法域名」校验拦截（真机预览/体验版常见），并非书未收录
        this.setData({
          'bookForm.description': '网络请求被小程序域名校验拦截：开发期可在手机上打开调试模式（右上角···→开发调试→打开调试）后重试；正式使用需在小程序管理后台配置 request 合法域名'
        })
        util.showToast('网络被域名校验拦截，非未收录', 'none')
        return
      }

      if (!info) {
        // 公共数据源与豆瓣均未收录（常见于新出版或盗版/自出版书籍），提示手动补全
        this.setData({
          'bookForm.description': '公共图书数据源与豆瓣均未查询到该书信息，请手动填写'
        })
        util.showToast('未查询到，请手动填写', 'none')
        return
      }

      const category = isbnApi.guessCategory(info, this.data.categories)
      this.setData({
        bookForm: {
          ...this.data.bookForm,
          title: info.title || '',
          author: info.author || '',
          category: category,
          publisher: info.publisher || '',
          publishDate: info.publishDate || '',
          pages: info.pages || '',
          description: info.description || '暂无简介，可手动补充',
          cover: info.cover || ''
        },
        dataSource: info.source
      })

      // 封面若来自 Open Library 且不存在会是 1x1 空图，无需特殊处理
      util.showToast('已自动填充（' + info.source + '）', 'success')
    })
  },

  onInput(e) {
    const field = e.currentTarget.dataset.field
    this.setData({ [`bookForm.${field}`]: e.detail.value })
  },

  onCategoryChange(e) {
    this.setData({ 'bookForm.category': this.data.categories[e.detail.value].name })
  },

  onReScan() {
    this.startScan()
  },

  onManualInput() {
    this.setData({ step: 'form' })
  },

  onSave() {
    const form = this.data.bookForm
    if (!form.title) {
      util.showToast('请输入书名')
      return
    }
    if (!form.author) {
      util.showToast('请输入作者')
      return
    }

    this.setData({ saving: true })

    const book = store.addBook({
      title: form.title,
      author: form.author,
      isbn: form.isbn,
      category: form.category,
      publisher: form.publisher,
      publishDate: form.publishDate,
      pages: parseInt(form.pages) || 0,
      description: form.description,
      location: form.location || '待分配',
      cover: form.cover || '',
      type: 'physical',
      status: 'available'
    })

    this.setData({ saving: false, step: 'success' })

    setTimeout(() => {
      wx.redirectTo({ url: `/pages/book-detail/book-detail?id=${book.id}` })
    }, 1500)
  },

  onSaveAndContinue() {
    const form = this.data.bookForm
    if (!form.title) {
      util.showToast('请输入书名')
      return
    }

    store.addBook({
      title: form.title,
      author: form.author,
      isbn: form.isbn,
      category: form.category,
      publisher: form.publisher,
      publishDate: form.publishDate,
      pages: parseInt(form.pages) || 0,
      description: form.description,
      location: form.location || '待分配',
      cover: form.cover || '',
      type: 'physical',
      status: 'available'
    })

    util.showToast('添加成功', 'success')
    // 重置表单，继续扫码
    this.setData({
      step: 'scan',
      bookForm: {
        title: '', author: '', isbn: '', category: '文学',
        publisher: '', publishDate: '', pages: '', description: '', location: '', cover: ''
      },
      scanResult: null,
      dataSource: '',
      querying: false
    })
    setTimeout(() => this.startScan(), 500)
  }
})
