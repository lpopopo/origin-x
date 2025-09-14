const app = getApp()

Page({
  data: {
    h5Url: app.globalData.h5Url,
    showDebug: false
  },

  onLoad: function(options) {
    console.log('webview页面加载')

    // 处理URL，移除不支持的参数
    let cleanUrl = app.globalData.h5Url

    // 如果有传入的URL参数，使用传入的URL
    if (options.url) {
      cleanUrl = decodeURIComponent(options.url)
    }

    // 移除 wechat_redirect 等不支持的参数
    if (cleanUrl.includes('#wechat_redirect')) {
      cleanUrl = cleanUrl.replace('#wechat_redirect', '')
    }
    if (cleanUrl.includes('?wechat_redirect')) {
      cleanUrl = cleanUrl.replace('?wechat_redirect', '')
    }

    this.setData({
      h5Url: cleanUrl
    })
  },

  onShow: function() {
    console.log('webview页面显示')
  },

  onHide: function() {
    console.log('webview页面隐藏')
  },

  handleMessage: function(e) {
    console.log('收到H5消息:', e.detail.data)
    // 处理来自H5的消息
  },

  handleError: function(e) {
    console.error('webview加载错误:', e.detail)
    console.error('当前URL:', this.data.h5Url)

    let errorMsg = '页面加载失败'
    if (e.detail && e.detail.errMsg) {
      if (e.detail.errMsg.includes('domain')) {
        errorMsg = '域名未配置或不在白名单'
      } else if (e.detail.errMsg.includes('network')) {
        errorMsg = '网络连接失败'
      } else if (e.detail.errMsg.includes('timeout')) {
        errorMsg = '加载超时'
      }
    }

    wx.showModal({
      title: '加载失败',
      content: `${errorMsg}\n\n当前URL: ${this.data.h5Url}\n\n请检查:\n1. 域名是否已在小程序后台配置\n2. 网络连接是否正常\n3. 是否在真机上测试`,
      showCancel: false,
      confirmText: '重试',
      success: (res) => {
        if (res.confirm) {
          // 重新加载页面
          this.setData({
            h5Url: this.data.h5Url + '?t=' + Date.now()
          })
        }
      }
    })
  },

  handleLoad: function(e) {
    console.log('webview加载完成:', e.detail)
    wx.showToast({
      title: '加载完成',
      icon: 'success',
      duration: 1000
    })
  },

  toggleDebug: function() {
    this.setData({
      showDebug: !this.data.showDebug
    })
  },

  onShareAppMessage: function() {
    return {
      title: 'Origin X',
      path: '/pages/webview/webview'
    }
  }
})