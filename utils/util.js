// utils/util.js - 通用工具函数

// 格式化日期
function formatDate(date, fmt = 'YYYY-MM-DD') {
  if (!date) return ''
  if (typeof date === 'string') date = new Date(date)
  if (typeof date === 'number') date = new Date(date)

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')
  const second = String(date.getSeconds()).padStart(2, '0')

  return fmt
    .replace('YYYY', year)
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hour)
    .replace('mm', minute)
    .replace('ss', second)
}

// 相对时间
function timeAgo(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now - date
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (seconds < 60) return '刚刚'
  if (minutes < 60) return minutes + '分钟前'
  if (hours < 24) return hours + '小时前'
  if (days < 7) return days + '天前'
  if (days < 30) return Math.floor(days / 7) + '周前'
  if (days < 365) return Math.floor(days / 30) + '个月前'
  return Math.floor(days / 365) + '年前'
}

// 计算剩余天数
function daysLeft(dueDateStr) {
  const due = new Date(dueDateStr)
  const now = new Date()
  const diff = due - now
  return Math.ceil(diff / (24 * 60 * 60 * 1000))
}

// 判断是否逾期
function isOverdue(dueDateStr) {
  return new Date(dueDateStr) < new Date()
}

// 计算逾期天数：不足一天也计为 1 天，避免出现「已逾期0天」的困惑展示
function overdueDays(dueDateStr) {
  const diff = new Date() - new Date(dueDateStr)
  if (diff <= 0) return 0
  return Math.max(1, Math.floor(diff / (24 * 60 * 60 * 1000)))
}

// 生成唯一ID
function genId(prefix = 'id') {
  return prefix + Date.now() + Math.floor(Math.random() * 1000)
}

// 防抖
function debounce(fn, delay = 500) {
  let timer = null
  return function (...args) {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => fn.apply(this, args), delay)
  }
}

// 显示提示
function showToast(title, icon = 'none', duration = 2000) {
  wx.showToast({ title, icon, duration })
}

function showLoading(title = '加载中...') {
  wx.showLoading({ title, mask: true })
}

function hideLoading() {
  wx.hideLoading()
}

function showModal(title, content) {
  return new Promise((resolve) => {
    wx.showModal({
      title,
      content,
      success: (res) => resolve(res.confirm)
    })
  })
}

// 格式化文件大小
function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + 'B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + 'KB'
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + 'MB'
  return (bytes / (1024 * 1024 * 1024)).toFixed(1) + 'GB'
}

// 格式化数字（万为单位）
function formatNumber(num) {
  if (num >= 10000) return (num / 10000).toFixed(1) + '万'
  return num.toString()
}

// 根据文件扩展名获取格式
function getFileFormat(filename) {
  const ext = filename.split('.').pop().toLowerCase()
  const formatMap = {
    txt: 'txt',
    pdf: 'pdf',
    epub: 'epub',
    mobi: 'mobi',
    azw: 'azw',
    azw3: 'azw3',
    doc: 'doc',
    docx: 'docx'
  }
  return formatMap[ext] || 'unknown'
}

// 获取文件格式图标
function getFormatIcon(format) {
  const iconMap = {
    txt: '📄',
    pdf: '📕',
    epub: '📗',
    mobi: '📘',
    azw: '📘',
    azw3: '📘',
    doc: '📒',
    docx: '📒'
  }
  return iconMap[format] || '📖'
}

// 验证ISBN
function isValidISBN(isbn) {
  if (!isbn) return false
  isbn = isbn.replace(/[-\s]/g, '')
  if (isbn.length === 10) {
    // ISBN-10
    let sum = 0
    for (let i = 0; i < 9; i++) {
      if (!/\d/.test(isbn[i])) return false
      sum += parseInt(isbn[i]) * (10 - i)
    }
    const last = isbn[9].toUpperCase()
    sum += (last === 'X') ? 10 : parseInt(last)
    return sum % 11 === 0
  } else if (isbn.length === 13) {
    // ISBN-13
    let sum = 0
    for (let i = 0; i < 13; i++) {
      if (!/\d/.test(isbn[i])) return false
      sum += parseInt(isbn[i]) * (i % 2 === 0 ? 1 : 3)
    }
    return sum % 10 === 0
  }
  return false
}

// 图书分类（默认值 / 向后兼容用；实际数据源见 getBookCategories）
const BOOK_CATEGORIES = [
  { name: '全部', icon: '📚' },
  { name: '文学', icon: '📖' },
  { name: '科幻', icon: '🚀' },
  { name: '技术', icon: '💻' },
  { name: '历史', icon: '🏛️' },
  { name: '哲学', icon: '🤔' },
  { name: '经济', icon: '💰' },
  { name: '科学', icon: '🔬' },
  { name: '艺术', icon: '🎨' },
  { name: '传记', icon: '👤' },
  { name: '教育', icon: '🎓' },
  { name: '生活', icon: '🌿' }
]

// 分类默认播种值（不含「全部」，管理端「图书分类」新增/删除后以此为初始数据）
const DEFAULT_CATEGORIES = [
  { name: '文学', icon: '📖' },
  { name: '科幻', icon: '🚀' },
  { name: '技术', icon: '💻' },
  { name: '历史', icon: '🏛️' },
  { name: '哲学', icon: '🤔' },
  { name: '经济', icon: '💰' },
  { name: '科学', icon: '🔬' },
  { name: '心理', icon: '🧠' },
  { name: '教育', icon: '🎓' },
  { name: '传记', icon: '👤' },
  { name: '艺术', icon: '🎨' },
  { name: '生活', icon: '🌿' },
  { name: '少儿', icon: '🧸' }
]

const CATEGORY_KEY = 'lib_categories'

/**
 * 图书分类的**唯一数据源**：管理端「图书分类」维护的 lib_categories。
 * 录入图书 / 书库筛选 / 首页分类导航 / 编辑图书 全部走这里，
 * 保证管理端增删改分类能真正作用于全局。
 * @returns {Array<{name:string, icon:string}>} 不含「全部」
 */
function getBookCategories() {
  try {
    const saved = wx.getStorageSync(CATEGORY_KEY)
    if (Array.isArray(saved)) {
      // 用户已初始化（即使被删空也不再复活），直接采用
      return saved.map(c => ({ name: c.name, icon: c.icon || '📚' }))
    }
    // 首次访问：播种默认分类
    wx.setStorageSync(CATEGORY_KEY, DEFAULT_CATEGORIES.map((c, i) => ({
      id: 'c' + (i + 1), name: c.name, icon: c.icon
    })))
  } catch (e) {}
  return DEFAULT_CATEGORIES.slice()
}

// 分类名列表（不含「全部」）
function getCategoryNames() {
  return getBookCategories().map(c => c.name)
}

module.exports = {
  formatDate,
  timeAgo,
  daysLeft,
  overdueDays,
  isOverdue,
  genId,
  debounce,
  showToast,
  showLoading,
  hideLoading,
  showModal,
  formatFileSize,
  formatNumber,
  getFileFormat,
  getFormatIcon,
  isValidISBN,
  BOOK_CATEGORIES,
  DEFAULT_CATEGORIES,
  getBookCategories,
  getCategoryNames
}
