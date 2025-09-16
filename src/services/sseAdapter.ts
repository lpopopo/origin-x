import { RequestService } from '../utils/request';

// 任务状态事件类型
export interface TaskStatusEvent {
  taskId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  message?: string;
}

export interface TaskFinishedEvent {
  taskId: string;
  status: 'completed' | 'failed';
  progress: number;
  gifUrl?: string;
  gifFileSize?: number;
  gifWidth?: number;
  gifHeight?: number;
  actualDuration?: number;
  error?: string;
  errorCode?: string;
}

export interface TaskErrorEvent {
  error: string;
  errorCode?: string;
}

// 任务监听回调
export interface TaskListenerCallbacks {
  onConnected?: () => void;
  onStatusUpdate?: (data: TaskStatusEvent) => void;
  onFinished?: (data: TaskFinishedEvent) => void;
  onError?: (data: TaskErrorEvent) => void;
  onConnectionError?: (error: Error) => void;
}

/**
 * 任务状态SSE适配器
 * 使用统一的RequestService创建SSE连接
 */
export class TaskSSEAdapter {
  private cleanup?: () => void;
  private taskId: string;
  private sseUrl?: string;
  private callbacks: TaskListenerCallbacks;

  constructor(taskId: string, callbacks: TaskListenerCallbacks, sseUrl?: string) {
    this.taskId = taskId;
    this.sseUrl = sseUrl;
    this.callbacks = callbacks;
  }

  /**
   * 开始监听任务状态
   */
  public startListening(): () => void {
    // 使用服务端返回的sseUrl或构建默认URL
    const sseUrl = this.sseUrl || `/sse/tasks/${this.taskId}/stream`;

    // 使用统一的RequestService创建SSE连接
    this.cleanup = RequestService.createSSEConnection(
      sseUrl,
      {
        onOpen: () => {
          this.callbacks.onConnected?.();
        },
        onMessage: (data: any) => {
          this.handleSSEMessage(data);
        },
        onError: (error: Error) => {
          this.callbacks.onConnectionError?.(error);
        },
        onClose: () => {
          // SSE连接关闭
        }
      },
      {
        timeout: 30000,
        retryDelay: 3000,
        maxRetryCount: 10
      }
    );

    // 返回清理函数
    return () => {
      this.cleanup?.();
    };
  }

  /**
   * 处理SSE消息
   */
  private handleSSEMessage(sseEvent: any): void {
    try {
      // 新的SSE消息格式包含type和data字段
      // 例如: { type: 'status', data: { taskId, status, progress }, id, retry }
      const { type, data } = sseEvent;

      if (!type || !data) {
        // 兼容旧格式：直接的状态数据
        this.handleLegacyMessage(sseEvent);
        return;
      }

      // 处理标准SSE事件格式
      this.handleTypedMessage(type, data);

    } catch (error) {
      console.error('处理SSE消息失败:', error);
    }
  }

  /**
   * 处理任务完成消息的通用逻辑
   */
  private handleFinishedMessage(data: any): void {
    const finishedEvent: TaskFinishedEvent = {
      taskId: data.taskId || this.taskId,
      status: data.status === 'failed' ? 'failed' : 'completed',
      progress: data.progress || (data.status === 'completed' ? 100 : 0),
      gifUrl: data.gifUrl,
      gifFileSize: data.gifFileSize,
      gifWidth: data.gifWidth,
      gifHeight: data.gifHeight,
      actualDuration: data.actualDuration,
      error: data.error,
      errorCode: data.errorCode
    };

    this.callbacks.onFinished?.(finishedEvent);
    this.cleanup?.(); // 任务完成，清理连接
  }

  /**
   * 处理带类型的SSE消息
   */
  private handleTypedMessage(type: string, data: any): void {
    // 验证taskId匹配（如果消息包含taskId）
    if (data.taskId && data.taskId !== this.taskId) {
      return; // 忽略不匹配的任务消息
    }

    switch (type) {
      case 'connected':
        // 连接建立消息
        // event: connected
        // data: {"message":"已连接到任务状态流","taskId":"task-uuid-string"}
        this.callbacks.onConnected?.();
        break;

      case 'status':
        // 状态更新消息
        // event: status
        // data: {"taskId":"task-uuid-string","status":"processing","progress":45}
        this.callbacks.onStatusUpdate?.({
          taskId: data.taskId || this.taskId,
          status: data.status,
          progress: data.progress || 0,
          message: data.message
        });
        break;

      case 'message':
        // 处理通用message事件，根据data内容判断具体类型
        if (data.status === 'completed' || data.status === 'failed') {
          // 这是一个任务完成消息
          this.handleFinishedMessage(data);
        } else if (data.status === 'processing' || data.status === 'pending') {
          // 这是一个状态更新消息
          this.callbacks.onStatusUpdate?.({
            taskId: data.taskId || this.taskId,
            status: data.status,
            progress: data.progress || 0,
            message: data.message
          });
        }
        break;

      case 'finished':
        // 任务完成消息（成功或失败）
        // event: finished
        // data: {"taskId":"...","status":"completed","progress":100,"gifUrl":"...","gifFileSize":2048000,"gifWidth":512,"gifHeight":512,"actualDuration":4.0}
        // 或者: {"taskId":"...","status":"failed","progress":0,"error":"生成失败","errorCode":"AI_SERVICE_ERROR"}
        this.handleFinishedMessage(data);
        break;

      case 'error':
        // 错误消息
        // event: error
        // data: {"error":"任务不存在或无权限访问"}
        this.callbacks.onError?.({
          error: data.error || '任务处理失败',
          errorCode: data.errorCode
        });
        this.cleanup?.(); // 发生错误，清理连接
        break;

      default:
        // 对于未知类型，不做处理，避免误触发回调
        break;
    }
  }

  /**
   * 处理兼容旧格式的消息
   */
  private handleLegacyMessage(data: any): void {
    if (!data || typeof data !== 'object') {
      return;
    }

    const { status, progress, taskId } = data;

    // 验证taskId匹配
    if (taskId && taskId !== this.taskId) {
      return;
    }

    switch (status) {
      case 'pending':
      case 'processing':
        this.callbacks.onStatusUpdate?.({
          taskId: this.taskId,
          status,
          progress: progress || 0,
          message: data.message
        });
        break;

      case 'completed':
        this.callbacks.onFinished?.({
          taskId: this.taskId,
          status: 'completed',
          progress: 100,
          gifUrl: data.gifUrl,
          gifFileSize: data.gifFileSize,
          gifWidth: data.gifWidth,
          gifHeight: data.gifHeight,
          actualDuration: data.actualDuration
        });
        this.cleanup?.();
        break;

      case 'failed':
        this.callbacks.onFinished?.({
          taskId: this.taskId,
          status: 'failed',
          progress: progress || 0,
          error: data.error || data.message || '任务失败',
          errorCode: data.errorCode
        });
        this.cleanup?.();
        break;

      default:
        if (data.error || data.message) {
          this.callbacks.onError?.({
            error: data.error || data.message || '任务处理失败',
            errorCode: data.errorCode
          });
        }
    }
  }

  /**
   * 手动触发状态更新（用于测试）
   */
  public simulateStatusUpdate(status: string, progress: number): void {
    this.handleLegacyMessage({
      taskId: this.taskId,
      status,
      progress,
      message: `模拟状态: ${status}`
    });
  }
}