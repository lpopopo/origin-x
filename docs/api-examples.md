# 邮箱验证API使用示例

## 接口地址

基础URL: `http://120.26.112.15/api/v1`

## 1. 发送验证码

### 请求
```bash
curl -X POST http://120.26.112.15/api/v1/auth/send-code \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com"
  }'
```

### 响应
```json
{
  "success": true,
  "message": "验证码已发送",
  "data": null
}
```

### 错误响应
```json
{
  "success": false,
  "message": "邮箱格式不正确",
  "data": null
}
```

## 2. 验证验证码

### 请求
```bash
curl -X POST http://120.26.112.15/api/v1/auth/verify-code \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "code": "123456"
  }'
```

### 响应
```json
{
  "success": true,
  "message": "验证码验证成功",
  "data": null
}
```

### 错误响应
```json
{
  "success": false,
  "message": "验证码错误或已过期",
  "data": null
}
```

## 3. 完整注册流程示例

### 步骤1: 发送验证码
```bash
curl -X POST http://120.26.112.15/api/v1/auth/send-code \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com"
  }'
```

### 步骤2: 验证验证码
```bash
curl -X POST http://120.26.112.15/api/v1/auth/verify-code \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "code": "123456"
  }'
```

### 步骤3: 完成注册
```bash
curl -X POST http://120.26.112.15/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "username": "testuser",
    "password": "password123",
    "confirmPassword": "password123"
  }'
```

## 4. JavaScript/TypeScript 使用示例

### 使用fetch API
```typescript
// 发送验证码
async function sendVerificationCode(email: string) {
  try {
    const response = await fetch('http://120.26.112.15/api/v1/auth/send-code', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });
    
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('发送验证码失败:', error);
    throw error;
  }
}

// 验证验证码
async function verifyCode(email: string, code: string) {
  try {
    const response = await fetch('http://120.26.112.15/api/v1/auth/verify-code', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, code }),
    });
    
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('验证验证码失败:', error);
    throw error;
  }
}
```

### 使用axios
```typescript
import axios from 'axios';

const API_BASE_URL = 'http://120.26.112.15/api/v1';

// 发送验证码
async function sendVerificationCode(email: string) {
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/send-code`, { email });
    return response.data;
  } catch (error) {
    console.error('发送验证码失败:', error);
    throw error;
  }
}

// 验证验证码
async function verifyCode(email: string, code: string) {
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/verify-code`, { email, code });
    return response.data;
  } catch (error) {
    console.error('验证验证码失败:', error);
    throw error;
  }
}
```

## 5. 错误处理

### 常见错误码
- `400`: 请求参数错误（邮箱格式不正确、验证码为空等）
- `404`: 接口不存在
- `429`: 请求过于频繁（验证码发送限制）
- `500`: 服务器内部错误

### 错误处理示例
```typescript
try {
  const result = await sendVerificationCode('invalid-email');
  if (result.success) {
    console.log('验证码发送成功');
  } else {
    console.error('发送失败:', result.message);
  }
} catch (error) {
  if (error.response?.status === 429) {
    console.error('发送过于频繁，请稍后再试');
  } else if (error.response?.status === 400) {
    console.error('邮箱格式不正确');
  } else {
    console.error('网络错误，请稍后重试');
  }
}
```

## 6. 测试建议

1. **正常流程测试**
   - 使用有效邮箱发送验证码
   - 使用正确验证码进行验证
   - 完成注册流程

2. **异常情况测试**
   - 使用无效邮箱格式
   - 使用错误验证码
   - 使用过期验证码
   - 频繁发送验证码

3. **边界条件测试**
   - 空邮箱地址
   - 空验证码
   - 超长邮箱地址
   - 特殊字符邮箱地址

4. **性能测试**
   - 并发发送验证码
   - 大量用户同时注册
   - 网络延迟情况下的响应
