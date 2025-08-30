export default defineAppConfig({
  pages: [
    'pages/index/index',
    'pages/login/index',
    'pages/register/index',
    'pages/profile/index',
    'pages/workspace/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#fff',
    navigationBarTitleText: 'Origin-X',
    navigationBarTextStyle: 'black'
  },
  tabBar: {
    color: '#7A7E83',
    selectedColor: '#3cc51f',
    borderStyle: 'black',
    backgroundColor: '#ffffff',
    list: [
      {
        pagePath: 'pages/index/index',
        iconPath: 'assets/home.png',
        selectedIconPath: 'assets/home-active.png',
        text: '首页'
      },
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
