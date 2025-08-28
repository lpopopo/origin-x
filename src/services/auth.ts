import Taro from '@tarojs/taro';
import { LoginForm, RegisterForm, AuthResponse, ApiResponse, EmailVerificationParams, UserProfile } from '../../types/auth';

const BASE_URL = 'http://localhost:8080/api/v1';

export class AuthService {
  static async login(data: LoginForm): Promise<ApiResponse<AuthResponse>> {
    try {
      const response = await Taro.request({
        url: `${BASE_URL}/auth/login`,
        method: 'POST',
        data,
      });
      
      return response.data;
    } catch (error) {
      throw new Error('登录失败，请稍后重试');
    }
  }

  static async register(data: RegisterForm): Promise<ApiResponse<AuthResponse>> {
    try {
      const response = await Taro.request({
        url: `${BASE_URL}/auth/register`,
        method: 'POST',
        data,
      });
      
      return response.data;
    } catch (error) {
      throw new Error('注册失败，请稍后重试');
    }
  }

  static async verifyEmail(params: EmailVerificationParams): Promise<ApiResponse<null>> {
    try {
      const response = await Taro.request({
        url: `${BASE_URL}/auth/verify-email`,
        method: 'POST',
        data: params,
      });
      return response.data;
    } catch (error) {
      throw new Error('邮箱验证失败，请稍后重试');
    }
  }

  static async resendVerificationEmail(email: string): Promise<ApiResponse<null>> {
    try {
      const response = await Taro.request({
        url: `${BASE_URL}/auth/resend-verification`,
        method: 'POST',
        data: { email },
      });
      return response.data;
    } catch (error) {
      throw new Error('发送验证邮件失败，请稍后重试');
    }
  }

  static async getUserProfile(): Promise<ApiResponse<UserProfile>> {
    try {
      // 从本地存储获取token
      const token = Taro.getStorageSync('accessToken');
      if (!token) {
        throw new Error('未找到访问令牌');
      }

      const response = await Taro.request({
        url: `${BASE_URL}/users/profile`,
        method: 'GET',
        header: {
          'Authorization': `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      throw new Error('获取用户信息失败');
    }
  }

  static async logout(): Promise<void> {
    try {
      const token = Taro.getStorageSync('accessToken');
      if (token) {
        // 调用后端登出接口
        await Taro.request({
          url: `${BASE_URL}/auth/logout`,
          method: 'POST',
          header: {
            'Authorization': `Bearer ${token}`,
          },
        });
      }
    } catch (error) {
      console.error('登出请求失败:', error);
    } finally {
      // 清除本地token
      Taro.removeStorageSync('accessToken');
      Taro.removeStorageSync('refreshToken');
      Taro.removeStorageSync('expiresAt');
      Taro.removeStorageSync('userId');
    }
  }
}
