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
  avatar: string;
  username: string;
  isActive: boolean;
  isVerified: boolean;
  balance: number;
  stats: UserStats;
  quota: UserQuota;
  createdAt: string;
}

export interface AuthResponse {
  user: UserInfo;
}

export interface EmailVerificationParams {
  token: string;
  email: string;
}
