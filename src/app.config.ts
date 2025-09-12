export default defineAppConfig({
  pages: [
    'pages/workspace/index',
    'pages/login/index',
    'pages/register/index',
    'pages/profile/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#fff',
    navigationBarTitleText: 'Origin-X',
    navigationBarTextStyle: 'black'
  },
  tabBar: {
    color: '#808080',
    selectedColor: '#667eea',
    borderStyle: 'white',
    backgroundColor: '#ffffff',
    list: [
      {
        pagePath: 'pages/workspace/index',
        iconPath: 'assets/workspace.png',
        selectedIconPath: 'assets/workspace-active.png',
        text: '工作台'
      },
      {
        pagePath: 'pages/profile/index',
        iconPath: 'assets/profile.png',
        selectedIconPath: 'assets/profile-active.png',
        text: '我的'
      }
    ]
  }
})
