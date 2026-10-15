// pages/upload/upload.js
const store = require('../../utils/store.js')
const util = require('../../utils/util.js')

Page({
  data: {
    step: 'select', // select | form | uploading | success
    fileInfo: null,
    uploadProgress: 0,
    bookForm: {
      title: '',
      author: '',
      category: '技术',
      description: '',
      cover: ''
    },
    categories: util.getBookCategories(),
    supportedFormats: ['TXT', 'PDF', 'EPUB', 'MOBI', 'AZW3', 'DOC', 'DOCX'],
    saving: false
  },

  // 选择电子书文件
  onChooseFile() {
    wx.chooseMessageFile({
      count: 1,
      type: 'file',
      extension: ['txt', 'pdf', 'epub', 'mobi', 'azw', 'azw3', 'doc', 'docx'],
      success: (res) => {
        const file = res.tempFiles[0]
        const format = util.getFileFormat(file.name)
        const fileSize = util.formatFileSize(file.size)

        // 从文件名提取书名
        const titleFromName = file.name.replace(/\.[^.]+$/, '')

        this.setData({
          step: 'form',
          fileInfo: {
            name: file.name,
            path: file.path,
            size: fileSize,
            sizeBytes: file.size,
            format: format,
            formatIcon: util.getFormatIcon(format)
          },
          'bookForm.title': titleFromName
        })

        // 模拟上传过程
        this.simulateUpload()
      },
      fail: () => {
        util.showToast('取消选择文件')
      }
    })
  },

  // 模拟上传进度
  simulateUpload() {
    this.setData({ step: 'uploading', uploadProgress: 0 })
    const timer = setInterval(() => {
      let progress = this.data.uploadProgress + Math.random() * 20
      if (progress >= 100) {
        progress = 100
        clearInterval(timer)
        setTimeout(() => {
          this.setData({ step: 'form' })
          util.showToast('文件上传完成', 'success')
        }, 300)
      }
      this.setData({ uploadProgress: Math.floor(progress) })
    }, 200)
  },

  onInput(e) {
    const field = e.currentTarget.dataset.field
    this.setData({ [`bookForm.${field}`]: e.detail.value })
  },

  onCategoryChange(e) {
    this.setData({ 'bookForm.category': this.data.categories[e.detail.value].name })
  },

  // 选择封面图片
  onChooseCover() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath
        this.setData({ 'bookForm.cover': tempFilePath })
      }
    })
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
    if (!this.data.fileInfo) {
      util.showToast('请先选择电子书文件')
      return
    }

    this.setData({ saving: true })

    const book = store.addBook({
      title: form.title,
      author: form.author,
      category: form.category,
      description: form.description,
      cover: form.cover || '',
      type: 'electronic',
      status: 'available',
      fileFormat: this.data.fileInfo.format,
      fileSize: this.data.fileInfo.size,
      filePath: this.data.fileInfo.path,
      publisher: '',
      pages: 0
    })

    // TXT 文件：读取全文并持久化，供阅读器离线阅读
    // 注意：util.getFileFormat() 返回小写格式（如 'txt'），此处必须用小写比较
    if (String(this.data.fileInfo.format).toLowerCase() === 'txt' && this.data.fileInfo.path) {
      const ebook = require('../../utils/ebook.js')
      ebook.readTxtFile(this.data.fileInfo.path, (err, text) => {
        if (!err && text) {
          ebook.saveStoredContent(book.id, text)
        }
      })
    }

    this.setData({ saving: false, step: 'success' })

    setTimeout(() => {
      wx.redirectTo({ url: `/pages/book-detail/book-detail?id=${book.id}` })
    }, 1500)
  },

  onReUpload() {
    this.setData({
      step: 'select',
      fileInfo: null,
      uploadProgress: 0,
      bookForm: { title: '', author: '', category: '技术', description: '', cover: '' }
    })
  }
})
