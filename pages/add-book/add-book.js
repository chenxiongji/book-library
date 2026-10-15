// pages/add-book/add-book.js - 录入图书（纸质书 / 电子书）
const store = require('../../utils/store.js')
const util = require('../../utils/util.js')
const adminData = require('../../utils/admin-data.js')
const isbnApi = require('../../utils/isbn.js')

const TAGS_KEY = 'lib_tags'
const ROOMS_KEY = 'lib_rooms'
const FIELDS_KEY = 'lib_fields'
const MAX_EBOOK_SIZE = 100 * 1024 * 1024 // 电子书附件上限：100M
const EBOOK_EXTS = ['epub', 'pdf', 'mobi', 'azw3']
const TYPE_OPTIONS = ['纸质书', '电子书']

Page({
  data: {
    // 基本信息
    rooms: [],
    roomIndex: 0,
    categories: [],
    categoryIndex: 0,
    tags: [],
    selectedTags: [],
    showTagPanel: false,
    // 藏书信息
    typeOptions: TYPE_OPTIONS,
    typeIndex: 0, // 0=纸质书 1=电子书
    ebook: null, // { name, sizeText, size, path, format }
    // 出版信息
    form: {
      isbn: '', title: '', author: '', cover: '',
      code: '', location: '', remark: '',
      publisher: '', publishDate: '', pages: '', price: '', description: ''
    },
    // 管理端「登记字段」定义的自定义字段（会渲染成动态表单）
    customFields: [],
    // 折叠状态
    stockOpen: true,
    publishOpen: false,
    // 行为
    autoScan: false,
    lookingUp: false,
    saving: false
  },

  onLoad(query) {
    const rooms = adminData.getList(ROOMS_KEY, [
      { id: 'r1', name: '阳光读书·总馆' }
    ])
    const tags = adminData.getList(TAGS_KEY, [
      { id: 't1', name: '热门', color: '#EF4444' },
      { id: 't2', name: '新书', color: '#22C55E' },
      { id: 't3', name: '推荐', color: '#4A6CF7' }
    ])
    const categories = util.getBookCategories()
    // 读取管理端定义的登记字段，渲染为动态表单项（value 用于收集输入）
    const customFields = adminData.getList(FIELDS_KEY, []).map(f => ({
      ...f,
      value: f.type === '开关' ? false : ''
    }))
    this.setData({ rooms, tags, categories, customFields })

    // 支持从扫码页带 ISBN 跳入，自动回填
    if (query && query.isbn) {
      this.setData({ 'form.isbn': query.isbn })
      this.lookupByIsbn(query.isbn)
    }
  },

  // ========== 输入 ==========
  onInput(e) {
    this.setData({ [`form.${e.currentTarget.dataset.field}`]: e.detail.value })
  },

  onRoomChange(e) {
    this.setData({ roomIndex: Number(e.detail.value) })
  },

  onCategoryChange(e) {
    this.setData({ categoryIndex: Number(e.detail.value) })
  },

  // 藏书类型：纸质书 / 电子书
  onTypeChange(e) {
    this.setData({ typeIndex: Number(e.detail.value) })
  },

  // 折叠出版信息 / 藏书信息
  toggleStock() { this.setData({ stockOpen: !this.data.stockOpen }) },
  togglePublish() { this.setData({ publishOpen: !this.data.publishOpen }) },

  // ========== ISBN：扫码 + 自动获取 ==========
  onScanIsbn() {
    wx.scanCode({
      success: (res) => {
        const isbn = (res.result || '').trim()
        if (!isbn) return
        this.setData({ 'form.isbn': isbn })
        this.lookupByIsbn(isbn)
      },
      fail: () => {}
    })
  },

  onIsbnBlur(e) {
    const isbn = (e.detail.value || '').trim()
    if (isbn.length >= 10) this.lookupByIsbn(isbn)
  },

  // 根据ISBN自动获取图书信息（公共源 → 豆瓣）
  lookupByIsbn(isbn) {
    if (this.data.lookingUp || !isbn) return
    this.setData({ lookingUp: true })
    isbnApi.lookup(isbn).then((info) => {
      this.setData({ lookingUp: false })
      // 域名校验拦截：与「未收录」区分开，避免误报「已自动填充」
      if (info && info.domainBlocked) {
        util.showToast('网络请求被域名校验拦截，请手动填写')
        this.setData({ 'form.isbn': isbn })
        return
      }
      if (!info) {
        util.showToast('未查询到该书信息，请手动填写')
        return
      }
      const patch = { 'form.isbn': isbn }
      if (info.title) patch['form.title'] = info.title
      if (info.author) patch['form.author'] = info.author
      if (info.publisher) patch['form.publisher'] = info.publisher
      if (info.publishDate) patch['form.publishDate'] = info.publishDate
      if (info.pages) patch['form.pages'] = String(info.pages)
      if (info.description) patch['form.description'] = info.description
      if (info.cover) patch['form.cover'] = info.cover
      // 自动推测分类：lookup 结果本身不含 category，需要调用 guessCategory 现算
      if (isbnApi.guessCategory) {
        const cat = isbnApi.guessCategory(info, this.data.categories)
        const idx = this.data.categories.findIndex(c => c.name === cat)
        if (idx >= 0) patch.categoryIndex = idx
      }
      this.setData(patch)
      util.showToast('已自动填充图书信息', 'success')
    })
  },

  // 编号扫码（纸质书）
  onScanCode() {
    wx.scanCode({
      success: (res) => {
        const code = (res.result || '').trim()
        if (code) this.setData({ 'form.code': code })
      },
      fail: () => {}
    })
  },

  // ========== 封面 ==========
  onChooseCover() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      success: (res) => {
        this.setData({ 'form.cover': res.tempFiles[0].tempFilePath })
      }
    })
  },

  // ========== 标签多选 ==========
  toggleTagPanel() { this.setData({ showTagPanel: !this.data.showTagPanel }) },
  onStopPropagation() {},

  onTagToggle(e) {
    const name = e.currentTarget.dataset.name
    const list = this.data.selectedTags.slice()
    const idx = list.indexOf(name)
    if (idx >= 0) list.splice(idx, 1)
    else list.push(name)
    this.setData({ selectedTags: list })
  },

  confirmTags() { this.setData({ showTagPanel: false }) },

  // ========== 电子书上传（≤100M）==========
  onChooseFile() {
    wx.chooseMessageFile({
      count: 1,
      type: 'file',
      extension: EBOOK_EXTS,
      success: (res) => {
        const f = res.tempFiles && res.tempFiles[0]
        if (!f) return
        const name = f.name || ''
        const ext = (name.split('.').pop() || '').toLowerCase()
        if (EBOOK_EXTS.indexOf(ext) === -1) {
          util.showToast(`仅支持 ${EBOOK_EXTS.join(' / ')} 格式`)
          return
        }
        if (f.size > MAX_EBOOK_SIZE) {
          util.showToast('文件大小不能超过 100M')
          return
        }
        this.setData({
          ebook: {
            name,
            size: f.size,
            sizeText: util.formatFileSize(f.size),
            path: f.path,
            format: ext
          }
        })
      },
      fail: () => {}
    })
  },

  onRemoveFile() { this.setData({ ebook: null }) },

  // ========== 自定义字段（管理端「登记字段」）==========
  onCustomInput(e) {
    const idx = Number(e.currentTarget.dataset.index)
    this.setData({ [`customFields[${idx}].value`]: e.detail.value })
  },

  onCustomSwitch(e) {
    const idx = Number(e.currentTarget.dataset.index)
    this.setData({ [`customFields[${idx}].value`]: e.detail.value })
  },

  // ========== 录入后自动扫码 ==========
  onAutoScanChange(e) { this.setData({ autoScan: e.detail.value }) },

  // ========== 保存 ==========
  onSave() {
    if (this.data.saving) return
    const form = this.data.form
    const isPhysical = this.data.typeIndex === 0

    if (!form.title.trim()) { util.showToast('请输入书名'); return }
    if (!form.author.trim()) { util.showToast('请输入作者'); return }
    if (!isPhysical && !this.data.ebook) { util.showToast('请上传电子书文件'); return }

    // 校验管理端设为必填的自定义字段
    const custom = {}
    for (const f of this.data.customFields) {
      const v = f.value
      const empty = f.type === '开关' ? false : !String(v == null ? '' : v).trim()
      if (f.required && empty) {
        util.showToast(`请填写「${f.name}」`)
        return
      }
      if (!empty) custom[f.name] = v
    }

    this.setData({ saving: true })
    const book = store.addBook({
      isbn: form.isbn.trim(),
      title: form.title.trim(),
      author: form.author.trim(),
      category: this.data.categories[this.data.categoryIndex].name,
      cover: form.cover,
      description: form.description.trim(),
      publisher: form.publisher.trim(),
      publishDate: form.publishDate.trim(),
      pages: parseInt(form.pages) || 0,
      price: form.price.trim(),
      // 归属
      room: (this.data.rooms[this.data.roomIndex] || {}).name || '',
      tags: this.data.selectedTags,
      // 类型与差异化字段
      type: isPhysical ? 'physical' : 'electronic',
      code: form.code.trim(),
      location: form.location.trim(),
      remark: form.remark.trim(),
      // 管理端「登记字段」录入的值
      custom,
      ...(isPhysical ? {} : {
        fileFormat: this.data.ebook.format,
        fileSize: this.data.ebook.sizeText,
        fileSizeBytes: this.data.ebook.size,
        filePath: this.data.ebook.path
      }),
      status: 'available'
    })

    this.setData({ saving: false })
    util.showToast('录入成功', 'success')
    const next = this.data.autoScan
      ? '/pages/scan/scan'
      : `/pages/book-detail/book-detail?id=${book.id}`
    setTimeout(() => wx.redirectTo({ url: next }), 800)
  }
})
