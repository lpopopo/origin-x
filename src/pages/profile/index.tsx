import React from 'react';
import { View, Text, Button, Image } from '@tarojs/components';
import { useUser } from '../../stores/userStore';
import { ProtectedRoute } from '../../components/ProtectedRoute';
import './index.less';

const ProfilePage: React.FC = () => {
  const { state, refreshUserProfile, clearUser } = useUser();

  const handleLogout = async () => {
    try {
      await clearUser();
      // 这里可以添加跳转逻辑
      console.log('用户已退出登录');
    } catch (error) {
      console.error('退出登录失败:', error);
    }
  };

  const handleRefresh = async () => {
    try {
      await refreshUserProfile();
      console.log('用户信息已刷新');
    } catch (error) {
      console.error('刷新用户信息失败:', error);
    }
  };

  if (state.isLoading) {
    return (
      <View className="profile-page">
        <View className="loading-container">
          <Text className="loading-text">加载中...</Text>
        </View>
      </View>
    );
  }

  if (!state.user) {
    return (
      <View className="profile-page">
        <View className="error-container">
          <Text className="error-text">获取用户信息失败</Text>
          <Button onClick={handleRefresh} className="retry-btn">重试</Button>
        </View>
      </View>
    );
  }

  return (
    <View className="profile-page">
      <View className="profile-header">
        <View className="avatar-container">
          <Image 
            className="avatar" 
            src="https://via.placeholder.com/80x80" 
            alt="用户头像"
          />
        </View>
        <View className="user-info">
          <Text className="username">{state.user.username}</Text>
          <Text className="email">{state.user.email}</Text>
          <Text className="join-date">
            加入时间: {new Date(state.user.createdAt).toLocaleDateString()}
          </Text>
        </View>
      </View>

      <View className="stats-section">
        <Text className="section-title">使用统计</Text>
        <View className="stats-grid">
          <View className="stat-card">
            <Text className="stat-number">{state.user.stats.totalGenerations}</Text>
            <Text className="stat-label">总生成次数</Text>
          </View>
          <View className="stat-card">
            <Text className="stat-number">{state.user.stats.successfulGenerations}</Text>
            <Text className="stat-label">成功次数</Text>
          </View>
          <View className="stat-card">
            <Text className="stat-number">{state.user.stats.successRate}%</Text>
            <Text className="stat-label">成功率</Text>
          </View>
        </View>
        {state.user.stats.lastGenerationAt && (
          <View className="last-generation">
            <Text className="last-generation-label">最后生成:</Text>
            <Text className="last-generation-time">
              {new Date(state.user.stats.lastGenerationAt).toLocaleString()}
            </Text>
          </View>
        )}
      </View>

      <View className="quota-section">
        <Text className="section-title">今日配额</Text>
        <View className="quota-container">
          <View className="quota-bar">
            <View 
              className="quota-progress" 
              style={{ 
                width: `${(state.user.quota.used / state.user.quota.daily) * 100}%` 
              }}
            />
          </View>
          <View className="quota-info">
            <Text className="quota-text">
              已使用: {state.user.quota.used} / {state.user.quota.daily}
            </Text>
            <Text className="quota-remaining">
              剩余: {state.user.quota.remaining}
            </Text>
          </View>
        </View>
      </View>

      <View className="account-section">
        <Text className="section-title">账户信息</Text>
        <View className="account-info">
          <View className="info-row">
            <Text className="info-label">账户状态:</Text>
            <Text className={`info-value ${state.user.isActive ? 'active' : 'inactive'}`}>
              {state.user.isActive ? '正常' : '已禁用'}
            </Text>
          </View>
          <View className="info-row">
            <Text className="info-label">邮箱验证:</Text>
            <Text className={`info-value ${state.user.isVerified ? 'verified' : 'unverified'}`}>
              {state.user.isVerified ? '已验证' : '未验证'}
            </Text>
          </View>
          <View className="info-row">
            <Text className="info-label">账户余额:</Text>
            <Text className="info-value">{state.user.balance} 积分</Text>
          </View>
        </View>
      </View>

      <View className="actions-section">
        <Button onClick={handleRefresh} className="refresh-btn">
          刷新信息
        </Button>
        <Button onClick={handleLogout} className="logout-btn">
          退出登录
        </Button>
      </View>
    </View>
  );
};

// 使用 ProtectedRoute 包装页面，确保只有登录用户才能访问
export default function ProtectedProfilePage() {
  return (
    <ProtectedRoute>
      <ProfilePage />
    </ProtectedRoute>
  );
}
