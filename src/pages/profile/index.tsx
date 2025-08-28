import { View, Text, Image } from '@tarojs/components'
import { useLoad } from '@tarojs/taro'
import { useUser } from '../../stores/userStore'
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
            src={state.user?.avatar || 'https://via.placeholder.com/80x80'} 
            mode='aspectFill'
          />
        </View>
        <View className='user-info'>
          <Text className='username'>{state.user?.username || '未登录用户'}</Text>
          <Text className='email'>{state.user?.email || '暂无邮箱信息'}</Text>
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
          <Text className='menu-text'>设置</Text>
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
