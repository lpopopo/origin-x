import { View, Text, Button } from '@tarojs/components'
import { useLoad } from '@tarojs/taro'
import { useUser } from '../../stores/userStore'
import './index.less'

export default function Index() {
  const { state } = useUser()

  useLoad(() => {
    console.log('Index page loaded.')
  })

  return (
    <View className='index'>
      <View className='hero-section'>
        <Text className='hero-title'>欢迎使用 Origin-X</Text>
        <Text className='hero-subtitle'>您的智能工作伙伴</Text>
        {state.user ? (
          <Text className='welcome-text'>欢迎回来，{state.user && state.user.username}！</Text>
        ) : (
          <Text className='welcome-text'>请登录以使用完整功能</Text>
        )}
      </View>

      <View className='features-section'>
        <View className='feature-card'>
          <View className='feature-icon'>📁</View>
          <Text className='feature-title'>文件管理</Text>
          <Text className='feature-desc'>高效管理您的图片和文档</Text>
        </View>
        
        <View className='feature-card'>
          <View className='feature-icon'>🖼️</View>
          <Text className='feature-title'>图片处理</Text>
          <Text className='feature-desc'>强大的图片编辑和处理工具</Text>
        </View>
        
        <View className='feature-card'>
          <View className='feature-icon'>📊</View>
          <Text className='feature-title'>数据分析</Text>
          <Text className='feature-desc'>深入了解您的使用情况</Text>
        </View>
        
        <View className='feature-card'>
          <View className='feature-icon'>🔒</View>
          <Text className='feature-title'>安全可靠</Text>
          <Text className='feature-desc'>保护您的数据安全</Text>
        </View>
      </View>

      <View className='quick-actions'>
        <Button className='action-button primary'>开始使用</Button>
        <Button className='action-button secondary'>了解更多</Button>
      </View>
    </View>
  )
}
