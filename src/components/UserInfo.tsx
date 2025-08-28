import React from 'react';
import { View, Text, Button } from '@tarojs/components';
import { useUser } from '../stores/userStore';
import './UserInfo.less';

export const UserInfo: React.FC = () => {
  const { state, fetchUserProfile, clearUser, refreshUserProfile } = useUser();

  const handleLogin = () => {
    // 这里可以跳转到登录页面
    console.log('跳转到登录页面');
  };

  const handleLogout = () => {
    clearUser();
  };

  if (state.isLoading) {
    return (
      <View className="user-info">
        <Text>加载中...</Text>
      </View>
    );
  }

  if (!state.isAuthenticated || !state.user) {
    return (
      <View className="user-info">
        <Text className="not-login">未登录</Text>
        <Button onClick={handleLogin} className="login-btn">登录</Button>
      </View>
    );
  }

  return (
    <View className="user-info">
      <View className="user-header">
        <Text className="username">{state.user.username}</Text>
        <Text className="email">{state.user.email}</Text>
      </View>
      
      <View className="user-stats">
        <Text className="section-title">使用统计</Text>
        <View className="stats-grid">
          <View className="stat-item">
            <Text className="stat-value">{state.user.stats.totalGenerations}</Text>
            <Text className="stat-label">总生成次数</Text>
          </View>
          <View className="stat-item">
            <Text className="stat-value">{state.user.stats.successfulGenerations}</Text>
            <Text className="stat-label">成功次数</Text>
          </View>
          <View className="stat-item">
            <Text className="stat-value">{state.user.stats.successRate}%</Text>
            <Text className="stat-label">成功率</Text>
          </View>
        </View>
        {state.user.stats.lastGenerationAt && (
          <Text className="last-generation">
            最后生成: {new Date(state.user.stats.lastGenerationAt).toLocaleString()}
          </Text>
        )}
      </View>
      
      <View className="user-quota">
        <Text className="section-title">今日配额</Text>
        <View className="quota-bar">
          <View 
            className="quota-used" 
            style={{ width: `${(state.user.quota.used / state.user.quota.daily) * 100}%` }}
          />
        </View>
        <Text className="quota-text">
          {state.user.quota.used} / {state.user.quota.daily} (剩余 {state.user.quota.remaining})
        </Text>
      </View>
      
      <View className="user-actions">
        <Button onClick={refreshUserProfile} className="refresh-btn">刷新信息</Button>
        <Button onClick={handleLogout} className="logout-btn">退出登录</Button>
      </View>
    </View>
  );
};
