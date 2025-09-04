# 网络请求统一处理指南

## 概述

本项目已实现统一的网络请求处理机制，所有后端API调用都通过 `RequestService` 进行，确保错误码处理的一致性。

## 后端响应格式

后端统一返回格式：
```json
{
  "code": 0,
  "message": "Success",
  "data": {
    // 具体的响应数据
  }
}
```

- `code: 0` 表示成功
- `code: 非0` 表示业务错误
- `message` 错误信息
- `data` 响应数据

## RequestService 使用

### 基本用法

```typescript
import { RequestService } from '../utils/request';

// GET 请求
const userProfile = await RequestService.get<UserProfile>('/users/profile');

// POST 请求
const loginResult = await RequestService.post<AuthResponse>('/auth/login', {
  email: 'user@example.com',
  password: 'password'
});

// PUT 请求
const updateResult = await RequestService.put<UserProfile>('/users/profile', {
  username: 'newUsername'
});

// DELETE 请求
await RequestService.delete('/users/account');

// PATCH 请求
const partialUpdate = await RequestService.patch<UserProfile>('/users/profile', {
  avatar: 'new-avatar-url'
});
```

### 自定义配置

```typescript
// 自定义请求头
const result = await RequestService.get('/api/data', {
  header: {
    'Custom-Header': 'value'
  }
});

// 自定义超时时间
const result = await RequestService.post('/api/data', data, {
  timeout: 30000 // 30秒
});
```

## 错误处理

### 自动处理的错误码

- **401**: 未授权，自动清除本地token并提示重新登录
- **403**: 权限不足，显示权限不足提示
- **429**: 请求过于频繁，显示重试提示
- **其他错误码**: 显示后端返回的错误信息

### 错误处理示例

```typescript
try {
  const result = await RequestService.get('/api/data');
  // 处理成功结果
} catch (error) {
  // 错误已经被统一处理，这里可以添加额外的业务逻辑
  console.error('业务错误:', error.message);
}
```

## 认证处理

### 认证失败处理

当收到 401 错误时，系统会：
1. 清除本地存储的用户信息
2. 显示"登录已过期，请重新登录"提示
3. 抛出错误供业务层处理

## 服务层使用示例

### 认证服务

```typescript
export class AuthService {
  static async login(data: LoginForm): Promise<AuthResponse> {
    try {
      return await RequestService.post<AuthResponse>('/auth/login', data);
    } catch (error) {
      throw new Error('登录失败，请稍后重试');
    }
  }

  static async getUserProfile(): Promise<UserProfile> {
    try {
      return await RequestService.get<UserProfile>('/users/profile');
    } catch (error) {
      throw new Error('获取用户信息失败');
    }
  }
}
```

### 生成服务

```typescript
export class GenerateService {
  static async createTask(request: GenerateTaskRequest): Promise<GenerateTaskResponse> {
    try {
      return await RequestService.post<GenerateTaskResponse>('/generate', request);
    } catch (error) {
      throw new Error('创建任务失败，请稍后重试');
    }
  }
}
```

### 上传服务

```typescript
export class UploadService {
  static async getUploadUrl(filename: string): Promise<UploadUrlResponse> {
    try {
      return await RequestService.get<UploadUrlResponse>(
        `/upload?filename=${encodeURIComponent(filename)}`,
        { header: { 'Content-Type': 'image/jpeg' } }
      );
    } catch (error) {
      throw new Error('获取上传地址失败');
    }
  }
}
```

## 页面组件使用

### 登录页面示例

```typescript
const handleLogin = async () => {
  try {
    setLoading(true);
    const response = await AuthService.login(form);
    // 直接使用 response，不需要 response.data
    Taro.setStorageSync('userId', response.user.userId);
    await fetchUserProfile();
    Taro.reLaunch({ url: '/pages/workspace/index' });
  } catch (err) {
    setError(err instanceof Error ? err.message : '登录失败，请稍后重试');
  } finally {
    setLoading(false);
  }
};
```

## 注意事项

1. **类型安全**: 使用泛型指定返回类型，确保类型安全
2. **错误处理**: 所有网络错误都会被统一处理，业务层只需要处理业务逻辑
3. **认证**: 认证token会自动添加，无需手动处理
4. **URL**: 相对路径会自动添加基础URL前缀
5. **超时**: 默认10秒超时，可通过配置自定义

## 迁移指南

如果从旧的直接使用 `Taro.request` 的方式迁移：

### 旧代码
```typescript
const response = await Taro.request({
  url: `${BASE_URL}/auth/login`,
  method: 'POST',
  data: form
});
if (response.data.code === 0) {
  return response.data.data;
} else {
  throw new Error(response.data.message);
}
```

### 新代码
```typescript
return await RequestService.post<AuthResponse>('/auth/login', form);
```

新代码更简洁，错误处理更统一，类型更安全。
