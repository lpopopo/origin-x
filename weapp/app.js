App({
  onLaunch: function () {
    console.log('Origin X 小程序启动')
  },

  onShow: function (options) {
    console.log('Origin X 小程序显示')
  },

  onHide: function () {
    console.log('Origin X 小程序隐藏')
  },

  onError: function (msg) {
    console.log('Origin X 小程序错误:', msg)
  },

  globalData: {
    h5Url: 'https://meme.52725.uno'
  }
})