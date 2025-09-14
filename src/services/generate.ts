import Taro from '@tarojs/taro'
import XRequest from '../utils/xRequest'
import { RequestService } from '../utils/request'

const safeParseJson = (json: string) => {
  try {
    return JSON.parse(json)
  } catch (error) {
    return null
  }
}

export interface GenerateTaskRequest {
  prompt: string
  objectKey?: string
}

export interface GenerateTaskResponse {
  message: string
  progress: number
  sseUrl: string
  status: string
  taskId: string
}

export interface SSEMessage {
  event: string
  data: any
}

export interface TaskStatusEvent {
  taskId: string
  status: string
  progress: number
}

export interface TaskFinishedEvent {
  taskId: string
  status: string
  progress: number
  gifUrl?: string
  gifFileSize?: number
  gifWidth?: number
  gifHeight?: number
  actualDuration?: number
  error?: string
  errorCode?: string
}

export interface TaskErrorEvent {
  error: string
}

export interface DemoExample {
  imageUrl: string
  prevVideoUrl: string
  prompt: string
  style: string
}

// 生成配置类型
export interface GenerateConfig {
  styles: Record<string, string>
}

export class GenerateService {
  /**
   * 获取生成配置选项
   */
  static async getGenerateConfig(): Promise<GenerateConfig> {
    try {
      return await RequestService.get<GenerateConfig>('/generate/config');
    } catch (error) {
      console.error('获取生成配置失败:', error)
      throw new Error('获取配置失败，请稍后重试')
    }
  }

  /**
   * 获取demo示例
   */
  static async getDemoExample(): Promise<DemoExample> {
    try {
      // 开发环境mock数据
      if (process.env.NODE_ENV === 'development') {
        console.log('DEV模式: 使用mock demo示例')
        await new Promise(resolve => setTimeout(resolve, 300)) // 模拟网络延迟
        return {
          imageUrl: 'https://img.52725.uno/demo.jpeg',
          prevVideoUrl: 'https://img.52725.uno/demo.mp4',
          prompt: '欢快的跳起舞来',
          style: 'style-b'
        }
      }
      
      return await RequestService.get<DemoExample>('/generate/demo');
    } catch (error) {
      console.error('获取demo示例失败:', error)
      throw new Error('获取示例失败，请稍后重试')
    }
  }

  /**
   * 创建生成任务
   */
  static async createTask(request: GenerateTaskRequest): Promise<GenerateTaskResponse> {
    try {
      // 开发环境mock数据
      if (process.env.NODE_ENV === 'development') {
        console.log('DEV模式: 使用mock任务创建响应')
        await new Promise(resolve => setTimeout(resolve, 500)) // 模拟网络延迟
        return {
          message: 'Task created successfully',
          progress: 0,
          sseUrl: `https://52725.uno/api/v1/sse/tasks/mock-task-id/stream`,
          status: 'pending',
          taskId: 'mock-task-' + Date.now()
        }
      }
      
      return await RequestService.post<GenerateTaskResponse>('/generate', request);
    } catch (error) {
      console.error('创建生成任务失败:', error)
      throw new Error('创建任务失败，请稍后重试')
    }
  }

  /**
   * 监听任务状态更新
   */
  static listenToTaskStatus(
    taskId: string,
    callbacks: {
      onConnected?: (data: any) => void
      onStatusUpdate?: (data: TaskStatusEvent) => void
      onFinished?: (data: TaskFinishedEvent) => void
      onError?: (data: TaskErrorEvent) => void
      onConnectionError?: (error: Error) => void
    }
  ): () => void {
    
    // 开发环境mock SSE流
    if (process.env.NODE_ENV === 'development') {
      console.log('DEV模式: 使用mock SSE流')
      
      let isCancelled = false
      
      // 模拟SSE事件序列
      const mockSSESequence = async () => {
        if (isCancelled) return
        
        // 1. 连接成功
        setTimeout(() => {
          if (!isCancelled) {
            callbacks.onConnected && callbacks.onConnected({ event: 'connected', message: 'Connected to mock SSE' })
          }
        }, 100)
        
        // 2. 状态更新 - 处理中 0%
        setTimeout(() => {
          if (!isCancelled) {
            callbacks.onStatusUpdate && callbacks.onStatusUpdate({
              taskId,
              status: 'processing',
              progress: 0
            })
          }
        }, 500)
        
        // 3. 状态更新 - 处理中 25%
        setTimeout(() => {
          if (!isCancelled) {
            callbacks.onStatusUpdate && callbacks.onStatusUpdate({
              taskId,
              status: 'processing',
              progress: 25
            })
          }
        }, 1500)
        
        // 4. 状态更新 - 处理中 50%
        setTimeout(() => {
          if (!isCancelled) {
            callbacks.onStatusUpdate && callbacks.onStatusUpdate({
              taskId,
              status: 'processing',
              progress: 50
            })
          }
        }, 2500)
        
        // 5. 状态更新 - 处理中 75%
        setTimeout(() => {
          if (!isCancelled) {
            callbacks.onStatusUpdate && callbacks.onStatusUpdate({
              taskId,
              status: 'processing',
              progress: 75
            })
          }
        }, 3500)
        
        // 6. 完成
        setTimeout(() => {
          if (!isCancelled) {
            callbacks.onFinished && callbacks.onFinished({
              taskId,
              status: 'completed',
              progress: 100,
              gifUrl: 'https://img.52725.uno/generated/2fc1c828-9e18-408e-a1eb-033154ff3a4a/f19121ec.gif',
              gifFileSize: 2048000, // 2MB
              gifWidth: 512,
              gifHeight: 512,        
              actualDuration: 3
            })
          }
        }, 4500)
      }
      
      // 启动mock序列
      mockSSESequence()
      
      // 返回清理函数
      return () => {
        isCancelled = true
        console.log('DEV模式: mock SSE已取消')
      }
    }
    try {
      // 使用 x-request 工具函数创建 SSE 连接
      const xRequest = XRequest({
        baseURL: `https://52725.uno/api/v1/sse/tasks/${taskId}/stream`,
      })
      // 创建 AbortController 用于控制连接
      const abortController = new AbortController()

      // 调用 x-request 的 create 方法处理 SSE 流
      xRequest.create(
        {
          stream: true,
        },
        {
          onSuccess: (chunks) => {
            console.log('SSE 流处理完成，共收到', chunks.length, '个数据块')
          },
          onError: (error) => {
            console.error('SSE 连接错误:', error)
            callbacks.onConnectionError && callbacks.onConnectionError(error)
          },
          onUpdate: (chunk) => {
            try {
              console.log('SSE事件数据:', chunk)
              
              // 根据事件类型处理不同的状态
              // 优先使用chunk中的event字段
              const eventType = chunk.event
              const data = safeParseJson(chunk.data)
              
              switch (eventType) {
                case 'connected':
                  console.log('收到connected事件:', data)
                  callbacks.onConnected && callbacks.onConnected(chunk)
                  break
                case 'status':
                  console.log('收到status事件:', data)
                  // 将 SSE 数据转换为 TaskStatusEvent 类型
                  const statusEvent: TaskStatusEvent = {
                    taskId: (data && data.taskId) || taskId,
                    status: (data && data.status) || 'unknown',
                    progress: (data && data.progress) || 0
                  }
                  callbacks.onStatusUpdate && callbacks.onStatusUpdate(statusEvent)
                  break
                case 'finished':
                  console.log('收到finished事件:', data)
                  // 将 SSE 数据转换为 TaskFinishedEvent 类型
                  const finishedEvent: TaskFinishedEvent = {
                    taskId: (data && data.taskId) || taskId,
                    status: (data && data.status) || 'finished',
                    progress: (data && data.progress) || 100,
                    gifUrl: data && data.gifUrl,
                    gifFileSize: data && data.gifFileSize,
                    gifWidth: data && data.gifWidth,
                    gifHeight: data && data.gifHeight,
                    actualDuration: data && data.actualDuration,
                    error: data && data.error,
                    errorCode: data && data.errorCode
                  }
                  callbacks.onFinished && callbacks.onFinished(finishedEvent)
                  break
                case 'error':
                  console.log('收到error事件:', chunk)
                  // 将 SSE 数据转换为 TaskErrorEvent 类型
                  const errorEvent: TaskErrorEvent = {
                    error: (data && data.error) || data || '未知错误'
                  }
                  callbacks.onError && callbacks.onError(errorEvent)
                  break
                default:
                  console.log('未知事件类型:', eventType, chunk)
              }
            } catch (parseError) {
              console.error('解析SSE数据失败:', parseError, '原始数据:', chunk)
            }
          },
          onStream: (controller) => {
            // 保存 AbortController 引用，用于后续清理
            Object.assign(abortController, controller)
          }
        }
      ).catch((error) => {
        console.error('建立SSE连接失败:', error)
        const connectionError = new Error('建立SSE连接失败')
        callbacks.onConnectionError && callbacks.onConnectionError(connectionError)
      })

      // 设置超时，避免长时间等待
      const timeoutId = setTimeout(() => {
        if (abortController.signal.aborted === false) {
          abortController.abort()
          callbacks.onConnectionError && callbacks.onConnectionError(new Error('连接超时'))
        }
      }, 300000) // 5分钟超时

      // 返回清理函数
      return () => {
        clearTimeout(timeoutId)
        if (abortController.signal.aborted === false) {
          abortController.abort()
        }
      }
    } catch (error) {
      console.error('建立SSE连接失败:', error)
      const connectionError = new Error('建立SSE连接失败')
      callbacks.onConnectionError && callbacks.onConnectionError(connectionError)
      return () => {}
    }
  }
}
