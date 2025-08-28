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
  isActive: boolean;
  isVerified: boolean;
  balance: number;
  createdAt: string;
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
  isActive: boolean;
  isVerified: boolean;
  balance: number;
  stats: UserStats;
  quota: UserQuota;
  createdAt: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  user: UserInfo;
}

export interface EmailVerificationParams {
  token: string;
  email: string;
}

// API响应类型
export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}
