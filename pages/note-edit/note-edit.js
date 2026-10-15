// pages/note-edit/note-edit.js
const store = require('../../utils/store.js')
const util = require('../../utils/util.js')

Page({
  data: {
    bookId: '',
    selectedBook: null,
    noteTitle: '',
    noteContent: '',
    noteChapter: '',
    books: [],
    showBookPicker: false,
    saving: false,
    contentLength: 0
  },

  onLoad(options) {
    const allBooks = store.getBooks()
    this.setData({ books: allBooks })

    if (options.bookId) {
      const book = store.getBookById(options.bookId)
      if (book) {
        this.setData({
          bookId: book.id,
          selectedBook: book
        })
      }
    }
  },

  onTitleInput(e) {
    this.setData({ noteTitle: e.detail.value })
  },

  onContentInput(e) {
    this.setData({
      noteContent: e.detail.value,
      contentLength: e.detail.value.length
    })
  },

  onChapterInput(e) {
    this.setData({ noteChapter: e.detail.value })
  },

  onShowBookPicker() {
    this.setData({ showBookPicker: true })
  },

  onHideBookPicker() {
    this.setData({ showBookPicker: false })
  },

  onSelectBook(e) {
    const book = e.currentTarget.dataset.book
    this.setData({
      selectedBook: book,
      bookId: book.id,
      showBookPicker: false
    })
  },

  onSave() {
    // 防重复提交：saving 期间直接忽略后续点击
    if (this.data.saving) return
    if (!this.data.selectedBook) {
      util.showToast('请选择关联图书')
      return
    }
    if (!this.data.noteTitle.trim()) {
      util.showToast('请输入笔记标题')
      return
    }
    if (!this.data.noteContent.trim()) {
      util.showToast('请输入笔记内容')
      return
    }

    this.setData({ saving: true })

    store.addNote({
      bookId: this.data.selectedBook.id,
      bookTitle: this.data.selectedBook.title,
      bookCover: this.data.selectedBook.cover,
      title: this.data.noteTitle,
      content: this.data.noteContent,
      chapter: this.data.noteChapter
    })

    util.showToast('笔记发布成功！', 'success')

    // saving 保持 true 直到返回，避免 1.5s 内重复点击写入多条笔记
    setTimeout(() => {
      wx.navigateBack()
    }, 1500)
  },

  onCancel() {
    if (this.data.noteTitle || this.data.noteContent) {
      wx.showModal({
        title: '提示',
        content: '确定要放弃编辑吗？',
        success: (res) => {
          if (res.confirm) wx.navigateBack()
        }
      })
    } else {
      wx.navigateBack()
    }
  }
})
