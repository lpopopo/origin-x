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

// 用户历史记录相关类型
export interface UserWork {
  id: number;
  userId: string;
  workId: string;
  originalImageUrl: string;
  generatedImageUrl: string;
  prompt: string;
  model: string;
  likes: number;
  views: number;
  quotes: number;
  isPublic: number;
  createdAt: string;
  updatedAt: string;
}

export interface UserWorksResponse {
  works: UserWork[];
  total: number;
  pageNo: number;
  pageSize: number;
}

export interface UserWorksParams {
  pageNo?: number;
  pageSize?: number;
}
