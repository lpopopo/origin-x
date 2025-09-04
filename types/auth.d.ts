export interface LoginForm {
  email: string;
  password: string;
}

export interface RegisterForm {
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
}

export interface UserInfo {
  userId: string;
  email: string;
  username: string;
  userAvatar: string;           // 用户头像
  isActive?: boolean;           // 后台管理接口才返回
  isVerified?: boolean;         // 后台管理接口才返回
  balance: number;
}

export interface UserStats {
  totalGenerations: number;
  successfulGenerations: number;
  successRate: number;
  lastGenerationAt: string | null;
}

export interface UserQuota {
  daily: number;
  used: number;
  remaining: number;
}

export interface UserProfile {
  userId: string;
  email: string;
  username: string;
  userAvatar: string;           // 用户头像
  isActive?: boolean;           // 后台管理接口才返回
  isVerified?: boolean;         // 后台管理接口才返回
  balance: number;
  stats?: UserStats;
  quota?: UserQuota;
  createdAt?: string;
}

export interface AuthResponse {
  user: UserInfo;
}

export interface EmailVerificationParams {
  token: string;
  email: string;
}
