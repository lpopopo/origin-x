import { View, Text, Button, Image } from '@tarojs/components'
import { useLoad } from '@tarojs/taro'
import { useState } from 'react'
import './index.less'

export default function Workspace() {
  const [uploadedImages, setUploadedImages] = useState<string[]>([])
  const [isUploading, setIsUploading] = useState(false)

  useLoad(() => {
    console.log('Workspace page loaded.')
  })

  const handleChooseImage = () => {
    // 这里可以集成Taro的图片选择API
    // 暂时使用模拟数据
    setIsUploading(true)
    setTimeout(() => {
      const newImage = `https://via.placeholder.com/300x200/667eea/ffffff?text=上传图片${uploadedImages.length + 1}`
      setUploadedImages([...uploadedImages, newImage])
      setIsUploading(false)
    }, 1000)
  }

  const handleRemoveImage = (index: number) => {
    const newImages = uploadedImages.filter((_, i) => i !== index)
    setUploadedImages(newImages)
  }

  return (
    <View className='workspace'>
      <View className='workspace-header'>
        <Text className='workspace-title'>工作台</Text>
        <Text className='workspace-subtitle'>管理您的图片和文件</Text>
      </View>

      <View className='upload-section'>
        <View className='upload-area' onClick={handleChooseImage}>
          <View className='upload-icon'>+</View>
          <Text className='upload-text'>点击上传图片</Text>
          <Text className='upload-hint'>支持 JPG、PNG、GIF 格式</Text>
        </View>
      </View>

      {isUploading && (
        <View className='uploading-indicator'>
          <Text className='uploading-text'>上传中...</Text>
        </View>
      )}

      {uploadedImages.length > 0 && (
        <View className='images-section'>
          <View className='section-header'>
            <Text className='section-title'>已上传图片</Text>
            <Text className='image-count'>{uploadedImages.length} 张</Text>
          </View>
          
          <View className='images-grid'>
            {uploadedImages.map((image, index) => (
              <View key={index} className='image-item'>
                <Image 
                  className='uploaded-image' 
                  src={image} 
                  mode='aspectFill'
                />
                <View className='image-actions'>
                  <Button 
                    className='action-btn view-btn'
                    onClick={() => console.log('查看图片:', index)}
                  >
                    查看
                  </Button>
                  <Button 
                    className='action-btn remove-btn'
                    onClick={() => handleRemoveImage(index)}
                  >
                    删除
                  </Button>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      <View className='workspace-tools'>
        <View className='tool-item'>
          <View className='tool-icon'>🖼️</View>
          <Text className='tool-name'>图片编辑</Text>
        </View>
        <View className='tool-item'>
          <View className='tool-icon'>📁</View>
          <Text className='tool-name'>文件管理</Text>
        </View>
        <View className='tool-item'>
          <View className='tool-icon'>🔍</View>
          <Text className='tool-name'>搜索</Text>
        </View>
        <View className='tool-item'>
          <View className='tool-icon'>📊</View>
          <Text className='tool-name'>统计</Text>
        </View>
      </View>
    </View>
  )
}
