// components/book-card/book-card.js
Component({
  properties: {
    book: {
      type: Object,
      value: {}
    },
    mode: {
      type: String,
      value: 'grid' // grid | list
    },
    showStatus: {
      type: Boolean,
      value: true
    }
  },

  methods: {
    // 只派发自定义事件，由父页面决定跳转
    // 注意：事件名不能叫 tap/longpress —— 那会与原生事件冒泡同名，导致父页面
    // 一次点击收到两次回调（自定义 + 原生冒泡），出现重复 navigateTo
    onTap() {
      const book = this.data.book
      if (!book || !book.id) return
      this.triggerEvent('booktap', { book })
    },
    onLongPress() {
      const book = this.data.book
      if (!book || !book.id) return
      this.triggerEvent('booklongpress', { book })
    }
  }
})
