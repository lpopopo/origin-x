import { View, Text, Button, Image, Input } from '@tarojs/components'
import Taro, { useLoad } from '@tarojs/taro'
import { useState, useRef } from 'react'
import './index.less'

// 定义消息类型
interface Message {
  id: string
  type: 'text' | 'image'
  content: string
  timestamp: number
  isUser: boolean
}

// 定义上传的图片类型
interface UploadedImage {
  id: string
  url: string
  name: string
  size: number
}

export default function Workspace() {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputText, setInputText] = useState<string>('')
  const [uploadedImage, setUploadedImage] = useState<UploadedImage | null>(null)
  const [isUploading, setIsUploading] = useState<boolean>(false)
  const inputRef = useRef<any>(null)

  useLoad(() => {
    console.log('Workspace page loaded.')
    // 添加欢迎消息
    const welcomeMessage: Message = {
      id: '1',
      type: 'text',
      content: '您好！我是您的工作助手，有什么问题尽管问我。',
      timestamp: Date.now(),
      isUser: false
    }
    setMessages([welcomeMessage])
  })

  // 处理图片上传
  const handleChooseImage = async (): Promise<void> => {
    try {
      setIsUploading(true)
      
      // 使用Taro的图片选择API
      const { tempFilePaths, tempFiles } = await Taro.chooseImage({
        count: 1,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera']
      })

      if (tempFilePaths && tempFilePaths.length > 0) {
        const file = tempFiles?.[0]
        const newImage: UploadedImage = {
          id: Date.now().toString(),
          url: tempFilePaths[0],
          name: file?.originalFileObj?.name || `image_${Date.now()}.jpg`,
          size: file?.size || 0
        }
        
        setUploadedImage(newImage)
        
        // 添加图片消息
        const imageMessage: Message = {
          id: Date.now().toString(),
          type: 'image',
          content: newImage.url,
          timestamp: Date.now(),
          isUser: true
        }
        
        setMessages(prev => [...prev, imageMessage])
        
        // 模拟AI回复
        setTimeout(() => {
          const aiReply: Message = {
            id: (Date.now() + 1).toString(),
            type: 'text',
            content: '我已经收到您上传的图片，请问有什么需要帮助的吗？',
            timestamp: Date.now(),
            isUser: false
          }
          setMessages(prev => [...prev, aiReply])
        }, 1000)
      }
    } catch (error) {
      console.error('图片上传失败:', error)
      Taro.showToast({
        title: '图片上传失败',
        icon: 'error'
      })
    } finally {
      setIsUploading(false)
    }
  }

  // 处理文本输入
  const handleInputChange = (e: any): void => {
    setInputText(e.detail.value)
  }

  // 处理发送消息
  const handleSendMessage = (): void => {
    if (!inputText.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'text',
      content: inputText.trim(),
      timestamp: Date.now(),
      isUser: true
    }

    setMessages(prev => [...prev, userMessage])
    setInputText('')

    // 模拟AI回复
    setTimeout(() => {
      const aiReply: Message = {
        id: (Date.now() + 1).toString(),
        type: 'text',
        content: '我理解您的问题，让我为您提供帮助。',
        timestamp: Date.now(),
        isUser: false
      }
      setMessages(prev => [...prev, aiReply])
    }, 1000)
  }

  // 移除上传的图片
  const handleRemoveImage = (): void => {
    setUploadedImage(null)
  }

  // 处理图片预览
  const handleImagePreview = (url: string): void => {
    Taro.previewImage({
      urls: [url],
      current: url
    })
  }

  return (
    <View className='workspace'>
      {/* 聊天消息区域 */}
      <View className='chat-messages'>
        {messages.map((message) => (
          <View 
            key={message.id} 
            className={`message ${message.isUser ? 'user-message' : 'ai-message'}`}
          >
            {message.type === 'text' ? (
              <Text className='message-text'>{message.content}</Text>
            ) : (
              <View className='image-container'>
                <Image 
                  className='message-image' 
                  src={message.content} 
                  mode='aspectFit'
                  onClick={() => handleImagePreview(message.content)}
                />
                <View className='preview-hint'>👁</View>
              </View>
            )}
            <Text className='message-time'>
              {new Date(message.timestamp).toLocaleTimeString('zh-CN', {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </Text>
          </View>
        ))}
      </View>

      {/* 底部操作区域 */}
      <View className='bottom-actions'>
        {/* 图片上传按钮 */}
        <View className='upload-section'>
          <Button 
            className='upload-btn'
            onClick={handleChooseImage}
            // disabled={isUploading}
          >
            {isUploading ? '上传中...' : '上传图片'}
          </Button>
          
          {/* 显示已上传的图片 */}
          {uploadedImage && (
            <View className='uploaded-image-preview'>
              <View className='image-container'>
                <Image 
                  className='preview-image' 
                  src={uploadedImage.url} 
                  mode='aspectFit'
                  onClick={() => handleImagePreview(uploadedImage.url)}
                />
                <View className='preview-hint'>👁</View>
              </View>
              <Button 
                className='remove-image-btn'
                onClick={handleRemoveImage}
              >
                ×
              </Button>
            </View>
          )}
        </View>

        {/* 输入框和发送按钮 */}
        <View className='input-section'>
          <View className='input-wrapper'>
            <View className='input-icon'></View>
            <Input
              ref={inputRef}
              className='chat-input'
              value={inputText}
              onInput={handleInputChange}
              onConfirm={handleSendMessage}
              placeholder='有问题尽管问我'
              placeholderClass='input-placeholder'
            />
            <Button 
              className='send-btn'
              onClick={handleSendMessage}
              disabled={!inputText.trim()}
            >
              ➤
            </Button>
          </View>
        </View>
      </View>
    </View>
  )
}
