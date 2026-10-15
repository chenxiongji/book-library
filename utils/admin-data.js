// utils/admin-data.js - 管理端数据助手：读取时自动播种默认数据
// 存储键统一 lib_ 前缀，可被 admin 页"导出/导入数据"整体备份恢复

const PALETTE = ['#4A6CF7', '#22C55E', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#EC4899', '#64748B']

// 读取列表；仅在「从未初始化过」时播种默认数据
// 注意：不能用 v.length 判断——用户把列表删空后存储为 []，length 为 0 会被误判为未初始化，
// 导致默认数据「复活」，删除操作无法真正生效。改用 Array.isArray 判断键是否存在。
function getList(key, seed) {
  const v = wx.getStorageSync(key)
  if (Array.isArray(v)) return v
  wx.setStorageSync(key, seed)
  return seed
}

// 读取对象；同理，用 typeof === 'object' 判断是否已初始化（允许空对象）
function getObject(key, seed) {
  const v = wx.getStorageSync(key)
  if (v !== '' && v !== null && typeof v === 'object') return v
  wx.setStorageSync(key, seed)
  return seed
}

function save(key, value) {
  wx.setStorageSync(key, value)
}

// 颜色循环取色
function pickColor(index) {
  return PALETTE[index % PALETTE.length]
}

module.exports = {
  PALETTE,
  getList,
  getObject,
  save,
  pickColor
}
