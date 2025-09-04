import Taro from '@tarojs/taro';
import { RequestService } from '../utils/request';
import { LoginForm, RegisterForm, AuthResponse, EmailVerificationParams, UserProfile } from '../../types/auth';

export class AuthService {
  static async login(data: LoginForm): Promise<AuthResponse> {
    try {
      return await RequestService.post<AuthResponse>('/auth/login', data);
    } catch (error) {
      throw new Error('登录失败，请稍后重试');
    }
  }

  static async register(data: RegisterForm): Promise<AuthResponse> {
    try {
      return await RequestService.post<AuthResponse>('/auth/register', data);
    } catch (error) {
      throw new Error('注册失败，请稍后重试');
    }
  }

  static async verifyEmail(params: EmailVerificationParams): Promise<null> {
    try {
      return await RequestService.post<null>('/auth/verify-email', params);
    } catch (error) {
      throw new Error('邮箱验证失败，请稍后重试');
    }
  }

  static async resendVerificationEmail(email: string): Promise<null> {
    try {
      return await RequestService.post<null>('/auth/resend-verification', { email });
    } catch (error) {
      throw new Error('发送验证邮件失败，请稍后重试');
    }
  }

  static async getUserProfile(): Promise<UserProfile> {
    try {
      return await RequestService.get<UserProfile>('/users/profile');
    } catch (error) {
      throw new Error('获取用户信息失败');
    }
  }

  static async logout(): Promise<void> {
    try {
      // 调用后端登出接口
      await RequestService.post('/auth/logout');
    } catch (error) {
      console.error('登出请求失败:', error);
    } finally {
      // 清除本地用户信息
      Taro.removeStorageSync('userId');
    }
  }

  static async sendVerificationCode(email: string): Promise<null> {
    try {
      return await RequestService.post<null>('/auth/send-code', { email });
    } catch (error) {
      throw new Error('发送验证码失败，请稍后重试');
    }
  }

  static async verifyCode(email: string, code: string): Promise<null> {
    try {
      return await RequestService.post<null>('/auth/verify-code', { email, code });
    } catch (error) {
      throw new Error('验证码验证失败，请稍后重试');
    }
  }
}
