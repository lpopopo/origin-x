# 用户认证系统使用说明

## 概述

本系统实现了一个完整的用户认证和状态管理系统，支持 H5、PC 和微信小程序等多种平台。系统会自动处理用户登录状态、token 刷新、用户信息获取等功能。

## 主要功能

### 1. 自动用户状态管理
- 应用启动时自动检查登录状态
- 自动获取用户信息
- 自动处理 token 过期和刷新

### 2. 全局状态存储
- 用户基本信息（用户名、邮箱等）
- 使用统计（生成次数、成功率等）
- 配额信息（每日限额、已使用量等）

### 3. 跨平台兼容
- 支持 H5、PC、微信小程序、支付宝小程序等
- 自动检测平台类型
- 统一的 API 接口

## 系统架构

```
App.tsx (入口)
├── UserProvider (全局状态管理)
│   ├── 用户状态管理
│   ├── Token 管理
│   └── 自动刷新机制
├── 页面组件
│   ├── 使用 useUser hook
│   └── 访问用户状态
└── 工具类
    ├── TokenManager (Token 管理)
    ├── AuthService (认证服务)
    └── PlatformUtils (平台检测)
```

## 使用方法

### 1. 在组件中使用用户状态

```tsx
import { useUser } from '../stores/userStore';

function MyComponent() {
  const { state, fetchUserProfile, clearUser } = useUser();
  
  if (state.isLoading) {
    return <div>加载中...</div>;
  }
  
  if (!state.isAuthenticated) {
    return <div>请先登录</div>;
  }
  
  return (
    <div>
      <h1>欢迎, {state.user?.username}</h1>
      <p>今日剩余配额: {state.user?.quota.remaining}</p>
      <button onClick={clearUser}>退出登录</button>
    </div>
  );
}
```

### 2. 保护需要登录的路由

```tsx
import { ProtectedRoute } from '../components/ProtectedRoute';

function App() {
  return (
    <ProtectedRoute>
      <PrivatePage />
    </ProtectedRoute>
  );
}
```

### 3. 自定义未授权页面的显示

```tsx
import { ProtectedRoute } from '../components/ProtectedRoute';

function App() {
  const customFallback = (
    <div>
      <h2>需要登录</h2>
      <p>此页面需要登录后才能访问</p>
      <button>去登录</button>
    </div>
  );
  
  return (
    <ProtectedRoute fallback={customFallback}>
      <PrivatePage />
    </ProtectedRoute>
  );
}
```

## API 接口

### 获取用户信息
- **接口**: `GET /api/v1/users/profile`
- **认证**: 需要 Bearer Token
- **响应**: 包含用户基本信息、统计数据和配额信息

### 响应数据结构

```typescript
interface UserProfile {
  userId: string;
  email: string;
  username: string;
  isActive: boolean;
  isVerified: boolean;
  balance: number;
  stats: {
    totalGenerations: number;
    successfulGenerations: number;
    successRate: number;
    lastGenerationAt: string | null;
  };
  quota: {
    daily: number;
    used: number;
    remaining: number;
  };
  createdAt: string;
}
```

## 状态管理

### 用户状态
- `user`: 用户信息对象
- `isLoading`: 是否正在加载
- `isAuthenticated`: 是否已认证
- `error`: 错误信息

### 可用操作
- `fetchUserProfile()`: 获取用户信息
- `clearUser()`: 清除用户状态
- `refreshUserProfile()`: 刷新用户信息

## Token 管理

### 自动 Token 刷新
- 系统会监控 token 的过期时间
- 在 token 即将过期前自动刷新
- 刷新失败时自动清除用户状态

### Token 存储
- 使用 Taro 的本地存储
- 支持多平台兼容
- 自动清理过期 token

## 平台适配

### 微信小程序
- 使用微信小程序的存储 API
- 支持微信登录流程

### H5/PC
- 使用浏览器的 localStorage
- 支持跨标签页状态同步

### 其他小程序
- 支持支付宝、字节跳动等小程序
- 统一的 API 接口

## 错误处理

### 网络错误
- 自动重试机制
- 友好的错误提示
- 降级处理

### Token 过期
- 自动刷新 token
- 刷新失败时跳转登录
- 清除无效状态

## 最佳实践

### 1. 组件设计
- 使用 `useUser` hook 获取状态
- 根据加载状态显示相应 UI
- 处理未认证状态

### 2. 路由保护
- 使用 `ProtectedRoute` 包装私有页面
- 提供友好的未授权提示
- 支持自定义 fallback

### 3. 状态更新
- 使用 `refreshUserProfile` 更新用户信息
- 在关键操作后刷新状态
- 避免频繁的状态更新

## 注意事项

1. **Token 安全**: 不要在代码中硬编码 token
2. **状态同步**: 多标签页时注意状态同步
3. **错误处理**: 始终处理可能的错误情况
4. **性能优化**: 避免不必要的状态更新
5. **平台兼容**: 测试不同平台的兼容性

## 故障排除

### 常见问题

1. **用户状态不更新**
   - 检查 token 是否有效
   - 确认网络请求是否成功
   - 查看控制台错误信息

2. **Token 刷新失败**
   - 检查 refresh token 是否有效
   - 确认后端接口是否正常
   - 查看网络状态

3. **平台兼容性问题**
   - 检查 Taro 环境变量
   - 确认平台 API 支持
   - 查看平台文档

### 调试技巧

1. 使用浏览器开发者工具查看网络请求
2. 检查本地存储中的 token 信息
3. 查看控制台日志和错误信息
4. 使用 React DevTools 查看组件状态
