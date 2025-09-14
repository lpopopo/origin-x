import Taro from '@tarojs/taro';

// 后端统一的响应格式
export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
}

// 请求配置接口
export interface RequestConfig {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  data?: any;
  header?: Record<string, string>;
  timeout?: number;
}

// 统一的网络请求工具
export class RequestService {
  private static BASE_URL = 'https://52725.uno/api/v1';

  /**
   * 统一的网络请求方法
   * @param config 请求配置
   * @returns 处理后的响应数据
   */
  static async request<T = any>(config: RequestConfig): Promise<T> {
    try {
      // 添加认证头
      const headers = {
        'Content-Type': 'application/json',
        ...config.header
      };

      const response = await Taro.request({
        credentials: 'include',
        url: config.url.startsWith('http') ? config.url : `${this.BASE_URL}${config.url}`,
        method: config.method || 'GET',
        data: config.data,
        header: headers,
        timeout: config.timeout || 10000,
      });

      // 检查HTTP状态码
      if (response.statusCode !== 200) {
        throw new Error(`HTTP ${response.statusCode}: ${(response.data && response.data.message) || '请求失败'}`);
      }

      // 检查后端业务错误码
      const apiResponse = response.data as ApiResponse<T>;
      
      if (apiResponse.code !== 0) {
        // 处理特定的错误码
        switch (apiResponse.code) {
          case 40001:
          case 40002:
          case 40003:
            // 未授权，跳转到登录页
            Taro.removeStorageSync('userId');
            Taro.showToast({
              title: '登录已过期，请重新登录',
              icon: 'none',
              duration: 2000
            });
            // 可以在这里添加跳转到登录页的逻辑
            break;
          default:
            Taro.showToast({
              title: apiResponse.message || '请求失败',
              icon: 'none',
              duration: 2000
            });
        }
        
        throw new Error(apiResponse.message || `业务错误: ${apiResponse.code}`);
      }

      // 返回数据部分
      return apiResponse.data;
    } catch (error) {
      console.error('网络请求失败:', error);
      
      // 如果是我们抛出的业务错误，直接抛出
      if (error instanceof Error) {
        throw error;
      }
      
      // 其他错误统一处理
      throw new Error('网络请求失败，请检查网络连接');
    }
  }

  /**
   * GET请求
   */
  static async get<T = any>(url: string, config?: Omit<RequestConfig, 'url' | 'method'>): Promise<T> {
    return this.request<T>({ url, method: 'GET', ...config });
  }

  /**
   * POST请求
   */
  static async post<T = any>(url: string, data?: any, config?: Omit<RequestConfig, 'url' | 'method' | 'data'>): Promise<T> {
    return this.request<T>({ url, method: 'POST', data, ...config });
  }

  /**
   * PUT请求
   */
  static async put<T = any>(url: string, data?: any, config?: Omit<RequestConfig, 'url' | 'method' | 'data'>): Promise<T> {
    return this.request<T>({ url, method: 'PUT', data, ...config });
  }

  /**
   * DELETE请求
   */
  static async delete<T = any>(url: string, config?: Omit<RequestConfig, 'url' | 'method'>): Promise<T> {
    return this.request<T>({ url, method: 'DELETE', ...config });
  }

  /**
   * PATCH请求
   */
  static async patch<T = any>(url: string, data?: any, config?: Omit<RequestConfig, 'url' | 'method' | 'data'>): Promise<T> {
    return this.request<T>({ url, method: 'PATCH', data, ...config });
  }
}
