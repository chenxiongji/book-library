// components/vip-badge/vip-badge.js
Component({
  properties: {
    level: { type: Number, value: 0 },
    size: { type: String, value: 'md' } // sm | md | lg
  },
  data: {
    levelInfo: null
  },
  lifetimes: {
    attached() {
      this.updateLevelInfo()
    }
  },
  observers: {
    'level': function () {
      this.updateLevelInfo()
    }
  },
  methods: {
    updateLevelInfo() {
      const store = require('../../utils/store.js')
      this.setData({
        levelInfo: store.getVipLevelInfo(this.data.level)
      })
    }
  }
})
