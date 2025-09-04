import { View, Input, Button, Text } from '@tarojs/components';
import { useState } from 'react';
import Taro from '@tarojs/taro';
import { LoginForm } from '../../../types/auth';
import { AuthService } from '../../services/auth';
import { useUser } from '../../stores/userStore';
import './index.less';

const Login: React.FC = () => {
  const [form, setForm] = useState<LoginForm>({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { fetchUserProfile } = useUser();

  const handleInput = (field: keyof LoginForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const handleLogin = async () => {
    if (!form.email || !form.password) {
      setError('请填写完整信息');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setError('请输入有效的邮箱地址');
      return;
    }

    try {
      setLoading(true);
      const response = await AuthService.login(form);
      Taro.setStorageSync('userId', response.user.userId);
      // 获取用户信息并存储到全局store
      await fetchUserProfile();
      // 跳转到工作区页面
      Taro.reLaunch({ url: '/pages/workspace/index' });
    } catch (err) {
      setError(err instanceof Error ? err.message : '登录失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const goToRegister = () => {
    Taro.navigateTo({ url: '/pages/register/index' });
  };

  return (
    <View className='login-container'>
      <View className='login-box'>
        <View className='login-title'>登录</View>
        
        <View className='form-item'>
          <Input
            className='input'
            type='text'
            placeholder='请输入邮箱'
            value={form.email}
            onInput={e => handleInput('email', e.detail.value)}
          />
        </View>

        <View className='form-item'>
          <Input
            className='input'
            type="safe-password"
            password={true}
            placeholder='请输入密码'
            value={form.password}
            onInput={e => handleInput('password', e.detail.value)}
          />
        </View>

        {error && <Text className='error-text'>{error}</Text>}

        <Button
          className='login-button'
          loading={loading}
          onClick={handleLogin}
        >
          登录
        </Button>

        <View className='register-link' onClick={goToRegister}>
          还没有账号？立即注册
        </View>
      </View>
    </View>
  );
};

export default Login;
