import Taro from '@tarojs/taro';
import { LoginForm, RegisterForm, AuthResponse, ApiResponse, EmailVerificationParams, UserProfile } from '../../types/auth';

const BASE_URL = 'https://52725.uno/api/v1';

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
      const response = await Taro.request({
        url: `${BASE_URL}/users/profile`,
        method: 'GET',
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

  static async sendVerificationCode(email: string): Promise<ApiResponse<null>> {
    try {
      const response = await Taro.request({
        url: `${BASE_URL}/auth/send-code`,
        method: 'POST',
        data: { email },
      });
      return response.data;
    } catch (error) {
      throw new Error('发送验证码失败，请稍后重试');
    }
  }

  static async verifyCode(email: string, code: string): Promise<ApiResponse<null>> {
    try {
      const response = await Taro.request({
        url: `${BASE_URL}/auth/verify-code`,
        method: 'POST',
        data: { email, code },
      });
      return response.data;
    } catch (error) {
      throw new Error('验证码验证失败，请稍后重试');
    }
  }
}
