import { View, Text, Image, Button } from '@tarojs/components'
import Taro, { useLoad, showToast } from '@tarojs/taro'
import { useState, useRef } from 'react'
import { useUser } from '../../stores/userStore'
import { UserWork } from '../../../types/auth'
import { WorksService } from '../../services/works'
import { H5DownloadUtils } from '../../utils/h5Download'

const currency = 'https://img.52725.uno/assets/currency.png'


import './index.less'

export default function Profile() {
  const { state } = useUser()
  
  // 本地历史记录状态管理
  const [userWorks, setUserWorks] = useState<UserWork[]>([])
  const [worksLoading, setWorksLoading] = useState(false)
  const [worksError, setWorksError] = useState<string | null>(null)
  const [worksPageSize, setWorksPageSize] = useState(10)
  
  // H5环境检测和长按下载相关状态
  const [isH5, setIsH5] = useState(false)
  const longPressTimer = useRef<NodeJS.Timeout | null>(null)
  const [isLongPressing, setIsLongPressing] = useState(false)

  // 获取用户历史记录
  const fetchUserWorks = async (pageNo: number = 1, pageSize: number = 10) => {
    try {
      setWorksLoading(true)
      setWorksError(null)
      
      const response = await WorksService.getUserWorksWithPagination(pageNo, pageSize)
      setUserWorks(response.works)
      setWorksPageSize(response.pageSize)
    } catch (error) {
      console.error('获取用户历史记录失败:', error)
      setWorksError('获取历史记录失败')
    } finally {
      setWorksLoading(false)
    }
  }

  // 刷新用户历史记录
  const refreshUserWorks = async () => {
    await fetchUserWorks(1, worksPageSize)
  }

  useLoad(() => {
    console.log('Profile page loaded.')
    // 检测H5环境
    setIsH5(H5DownloadUtils.isH5())
    // 加载用户历史记录
    fetchUserWorks(1, 10)
  })

  // 格式化日期函数
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${year}.${month}.${day} ${hours}:${minutes}`
  }


  const handleRechargeClick = () => {
    showToast({ title: '充值功能开发中', icon: 'none' })
  }

  const handleViewAllClick = () => {
    if (userWorks.length === 0) {
      showToast({ title: '暂无更多历史记录', icon: 'none' })
    } else {
      showToast({ title: '查看全部功能开发中', icon: 'none' })
    }
  }

  const handleRefreshClick = () => {
    refreshUserWorks()
    showToast({ title: '刷新成功', icon: 'success' })
  }

  // 处理图片预览
  const handleImagePreview = (url: string): void => {
    Taro.previewImage({
      urls: [url],
      current: url,
    })
  }

  // 处理长按下载图片
  const handleLongPressDownload = (url: string): void => {
    if (isH5) {
      // H5环境使用H5下载工具
      handleH5Download(url)
    } else {
      // 小程序环境使用原有逻辑
      handleMiniProgramDownload(url)
    }
  }

  // H5环境下的下载处理
  const handleH5Download = async (url: string): Promise<void> => {
    try {
      showToast({ title: '开始下载...', icon: 'loading' })
      await H5DownloadUtils.smartDownloadImage(url)
      showToast({ title: '下载成功', icon: 'success' })
    } catch (error) {
      console.error('H5下载失败:', error)
      showToast({ title: '下载失败', icon: 'none' })
    }
  }

  // 小程序环境下的下载处理
  const handleMiniProgramDownload = (url: string): void => {
    // 检查用户是否授权保存到相册
    Taro.getSetting({
      success: (res) => {
        if (!res.authSetting['scope.writePhotosAlbum']) {
          // 请求授权
          Taro.authorize({
            scope: 'scope.writePhotosAlbum',
            success: () => {
              downloadAndSaveImage(url)
            },
            fail: () => {
              Taro.showModal({
                title: '提示',
                content: '需要授权保存到相册才能下载图片',
                showCancel: false,
              })
            },
          })
        } else {
          // 已授权，直接保存
          downloadAndSaveImage(url)
        }
      },
    })
  }

  // H5环境下的长按事件处理
  const handleH5LongPressStart = (url: string): void => {
    if (!isH5) return
    
    setIsLongPressing(true)
    longPressTimer.current = setTimeout(() => {
      handleH5Download(url)
      setIsLongPressing(false)
    }, 100) // 1s长按触发
  }

  const handleH5LongPressEnd = (): void => {
    if (!isH5) return
    
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
    setIsLongPressing(false)
  }

  // 下载并保存图片到相册（小程序环境）
  const downloadAndSaveImage = (url: string): void => {
    Taro.showLoading({ title: '下载中...' })
    
    // 下载图片到本地
    Taro.downloadFile({
      url: url,
      success: (res) => {
        if (res.statusCode === 200) {
          // 保存图片到相册
          Taro.saveImageToPhotosAlbum({
            filePath: res.tempFilePath,
            success: () => {
              Taro.hideLoading()
              Taro.showToast({
                title: '图片已保存到相册',
                icon: 'success',
              })
            },
            fail: () => {
              Taro.hideLoading()
              Taro.showToast({
                title: '保存失败',
                icon: 'none',
              })
            },
          })
        } else {
          Taro.hideLoading()
          Taro.showToast({
            title: '下载失败',
            icon: 'none',
          })
        }
      },
      fail: () => {
        Taro.hideLoading()
        Taro.showToast({
          title: '下载失败',
          icon: 'none',
        })
      },
    })
  }


  return (
    <View className='profile-page'>
      {/* 个人信息卡片 */}
      <View className='gradient-bg'>
        <View className='profile-header'>
          <View className='user-info-section'>
            <View className='avatar-container'>
              <Image 
                className='profile-avatar' 
                src={(state.user && state.user.userAvatar) || ''} 
                mode='aspectFill'
              />
            </View>
            <View className='user-details'>
              <Text className='username'>{(state.user && state.user.username) || '动图创作者'}</Text>
              <Text className='email-text'>{(state.user && state.user.email) || 'creator@example.com'}</Text>
            </View>
          </View>
        </View>
      </View>
      
      {/* 余额和积分卡片 */}
      <View className='balance-card-container'>
        <View className='profile-info-card'>
          <View className='balance-section'>
            <View className='balance-header'>
              <View className='balance-info'>
                <Text className='balance-label'>我的余额</Text>
                <Text className='points-display'>{(state.user && state.user.balance) || 1234}</Text>
              </View>
              <View className='balance-icon'>
                <Image src={currency} mode="aspectFit" />
              </View>
            </View>
            <Button className='recharge-btn' onClick={handleRechargeClick}>
              <Text className='recharge-icon'>+</Text>
              <Text className='recharge-text'>充值积分</Text>
            </Button>
          </View>
        </View>
      </View>
      
      {/* 历史记录列表 */}
      <View className='history-section'>
        <View className='history-header'>
          <Text className='history-title'>创作历史</Text>
          {/* <View className='history-actions'>
            <View className='refresh-btn' onClick={handleRefreshClick}>
              <Text className='refresh-icon'>🔄</Text>
            </View>
            <View className='view-all-btn' onClick={handleViewAllClick}>
              <Text className='history-icon'>🕒</Text>
              <Text className='view-all-text'>查看全部</Text>
            </View>
          </View> */}
        </View>
        
        <View className='history-list'>
          {worksLoading ? (
            <View className='loading-container'>
              <Text className='loading-text'>加载中...</Text>
            </View>
          ) : worksError ? (
            <View className='error-container'>
              <Text className='error-text'>{worksError}</Text>
            </View>
          ) : userWorks.length === 0 ? (
            <View className='empty-container'>
              <Text className='empty-text'>暂无创作历史</Text>
            </View>
          ) : (
            userWorks.map((work: UserWork) => (
              <View key={work.id} className='history-item'>
                <View className='history-card'>
                  <View className='image-container'>
                    <Image
                      className={`history-preview ${isLongPressing ? 'long-pressing' : ''}`}
                      src={work.generatedImageUrl}
                      mode='aspectFill'
                      onClick={() => handleImagePreview(work.generatedImageUrl)}
                      onLongPress={() => handleLongPressDownload(work.generatedImageUrl)}
                      onTouchStart={() => isH5 && handleH5LongPressStart(work.generatedImageUrl)}
                      onTouchEnd={() => isH5 && handleH5LongPressEnd()}
                      onTouchCancel={() => isH5 && handleH5LongPressEnd()}
                    />
                    <View className='image-overlay'>
                      <Text className='history-description'>{work.prompt}</Text>
                      <Text className='history-date'>{formatDate(work.createdAt)}</Text>
                    </View>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>
      </View>
    </View>
  )
}
