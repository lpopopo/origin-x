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
  type: 'text' | 'image' | 'demo-card' | 'loading'
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
  const [isDragOver, setIsDragOver] = useState<boolean>(false)
  const [demoExample, setDemoExample] = useState<DemoExample | null>(null)
  const [isLoadingDemo, setIsLoadingDemo] = useState<boolean>(false)
  const [generateConfig, setGenerateConfig] = useState<GenerateConfig | null>(null)
  const [tabBarHeight, setTabBarHeight] = useState<number>(50) // tabBar高度
  const [inputOptions, setInputOptions] = useState<string[]>([]) // 输入选项
  const [selectedStyle, setSelectedStyle] = useState<string>('default') // 选中的风格
  const [showStyleDropdown, setShowStyleDropdown] = useState<boolean>(false) // 是否显示风格下拉框
  const uploadAreaRef = useRef<any>(null)
  const inputRef = useRef<any>(null)
  const buttonRef = useRef<any>(null)

  useLoad(() => {
    console.log('Workspace page loaded.')
    loadDemoExample()
    loadGenerateConfig()
    loadInputOptions()
    getTabBarHeight()
    
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

  // 获取tabBar高度
  const getTabBarHeight = (): void => {
    try {
      // 获取系统信息
      Taro.getSystemInfo({
        success: (res) => {
          console.log('系统信息:', res)
          let calculatedHeight = 50 // 默认高度
          
          if (Taro.getEnv() === Taro.ENV_TYPE.WEAPP) {
            // 微信小程序环境
            const safeAreaInsetBottom = res.safeArea ? res.screenHeight - res.safeArea.bottom : 0
            calculatedHeight = res.platform === 'ios' ? 49 + safeAreaInsetBottom : 50
          } else if (Taro.getEnv() === Taro.ENV_TYPE.WEB) {
            // H5环境，可以通过DOM查询
            setTimeout(() => {
              // 尝试多种选择器来查找tabBar
              const tabBarSelectors = [
                '.taro-tabbar__tabbar',
                '.taro-tabbar',
                '[role="tablist"]',
                '.tabbar'
              ]
              
              let tabBar = null
              for (const selector of tabBarSelectors) {
                tabBar = document.querySelector(selector)
                if (tabBar) break
              }
              
              if (tabBar) {
                const rect = tabBar.getBoundingClientRect()
                calculatedHeight = rect.height
                setTabBarHeight(calculatedHeight)
                console.log('检测到的tabBar高度:', calculatedHeight, 'selector:', tabBar.className)
                
                // 同时更新主内容区域的padding
                updateMainContentPadding(calculatedHeight)
              } else {
                console.log('未找到tabBar元素，使用默认高度')
                setTabBarHeight(50)
                updateMainContentPadding(50)
              }
            }, 300) // 增加延迟确保DOM完全渲染
            return
          }
          
          setTabBarHeight(calculatedHeight)
          updateMainContentPadding(calculatedHeight)
          console.log('计算的tabBar高度:', calculatedHeight)
        },
        fail: () => {
          console.log('获取系统信息失败，使用默认tabBar高度')
          setTabBarHeight(50)
          updateMainContentPadding(50)
        }
      })
    } catch (error) {
      console.error('获取tabBar高度失败:', error)
      setTabBarHeight(50)
      updateMainContentPadding(50)
    }
  }

  // 更新主内容区域的padding
  const updateMainContentPadding = (tabBarHeight: number): void => {
    const inputAreaHeight = 140 // 估算的输入区域高度
    const totalBottomSpace = inputAreaHeight + tabBarHeight
    
    // 动态设置CSS变量或直接修改样式
    if (typeof document !== 'undefined') {
      document.documentElement.style.setProperty('--tabbar-height', `${tabBarHeight}px`)
      document.documentElement.style.setProperty('--input-area-bottom-space', `${totalBottomSpace}px`)
    }
  }

  // 加载输入选项
  const loadInputOptions = async (): Promise<void> => {
    try {
      // 这里应该调用实际的API接口
      // const options = await SomeService.getInputOptions()
      
      // 暂时使用模拟数据
      const mockOptions = [
        '让头发飘动',
        '眼睛眨动', 
        '微笑',
        '点头',
        '招手',
        '背景特效'
      ]
      setInputOptions(mockOptions)
      console.log('输入选项加载成功:', mockOptions)
    } catch (error) {
      console.error('加载输入选项失败:', error)
      // 使用默认选项
      setInputOptions(['让头发飘动', '眼睛眨动', '微笑'])
    }
  }

  // 处理选项点击
  const handleOptionClick = (option: string): void => {
    // 将选项添加到输入文本中
    const currentText = inputText.trim()
    const newText = currentText ? `${currentText}，${option}` : option
    setInputText(newText)
  }

  // 处理风格选择
  const handleStyleSelect = (styleValue: string): void => {
    setSelectedStyle(styleValue)
    setShowStyleDropdown(false)
  }

  // 获取当前选中风格的显示名称
  const getSelectedStyleLabel = (): string => {
    if (!generateConfig?.styles) return '默认风格'
    
    const entries = Object.entries(generateConfig.styles)
    const found = entries.find(([_, value]) => value === selectedStyle)
    return found ? found[0] : '默认风格'
  }

  // 加载生成配置
  const loadGenerateConfig = async (): Promise<void> => {
    try {
      const config = await GenerateService.getGenerateConfig()
      setGenerateConfig(config)
      
      // 如果当前没有选中的风格，自动选择第一个
      if (config.styles && Object.keys(config.styles).length > 0) {
        const firstStyleValue = Object.values(config.styles)[0]
        if (selectedStyle === 'default' || !Object.values(config.styles).includes(selectedStyle)) {
          setSelectedStyle(firstStyleValue)
        }
      }
      
      console.log('生成配置加载成功:', config)
    } catch (error) {
      console.error('加载生成配置失败:', error)
      // 使用默认配置作为后备
      const fallbackConfig = {
        styles: {
          '默认风格': 'default'
        }
      }
      setGenerateConfig(fallbackConfig)
      
      // 设置默认选中第一个风格
      setSelectedStyle('default')
    }
  }

  // 加载demo示例数据
  const loadDemoExample = async (): Promise<void> => {
    try {
      setIsLoadingDemo(true)
      const demo = await GenerateService.getDemoExample()
      setDemoExample(demo)
      
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
      const maxSize = 20 * 1024 * 1024 // 20MB
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
    if (!inputText.trim()) {
      Taro.showToast({
        title: '请输入动画描述文字',
        icon: 'none'
      })
      return
    }
    
    if (!uploadedImage) {
      Taro.showToast({
        title: '请上传图片',
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
      content: inputText.trim(),
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

    // 显示AI正在处理的消息（只显示动画，不显示文本）
    const processingMessage: Message = {
      id: (Date.now() + 2).toString(),
      type: 'loading',
      content: '',
      timestamp: Date.now(),
      isUser: false
    }
    setMessages(prev => [...prev, processingMessage])

    try {
      // 调用API创建任务
      const requestData: any = {
        prompt: inputText.trim(),
        style: selectedStyle
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
      
    } catch (error) {
      console.error('发送消息失败:', error)
      
      // 重置处理状态
      setIsProcessing(false)
      
      // 移除加载消息
      setMessages(prev => prev.filter(msg => msg.id !== processingMessage.id))
      
      // 显示错误提示
      const errorMessage = error instanceof Error ? error.message : '发送失败，请重试'
      Taro.showToast({
        title: errorMessage,
        icon: 'error'
      })
    }
  }

  // 移除上传的图片
  const handleRemoveImage = (e: any): void => {
    e.stopPropagation() // 阻止事件冒泡，避免触发上传
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
    // 如果是demo卡片消息，自动填充参数到输入组件
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
        
        // 直接设置图片和文本到输入组件
        setUploadedImage(exampleImage)
        setInputText(message.demoData.prompt)
        
        // 滚动到输入区域（可选）
        setTimeout(() => {
          const inputArea = document.querySelector('.input-area')
          if (inputArea) {
            inputArea.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
          }
        }, 100)
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
    console.log('status:', status, 'gifUrl:', gifUrl)
    
    // 重置处理状态
    setIsProcessing(false)
    
    if (status === 'completed' && gifUrl) {
      console.log('生成成功，显示GIF:', gifUrl)
      // 任务成功完成，显示生成的GIF
      const successMessage: Message = {
        id: (Date.now() + 3).toString(),
        type: 'image',
        content: gifUrl,
        timestamp: Date.now(),
        isUser: false
      }
      
      // 移除处理消息，添加成功消息
      setMessages(prev => {
        console.log('更新消息列表，移除messageId:', messageId, '添加新消息:', successMessage)
        return [
          ...prev.filter(msg => msg.id !== messageId),
          successMessage
        ]
      })
      
      // 显示成功提示，包含文件信息
      const fileInfo = `生成完成！文件大小: ${(gifFileSize / 1024 / 1024).toFixed(2)}MB, 尺寸: ${gifWidth}x${gifHeight}, 时长: ${actualDuration}秒`
      Taro.showToast({
        title: '生成完成！',
        icon: 'success'
      })
      
      console.log(fileInfo)
    } else if (status === 'failed') {
      console.log('生成失败:', error)
      // 任务失败
      const errorMessage = error || '生成失败'
      const errorDetails = errorCode ? ` (错误代码: ${errorCode})` : ''
      
      // 更新处理消息为失败状态
      setMessages(prev => prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, content: `生成失败: ${errorMessage}${errorDetails}`, type: 'text' }
          : msg
      ))
      
      Taro.showToast({
        title: '生成失败',
        icon: 'none'
      })
    } else {
      console.log('未知状态或缺少gifUrl:', status, gifUrl)
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
                      onError={(e) => {
                        console.error('Robot avatar loading failed')
                        // 用小图标替换失败的机器人头像
                        const imgElement = e.currentTarget
                        if (imgElement && imgElement.parentElement) {
                          imgElement.style.display = 'none'
                          const fallbackIcon = document.createElement('text')
                          fallbackIcon.textContent = '🖼️'
                          fallbackIcon.style.fontSize = '16px'
                          fallbackIcon.style.textAlign = 'center'
                          imgElement.parentElement.appendChild(fallbackIcon)
                        }
                      }}
                    />
                  </View>
                )}
                
                <View className={`message-bubble ${message.isUser ? 'chat-bubble-right' : 'chat-bubble-left'}`}>
                  {message.type === 'text' ? (
                    <Text className='bubble-text'>{message.content}</Text>
                  ) : message.type === 'loading' ? (
                    <View className='ai-input-indicator'>
                      <View className='ai-circle small'></View>
                      <View className='ai-circle medium'></View>
                      <View className='ai-circle large'></View>
                      <View className='ai-circle medium'></View>
                      <View className='ai-circle small'></View>
                    </View>
                  ) : message.type === 'demo-card' ? (
                    <View className='demo-card' onClick={() => handleDemoCardClick(message.id)}>
                      <Text className='demo-card-title'>{message.content}</Text>
                      <View className='demo-video-container'>
{isH5 ? (
                          <>
                            <video 
                              className='demo-video' 
                              src={message.demoData?.videoUrl || ''} 
                              poster={demoExample?.imageUrl || ''}
                              autoPlay
                              loop
                              muted
                              playsInline
                              style={{
                                width: '100%',
                                height: '180px',
                                objectFit: 'cover'
                              }}
                              onLoadedData={() => {
                                console.log('Demo video loaded successfully')
                              }}
                              onError={(e) => {
                                console.error('Demo video error:', e)
                                console.error('Video URL:', message.demoData?.videoUrl)
                                console.error('Poster URL:', demoExample?.imageUrl)
                                // 隐藏video元素，显示fallback
                                const videoElement = e.target as HTMLVideoElement
                                if (videoElement) {
                                  videoElement.style.display = 'none'
                                  const fallbackElement = videoElement.parentElement?.querySelector('.demo-video-fallback') as HTMLDivElement
                                  if (fallbackElement) {
                                    fallbackElement.style.display = 'flex'
                                  }
                                }
                              }}
                            />
                            <View
                              className='demo-video-fallback'
                              style={{
                                width: '100%',
                                height: '180px',
                                display: 'none',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: '#f5f5f5',
                                borderRadius: '8px'
                              }}
                            >
                              <Text className='fallback-icon'>🖼️</Text>
                            </View>
                          </>
                        ) : (
                          <Video 
                            className='demo-video' 
                            src={message.demoData?.videoUrl || ''} 
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
                          />
                        )}
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
                      {isH5 ? (
                        <>
                          <img
                            className='bubble-image'
                            src={message.content}
                            alt='Generated image'
                            style={{
                              width: '100%',
                              maxHeight: '300px',
                              objectFit: 'contain',
                              cursor: 'pointer'
                            }}
                            onClick={() => handleImagePreview(message.content, message.id)}
                            onError={(e) => {
                              console.error('Image loading failed:', message.content)
                              // 隐藏原图片，显示fallback元素
                              const imgElement = e.target as HTMLImageElement
                              if (imgElement) {
                                imgElement.style.display = 'none'
                                const fallbackElement = imgElement.nextElementSibling as HTMLDivElement
                                if (fallbackElement) {
                                  fallbackElement.style.display = 'flex'
                                }
                              }
                            }}
                          />
                          <View
                            className='bubble-image-fallback'
                            style={{ display: 'none' }}
                            onClick={() => handleImagePreview(message.content, message.id)}
                          >
                            <Text className='fallback-icon'>🖼️</Text>
                          </View>
                        </>
                      ) : (
                        <Image
                          className='bubble-image'
                          src={message.content}
                          mode='aspectFit'
                          onClick={() => handleImagePreview(message.content, message.id)}
                          onError={() => {
                            console.error('Image loading failed:', message.content)
                            // 小程序环境：将Image组件替换为小图标显示
                            const imgElement = e.currentTarget
                            if (imgElement && imgElement.parentElement) {
                              imgElement.style.display = 'none'
                              // 创建fallback图标
                              const fallbackIcon = document.createElement('text')
                              fallbackIcon.textContent = '🖼️'
                              fallbackIcon.style.fontSize = '20px'
                              fallbackIcon.style.textAlign = 'center'
                              imgElement.parentElement.appendChild(fallbackIcon)
                            }
                          }}
                        />
                      )}
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
                        onError={(e) => {
                          console.error('User avatar loading failed:', userState.user?.userAvatar)
                          // 用小图标替换失败的用户头像
                          const imgElement = e.currentTarget
                          if (imgElement && imgElement.parentElement) {
                            imgElement.style.display = 'none'
                            const fallbackIcon = document.createElement('text')
                            fallbackIcon.textContent = '🖼️'
                            fallbackIcon.style.fontSize = '16px'
                            fallbackIcon.style.textAlign = 'center'
                            imgElement.parentElement.appendChild(fallbackIcon)
                          }
                        }}
                      />
                    ) : (
                      <Text className='user-icon'>👤</Text>
                    )}
                  </View>
                )}
              </View>
            ))}

          </View>
        )}
      </View>


      {/* 输入区域 */}
      <View className='input-area' style={{ bottom: `${tabBarHeight}px` }}>
        <View className='input-container'>
          <View className='input-card'>
            {/* 主输入区域 - 横向布局 */}
            <View className='input-main-section'>
              {/* 左侧图片上传按钮/图片显示区域 - 3:4比例长矩形 */}
              <View className='image-upload-btn' onClick={handleChooseImage}>
                {uploadedImage ? (
                  <View className='uploaded-image-container'>
                    <Image
                      className='uploaded-image-display'
                      src={uploadedImage.url}
                      mode='aspectFit'
                      onError={(e) => {
                        console.error('Uploaded image display failed:', uploadedImage.url)
                        // 用小图标替换失败的上传图片预览
                        const imgElement = e.currentTarget
                        if (imgElement && imgElement.parentElement) {
                          imgElement.style.display = 'none'
                          const fallbackIcon = document.createElement('text')
                          fallbackIcon.textContent = '🖼️'
                          fallbackIcon.style.fontSize = '16px'
                          fallbackIcon.style.textAlign = 'center'
                          fallbackIcon.style.display = 'flex'
                          fallbackIcon.style.alignItems = 'center'
                          fallbackIcon.style.justifyContent = 'center'
                          fallbackIcon.style.width = '100%'
                          fallbackIcon.style.height = '100%'
                          imgElement.parentElement.appendChild(fallbackIcon)
                        }
                      }}
                    />
                    <View className='remove-image-btn' onClick={handleRemoveImage}>
                      <Text className='remove-image-icon'>×</Text>
                    </View>
                  </View>
                ) : (
                  <Text className='upload-plus-icon'>+</Text>
                )}
              </View>
              
              {/* 中间文本输入区域 */}
              <View className='text-input-wrapper'>
                <Textarea
                  className='main-text-input'
                  value={inputText}
                  onInput={handleInputChange}
                  placeholder='描述你想要的动画效果...'
                  placeholderClass='main-text-placeholder'
                  maxlength={300}
                  showConfirmBar={false}
                  autoHeight={false}
                />
              </View>
            </View>
            
            {/* 底部风格选择和发送按钮区域 */}
            <View className='input-bottom-section'>
              <View className='style-selector-wrapper'>
                <View className='style-dropdown' onClick={() => setShowStyleDropdown(!showStyleDropdown)}>
                  <Text className='style-selected'>{getSelectedStyleLabel()}</Text>
                  <Text className='dropdown-arrow'>{showStyleDropdown ? '▲' : '▼'}</Text>
                  
                  {/* 向上弹出的选项列表 */}
                  {showStyleDropdown && generateConfig?.styles && (
                    <View className='style-options'>
                      {Object.entries(generateConfig.styles).map(([label, value]) => (
                        <View 
                          key={value}
                          className={`style-option ${selectedStyle === value ? 'selected' : ''}`}
                          onClick={(e) => {
                            e.stopPropagation()
                            handleStyleSelect(value)
                          }}
                        >
                          <Text className='style-option-text'>{label}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              </View>
              
              {/* 发送按钮 */}
              <View className='send-button-wrapper'>
                <View className='function-btn send-btn' onClick={handleSendMessage}>
                  <Text className='function-btn-icon'>➤</Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </View>

    </View>
  )
}
