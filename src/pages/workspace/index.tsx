import { View, Text, Button, Image, Video, Input, Progress, Textarea } from '@tarojs/components'
import Taro, { useLoad } from '@tarojs/taro'
import { useState, useRef, useEffect } from 'react'
import { UploadService } from '../../services/upload'
import { H5UploadUtils } from '../../utils/h5Upload'
import { GenerateService, DemoExample, GenerateConfig } from '../../services/generate'
import { useUser } from '../../stores/userStore'
import './index.less'

// 定义消息类型
interface Message {
  id: string
  type: 'text' | 'image' | 'demo-card'
  content: string
  timestamp: number
  isUser: boolean
  demoData?: {
    videoUrl: string
    prompt: string
  }
}

// 定义上传的图片类型
interface UploadedImage {
  id: string
  url: string
  name: string
  size: number
  width?: number // 图片宽度
  height?: number // 图片高度
  uploadTime: number // 上传时间
}

export default function Workspace() {
  const { state: userState } = useUser()
  const [messages, setMessages] = useState<Message[]>([])
  const [inputText, setInputText] = useState<string>('')
  const [uploadedImage, setUploadedImage] = useState<UploadedImage | null>(null)
  const [isUploading, setIsUploading] = useState<boolean>(false)
  const [uploadProgress, setUploadProgress] = useState<number>(0)
  const [cleanupFunction, setCleanupFunction] = useState<(() => void) | null>(null)
  const [isProcessing, setIsProcessing] = useState<boolean>(false) // 是否正在处理任务
  const [showTyping, setShowTyping] = useState<boolean>(false)
  const [isDragOver, setIsDragOver] = useState<boolean>(false)
  const [demoExample, setDemoExample] = useState<DemoExample | null>(null)
  const [isLoadingDemo, setIsLoadingDemo] = useState<boolean>(false)
  const [generateConfig, setGenerateConfig] = useState<GenerateConfig | null>(null)
  const [showModal, setShowModal] = useState<boolean>(false)
  const [isModalClosing, setIsModalClosing] = useState<boolean>(false)
  const [modalParams, setModalParams] = useState({
    style: 'default',
    duration: 3,
    fps: 30,
    quality: 'high'
  })
  const [videoSources, setVideoSources] = useState<{[key: string]: string}>({})
  const uploadAreaRef = useRef<any>(null)
  const inputRef = useRef<any>(null)
  const buttonRef = useRef<any>(null)

  useLoad(() => {
    console.log('Workspace page loaded.')
    loadDemoExample()
    loadGenerateConfig()
    
    // 添加机器人欢迎消息
    const welcomeMessage: Message = {
      id: 'welcome-' + Date.now().toString(),
      type: 'text',
      content: '你好！😄 只需要上传一张图片🏞，然后描述你想要的动画效果✨，我就能为你生成精彩的动图！\n\n💡 支持人物动作、物体移动、特效添加等多种动画类型',
      timestamp: Date.now(),
      isUser: false
    }
    setMessages([welcomeMessage])
  })

  // 加载生成配置
  const loadGenerateConfig = async (): Promise<void> => {
    try {
      const config = await GenerateService.getGenerateConfig()
      setGenerateConfig(config)
      console.log('生成配置加载成功:', config)
    } catch (error) {
      console.error('加载生成配置失败:', error)
      // 使用默认配置
      setGenerateConfig({
        styles: {
          '默认风格': 'default',
          '卡通风格': 'cartoon',
          '写实风格': 'realistic'
        }
      })
    }
  }

  // 加载demo示例数据
  const loadDemoExample = async (): Promise<void> => {
    try {
      setIsLoadingDemo(true)
      const demo = await GenerateService.getDemoExample()
      setDemoExample(demo)
      
      // 预加载视频URL
      const videoUrl = await createVideoUrl(demo.prevVideoUrl)
      setVideoSources(prev => ({
        ...prev,
        [demo.prevVideoUrl]: videoUrl
      }))
      
      // 添加demo卡片消息到聊天
      const demoCardMessage: Message = {
        id: 'demo-card-' + Date.now().toString(),
        type: 'demo-card',
        content: '这是一个示例效果，点击下方动图可以快速体验',
        timestamp: Date.now(),
        isUser: false,
        demoData: {
          videoUrl: demo.prevVideoUrl,
          prompt: demo.prompt
        }
      }
      
      // 添加demo消息（在欢迎消息之后）
      setMessages(prev => [...prev, demoCardMessage])
      
    } catch (error) {
      console.error('加载demo示例失败:', error)
      // 使用默认的示例数据作为后备
      setDemoExample({
        imageUrl: 'https://via.placeholder.com/400x400/FFB6C1/FFFFFF?text=Demo+Image',
        prevVideoUrl: 'https://via.placeholder.com/300x200/FFB6C1/DDDDDD?text=Demo+GIF',
        prompt: '让头发飘动，眼睛眨动，背景添加飘落的樱花特效',
        style: 'default'
      })
      
      // 即使是默认数据也添加到消息中
      const demoCardMessage: Message = {
        id: 'demo-card-fallback-' + Date.now().toString(),
        type: 'demo-card',
        content: '这是一个示例效果，点击下方动图可以快速体验',
        timestamp: Date.now(),
        isUser: false,
        demoData: {
          videoUrl: 'https://via.placeholder.com/300x200/FFB6C1/DDDDDD?text=Demo+GIF',
          prompt: '让头发飘动，眼睛眨动，背景添加飘落的樱花特效'
        }
      }
      
      setMessages(prev => [...prev, demoCardMessage])
      
    } finally {
      setIsLoadingDemo(false)
    }
  }

  // 检测当前环境
  const isH5 = Taro.getEnv() === Taro.ENV_TYPE.WEB

  // 处理视频URL的函数，添加必要的headers
  const createVideoUrl = async (originalUrl: string): Promise<string> => {
    if (!isH5 || !originalUrl) return originalUrl
    
    try {
      // 在H5环境下，通过fetch获取视频内容并创建blob URL
      const response = await fetch(originalUrl, {
        headers: {
          'Accept': 'video/mp4,video/*,*/*;q=0.9',
          'Referer': window.location.origin
        }
      })
      
      if (response.ok) {
        const blob = await response.blob()
        const blobUrl = URL.createObjectURL(blob)
        return blobUrl
      }
    } catch (error) {
      console.warn('Failed to load video with headers, falling back to direct URL:', error)
    }
    
    return originalUrl
  }

  // 启用拖拽上传（仅H5环境）
  useEffect(() => {
    if (isH5 && uploadAreaRef.current) {
      const cleanup = H5UploadUtils.enableDragAndDrop(
        uploadAreaRef.current,
        handleDragAndDrop
      )
      
      return cleanup
    }
  }, [isH5, uploadAreaRef.current])

  // 组件卸载时清理SSE连接和视频blob URLs
  useEffect(() => {
    return () => {
      if (cleanupFunction) {
        cleanupFunction()
      }
      // 清理所有blob URLs
      Object.values(videoSources).forEach(url => {
        if (url.startsWith('blob:')) {
          URL.revokeObjectURL(url)
        }
      })
    }
  }, [cleanupFunction, videoSources])

  // 处理拖拽上传
  const handleDragAndDrop = async (files: File[]): Promise<void> => {
    setIsDragOver(false) // 重置拖拽状态
    
    if (files.length === 0) return
    
    // 只处理第一个文件
    const file = files[0]
    await handleFileUpload(file)
  }

  // 拖拽进入事件
  const handleDragEnter = (): void => {
    setIsDragOver(true)
  }

  // 拖拽离开事件
  const handleDragLeave = (): void => {
    setIsDragOver(false)
  }

  // 获取图片尺寸
  const getImageDimensions = (file: File): Promise<{width: number, height: number}> => {
    return new Promise((resolve, reject) => {
      const img = new window.Image()
      img.onload = () => {
        resolve({ width: img.width, height: img.height })
        URL.revokeObjectURL(img.src) // 清理内存
      }
      img.onerror = reject
      img.src = URL.createObjectURL(file)
    })
  }

  // 处理文件上传
  const handleFileUpload = async (file:File): Promise<void> => {
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
      
      // 获取图片尺寸
      const dimensions = await getImageDimensions(file)
      
      // 验证图片尺寸范围
      if (dimensions.width < 300 || dimensions.height < 300 || dimensions.width > 3000 || dimensions.height > 3000) {
        throw new Error('图片尺寸不符合要求，请上传300×300至3000×3000范围内的图片')
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
        const { imageUrl } = await UploadService.uploadImage(
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
          width: dimensions.width,
          height: dimensions.height,
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
        
        // 小程序环境获取图片信息
        const imageInfo = await new Promise<{width: number, height: number}>((resolve, reject) => {
          Taro.getImageInfo({
            src: localPath,
            success: (res) => resolve({ width: res.width, height: res.height }),
            fail: reject
          })
        })
        
        // 验证图片尺寸范围
        if (imageInfo.width < 300 || imageInfo.height < 300 || imageInfo.width > 3000 || imageInfo.height > 3000) {
          throw new Error('图片尺寸不符合要求，请上传300×300至3000×3000范围内的图片')
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
          const { imageUrl } = await UploadService.uploadImage(
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
            width: imageInfo.width,
            height: imageInfo.height,
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
      type: 'text',
      content: inputText.trim() || '生成图片',
      timestamp: Date.now(),
      isUser: true
    }

    // 先添加图片消息（如果有的话），再添加文本消息
    const messagesToAdd = []
    
    if (uploadedImage) {
      const imageMessage: Message = {
        id: (Date.now() - 1).toString(),
        type: 'image',
        content: uploadedImage.url,
        timestamp: Date.now() - 1,
        isUser: true
      }
      messagesToAdd.push(imageMessage)
    }
    
    messagesToAdd.push(userMessage)
    setMessages(prev => [...prev, ...messagesToAdd])

    // 显示AI正在处理的消息
    setShowTyping(true)
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
        style: modalParams.style
      }
      
      // 如果有上传的图片，添加imageUrl
      if (uploadedImage?.url) {
        // 开发环境使用固定的线上图片URL
        if (process.env.NODE_ENV === 'development') {
          requestData.imageUrl = 'https://n.sinaimg.cn/sinakd20120/287/w894h993/20230131/6128-b0868578421793c38d18b1e229624512.jpg'
        } else {
          requestData.imageUrl = uploadedImage.url
        }
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
            // 不显示连接状态消息，直接保持原有的处理状态
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

      // 清空输入数据
      setInputText('')
      setUploadedImage(null)
      
      // 关闭弹窗
      handleModalClose()
      
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
  const handleImagePreview = (url: string, messageId: string): void => {
    // 其他情况正常预览
    Taro.previewImage({
      urls: [url],
      current: url
    })
  }

  // 处理demo卡片点击
  const handleDemoCardClick = (messageId: string): void => {
    // 如果是demo卡片消息，自动填充参数并打开弹窗
    if (messageId.includes('demo-card')) {
      const message = messages.find(msg => msg.id === messageId)
      if (message && message.demoData) {
        // 创建示例图片对象
        const exampleImage: UploadedImage = {
          id: 'demo-' + Date.now().toString(),
          url: demoExample?.imageUrl || '',
          name: '示例图片.jpg',
          size: 2048000, // 模拟大小 2MB
          width: 1024,
          height: 1024,
          uploadTime: Date.now()
        }
        
        // 设置图片和文本
        setUploadedImage(exampleImage)
        setInputText(message.demoData.prompt)
        
        // 打开弹窗
        setShowModal(true)
      }
    }
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
    
    // 隐藏typing动画并重置处理状态
    setShowTyping(false)
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
    
    // 隐藏typing动画并重置处理状态
    setShowTyping(false)
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
  }

  // 处理连接错误事件
  const handleConnectionError = (error: Error, messageId: string) => {
    console.error('SSE连接错误:', error)
    
    // 隐藏typing动画并重置处理状态
    setShowTyping(false)
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
  }

  // 处理悬浮按钮点击
  const handleFloatingButtonClick = () => {
    setShowModal(true)
  }

  // 处理弹窗关闭
  const handleModalClose = () => {
    setIsModalClosing(true)
    // 等待动画完成后关闭弹窗
    setTimeout(() => {
      setShowModal(false)
      setIsModalClosing(false)
      // 清空弹窗内容
      setInputText('')
      setUploadedImage(null)
      setUploadProgress(0)
      setIsUploading(false)
    }, 300) // 与 CSS 动画时间一致
  }

  // 处理参数输入变化
  const handleParamChange = (key: string, value: any) => {
    setModalParams(prev => ({
      ...prev,
      [key]: value
    }))
  }

  // 处理参数确认
  const handleParamConfirm = () => {
    console.log('应用参数:', modalParams)
    Taro.showToast({
      title: '参数已应用',
      icon: 'success'
    })
    setShowModal(false)
  }

  return (
    <View className='workspace'>
      {/* 头部LOGO */}
      <View className='header'>
        <View className='creativity-logo'>
          <Text className='creativity-letter c'>C</Text>
          <Text className='creativity-letter r'>R</Text>
          <Text className='creativity-letter e'>E</Text>
          <Text className='creativity-letter a'>A</Text>
          <Text className='creativity-letter t'>T</Text>
          <Text className='creativity-letter i'>I</Text>
          <Text className='creativity-letter v'>V</Text>
          <Text className='creativity-letter i2'>I</Text>
          <Text className='creativity-letter t2'>T</Text>
          <Text className='creativity-letter y'>Y</Text>
        </View>
      </View>

      {/* 主要内容区域 */}
      <View className='main-content'>

        {/* 聊天消息区域 */}
        {messages.length > 0 && (
          <View className='chat-messages'>
            {messages.map((message) => (
              <View 
                key={message.id} 
                className={`message-wrapper ${message.isUser ? 'user-message-wrapper' : 'ai-message-wrapper'}`}
              >
                {!message.isUser && (
                  <View className='ai-avatar'>
                    <Image 
                      className='avatar-image'
                      src={require('../../assets/robot-avatar.png')}
                      mode='aspectFit'
                    />
                  </View>
                )}
                
                <View className={`message-bubble ${message.isUser ? 'chat-bubble-right' : 'chat-bubble-left'}`}>
                  {message.type === 'text' ? (
                    <Text className='bubble-text'>{message.content}</Text>
                  ) : message.type === 'demo-card' ? (
                    <View className='demo-card' onClick={() => handleDemoCardClick(message.id)}>
                      <Text className='demo-card-title'>{message.content}</Text>
                      <View className='demo-video-container'>
                        <Video 
                          className='demo-video' 
                          src={videoSources[message.demoData?.videoUrl || ''] || message.demoData?.videoUrl || ''} 
                          poster={demoExample?.imageUrl || ''}
                          controls={false}
                          autoplay={true}
                          loop={true}
                          muted={true}
                          showPlayBtn={false}
                          showCenterPlayBtn={false}
                          showProgress={false}
                          showFullscreenBtn={false}
                          objectFit='contain'
                          onPlay={() => console.log('Demo video started playing')}
                          onError={(e) => {
                            console.error('Demo video error:', e)
                            // 如果视频加载失败，尝试重新加载
                            if (message.demoData?.videoUrl && !videoSources[message.demoData.videoUrl]) {
                              createVideoUrl(message.demoData.videoUrl).then(url => {
                                setVideoSources(prev => ({
                                  ...prev,
                                  [message.demoData!.videoUrl]: url
                                }))
                              })
                            }
                          }}
                          onLoadedData={() => {
                            console.log('Demo video loaded successfully')
                            // 视频加载成功储会自动播放（由于autoplay=true）
                          }}
                        />
                        <View className='demo-play-overlay' onClick={() => {
                          const videoElement = document.querySelector(`video[src*="${message.demoData?.videoUrl?.split('/').pop()}"]`) as HTMLVideoElement
                          if (videoElement) {
                            if (videoElement.paused) {
                              videoElement.play().catch(e => console.log('Manual play prevented:', e))
                            } else {
                              videoElement.pause()
                            }
                          }
                        }}>
                          <View className='demo-play-button'>
                            <Text className='demo-play-icon'>▶</Text>
                          </View>
                        </View>
                      </View>
                      <Text className='demo-prompt'>{message.demoData?.prompt}</Text>
                      <View className='demo-action-hint'>
                        <Text className='demo-hint-text'>👆 点击卡片快速体验</Text>
                      </View>
                    </View>
                  ) : (
                    <View className='bubble-image-container'>
                      <Image 
                        className='bubble-image' 
                        src={message.content} 
                        mode='aspectFit'
                        onClick={() => handleImagePreview(message.content, message.id)}
                      />
                    </View>
                  )}
                </View>

                {message.isUser && (
                  <View className='user-avatar'>
                    {userState.user?.userAvatar ? (
                      <Image 
                        className='avatar-image'
                        src={userState.user.userAvatar}
                        mode='aspectFit'
                      />
                    ) : (
                      <Text className='user-icon'>👤</Text>
                    )}
                  </View>
                )}
              </View>
            ))}

            {/* AI输入动画效果 */}
            {showTyping && (
              <View className='message-wrapper ai-message-wrapper ai-typing-message'>
                <View className='ai-avatar'>
                  <Image 
                    className='avatar-image'
                    src={require('../../assets/robot-avatar.png')}
                    mode='aspectFit'
                  />
                </View>
                <View className='message-bubble chat-bubble-left'>
                  <View className='ai-input-indicator'>
                    <View className='ai-circle small'></View>
                    <View className='ai-circle medium'></View>
                    <View className='ai-circle large'></View>
                    <View className='ai-circle medium'></View>
                    <View className='ai-circle small'></View>
                  </View>
                </View>
              </View>
            )}
          </View>
        )}
      </View>


      {/* 悬浮按钮 */}
      <View 
        className='floating-button'
        onClick={handleFloatingButtonClick}
      >
        <Image 
          className='floating-button-icon'
          src={require('../../assets/button.png')}
          mode='aspectFit'
        />
      </View>

      {/* 参数设置弹窗 */}
      {showModal && (
        <View className='modal-overlay' onClick={handleModalClose}>
          <View className={`modal-content ${isModalClosing ? 'closing' : ''}`} onClick={(e) => e.stopPropagation()}>
            
            <View className='modal-body'>
              {/* 图片上传区域 */}
              <View className='param-group'>
                <Text className='param-label'>上传图片</Text>
                <View 
                  className={`modal-upload-zone ${uploadedImage ? 'has-image' : ''}`}
                  onClick={handleChooseImage}
                >
                  {!uploadedImage ? (
                    <View className='modal-upload-placeholder'>
                      <View className='modal-upload-icon'>
                        <Text>📁</Text>
                      </View>
                      <Text className='modal-upload-text'>点击上传或拖拽图片到此处</Text>
                      <Text className='modal-upload-hint'>支持 JPG、PNG 格式</Text>
                      <Text className='modal-upload-hint'>宽高范围：300×300 ~ 3000×3000</Text>
                      <Text className='modal-upload-hint'>图片大小不超过10M</Text>
                    </View>
                  ) : (
                    <View className='modal-uploaded-display'>
                      <Image 
                        className='modal-uploaded-image'
                        src={uploadedImage.url}
                        mode='aspectFit'
                      />
                      <View className='modal-remove-image' onClick={handleRemoveImage}>
                        <Text>×</Text>
                      </View>
                    </View>
                  )}
                  
                  {/* 图片信息显示 */}
                  {uploadedImage && (
                    <View className='modal-image-info'>
                      <Text className='image-info-text'>
                        尺寸: {uploadedImage.width || '未知'} × {uploadedImage.height || '未知'} | 
                        大小: {uploadedImage.size > 0 ? (uploadedImage.size / 1024 / 1024).toFixed(2) + 'MB' : '未知'}
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              {/* 上传进度 */}
              {isUploading && uploadProgress > 0 && (
                <View className='modal-upload-progress'>
                  <Progress 
                    percent={uploadProgress} 
                    strokeWidth={3}
                    color='#4A90E2'
                    backgroundColor='#E5E5EA'
                  />
                  <Text className='modal-progress-text'>{uploadProgress}%</Text>
                </View>
              )}

              {/* 文本输入框 */}
              <View className='param-group'>
                <View className='param-label-container'>
                  <Text className='param-label'>动画描述</Text>
                  <Text className='char-counter'>{inputText.length}/300</Text>
                </View>
                <Textarea
                  className='modal-text-input'
                  value={inputText}
                  onInput={handleInputChange}
                  placeholder='描述你想要的动画效果...'
                  placeholderClass='modal-input-placeholder'
                  autoHeight
                  maxlength={300}
                  showConfirmBar={false}
                />
              </View>

              {/* 样式选择 */}
              {generateConfig && (
                <View className='param-group'>
                  <Text className='param-label'>动画风格</Text>
                  <View className='param-options'>
                    {Object.entries(generateConfig.styles).map(([label, value]) => (
                      <View 
                        key={value}
                        className={`param-option ${modalParams.style === value ? 'active' : ''}`}
                        onClick={() => handleParamChange('style', value)}
                      >
                        <Text className='option-text'>{label}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>

            <View className='modal-footer'>
              <Button className='modal-confirm modal-single-button' onClick={handleSendMessage}>
                <Text className='modal-confirm-text'>生成</Text>
                <View className='modal-cost-info'>
                  <Text className='modal-cost-amount'>-100</Text>
                  <Image 
                    className='modal-currency-icon'
                    src={require('../../assets/currency.png')}
                    mode='aspectFit'
                  />
                </View>
              </Button>
            </View>
          </View>
        </View>
      )}
    </View>
  )
}
