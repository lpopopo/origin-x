import { View, Text, Button, Image, Input, Progress } from '@tarojs/components'
import Taro, { useLoad } from '@tarojs/taro'
import { useState, useRef, useEffect } from 'react'
import { UploadService } from '../../services/upload'
import { H5UploadUtils } from '../../utils/h5Upload'
import { GenerateService } from '../../services/generate'
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
  objectKey?: string // 图床返回的对象键
  uploadTime: number // 上传时间
}

export default function Workspace() {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputText, setInputText] = useState<string>('')
  const [uploadedImage, setUploadedImage] = useState<UploadedImage | null>(null)
  const [isUploading, setIsUploading] = useState<boolean>(false)
  const [uploadProgress, setUploadProgress] = useState<number>(0)
  const [cleanupFunction, setCleanupFunction] = useState<(() => void) | null>(null)
  const [isProcessing, setIsProcessing] = useState<boolean>(false) // 是否正在处理任务
  const inputRef = useRef<any>(null)
  const uploadAreaRef = useRef<any>(null)

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

  // 检测当前环境
  const isH5 = Taro.getEnv() === Taro.ENV_TYPE.WEB

  // 启用拖拽上传（仅H5环境）
  useEffect(() => {
    if (isH5 && uploadAreaRef.current) {
      const cleanup = H5UploadUtils.enableDragAndDrop(
        uploadAreaRef.current,
        handleDragAndDrop
      )
      
      return cleanup
    }
  }, [isH5])

  // 组件卸载时清理SSE连接
  useEffect(() => {
    return () => {
      if (cleanupFunction) {
        cleanupFunction()
      }
    }
  }, [cleanupFunction])

  // 处理拖拽上传
  const handleDragAndDrop = async (files: File[]): Promise<void> => {
    if (files.length === 0) return
    
    // 只处理第一个文件
    const file = files[0]
    await handleFileUpload(file)
  }

  // 处理文件上传
  const handleFileUpload = async (file: File): Promise<void> => {
    try {
      setIsUploading(true)
      setUploadProgress(0)
      
      // 验证文件类型
      if (!H5UploadUtils.isValidImage(file)) {
        throw new Error('不支持的文件类型，请选择有效的图片文件')
      }
      
      // 检查文件大小
      const maxSize = 10 * 1024 * 1024 // 10MB
      if (!H5UploadUtils.checkFileSize(file, maxSize)) {
        throw new Error(`文件大小不能超过${H5UploadUtils.formatFileSize(maxSize)}`)
      }
      
      // 显示上传进度提示
      Taro.showLoading({
        title: '正在上传图片...'
      })
      
      try {
        // 上传进度回调
        const onProgress = (progress: number) => {
          setUploadProgress(progress)
        }
        
        // 上传图片到图床
        const { imageUrl, objectKey } = await UploadService.uploadImage(
          file, 
          file.name, 
          onProgress
        )
        
        // 创建图片对象
        const newImage: UploadedImage = {
          id: Date.now().toString(),
          url: imageUrl,
          name: file.name,
          size: file.size,
          objectKey: objectKey,
          uploadTime: Date.now()
        }
        
        // 设置上传的图片
        setUploadedImage(newImage)
        
        // 添加图片消息（使用图床URL）
        const imageMessage: Message = {
          id: Date.now().toString(),
          type: 'image',
          content: imageUrl,
          timestamp: Date.now(),
          isUser: true
        }
        
        setMessages(prev => [...prev, imageMessage])
        
        // 隐藏加载提示
        Taro.hideLoading()
        
        // 显示成功提示
        Taro.showToast({
          title: '上传成功',
          icon: 'success'
        })
        
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
        
      } catch (uploadError) {
        console.error('图片上传到图床失败:', uploadError)
        const errorMessage = uploadError instanceof Error ? uploadError.message : '图片上传失败'
        Taro.hideLoading()
        Taro.showToast({
          title: errorMessage,
          icon: 'error'
        })
      }
    } catch (error) {
      console.error('文件上传失败:', error)
      const errorMessage = error instanceof Error ? error.message : '文件上传失败'
      Taro.hideLoading()
      Taro.showToast({
        title: errorMessage,
        icon: 'error'
      })
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  // 处理图片上传
  const handleChooseImage = async (): Promise<void> => {
    try {
      if (isH5) {
        // H5环境：使用自定义文件选择器
        try {
          const files = await H5UploadUtils.chooseFiles('image/*', false)
          if (files.length === 0) {
            throw new Error('未选择文件')
          }
          
          await handleFileUpload(files[0])
          
        } catch (error) {
          console.error('H5文件选择失败:', error)
          const errorMessage = error instanceof Error ? error.message : '文件选择失败'
          Taro.showToast({
            title: errorMessage,
            icon: 'error'
          })
        }
      } else {
        // 小程序环境：使用Taro的图片选择API
        const { tempFilePaths, tempFiles } = await Taro.chooseImage({
          count: 1,
          sizeType: ['compressed'],
          sourceType: ['album', 'camera']
        })

        if (!tempFilePaths || tempFilePaths.length === 0) {
          throw new Error('未选择图片')
        }

        const file = tempFiles?.[0]
        const localPath = tempFilePaths[0]
        const fileName = file?.originalFileObj?.name || `image_${Date.now()}.jpg`
        const fileSize = file?.size || 0
        
        // 显示上传进度提示
        Taro.showLoading({
          title: '正在上传图片...'
        })
        
        try {
          // 上传进度回调
          const onProgress = (progress: number) => {
            setUploadProgress(progress)
          }
          
          // 上传图片到图床
          const { imageUrl, objectKey } = await UploadService.uploadImage(
            localPath, 
            fileName, 
            onProgress
          )
          
          // 创建图片对象
          const newImage: UploadedImage = {
            id: Date.now().toString(),
            url: imageUrl,
            name: fileName,
            size: fileSize,
            objectKey: objectKey,
            uploadTime: Date.now()
          }
          
          // 设置上传的图片
          setUploadedImage(newImage)
          // 隐藏加载提示
          Taro.hideLoading()
          
          // 显示成功提示
          Taro.showToast({
            title: '上传成功',
            icon: 'success'
          })
        } catch (uploadError) {
          console.error('图片上传到图床失败:', uploadError)
          const errorMessage = uploadError instanceof Error ? uploadError.message : '图片上传失败'
          Taro.hideLoading()
          Taro.showToast({
            title: errorMessage,
            icon: 'error'
          })
        }
      }
    } catch (error) {
      console.error('选择图片失败:', error)
      const errorMessage = error instanceof Error ? error.message : '选择图片失败'
      Taro.showToast({
        title: errorMessage,
        icon: 'error'
      })
    }
  }

  // 处理文本输入
  const handleInputChange = (e: any): void => {
    setInputText(e.detail.value)
  }

  // 处理发送消息
  const handleSendMessage = async (): Promise<void> => {
    if (!inputText.trim() && !uploadedImage) {
      Taro.showToast({
        title: '请输入文字描述或上传图片',
        icon: 'none'
      })
      return
    }

    // 检查是否正在处理任务
    if (isProcessing) {
      Taro.showToast({
        title: '正在处理中，请稍候...',
        icon: 'none'
      })
      return
    }

    // 设置处理状态
    setIsProcessing(true)

    // 构建用户消息
    const userMessage: Message = {
      id: Date.now().toString(),
      type: uploadedImage ? 'image' : 'text',
      content: inputText.trim() || '生成图片',
      timestamp: Date.now(),
      isUser: true
    }

    setMessages(prev => [...prev, userMessage])
    setInputText('')

    // 如果有图片，显示图片消息
    if (uploadedImage) {
      const imageMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'image',
        content: uploadedImage.url,
        timestamp: Date.now(),
        isUser: true
      }
      setMessages(prev => [...prev, imageMessage])
    }

    // 显示AI正在处理的消息
    const processingMessage: Message = {
      id: (Date.now() + 2).toString(),
      type: 'text',
      content: '正在处理您的请求...',
      timestamp: Date.now(),
      isUser: false
    }
    setMessages(prev => [...prev, processingMessage])

    try {
      // 调用API创建任务
      const requestData: any = {
        prompt: inputText.trim() || '生成图片',
        objectKey: "uploads/a5d30ab5-ab0d-422f-b930-db9e4a9a782a/2.jpg"
      }
      
      // 如果有上传的图片，添加objectKey
      if (uploadedImage?.objectKey) {
        requestData.objectKey = uploadedImage.objectKey
      }

      console.log('创建任务请求数据:', requestData)
      const taskResponse = await GenerateService.createTask(requestData)
      console.log('任务创建成功:', taskResponse)
      
      // 开始监听SSE状态更新
      const cleanup = GenerateService.listenToTaskStatus(
        taskResponse.taskId,
        {
          onConnected: (data) => {
            console.log('SSE连接已建立:', data)
            // 更新处理消息显示连接状态
            setMessages(prev => prev.map(msg => 
              msg.id === processingMessage.id 
                ? { ...msg, content: '已连接到任务状态流，正在处理...' }
                : msg
            ))
          },
          onStatusUpdate: (data) => {
            handleStatusUpdate(data, processingMessage.id)
          },
          onFinished: (data) => {
            handleTaskFinished(data, processingMessage.id)
          },
          onError: (data) => {
            handleTaskError(data, processingMessage.id)
          },
          onConnectionError: (error) => {
            handleConnectionError(error, processingMessage.id)
          }
        }
      )

      // 存储清理函数，以便在组件卸载时调用
      setCleanupFunction(() => cleanup)
      
    } catch (error) {
      console.error('发送消息失败:', error)
      
      // 更新处理消息为错误状态
      setMessages(prev => prev.map(msg => 
        msg.id === processingMessage.id 
          ? { ...msg, content: `处理失败: ${error instanceof Error ? error.message : '未知错误'}` }
          : msg
      ))
      
      Taro.showToast({
        title: '发送失败，请重试',
        icon: 'none'
      })
      
      // 重置处理状态
      setIsProcessing(false)
    }
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

  // 处理状态更新事件
  const handleStatusUpdate = (data: any, messageId: string) => {
    const { status, progress } = data
    console.log('任务状态更新:', data , status, progress)
    
    let statusText = '正在处理...'
    if (status === 'processing') {
      statusText = `正在生成中... ${progress}%`
    } else if (status === 'pending') {
      statusText = '任务已创建，等待处理...'
    } else if (status === 'completed') {
      statusText = '任务已完成，正在生成结果...'
    }
    
    // 更新处理消息
    setMessages(prev => prev.map(msg => 
      msg.id === messageId 
        ? { ...msg, content: statusText }
        : msg
    ))
  }

  // 处理任务完成事件
  const handleTaskFinished = (data: any, messageId: string) => {
    const { status, gifUrl, error, errorCode, gifFileSize, gifWidth, gifHeight, actualDuration } = data
    console.log('任务完成:', data)
    
    // 重置处理状态
    setIsProcessing(false)
    
    if (status === 'completed' && gifUrl) {
      // 任务成功完成，显示生成的GIF
      const successMessage: Message = {
        id: (Date.now() + 3).toString(),
        type: 'image',
        content: gifUrl,
        timestamp: Date.now(),
        isUser: false
      }
      
      // 移除处理消息，添加成功消息
      setMessages(prev => [
        ...prev.filter(msg => msg.id !== messageId),
        successMessage
      ])
      
      // 清除上传的图片
      setUploadedImage(null)
      
      // 显示成功提示，包含文件信息
      const fileInfo = `生成完成！文件大小: ${(gifFileSize / 1024 / 1024).toFixed(2)}MB, 尺寸: ${gifWidth}x${gifHeight}, 时长: ${actualDuration}秒`
      Taro.showToast({
        title: '生成完成！',
        icon: 'success'
      })
      
      console.log(fileInfo)
    } else if (status === 'failed') {
      // 任务失败
      const errorMessage = error || '生成失败'
      const errorDetails = errorCode ? ` (错误代码: ${errorCode})` : ''
      
      // 更新处理消息为失败状态
      setMessages(prev => prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, content: `生成失败: ${errorMessage}${errorDetails}` }
          : msg
      ))
      
      Taro.showToast({
        title: '生成失败',
        icon: 'none'
      })
    }
  }

  // 处理任务错误事件
  const handleTaskError = (data: any, messageId: string) => {
    const { error } = data
    console.error('SSE错误:', error)
    
    // 重置处理状态
    setIsProcessing(false)
    
    // 更新处理消息为错误状态
    setMessages(prev => prev.map(msg => 
      msg.id === messageId 
        ? { ...msg, content: `发生错误: ${error}` }
        : msg
    ))
    
    Taro.showToast({
      title: '发生错误',
      icon: 'none'
    })
    
    // 清除上传的图片，因为任务失败了
    setUploadedImage(null)
  }

  // 处理连接错误事件
  const handleConnectionError = (error: Error, messageId: string) => {
    console.error('SSE连接错误:', error)
    
    // 重置处理状态
    setIsProcessing(false)
    
    // 更新处理消息为错误状态
    setMessages(prev => prev.map(msg => 
      msg.id === messageId 
        ? { ...msg, content: `连接失败: ${error.message}` }
        : msg
      ))
    
    Taro.showToast({
      title: '连接失败',
      icon: 'none'
    })
    
    // 清除上传的图片，因为连接失败了
    setUploadedImage(null)
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
        {/* 图片上传区域 */}
        <View 
          ref={uploadAreaRef}
          className={`upload-section`}
        >
          <Button 
            className='upload-btn'
            onClick={handleChooseImage}
          >
            {isUploading ? '上传中...' : '上传图片'}
          </Button>
          
          {/* 上传进度条 */}
          {isUploading && uploadProgress > 0 && (
            <View className='upload-progress'>
              <Progress 
                percent={uploadProgress} 
                strokeWidth={3}
                color='#007AFF'
                backgroundColor='#E5E5EA'
              />
              <Text className='progress-text'>{uploadProgress}%</Text>
            </View>
          )}
        
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
              </View>
              <View className='image-info'>
                <Text className='image-name'>{uploadedImage.name}</Text>
                <Text className='image-size'>
                  {uploadedImage.size > 0 ? H5UploadUtils.formatFileSize(uploadedImage.size) : '未知大小'}
                </Text>
              </View>
              <View 
                className='remove-image-btn'
                onClick={handleRemoveImage}
              >
                ×
              </View>
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
              disabled={!inputText.trim() || isProcessing}
            >
              {isProcessing ? '处理中...' : '➤'}
            </Button>
          </View>
        </View>
      </View>
    </View>
  )
}
