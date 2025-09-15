import { View, Text, Image, Button } from '@tarojs/components'
import Taro, { useLoad, showToast, usePullDownRefresh } from '@tarojs/taro'
import { useState, useRef } from 'react'
import { useUser } from '../../stores/userStore'
import { UserWork } from '../../../types/auth'
import { WorksService } from '../../services/works'
import { DownloadManager } from '../../utils/downloadManager'
import WorkPreviewModal, { WorkPreviewData } from '../../components/WorkPreviewModal'

const currency = 'https://img.52725.uno/assets/currency.png'


import './index.less'

export default function Profile() {
  const { state } = useUser()
  
  // 本地历史记录状态管理
  const [userWorks, setUserWorks] = useState<UserWork[]>([])
  const [worksLoading, setWorksLoading] = useState(false)
  const [worksError, setWorksError] = useState<string | null>(null)
  const [worksPageSize, setWorksPageSize] = useState(10)
  
  // 作品预览弹窗状态
  const [previewModalVisible, setPreviewModalVisible] = useState(false)
  const [selectedWork, setSelectedWork] = useState<WorkPreviewData | null>(null)

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
    // 加载用户历史记录
    fetchUserWorks(1, 10)
  })

  // 下拉刷新处理
  usePullDownRefresh(async () => {
    try {
      await refreshUserWorks()
      showToast({ title: '刷新成功', icon: 'success' })
    } catch (error) {
      showToast({ title: '刷新失败', icon: 'error' })
    } finally {
      Taro.stopPullDownRefresh()
    }
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

  // 处理图片预览
  const handleImagePreview = (url: string): void => {
    Taro.previewImage({
      urls: [url],
      current: url,
    })
  }

  // 处理作品点击 - 打开预览弹窗
  const handleWorkClick = (work: UserWork): void => {
    const workData: WorkPreviewData = {
      id: work.id,
      gifUrl: work.generatedImageUrl,
      originalImageUrl: work.originalImageUrl,
      prompt: work.prompt,
      createdAt: work.createdAt,
      // 如果后端没有提供这些字段，可以先设置为undefined
      gifFileSize: undefined,
      gifWidth: undefined,
      gifHeight: undefined,
      actualDuration: undefined
    }

    setSelectedWork(workData)
    setPreviewModalVisible(true)
  }

  // 关闭预览弹窗
  const handleClosePreviewModal = (): void => {
    setPreviewModalVisible(false)
    setSelectedWork(null)
  }

  // 处理下载（从弹窗中触发）
  const handleDownloadFromModal = async (workData: WorkPreviewData): Promise<void> => {
    try {
      await DownloadManager.downloadImage(workData.gifUrl)
      console.log('作品下载成功:', workData.id)
    } catch (error) {
      console.error('作品下载失败:', error)
    }
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
          <Text className='refresh-hint'>下拉刷新↓</Text>
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
                      className="history-preview"
                      src={work.generatedImageUrl}
                      mode='aspectFill'
                      onClick={() => handleWorkClick(work)}
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

      {/* 作品预览弹窗 */}
      <WorkPreviewModal
        isOpened={previewModalVisible}
        workData={selectedWork}
        onClose={handleClosePreviewModal}
        onDownload={handleDownloadFromModal}
      />
    </View>
  )
}
