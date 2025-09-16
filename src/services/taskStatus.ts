import { RequestService } from '../utils/request';

// 任务状态响应接口
export interface TaskStatusResponse {
  taskId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  message?: string;
  // 完成时的额外数据
  gifUrl?: string;
  gifFileSize?: number;
  gifWidth?: number;
  gifHeight?: number;
  actualDuration?: number;
  // 失败时的错误信息
  error?: string;
  errorCode?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * 任务状态查询服务
 * 用于小程序环境下轮询任务状态
 */
export class TaskStatusService {
  /**
   * 查询任务状态
   * @param taskId 任务ID
   * @returns 任务状态信息
   */
  static async getTaskStatus(taskId: string): Promise<TaskStatusResponse> {
    try {
      return await RequestService.get<TaskStatusResponse>(`/tasks/${taskId}/status`);
    } catch (error) {
      console.error('查询任务状态失败:', error);

      // 重新抛出错误，保持原始错误信息，让上层处理具体的错误类型
      if (error instanceof Error) {
        throw error;
      }

      throw new Error('获取任务状态失败，请稍后重试');
    }
  }

  /**
   * 批量查询任务状态
   * @param taskIds 任务ID数组
   * @returns 任务状态信息数组
   */
  static async getBatchTaskStatus(taskIds: string[]): Promise<TaskStatusResponse[]> {
    try {
      return await RequestService.post<TaskStatusResponse[]>('/tasks/batch-status', { taskIds });
    } catch (error) {
      console.error('批量查询任务状态失败:', error);
      throw new Error('批量获取任务状态失败，请稍后重试');
    }
  }

  /**
   * 取消任务
   * @param taskId 任务ID
   * @returns 取消结果
   */
  static async cancelTask(taskId: string): Promise<{ success: boolean; message: string }> {
    try {
      return await RequestService.post<{ success: boolean; message: string }>(`/tasks/${taskId}/cancel`);
    } catch (error) {
      console.error('取消任务失败:', error);
      throw new Error('取消任务失败，请稍后重试');
    }
  }
}