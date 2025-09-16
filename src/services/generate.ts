import { RequestService } from '../utils/request'
import { TaskSSEAdapter, TaskListenerCallbacks } from './sseAdapter'

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
      // 直接重新抛出原始错误，保留错误码信息
      throw error;
    }
  }

  /**
   * 监听任务状态更新 - 使用新的SSE适配器
   */
  static listenToTaskStatus(
    taskId: string,
    callbacks: TaskListenerCallbacks,
    sseUrl?: string
  ): () => void {

    // 开发环境mock SSE流
    if (process.env.NODE_ENV === 'development') {
      let isCancelled = false

      // 模拟SSE事件序列
      const mockSSESequence = async () => {
        if (isCancelled) return

        // 1. 连接成功
        setTimeout(() => {
          if (!isCancelled) {
            callbacks.onConnected && callbacks.onConnected()
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
      }
    }

    // 生产环境使用新的SSE适配器
    const adapter = new TaskSSEAdapter(taskId, callbacks, sseUrl)
    return adapter.startListening()
  }
}