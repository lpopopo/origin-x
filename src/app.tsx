import React from 'react'
import { PropsWithChildren } from 'react'
import { useLaunch } from '@tarojs/taro'
import { UserProvider } from './stores/userStore'

import './app.less'

function App({ children }: PropsWithChildren<any>) {
  useLaunch(() => {
    console.log('App launched.')
  })

  // children 是将要会渲染的页面
  return (
    <UserProvider
      requireAuth={true}
      routeWhitelist={[
        '/pages/login/index',
        '/pages/register/index',
        '/pages/workspace/index'
      ]}
    >
      {children}
    </UserProvider>
  )
}

export default App
