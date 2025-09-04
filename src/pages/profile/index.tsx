import { View, Text, Image } from '@tarojs/components'
import { useLoad, showToast } from '@tarojs/taro'
import { useUser } from '../../stores/userStore'

import currency from '../../assets/currency.png'

import './index.less'

export default function Profile() {
  const { state } = useUser()

  useLoad(() => {
    console.log('Profile page loaded.')
  })

  return (
    <View className='profile'>
      <View className='profile-header'>
        <View className='avatar-container'>
          <Image 
            className='avatar' 
            src={state.user?.userAvatar || 'https://via.placeholder.com/80x80'} 
            mode='aspectFill'
          />
        </View>
        <View className='user-info'>
          <Text className='username'>{state.user?.username || '未登录用户'}</Text>
          <Text className='email'>{state.user?.email || '暂无邮箱信息'}</Text>
        </View>
      </View>
      
      <View className='profile-balance'>
        <View className='balance-item' onClick={() => showToast({ title: '1RMB=100猫爪', icon: 'none' })}>
          <View className='balance-left'>
            <View className='balance-icon-container'>
              <Image className='currency-icon' src={currency} mode='aspectFit' />
            </View>
            <View className='balance-info'>
              <Text className='balance-label'>猫币余额</Text>
              <Text className='balance-subtitle'>可用于购买服务</Text>
            </View>
          </View>
          <View className='balance-amount-container'>
            <Text className='balance-amount'>{state.user?.balance || 0}</Text>
            <Text className='balance-unit'>猫爪</Text>
          </View>
        </View>
      </View>
      
      <View className='profile-stats'>
        <View className='stat-item'>
          <Text className='stat-number'>0</Text>
          <Text className='stat-label'>上传文件</Text>
        </View>
        <View className='stat-item'>
          <Text className='stat-number'>0</Text>
          <Text className='stat-label'>收藏</Text>
        </View>
        <View className='stat-item'>
          <Text className='stat-number'>0</Text>
          <Text className='stat-label'>分享</Text>
        </View>
      </View>

      <View className='profile-menu'>
        <View className='menu-item'>
          <Text className='menu-text'>个人资料</Text>
          <Text className='menu-arrow'>›</Text>
        </View>
        <View className='menu-item'>
          <Text className='menu-text'>账户设置</Text>
          <Text className='menu-arrow'>›</Text>
        </View>
        <View className='menu-item'>
          <Text className='menu-text'>充值中心</Text>
          <Text className='menu-arrow'>›</Text>
        </View>
        <View className='menu-item'>
          <Text className='menu-text'>帮助与反馈</Text>
          <Text className='menu-arrow'>›</Text>
        </View>
        <View className='menu-item'>
          <Text className='menu-text'>关于我们</Text>
          <Text className='menu-arrow'>›</Text>
        </View>
      </View>
    </View>
  )
}
