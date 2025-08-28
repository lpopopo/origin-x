import React, { ReactNode, useEffect } from 'react';
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useUser } from '../stores/userStore';
import './ProtectedRoute.less';

interface ProtectedRouteProps {
  children: ReactNode;
  fallback?: ReactNode;
  redirectTo?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  fallback,
  redirectTo = '/pages/login/index'
}) => {
  const { state, checkAuthAndRedirect } = useUser();

  // 如果正在加载，显示加载状态
  if (state.isLoading) {
    return (
      <View className="protected-route-loading">
        <Text>加载中...</Text>
      </View>
    );
  }

  // 如果未认证，自动跳转到登录页面
  if (!state.isAuthenticated) {
    useEffect(() => {
      // 延迟跳转，避免页面闪烁
      const timer = setTimeout(() => {
        Taro.redirectTo({
          url: redirectTo
        });
      }, 100);

      return () => clearTimeout(timer);
    }, []);

    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <View className="protected-route-unauthorized">
        <View className="unauthorized-content">
          <Text className="unauthorized-title">需要登录</Text>
          <Text className="unauthorized-message">
            正在跳转到登录页面...
          </Text>
        </View>
      </View>
    );
  }

  // 如果已认证，显示子组件
  return <>{children}</>;
};
